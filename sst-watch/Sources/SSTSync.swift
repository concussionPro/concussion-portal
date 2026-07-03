import Foundation

// URLSession JSON client that syncs SST events to the SAME backend the web /
// phone app uses. Matches lib/sst-trainer/clinic-sync.ts and the three routes
// under app/api/sst/* EXACTLY:
//
//   POST /api/sst/session       — durable threshold / training records
//   POST /api/sst/live          — ephemeral in-session HR ticks
//   GET  /api/sst/validate-code — onboarding clinic-code check
//
// Fire-and-forget + best-effort: a sync must NEVER block the patient UI. A
// network-failed session POST is queued in SSTStore and retried on next launch
// (flushPending). Live ticks are ephemeral — a missed tick is never queued.
//
// The payload is heterogeneous, so bodies are built with JSONSerialization
// rather than a Codable type. Per clinic-sync.ts, `eventType` and `patientRef`
// live INSIDE `payload` for session syncs; `patientRef` is a top-level additive
// field on live ticks (the live route ignores unknown top-level fields).

struct SSTSync {
    static let baseURL = "https://portal.concussion-education-australia.com"

    private static let sessionURL = baseURL + "/api/sst/session"
    private static let liveURL = baseURL + "/api/sst/live"

    // MARK: - Clinic-code validation (onboarding)

    /// GET /api/sst/validate-code?code=X → { valid: bool, clinicName?: string }.
    /// On a check-level failure (offline / 429 / 5xx) returns (false, nil) —
    /// the same "couldn't confirm" outcome as an unknown code.
    static func validateCode(_ code: String) async -> (valid: Bool, clinicName: String?) {
        let trimmed = code.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty,
              var comps = URLComponents(string: baseURL + "/api/sst/validate-code")
        else { return (false, nil) }
        comps.queryItems = [URLQueryItem(name: "code", value: trimmed)]
        guard let url = comps.url else { return (false, nil) }

        do {
            let (data, resp) = try await URLSession.shared.data(from: url)
            guard let http = resp as? HTTPURLResponse else { return (false, nil) }
            // Rate-limited / server error = couldn't check, not "invalid".
            if http.statusCode == 429 || http.statusCode >= 500 { return (false, nil) }
            guard let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
            else { return (false, nil) }
            let valid = (obj["valid"] as? Bool) == true
            let name = (obj["clinicName"] as? String).flatMap { $0.isEmpty ? nil : $0 }
            return (valid, name)
        } catch {
            return (false, nil)
        }
    }

    // MARK: - Durable session sync

    /// POST /api/sst/session. Fire-and-forget; returns whether the POST was
    /// accepted. On network/5xx failure the body is queued in SSTStore and
    /// retried by `flushPending()`.
    ///
    /// Body shape mirrors buildBody() in clinic-sync.ts:
    ///   {
    ///     clinicCode, patientLabel, sessionType,
    ///     hrtBpm?, bandLow?, bandHigh?, condition?,      // top-level columns
    ///     payload: { ...caller payload, eventType, patientRef }
    ///   }
    /// The caller supplies `eventType` inside `payload`; `patientRef` (the
    /// install UUID) is injected here. `hrtBpm`/`bandLow`/`bandHigh` are lifted
    /// out of `payload` to the top level (the route reads them from body root).
    static func postSession(
        clinicCode: String,
        sessionType: String,
        patientLabel: String,
        condition: String?,
        payload: [String: Any]
    ) async -> Bool {
        let code = clinicCode.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !code.isEmpty else { return false }

        // payload carries eventType (from caller) + patientRef (injected).
        var pl = payload
        pl["patientRef"] = SSTStore.patientRef

        var body: [String: Any] = [
            "clinicCode": code,
            "patientLabel": patientLabel,
            "sessionType": sessionType,
            "condition": condition ?? NSNull(),
        ]
        // Promote the columns the route reads from the top-level body.
        for k in ["hrtBpm", "bandLow", "bandHigh"] {
            if let v = pl[k] { body[k] = v }
        }
        body["payload"] = pl

        guard let data = try? JSONSerialization.data(withJSONObject: body) else { return false }

        let ok = await postData(urlString: sessionURL, data: data)
        if !ok {
            SSTStore.enqueue(PendingSync(url: sessionURL, body: data, queuedAt: Date()))
        }
        return ok
    }

    // MARK: - Live in-session ticks (ephemeral)

    /// POST /api/sst/live — { clinicCode, patientLabel, patientRef, bpm,
    /// bandLow, bandHigh, elapsedSec, phase }. Best-effort; failures are ignored
    /// (never queued — a missed tick is meaningless a few seconds later).
    static func postLiveTick(
        clinicCode: String,
        patientLabel: String,
        patientRef: String,
        bpm: Int?,
        bandLow: Int?,
        bandHigh: Int?,
        elapsedSec: Int,
        phase: String
    ) async {
        let code = clinicCode.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !code.isEmpty else { return }

        let body: [String: Any] = [
            "clinicCode": code,
            "patientLabel": patientLabel,
            "patientRef": patientRef,
            "bpm": bpm.map { $0 as Any } ?? NSNull(),
            "bandLow": bandLow.map { $0 as Any } ?? NSNull(),
            "bandHigh": bandHigh.map { $0 as Any } ?? NSNull(),
            "elapsedSec": elapsedSec,
            "phase": phase,
        ]
        guard let data = try? JSONSerialization.data(withJSONObject: body) else { return }
        _ = await postData(urlString: liveURL, data: data)
    }

    // MARK: - Retry queue flush

    /// Retry every queued session POST (call on launch / connectivity regain).
    /// Sequential + re-entrancy-guarded; whatever still fails stays queued.
    static func flushPending() async {
        guard await FlushLock.shared.begin() else { return }
        defer { Task { await FlushLock.shared.end() } }

        let queue = SSTStore.load().pendingSessions
        guard !queue.isEmpty else { return }

        var stillFailed: [PendingSync] = []
        for entry in queue {
            let ok = await postData(urlString: entry.url, data: entry.body)
            if !ok { stillFailed.append(entry) }
        }
        SSTStore.setPending(stillFailed)
    }

    // MARK: - Transport

    /// POST raw JSON. Returns true when the server handled it: 2xx (accepted)
    /// OR 4xx (rejected — bad code etc.; retrying can't help, so don't queue).
    /// 5xx / network → false (retry later). Mirrors post() in clinic-sync.ts.
    private static func postData(urlString: String, data: Data) async -> Bool {
        guard let url = URL(string: urlString) else { return false }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = data
        do {
            let (_, resp) = try await URLSession.shared.data(for: req)
            guard let http = resp as? HTTPURLResponse else { return false }
            let s = http.statusCode
            return (200..<300).contains(s) || (400..<500).contains(s)
        } catch {
            return false
        }
    }
}

/// Re-entrancy guard for flushPending (mirrors the `flushing` flag in
/// clinic-sync.ts) — never run two flushes concurrently.
private actor FlushLock {
    static let shared = FlushLock()
    private var flushing = false

    func begin() -> Bool {
        if flushing { return false }
        flushing = true
        return true
    }

    func end() { flushing = false }
}

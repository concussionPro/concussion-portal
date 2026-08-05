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
    /// Mirrors validateClinicCode in clinic-sync.ts: DEMO00 short-circuits without
    /// a network round-trip, a validated code is remembered so it re-enters when
    /// offline, and an UNKNOWN code still fails closed (no bypass) — a new device
    /// with no cached validation cannot get in while offline.
    static func validateCode(_ code: String) async -> (valid: Bool, clinicName: String?) {
        let trimmed = code.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return (false, nil) }

        // DEMO00 short-circuit — the shared demo code is always valid, no network.
        // Critical for an App Reviewer on a flaky connection. Case-insensitive to
        // match the server (which uppercases the code).
        if trimmed.uppercased() == "DEMO00" { return (true, "Demo Clinic") }

        guard var comps = URLComponents(string: baseURL + "/api/sst/validate-code")
        else { return (false, nil) }
        comps.queryItems = [URLQueryItem(name: "code", value: trimmed)]
        guard let url = comps.url else { return (false, nil) }

        do {
            let (data, resp) = try await URLSession.shared.data(from: url)
            guard let http = resp as? HTTPURLResponse else { return cachedFallback(trimmed) }
            // Rate-limited / server error = couldn't check → recall a prior validation.
            if http.statusCode == 429 || http.statusCode >= 500 { return cachedFallback(trimmed) }
            guard let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
            else { return (false, nil) }
            let valid = (obj["valid"] as? Bool) == true
            let name = (obj["clinicName"] as? String).flatMap { $0.isEmpty ? nil : $0 }
            if valid { cacheValidated(trimmed, name: name) }
            return (valid, name)
        } catch {
            // Offline: recall a code that WAS validated on THIS device before.
            // Never a bypass for an unknown code — a new device fails closed.
            return cachedFallback(trimmed)
        }
    }

    private static let validatedCodesKey = "sst.validatedCodes"

    /// Remember a server-confirmed code (+ clinic name) for offline re-entry.
    private static func cacheValidated(_ code: String, name: String?) {
        var map = (UserDefaults.standard.dictionary(forKey: validatedCodesKey) as? [String: String]) ?? [:]
        map[code.uppercased()] = name ?? ""
        UserDefaults.standard.set(map, forKey: validatedCodesKey)
    }

    /// Return a prior validation for this code if one exists, else fail closed.
    private static func cachedFallback(_ code: String) -> (valid: Bool, clinicName: String?) {
        let map = (UserDefaults.standard.dictionary(forKey: validatedCodesKey) as? [String: String]) ?? [:]
        if let name = map[code.uppercased()] {
            return (true, name.isEmpty ? nil : name)
        }
        return (false, nil)
    }

    // MARK: - Durable session sync

    /// POST /api/sst/session. Fire-and-forget; returns whether the POST was
    /// accepted. On network/5xx/402/429 failure the body is queued in SSTStore
    /// and retried by `flushPending()`.
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

        let queue = SSTStore.loadPending()
        guard !queue.isEmpty else { return }

        for (i, entry) in queue.enumerated() {
            // Pace under the server's 30/min rate limit — flushing a large
            // queue back-to-back 429'd its tail (mirrors the 2100ms spacing in
            // clinic-sync.ts flushPendingSyncs).
            if i > 0 { try? await Task.sleep(nanoseconds: 2_100_000_000) }
            let ok = await postData(urlString: entry.url, data: entry.body)
            // Remove ONLY the landed entry — events enqueued while this paced
            // flush runs must survive (mirrors web removePendingSync).
            if ok { SSTStore.removePending(entry) }
        }
    }

    // MARK: - Transport

    /// POST raw JSON. Returns true when the server handled it: 2xx (accepted)
    /// OR 4xx (rejected — bad code etc.; retrying can't help, so don't queue).
    /// EXCEPTIONS, mirroring post() in clinic-sync.ts: 402 trial/plan-full is
    /// TEMPORARY (the clinic can upgrade, at which point the same write becomes
    /// valid) and 429 is rate-limited, not rejected — both return false so the
    /// clinical event stays queued. 5xx / network → false (retry later).
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
            if s == 402 || s == 429 { return false }
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

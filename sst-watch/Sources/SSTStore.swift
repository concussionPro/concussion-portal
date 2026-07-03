import Foundation

// Persistent per-install state for the standalone SST Trainer watch app.
//
// Everything the app needs to survive a relaunch lives here, JSON-encoded into
// a single UserDefaults key. The install UUID (`patientRef`) is generated ONCE
// on first load and rides along with every sync so the clinician dashboard can
// stitch a patient's events together without an account (mirrors the web
// install-UUID → patientRef identity in lib/sst-trainer/clinic-sync.ts).
//
// Decode is graceful: any corruption / schema drift returns a fresh state
// (with a fresh UUID) rather than crashing the app.

/// A single queued session POST that failed to reach the backend. watchOS
/// networking is intermittent, so a network-failed clinical event is persisted
/// and retried on the next launch / connectivity, never lost. The body is the
/// already-serialised JSON (heterogeneous payload), stored verbatim.
struct PendingSync: Codable {
    var url: String
    var body: Data
    var queuedAt: Date
}

struct SSTState: Codable {
    /// Install UUID — the `patientRef` sent with every sync. Generated once.
    var patientRef: String

    // Clinic linkage (from onboarding).
    var clinicCode: String?
    var clinicName: String?
    var patientName: String?

    // Clinical state.
    var prescription: Prescription?
    var sessions: [SessionLog]
    var verifiedSessionCount: Int
    var lastTestAt: Date?
    var lastRedFlagAt: Date?

    // Failed-sync retry queue.
    var pendingSessions: [PendingSync]

    /// A brand-new state with a freshly minted install UUID.
    static func fresh() -> SSTState {
        SSTState(
            patientRef: UUID().uuidString,
            clinicCode: nil,
            clinicName: nil,
            patientName: nil,
            prescription: nil,
            sessions: [],
            verifiedSessionCount: 0,
            lastTestAt: nil,
            lastRedFlagAt: nil,
            pendingSessions: []
        )
    }

    /// Load persisted state, or a fresh state on first launch / decode failure.
    /// The fresh state is immediately saved so the install UUID is stable.
    static func load() -> SSTState { SSTStore.load() }

    /// Persist this state.
    func save() { SSTStore.save(self) }

    // Convenience mutators — keep call sites terse and always persist.

    mutating func setClinic(code: String?, name: String?) {
        clinicCode = code
        clinicName = name
        save()
    }

    mutating func appendSession(_ log: SessionLog) {
        sessions.append(log)
        if log.verified { verifiedSessionCount += 1 }
        save()
    }

    mutating func setPrescription(_ p: Prescription?) {
        prescription = p
        save()
    }

    mutating func markTested(at date: Date = Date()) {
        lastTestAt = date
        save()
    }

    mutating func markRedFlag(at date: Date = Date()) {
        lastRedFlagAt = date
        save()
    }
}

/// Namespace for the UserDefaults-backed persistence of `SSTState`.
enum SSTStore {
    static let key = "sst.state.v1"

    /// Load the persisted state, or mint + persist a fresh one. Never throws;
    /// a decode failure is treated as a first launch (fresh UUID).
    static func load() -> SSTState {
        guard
            let data = UserDefaults.standard.data(forKey: key),
            let state = try? JSONDecoder().decode(SSTState.self, from: data)
        else {
            let fresh = SSTState.fresh()
            save(fresh)
            return fresh
        }
        return state
    }

    /// Persist a state. Best-effort — a failed encode simply doesn't write.
    static func save(_ state: SSTState) {
        guard let data = try? JSONEncoder().encode(state) else { return }
        UserDefaults.standard.set(data, forKey: key)
    }

    /// Append a failed session POST to the retry queue.
    static func enqueue(_ pending: PendingSync) {
        var state = load()
        state.pendingSessions.append(pending)
        save(state)
    }

    /// Replace the retry queue (after a flush).
    static func setPending(_ pending: [PendingSync]) {
        var state = load()
        state.pendingSessions = pending
        save(state)
    }

    /// The stable install UUID used as `patientRef` on every sync.
    static var patientRef: String { load().patientRef }
}

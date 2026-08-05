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

    /// Single data agreement accepted (one screen, one button — covers HR
    /// reading, symptom entries, on-watch storage and clinic sync). Optional so
    /// states persisted before this field decode fine.
    var consentedAt: Date?

    // Clinical state.
    var prescription: Prescription?
    var sessions: [SessionLog]
    /// Sessions logged under PRIOR prescriptions — display/history only; never fed
    /// to `decide()`. Populated when a re-test adopts a new band. Optional so
    /// states persisted before this field decode fine.
    var archivedSessions: [SessionLog]?
    /// Serial graded-test record — the recovery-trajectory instrument.
    /// Optional so states persisted before this field decode fine.
    var thresholds: [ThresholdRecord]?
    var verifiedSessionCount: Int
    /// Progression freshness checkpoints (mirror store.ts: "a change must be earned
    /// by fresh sessions"). `decisionCheckpoint` = sessions.count at the last
    /// applied band change (regress / rest / advance); `progressionCheckpoint` =
    /// verifiedSessionCount at the last applied ADVANCE. Optional so states
    /// persisted before these fields decode fine (nil treated as 0).
    var decisionCheckpoint: Int?
    var progressionCheckpoint: Int?
    var lastTestAt: Date?
    /// When the band was last eased down (regress / rest). Drives the afterRegress
    /// re-test bypass (mirrors lastRegressAt on the web). Optional for decode compat.
    var lastRegressAt: Date?
    var lastRedFlagAt: Date?
    /// Patient confirmed a clinician has reviewed + cleared them since the last
    /// red flag. Optional so states persisted before this field decode fine.
    var redFlagClearedAt: Date?

    // Failed-sync retry queue — LEGACY location. The live queue now persists
    // under its own key (SSTStore.pendingKey): SSTFlow holds an in-memory
    // SSTState copy and persists it wholesale, so a queue inside SSTState could
    // be clobbered (events lost) or resurrected (duplicates) by a stale copy.
    // This property remains ONLY so old persisted blobs decode (and migrate)
    // cleanly — never read or write it elsewhere.
    var pendingSessions: [PendingSync]

    /// A brand-new state with a freshly minted install UUID.
    static func fresh() -> SSTState {
        SSTState(
            patientRef: UUID().uuidString,
            clinicCode: nil,
            clinicName: nil,
            patientName: nil,
            consentedAt: nil,
            prescription: nil,
            sessions: [],
            archivedSessions: [],
            thresholds: [],
            verifiedSessionCount: 0,
            decisionCheckpoint: 0,
            progressionCheckpoint: 0,
            lastTestAt: nil,
            lastRegressAt: nil,
            lastRedFlagAt: nil,
            redFlagClearedAt: nil,
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

    // Checkpoint accessors (nil-persisted state reads as 0).
    var decisionCheckpointValue: Int { decisionCheckpoint ?? 0 }
    var progressionCheckpointValue: Int { progressionCheckpoint ?? 0 }

    /// Apply an eased band (regress / rest): update bounds, stamp the regress time
    /// (for the afterRegress re-test bypass) and set the decision checkpoint so the
    /// same flare data can't ease the band twice.
    mutating func applyEasedBand(newLower: Int, newUpper: Int, at date: Date = Date()) {
        if var p = prescription {
            p.bandLow = newLower
            p.bandHigh = newUpper
            prescription = p
        }
        lastRegressAt = date
        decisionCheckpoint = sessions.count
        save()
    }

    /// Apply a confirmed advance: update bounds and set BOTH checkpoints so a fresh
    /// clean run is required before the next step (mirrors onApplyCeiling on the web).
    mutating func applyAdvancedBand(newLower: Int, newUpper: Int) {
        if var p = prescription {
            p.bandLow = newLower
            p.bandHigh = newUpper
            prescription = p
        }
        progressionCheckpoint = verifiedSessionCount
        decisionCheckpoint = sessions.count
        save()
    }

    /// Adopt a NEW band from a re-test: archive the prior band's sessions
    /// (display/history only) and reset progression evidence + checkpoints so the
    /// clean-run count restarts inside the new band (mirrors page.tsx onContinue).
    mutating func adoptNewPrescription(_ p: Prescription) {
        archivedSessions = (archivedSessions ?? []) + sessions
        sessions = []
        verifiedSessionCount = 0
        decisionCheckpoint = 0
        progressionCheckpoint = 0
        prescription = p
        save()
    }

    mutating func appendThreshold(_ record: ThresholdRecord) {
        var list = thresholds ?? []
        list.append(record)
        thresholds = list
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

    mutating func markCleared(at date: Date = Date()) {
        redFlagClearedAt = date
        save()
    }

    mutating func markConsented(at date: Date = Date()) {
        consentedAt = date
        save()
    }

    /// A red flag locks testing AND training until the patient confirms a
    /// clinician has cleared them (mirrors the web red-flag lock).
    var redFlagLocked: Bool {
        guard let flagged = lastRedFlagAt else { return false }
        guard let cleared = redFlagClearedAt else { return true }
        return cleared < flagged
    }
}

/// Namespace for the UserDefaults-backed persistence of `SSTState`.
enum SSTStore {
    static let key = "sst.state.v1"
    /// The failed-sync retry queue's OWN key. Decoupled from SSTState so a
    /// wholesale state save (every SSTState mutator) can never clobber or
    /// resurrect queue entries with a stale in-memory copy.
    static let pendingKey = "sst.pendingQueue.v1"

    /// Load the persisted state, or mint + persist a fresh one. Never throws;
    /// a decode failure is treated as a first launch (fresh UUID).
    static func load() -> SSTState {
        migrateLegacyPending()
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

    // MARK: - Pending-sync retry queue (own key — never through SSTState)

    /// One-time migration: the queue originally lived inside SSTState. Any
    /// entries found in a legacy persisted blob are appended to the dedicated
    /// key and cleared from the blob (append FIRST so a crash mid-migration
    /// duplicates a clinical event rather than losing it).
    private static func migrateLegacyPending() {
        guard
            let data = UserDefaults.standard.data(forKey: key),
            var state = try? JSONDecoder().decode(SSTState.self, from: data),
            !state.pendingSessions.isEmpty
        else { return }
        setPending(readPending() + state.pendingSessions)
        state.pendingSessions = []
        save(state)
    }

    /// Decode the dedicated queue key. Empty on missing / decode failure.
    private static func readPending() -> [PendingSync] {
        guard
            let data = UserDefaults.standard.data(forKey: pendingKey),
            let queue = try? JSONDecoder().decode([PendingSync].self, from: data)
        else { return [] }
        return queue
    }

    /// The persisted retry queue (migrating any legacy in-state entries first).
    static func loadPending() -> [PendingSync] {
        migrateLegacyPending()
        return readPending()
    }

    /// Append a failed session POST to the retry queue.
    static func enqueue(_ pending: PendingSync) {
        var queue = loadPending()
        queue.append(pending)
        setPending(queue)
    }

    /// Replace the retry queue (after a flush). Best-effort — a failed encode
    /// simply doesn't write.
    static func setPending(_ pending: [PendingSync]) {
        guard let data = try? JSONEncoder().encode(pending) else { return }
        UserDefaults.standard.set(data, forKey: pendingKey)
    }

    /// The stable install UUID used as `patientRef` on every sync.
    static var patientRef: String { load().patientRef }
}

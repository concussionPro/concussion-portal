import Foundation

// SST Trainer — clinical protocol, ported faithfully from lib/sst-trainer/
// protocol.ts. Same constants, same rules, verified against tests/sst-protocol
// on the web side. Keep this in lockstep with protocol.ts: if one changes, both
// change. Construct: measured HRt (Buffalo/Leddy) → sub-symptom band at
// 80–90% of the MEASURED threshold → verified-only progression, ceiling capped
// at the measured HRt.

enum SSTProtocol {
    // Band math (Leddy 80–90% of measured HRt)
    static let bandLowerPct = 0.80
    static let bandUpperPct = 0.90
    static let prescribedMinutes = 20
    static let sessionsPerWeek = 6

    // Symptom rules
    static let provocationRise = 3   // graded-test HRt = first stage with a ≥3-pt rise over rest
    static let sessionStopRise = 2   // within-session: ≥2-pt rise → stop
    static let maxRestingToTest = 8  // resting symptoms ≥8/10 → don't test today
    // The OTHER validated BCTT termination criterion: volitional exhaustion.
    // The manual phrases it as RPE > 17; the applied rule on every surface is
    // ≥ 17 (EXHAUSTION_RPE in protocol.ts) — one point conservative.
    static let exhaustionRPE = 17
    // Length of the graded ramp in 60-second stages (PROTOCOL_STAGE_CAP in
    // protocol.ts). Reaching it without provocation = the whole protocol
    // completed symptom-free, the second way a test can honestly report no
    // exercise intolerance.
    static let protocolStageCap = 20

    // Progression
    static let cleanNeeded = 3            // consecutive live-verified clean sessions to advance
    static let advanceStepBpm = 5
    static let regressRecentWindow = 3    // flares within the last N sessions → regress
    static let regressFlareCount = 2
    static let verifiedReadingMinPct = 80 // % of readings that must be live-verified
    static let retestMinHours = 48        // spacing between graded tests
    static let hrJumpConfirm = 40         // >40 bpm jump between stages → confirm

    // HR plausibility
    static let hrMin = 30
    static let hrMax = 250

    // Prolonged-recovery prognostic flag (Haider MN et al., Front Neurol 2019,
    // PMC6492460): an absolute HRt below this cutoff predicts prolonged (>30-day)
    // recovery. PROGNOSTIC only — NOT a dose modifier.
    static let prolongedRecoveryHRtCutoff = 135

    /// Prolonged-recovery risk from a measured HRt. NOTE: the web
    /// (computePrescription) ALSO ORs ΔHR (threshold − resting) ≤ 50 bpm, but the
    /// watch has NO resting HR, so ONLY the `hrt < 135` arm is evaluated here.
    static func prolongedRecoveryRisk(forHRt hrt: Int) -> Bool { hrt < prolongedRecoveryHRtCutoff }

    /// Clinician-facing note when the prognostic flag is set (else nil). Mirrors
    /// the clinicianNote string in computePrescription, minus the ΔHR clause the
    /// watch cannot compute.
    static func clinicianNote(forHRt hrt: Int) -> String? {
        guard prolongedRecoveryRisk(forHRt: hrt) else { return nil }
        return "Threshold \(hrt) bpm is below the validated prolonged-recovery cutoff (HRt <135 bpm; Haider 2019). This predicts a slower recovery — oversee dosing directly, keep the band conservative, and re-assess more frequently. The evidence gives no severity-adjusted dose, so a shorter starting session is a clinical judgement, not an app default."
    }

    /// Sub-symptom training band from a MEASURED HRt (bpm).
    static func band(fromHRt hrt: Int) -> (lower: Int, upper: Int) {
        (Int((Double(hrt) * bandLowerPct).rounded()),
         Int((Double(hrt) * bandUpperPct).rounded()))
    }

    /// HRt from a completed graded test: the HR at the first stage whose symptom
    /// score rose ≥ provocationRise over the resting baseline. Returns nil for a
    /// no-intolerance test (reached exhaustion/max with no provocation).
    /// Mirrors detectThreshold in protocol.ts: a red-flag termination trumps
    /// everything (never mint an HRt from a test that ended on a warning sign),
    /// and a test with no logged stages is invalid — NOT a clearance signal.
    static func detectHRt(stages: [TestStage], restingSymptom: Int, redFlagStop: Bool = false) -> ThresholdResult {
        if redFlagStop || stages.contains(where: { $0.redFlag }) {
            return ThresholdResult(interpretation: .redFlag, hrt: nil, bandLow: nil, bandHigh: nil)
        }
        if stages.isEmpty {
            return ThresholdResult(interpretation: .invalid, hrt: nil, bandLow: nil, bandHigh: nil)
        }
        for s in stages where (s.symptomScore - restingSymptom) >= provocationRise {
            let (lo, hi) = band(fromHRt: s.heartRate)
            return ThresholdResult(interpretation: .physiologic, hrt: s.heartRate,
                                   bandLow: lo, bandHigh: hi)
        }
        // No provocation across the whole test. `.noIntolerance` is the
        // CLEARANCE-GRADE read — it drives the hub's clearance banner and the GP
        // report's "tolerance recovered" line — so it needs one of the two
        // validated endpoints to have actually been reached: a recorded terminal
        // Borg ≥ 17, or the full protocol ramp completed symptom-free. A test
        // that simply stopped early evidences neither and fails closed to
        // `.invalid`, exactly as detectThreshold does server-side (a mismatch
        // here would show the patient a clearance the clinician never receives).
        let reachedExhaustion = stages.compactMap(\.rpe).contains { $0 >= exhaustionRPE }
        let completedProtocol = stages.count >= protocolStageCap
        guard reachedExhaustion || completedProtocol else {
            return ThresholdResult(interpretation: .invalid, hrt: nil, bandLow: nil, bandHigh: nil)
        }
        return ThresholdResult(interpretation: .noIntolerance, hrt: nil, bandLow: nil, bandHigh: nil)
    }

    /// A single reading is VERIFIED only when the logged value equals a fresh
    /// live-feed value from a real sensor (mirrors isVerifiedReading in
    /// protocol.ts). Manual/typed or stale readings are never verified.
    static func isVerifiedReading(logged: Int, liveFresh: Int?) -> Bool {
        guard let live = liveFresh else { return false }
        return logged == live
    }

    /// Session-level verification: ≥80% of readings verified AND a live HR source.
    static func sessionVerified(readings: [SessionReading], source: HRSource) -> Bool {
        guard source == .liveWatch, !readings.isEmpty else { return false }
        let verified = readings.filter { $0.verified }.count
        return (verified * 100 / readings.count) >= verifiedReadingMinPct
    }

    /// Progression decision. Advance only on live-verified clean runs; NEVER
    /// exceed the measured HRt (→ retest at the cap). Regression is never gated.
    static func decide(current: Prescription, sessions: [SessionLog]) -> ProgressionDecision {
        // REST TRIGGER (mirrors progressionDecision): the last TWO sessions BOTH
        // flared → prescribe a rest day, ease the ceiling back one step (floored at
        // the lower bound), and push a clinician check-in. Checked BEFORE regress.
        let lastTwo = Array(sessions.suffix(2))
        if lastTwo.count == 2 && lastTwo.allSatisfy({ $0.flare }) {
            let newUpper = max(current.bandLow, current.bandHigh - advanceStepBpm)
            let delta = newUpper - current.bandHigh
            // Shift BOTH bounds by the same delta so band width stays constant
            // (mirrors applyCeiling on the web).
            return .rest(newLower: current.bandLow + delta, newUpper: newUpper)
        }

        // Regression: a recent flare run lowers the band immediately (ungated).
        // Safety evidence counts from EVERY session, verified or not.
        let recent = Array(sessions.suffix(regressRecentWindow))
        let flares = recent.filter { $0.flare }.count
        if flares >= regressFlareCount {
            let newUpper = max(current.hrt / 2, current.bandHigh - advanceStepBpm)
            // Shift BOTH bounds by the same delta so band width stays constant
            // (mirrors applyCeiling on the web).
            let delta = newUpper - current.bandHigh
            return .regress(newLower: current.bandLow + delta, newUpper: newUpper)
        }
        // A single recent flare (any source) blocks an advance — hold and rebuild.
        if flares > 0 { return .hold }

        // Advance: needs `cleanNeeded` consecutive LIVE-VERIFIED clean sessions.
        // Unverified sessions are EXCLUDED from advance evidence (mirrors
        // protocol.ts), not treated as breaking the run — their safety data
        // already counted above.
        let lastN = Array(sessions.filter { $0.verified }.suffix(cleanNeeded))
        let cleanVerified = lastN.count == cleanNeeded
            && lastN.allSatisfy { !$0.flare && $0.minutesPct >= 80 }
        if cleanVerified {
            // Ceiling is capped at the measured HRt: at the cap, prescribe a re-test.
            if current.bandHigh >= current.hrt {
                return .retest
            }
            let newUpper = min(current.bandHigh + advanceStepBpm, current.hrt)
            // Shift BOTH bounds by the same delta so band width stays constant
            // (mirrors applyCeiling on the web).
            let delta = newUpper - current.bandHigh
            return .advance(newLower: current.bandLow + delta, newUpper: newUpper)
        }

        return .hold
    }
}

// ── value types (mirror protocol.ts) ────────────────────────────────────────

enum Interpretation: String, Codable { case physiologic, noIntolerance = "no-intolerance", redFlag = "red-flag", invalid }
enum HRSource: String, Codable { case liveWatch = "watch", manual }

struct TestStage: Codable {
    var minute: Int
    var heartRate: Int
    var symptomScore: Int   // 0–10
    var rpe: Int?           // Borg 6–20
    var redFlag: Bool = false
}

struct ThresholdResult: Codable {
    var interpretation: Interpretation
    var hrt: Int?
    var bandLow: Int?
    var bandHigh: Int?
}

/// One graded test in the serial record — the recovery-trajectory instrument
/// (the measured-HRt curve over time, mirroring SstTrajectory on the web).
/// Non-measurable outcomes (no-intolerance / red-flag) are kept as clinical
/// events; `verified` = live-sensor measurement (the simulator feed is not).
struct ThresholdRecord: Codable {
    var date: Date
    var hrt: Int?
    var interpretation: Interpretation
    var verified: Bool
}

struct SessionReading: Codable { var bpm: Int; var verified: Bool }

struct Prescription: Codable {
    var hrt: Int
    var bandLow: Int
    var bandHigh: Int
    var minutes: Int = SSTProtocol.prescribedMinutes
    /// Prolonged-recovery prognostic flag (Haider 2019). Watch-only note: computed
    /// from `hrt < 135` alone — the web's ΔHR≤50 arm needs a resting HR the watch
    /// doesn't have. Optional (nil ≙ false/unknown) so prescriptions persisted
    /// before these fields decode fine — Swift's synthesized decoder does NOT fall
    /// back to a default value for a missing non-optional key.
    var prolongedRecoveryRisk: Bool? = nil
    /// Clinician-facing note set when `prolongedRecoveryRisk` is true (else nil).
    var clinicianNote: String? = nil

    /// True iff the prognostic flag is set (nil-safe accessor for call sites).
    var hasProlongedRecoveryRisk: Bool { prolongedRecoveryRisk == true }

    /// Build a measured prescription from a graded-test HRt, computing the
    /// prognostic flag. Use this (not the memberwise init) whenever a fresh HRt is
    /// adopted so the flag is populated.
    static func measured(hrt: Int, bandLow: Int, bandHigh: Int) -> Prescription {
        Prescription(
            hrt: hrt,
            bandLow: bandLow,
            bandHigh: bandHigh,
            minutes: SSTProtocol.prescribedMinutes,
            prolongedRecoveryRisk: SSTProtocol.prolongedRecoveryRisk(forHRt: hrt),
            clinicianNote: SSTProtocol.clinicianNote(forHRt: hrt)
        )
    }
}

struct SessionLog: Codable {
    var avgHeartRate: Int
    var peakHeartRate: Int
    var minutesPct: Int      // % of prescribed minutes completed
    var preSymptom: Int
    var peakSymptom: Int
    var verified: Bool
    var nextDayFlare: Bool = false
    /// A flare = within-session provocation OR a next-day flare.
    var flare: Bool { (peakSymptom - preSymptom) >= SSTProtocol.sessionStopRise || nextDayFlare }
}

enum ProgressionDecision: Equatable {
    case advance(newLower: Int, newUpper: Int)
    case hold
    case regress(newLower: Int, newUpper: Int)
    /// Two flare sessions in a row → rest day + eased band + clinician check-in.
    case rest(newLower: Int, newUpper: Int)
    case retest
}

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

    /// Sub-symptom training band from a MEASURED HRt (bpm).
    static func band(fromHRt hrt: Int) -> (lower: Int, upper: Int) {
        (Int((Double(hrt) * bandLowerPct).rounded()),
         Int((Double(hrt) * bandUpperPct).rounded()))
    }

    /// HRt from a completed graded test: the HR at the first stage whose symptom
    /// score rose ≥ provocationRise over the resting baseline. Returns nil for a
    /// no-intolerance test (reached exhaustion/max with no provocation).
    static func detectHRt(stages: [TestStage], restingSymptom: Int) -> ThresholdResult {
        for s in stages where (s.symptomScore - restingSymptom) >= provocationRise {
            let (lo, hi) = band(fromHRt: s.heartRate)
            return ThresholdResult(interpretation: .physiologic, hrt: s.heartRate,
                                   bandLow: lo, bandHigh: hi)
        }
        // No provocation across the whole test.
        if let last = stages.last, last.redFlag {
            return ThresholdResult(interpretation: .redFlag, hrt: nil, bandLow: nil, bandHigh: nil)
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
        // Regression: a recent flare run lowers the band immediately (ungated).
        let recent = Array(sessions.suffix(regressRecentWindow))
        let flares = recent.filter { $0.flare }.count
        if flares >= regressFlareCount {
            let newUpper = max(current.hrt / 2, current.bandHigh - advanceStepBpm)
            let newLower = Int((Double(newUpper) * (bandLowerPct / bandUpperPct)).rounded())
            return .regress(newLower: newLower, newUpper: newUpper)
        }

        // Advance: needs `cleanNeeded` consecutive LIVE-VERIFIED clean sessions.
        let lastN = Array(sessions.suffix(cleanNeeded))
        let cleanVerified = lastN.count == cleanNeeded
            && lastN.allSatisfy { $0.verified && !$0.flare && $0.minutesPct >= 80 }
        if cleanVerified {
            // Ceiling is capped at the measured HRt: at the cap, prescribe a re-test.
            if current.bandHigh >= current.hrt {
                return .retest
            }
            let newUpper = min(current.bandHigh + advanceStepBpm, current.hrt)
            let newLower = Int((Double(newUpper) * (bandLowerPct / bandUpperPct)).rounded())
            return .advance(newLower: newLower, newUpper: newUpper)
        }

        return .hold
    }
}

// ── value types (mirror protocol.ts) ────────────────────────────────────────

enum Interpretation: String, Codable { case physiologic, noIntolerance = "no-intolerance", redFlag = "red-flag" }
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

struct SessionReading: Codable { var bpm: Int; var verified: Bool }

struct Prescription: Codable {
    var hrt: Int
    var bandLow: Int
    var bandHigh: Int
    var minutes: Int = SSTProtocol.prescribedMinutes
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
    case retest
}

import SwiftUI

// SSTFlow — the app state machine / root coordinator for the standalone
// SST Trainer watch app. Owns the persisted SSTState, the single SSTWorkout
// (live heart-rate) instance, and the transient in-flight inputs (symptom
// profile, resting score, last threshold result, last progression decision).
//
// One coordinator, one enum step. Every screen is a leaf that reads what it
// needs from the flow and calls back into it to advance. The flow — never a
// screen — owns persistence, sync, and the clinical decisions.
//
// Launch rule: a saved Prescription → Home ("welcome back"); otherwise the
// first-run funnel (onboarding → symptom profile → readiness → graded test →
// result → home).

enum Feeling: String, CaseIterable {
    case better, same, worse
    var title: String { rawValue.capitalized }
}

@MainActor
final class SSTFlow: ObservableObject {

    // Where the app is right now.
    enum Step: Equatable {
        case onboarding
        case symptomProfile
        case readiness
        case gradedTest
        case result
        case home
        case training
        case progress
        case blocked(String)   // red flag / rest-today terminal card
    }

    @Published var step: Step = .onboarding

    /// Persisted per-install state (clinic linkage, prescription, sessions).
    @Published var state: SSTState

    /// Live heart-rate source (HealthKit). One instance, shared by test +
    /// training. Screens that read `bpm` observe it directly.
    let workout = SSTWorkout()

    // Transient in-flight inputs (not persisted until they matter).
    @Published var selectedSymptoms: Set<String> = []
    @Published var restingSymptom = 0
    @Published var lastResult: ThresholdResult?
    @Published var lastDecision: ProgressionDecision?

    init() {
        state = SSTState.load()
        step = (state.prescription != nil) ? .home : .onboarding
    }

    // MARK: - Launch

    func onLaunch() {
        Task {
            await workout.requestAuthorization()
            await SSTSync.flushPending()
        }
    }

    // MARK: - Navigation helpers

    func goHome() { step = .home }
    func goProgress() { step = .progress }

    /// Start (or re-start) the graded-test funnel from Home. If no symptoms are
    /// selected yet, collect them first. Blocked while red-flag locked.
    func startTestFlow() {
        guard !state.redFlagLocked else { return }
        step = selectedSymptoms.isEmpty ? .symptomProfile : .readiness
    }

    /// Patient confirms a clinician has reviewed + cleared them → unlock.
    func confirmClearance() {
        state.markCleared()
    }

    // MARK: - Onboarding

    func completeOnboarding(code: String, clinicName: String?, patientName: String) {
        state.setClinic(code: code, name: clinicName)
        state.patientName = patientName
        state.save()
        step = .symptomProfile
    }

    func setSymptoms(_ symptoms: Set<String>) {
        selectedSymptoms = symptoms
        step = .readiness
    }

    // MARK: - Readiness → graded test

    func recordRedFlag() {
        state.markRedFlag()
        step = .blocked("Some of what you described needs a clinician's eyes today. Please stop and seek medical review before training.")
    }

    func blockRestToday() {
        step = .blocked("Your symptoms are high right now. Rest today and try the test again when you're settled.")
    }

    /// Readiness passed — begin the graded exertion test on live HR.
    func beginGradedTest(restingSymptom resting: Int) {
        restingSymptom = resting
        Task { try? await workout.start() }
        step = .gradedTest
    }

    /// Graded test finished — compute the threshold, sync it, show the result.
    /// An invalid test (no stages logged) neither syncs nor starts the 48h
    /// re-test clock — an aborted 10-second attempt must not lock out a real one.
    func completeGradedTest(stages: [TestStage], redFlagStop: Bool = false) {
        workout.stop()
        let result = SSTProtocol.detectHRt(stages: stages, restingSymptom: restingSymptom, redFlagStop: redFlagStop)
        lastResult = result
        if result.interpretation != .invalid {
            state.markTested()
            Task { await postThreshold(result: result, stages: stages, redFlagStop: redFlagStop) }
        }
        if result.interpretation == .redFlag { state.markRedFlag() }
        step = .result
    }

    /// Accept the result screen: physiologic → save the prescription and go
    /// Home; anything else just returns Home (Home adapts when there is no band).
    func acceptResult() {
        if let r = lastResult,
           r.interpretation == .physiologic,
           let hrt = r.hrt, let lo = r.bandLow, let hi = r.bandHigh {
            state.setPrescription(Prescription(hrt: hrt, bandLow: lo, bandHigh: hi))
        }
        step = .home
    }

    // MARK: - Retest gating

    /// Hours since the last graded test (nil = never tested).
    var hoursSinceLastTest: Double? {
        guard let last = state.lastTestAt else { return nil }
        return Date().timeIntervalSince(last) / 3600
    }

    var canRetest: Bool {
        guard !state.redFlagLocked else { return false }
        guard let h = hoursSinceLastTest else { return true }
        return h >= Double(SSTProtocol.retestMinHours)
    }

    var retestHoursRemaining: Int {
        guard let h = hoursSinceLastTest else { return 0 }
        return max(0, Int((Double(SSTProtocol.retestMinHours) - h).rounded(.up)))
    }

    func startRetest() {
        guard canRetest else { return }
        step = .readiness
    }

    // MARK: - Training

    func beginTraining() {
        guard !state.redFlagLocked else { return }
        Task { try? await workout.start() }
        step = .training
    }

    /// Commit a finished training session: persist, sync, decide next step, and
    /// auto-apply a regression (safety-critical, ungated). Advance / retest are
    /// surfaced to the user to confirm, per protocol.
    func commitSession(_ log: SessionLog, feeling: Feeling, timeInBandPct: Int) {
        workout.stop()
        state.appendSession(log)
        guard let current = state.prescription else { lastDecision = .hold; return }
        let decision = SSTProtocol.decide(current: current, sessions: state.sessions)
        lastDecision = decision

        // Regression auto-applies immediately.
        if case let .regress(lo, hi) = decision {
            var p = current
            p.bandLow = lo
            p.bandHigh = hi
            state.setPrescription(p)
        }

        Task { await postTraining(log: log, feeling: feeling, timeInBandPct: timeInBandPct, decision: decision) }
    }

    /// User confirms an advance from the summary card.
    func applyAdvance(newLower: Int, newUpper: Int) {
        guard var p = state.prescription else { return }
        p.bandLow = newLower
        p.bandHigh = newUpper
        state.setPrescription(p)
    }

    // MARK: - Sync payloads

    private func postThreshold(result: ThresholdResult, stages: [TestStage], redFlagStop: Bool = false) async {
        // No raw Optionals in a JSONSerialization payload — unwrap or omit. The
        // hrtBpm/bandLow/bandHigh keys are lifted to top-level columns by
        // postSession, so use those exact names.
        let termination = redFlagStop ? "red-flag"
            : (result.interpretation == .physiologic ? "symptom-limited" : "exhaustion-limited")
        var payload: [String: Any] = [
            "eventType": "threshold",
            "interpretation": result.interpretation.rawValue,
            "termination": termination,
            "restingSymptom": restingSymptom,
            "hrSource": HRSource.liveWatch.rawValue,   // "watch"
            "hrVerified": true,
            "stages": stages.map { s -> [String: Any] in
                var d: [String: Any] = [
                    "minute": s.minute,
                    "heartRate": s.heartRate,
                    "symptomScore": s.symptomScore,
                    "redFlag": s.redFlag
                ]
                if let rpe = s.rpe { d["rpe"] = rpe }
                return d
            }
        ]
        if let hrt = result.hrt { payload["hrtBpm"] = hrt }
        if let lo = result.bandLow { payload["bandLow"] = lo }
        if let hi = result.bandHigh { payload["bandHigh"] = hi }

        _ = await SSTSync.postSession(
            clinicCode: state.clinicCode ?? "",
            sessionType: "threshold",
            patientLabel: state.patientName ?? "",
            condition: "concussion",
            payload: payload
        )
    }

    private func postTraining(log: SessionLog, feeling: Feeling, timeInBandPct: Int, decision: ProgressionDecision) async {
        var payload: [String: Any] = [
            "eventType": "training",
            "avgHeartRate": log.avgHeartRate,
            "peakHeartRate": log.peakHeartRate,
            "minutesPct": log.minutesPct,
            "timeInBandPct": timeInBandPct,
            "preSymptom": log.preSymptom,
            "peakSymptom": log.peakSymptom,
            "flare": log.flare,
            "feeling": feeling.rawValue,
            "verified": log.verified,
            "hrSource": HRSource.liveWatch.rawValue,
            "hrVerified": log.verified,
            "decision": decisionLabel(decision)
        ]
        if let p = state.prescription {
            payload["bandLow"] = p.bandLow
            payload["bandHigh"] = p.bandHigh
            payload["hrtBpm"] = p.hrt
        }
        _ = await SSTSync.postSession(
            clinicCode: state.clinicCode ?? "",
            sessionType: "training",
            patientLabel: state.patientName ?? "",
            condition: "concussion",
            payload: payload
        )
    }

    private func decisionLabel(_ d: ProgressionDecision) -> String {
        switch d {
        case .advance: return "advance"
        case .hold:    return "hold"
        case .regress: return "regress"
        case .retest:  return "retest"
        }
    }
}

// MARK: - Root

struct SSTRootView: View {
    @StateObject private var flow = SSTFlow()

    var body: some View {
        Group {
            switch flow.step {
            case .onboarding:
                OnboardingView()
            case .symptomProfile:
                SymptomProfileView()
            case .readiness:
                ReadinessView()
            case .gradedTest:
                GradedTestView(workout: flow.workout)
            case .result:
                ResultView()
            case .home:
                HomeView()
            case .training:
                TrainingSessionView(workout: flow.workout)
            case .progress:
                ProgressScreen()
            case .blocked(let message):
                BlockedView(message: message)
            }
        }
        .environmentObject(flow)
        .onAppear { flow.onLaunch() }
    }
}

// MARK: - Blocked (red flag / rest today)

struct BlockedView: View {
    @EnvironmentObject var flow: SSTFlow
    let message: String

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                MessageCard(
                    icon: "exclamationmark.triangle.fill",
                    iconColor: .orange,
                    title: "Not today",
                    body: message
                )
                PrimaryButton(title: "Close", tint: .gray) { flow.goHome() }
            }
            .padding(.horizontal, 4)
        }
    }
}

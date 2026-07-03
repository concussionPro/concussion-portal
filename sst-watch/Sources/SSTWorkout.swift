import Foundation
import HealthKit
import Combine

// Live heart rate on the wrist for the standalone SST Trainer.
//
// The graded exertion test and sub-symptom training both need a REAL, fresh
// heart rate — never a fabricated or frozen value. We read the watch's own
// sensor via an HKWorkoutSession + HKLiveWorkoutBuilder (activityType .other,
// location .indoor) and publish only the most-recent HKStatistics heart-rate
// quantity. A staleness watchdog clears `bpm` to nil if no sample arrives for
// ~5s, mirroring the web app's live-feed staleness guard — a stale reading must
// never be mistaken for a live one (isVerifiedReading depends on freshness).

enum SSTWorkoutError: Error {
    case healthDataUnavailable
    case heartRateTypeUnavailable
}

@MainActor
final class SSTWorkout: NSObject, ObservableObject {
    /// Most-recent live heart rate (bpm), rounded. `nil` when there is no fresh
    /// reading — never a stale/frozen value.
    @Published var bpm: Int?
    /// True between `start()` and `stop()` while the workout session is active.
    @Published var isStreaming: Bool = false
    /// True once the user has granted heart-rate access.
    @Published var authorized: Bool = false

    private let healthStore = HKHealthStore()
    private var session: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?

    private var lastSampleAt: Date?
    private var staleTimer: Timer?

    /// ~5s with no sample → clear bpm (mirrors the web staleness watchdog).
    private static let staleSeconds: TimeInterval = 5

    // nonisolated: read from the nonisolated HKLiveWorkoutBuilderDelegate
    // callback. Immutable HealthKit descriptors, safe to share across contexts.
    nonisolated private static let hrType = HKQuantityType(.heartRate)
    nonisolated private static let hrUnit = HKUnit.count().unitDivided(by: .minute())

    override init() {
        super.init()
    }

    // MARK: - Authorization

    /// Request share + read access to heart rate. Sets `authorized` from the
    /// resulting share status (read status isn't queryable, so share is the
    /// proxy).
    func requestAuthorization() async {
        guard HKHealthStore.isHealthDataAvailable() else {
            authorized = false
            return
        }
        let types: Set<HKSampleType> = [Self.hrType]
        do {
            try await healthStore.requestAuthorization(toShare: types, read: types)
            authorized = healthStore.authorizationStatus(for: Self.hrType) == .sharingAuthorized
        } catch {
            authorized = false
        }
    }

    // MARK: - Streaming lifecycle

    /// Begin a workout session + live builder and start streaming heart rate.
    func start() async throws {
        guard HKHealthStore.isHealthDataAvailable() else {
            throw SSTWorkoutError.healthDataUnavailable
        }

        let config = HKWorkoutConfiguration()
        config.activityType = .other
        config.locationType = .indoor

        let session = try HKWorkoutSession(healthStore: healthStore, configuration: config)
        let builder = session.associatedWorkoutBuilder()
        builder.dataSource = HKLiveWorkoutDataSource(
            healthStore: healthStore,
            workoutConfiguration: config
        )
        builder.delegate = self
        session.delegate = self

        self.session = session
        self.builder = builder

        let startDate = Date()
        session.startActivity(with: startDate)
        try await builder.beginCollection(at: startDate)

        isStreaming = true
        bpm = nil
        lastSampleAt = nil
        startStaleTimer()
    }

    /// End the session + builder cleanly and stop publishing HR.
    func stop() {
        staleTimer?.invalidate()
        staleTimer = nil

        let endingBuilder = builder
        let endingSession = session
        session = nil
        builder = nil

        isStreaming = false
        bpm = nil
        lastSampleAt = nil

        endingSession?.end()
        Task {
            let now = Date()
            try? await endingBuilder?.endCollection(at: now)
            _ = try? await endingBuilder?.finishWorkout()
        }
    }

    // MARK: - Ingest (main-actor)

    /// Publish a fresh sensor reading, guarded to a plausible HR range. Called
    /// only from the builder delegate with a real HKStatistics quantity.
    fileprivate func ingest(bpm value: Double) {
        guard value >= Double(SSTProtocol.hrMin), value <= Double(SSTProtocol.hrMax) else { return }
        bpm = Int(value.rounded())
        lastSampleAt = Date()
    }

    // MARK: - Staleness watchdog

    private func startStaleTimer() {
        staleTimer?.invalidate()
        staleTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.checkStale() }
        }
    }

    private func checkStale() {
        guard let last = lastSampleAt else { return }
        if Date().timeIntervalSince(last) > Self.staleSeconds {
            bpm = nil
        }
    }
}

// MARK: - HKLiveWorkoutBuilderDelegate

extension SSTWorkout: HKLiveWorkoutBuilderDelegate {
    nonisolated func workoutBuilder(
        _ workoutBuilder: HKLiveWorkoutBuilder,
        didCollectDataOf collectedTypes: Set<HKSampleType>
    ) {
        guard collectedTypes.contains(Self.hrType),
              let stats = workoutBuilder.statistics(for: Self.hrType),
              let quantity = stats.mostRecentQuantity()
        else { return }
        let value = quantity.doubleValue(for: Self.hrUnit)
        Task { @MainActor in self.ingest(bpm: value) }
    }

    nonisolated func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {
        // No per-event handling needed — HR arrives via didCollectDataOf.
    }
}

// MARK: - HKWorkoutSessionDelegate

extension SSTWorkout: HKWorkoutSessionDelegate {
    nonisolated func workoutSession(
        _ workoutSession: HKWorkoutSession,
        didChangeTo toState: HKWorkoutSessionState,
        from fromState: HKWorkoutSessionState,
        date: Date
    ) {
        // If the session ends/fails out from under us, stop publishing stale HR.
        if toState == .ended || toState == .stopped {
            Task { @MainActor in
                self.isStreaming = false
                self.bpm = nil
            }
        }
    }

    nonisolated func workoutSession(
        _ workoutSession: HKWorkoutSession,
        didFailWithError error: Error
    ) {
        Task { @MainActor in
            self.isStreaming = false
            self.bpm = nil
        }
    }
}

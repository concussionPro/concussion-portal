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
    /// True when bpm comes from the simulator demo feed, never a real sensor.
    /// Readings from a simulated feed are NEVER verified and never sync as real.
    @Published var simulated: Bool = false

    private let healthStore = HKHealthStore()
    private var session: HKWorkoutSession?
    private var builder: HKLiveWorkoutBuilder?

    private var lastSampleAt: Date?
    private var staleTimer: Timer?
    private var simTimer: Timer?

    /// ~5s with no sample → clear bpm (mirrors the web staleness watchdog).
    private static let staleSeconds: TimeInterval = 5

    // nonisolated: read from the nonisolated HKLiveWorkoutBuilderDelegate
    // callback. Immutable HealthKit descriptors, safe to share across contexts.
    nonisolated private static let hrType = HKQuantityType(.heartRate)
    nonisolated private static let hrUnit = HKUnit.count().unitDivided(by: .minute())

    /// One-minute heart-rate recovery — bpm drop in the 60s after exertion ends.
    /// watchOS computes and writes this itself after a workout, so we only READ
    /// it; nothing here has to time or derive it.
    ///
    /// Why it is worth having: HRR is an autonomic measure, and autonomic
    /// dysfunction is the mechanism the whole sub-symptom threshold approach
    /// rests on. Recorded post-BCTT it characterises recovery alongside HRt.
    ///
    /// CAPTURE AND DISPLAY ONLY. It is not an input to `decide()` and must not
    /// become one: progression is prescribed off the HR threshold and symptoms,
    /// which is the published protocol. An HRR-driven progression rule has no
    /// basis in the SST literature, and the programme's credibility is that the
    /// protocol is the cited one.
    nonisolated private static let hrrType = HKQuantityType(.heartRateRecoveryOneMinute)

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
        // HRR is READ-ONLY: watchOS writes it itself after a workout, we never
        // do, so it must not go in the share set — asking to write a type the
        // app never writes is an unnecessary permission.
        let shareTypes: Set<HKSampleType> = [Self.hrType]
        let readTypes: Set<HKObjectType> = [Self.hrType, Self.hrrType]
        do {
            try await healthStore.requestAuthorization(toShare: shareTypes, read: readTypes)
            authorized = healthStore.authorizationStatus(for: Self.hrType) == .sharingAuthorized
        } catch {
            authorized = false
        }
    }

    // MARK: - Heart-rate recovery (read-only, post-workout)

    /// The most recent 1-minute HRR sample at or after `since`, in bpm.
    ///
    /// watchOS writes this a short time AFTER the workout ends, so a caller
    /// polls briefly rather than reading once: the sample frequently is not
    /// there the instant the session stops. Returns nil if it never lands,
    /// which is a normal outcome (a session too short or too light to produce
    /// one) and never an error — the sync simply omits the field.
    func heartRateRecovery(since: Date, waitingUpTo seconds: Double = 90) async -> Int? {
        guard HKHealthStore.isHealthDataAvailable() else { return nil }
        let deadline = Date().addingTimeInterval(seconds)
        repeat {
            if let bpm = await latestHrrSample(since: since) { return bpm }
            try? await Task.sleep(nanoseconds: 10_000_000_000)   // 10s
        } while Date() < deadline
        return nil
    }

    private func latestHrrSample(since: Date) async -> Int? {
        let predicate = HKQuery.predicateForSamples(withStart: since, end: nil)
        let sort = [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]
        return await withCheckedContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: Self.hrrType,
                predicate: predicate,
                limit: 1,
                sortDescriptors: sort
            ) { _, samples, _ in
                guard let sample = (samples?.first as? HKQuantitySample) else {
                    continuation.resume(returning: nil)
                    return
                }
                let bpm = sample.quantity.doubleValue(for: Self.hrUnit)
                continuation.resume(returning: Int(bpm.rounded()))
            }
            healthStore.execute(query)
        }
    }

    // MARK: - Streaming lifecycle

    /// Begin a workout session + live builder and start streaming heart rate.
    func start() async throws {
        #if targetEnvironment(simulator)
        // The watch simulator has no HR sensor — feed a LABELLED demo waveform
        // so flows are drivable on a Mac. FIRST, before any HealthKit call:
        // beginCollection can throw on the sim (and callers `try?` it), which
        // would otherwise kill the feed and strand every HR-gated screen.
        // Compiled out of device builds; the `simulated` flag routes every
        // consumer to unverified handling.
        isStreaming = true
        bpm = nil
        lastSampleAt = nil
        startStaleTimer()
        startSimulatedFeed()
        // Marketing screenshot: seed an in-band reading so the live gauge shows a
        // real in-band HR immediately instead of the 80 bpm warm-up ramp.
        if ProcessInfo.processInfo.environment["SST_SHOT"] != nil { ingest(bpm: 122) }
        return
        #else
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
        #endif
    }

    /// End the session + builder cleanly and stop publishing HR.
    func stop() {
        staleTimer?.invalidate()
        staleTimer = nil
        simTimer?.invalidate()
        simTimer = nil
        simulated = false

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

    #if targetEnvironment(simulator)
    /// Demo HR: a slow climb with jitter (rest ~80 toward ~150) — enough to
    /// exercise zones, bands and thresholds. Clearly labelled in the UI.
    private func startSimulatedFeed() {
        simulated = true
        simTimer?.invalidate()
        simTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                guard let self else { return }
                let current = self.bpm ?? 80
                let drift = current < 150 ? Int.random(in: 0...3) : 0
                let jitter = Int.random(in: -2...2)
                self.ingest(bpm: Double(min(170, max(65, current + drift + jitter))))
            }
        }
    }
    #endif

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

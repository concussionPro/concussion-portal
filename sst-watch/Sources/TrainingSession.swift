import SwiftUI
import Combine

// Live training session, paced to the MEASURED band. Counts down from the
// prescribed minutes, shows HR vs band with a zone state, haptics on crossing
// out of / back into band, a persistent warning at/over the measured ceiling,
// and a live tick to the clinic every ~3s. A symptom rise ≥2 stops the session.
// Readings are verified when the logged bpm is the fresh live reading.

struct TrainingSessionView: View {
    @EnvironmentObject var flow: SSTFlow
    @ObservedObject var workout: SSTWorkout

    private enum Phase { case preSymptom, live, summary, decision }

    @State private var phase: Phase = .preSymptom

    // Live-session state. Elapsed derives from the wall clock, never tick
    // counts — throttled ticks (wrist-down) must not undercount the session
    // and block legitimate advances.
    @State private var total = SSTProtocol.prescribedMinutes * 60
    @State private var remaining = SSTProtocol.prescribedMinutes * 60
    @State private var elapsed = 0
    @State private var sessionStartedAt = Date()
    @State private var readings: [SessionReading] = []
    @State private var lastZone: Zone? = nil
    @State private var overCeiling = false
    @State private var easeOff = false

    // Symptoms.
    @State private var preSymptom = 0
    @State private var peakSymptom = 0
    @State private var symptomNow = 0
    @State private var stoppedForSymptom = false

    // Summary.
    @State private var feeling: Feeling? = nil

    private let ticker = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    private var band: (low: Int, high: Int, hrt: Int) {
        let p = flow.state.prescription
        return (p?.bandLow ?? 0, p?.bandHigh ?? 0, p?.hrt ?? 0)
    }

    var body: some View {
        Group {
            switch phase {
            case .preSymptom: preSymptomView
            case .live:       liveView
            case .summary:    summaryView
            case .decision:   decisionView
            }
        }
        .onReceive(ticker) { _ in if phase == .live { tick() } }
        .onAppear {
            #if targetEnvironment(simulator)
            // Marketing screenshot: jump straight to the live gauge (the baseline
            // step can't be tapped through headless). Sim-only; never on device.
            if ProcessInfo.processInfo.environment["SST_SHOT"] == "training" {
                preSymptom = 1; peakSymptom = 1; symptomNow = 1
                total = (flow.state.prescription?.minutes ?? SSTProtocol.prescribedMinutes) * 60
                remaining = total
                sessionStartedAt = Date()
                phase = .live
            }
            #endif
        }
    }

    // MARK: - Pre-session symptom baseline

    private var preSymptomView: some View {
        ScrollView {
            VStack(spacing: 12) {
                ScreenTitle(text: "Before you start", subtitle: "Set a baseline")
                CrownScorePicker(title: "How bad are your symptoms right now?", value: $preSymptom, descriptor: symptomWord, accentFor: symptomSeverityColor)
                PrimaryButton(title: "Begin", systemImage: "play.fill") {
                    peakSymptom = preSymptom
                    symptomNow = preSymptom
                    total = (flow.state.prescription?.minutes ?? SSTProtocol.prescribedMinutes) * 60
                    remaining = total
                    sessionStartedAt = Date()
                    phase = .live
                    Haptics.play(.start)
                }
            }
            .padding(.horizontal, 4)
        }
    }

    // MARK: - Live

    private var currentZone: Zone? {
        guard let bpm = workout.bpm else { return nil }
        return zone(bpm: bpm, low: band.low, high: band.high)
    }

    private var liveView: some View {
        ScrollView {
            VStack(spacing: 8) {
                Text(mmss(remaining))
                    .font(.system(size: 30, weight: .bold, design: .rounded))
                    .monospacedDigit()

                BandRing(low: band.low, high: band.high, ceiling: band.hrt,
                         centerBig: workout.bpm.map(String.init) ?? "– –",
                         centerSmall: "bpm",
                         bigColor: (currentZone ?? .inBand).color,
                         size: 116)

                if let z = currentZone {
                    Text(z.label)
                        .font(.footnote).fontWeight(.bold)
                        .foregroundStyle(z.color)
                } else {
                    Text("Band \(band.low)–\(band.high) bpm")
                        .font(.caption2).foregroundStyle(.secondary)
                }
                HRSourceStatus(workout: workout)

                if easeOff {
                    Label("Ease off — above your band", systemImage: "arrow.down.circle.fill")
                        .font(.caption).foregroundStyle(.orange)
                        .multilineTextAlignment(.center)
                }
                if overCeiling {
                    Label("At your threshold — slow down", systemImage: "exclamationmark.triangle.fill")
                        .font(.caption).fontWeight(.semibold).foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                }

                Divider()

                // Inline symptom score — no sheet, no save tap. A change
                // applies immediately; a ≥2-point rise stops the session.
                CrownScorePicker(title: "Symptoms now", value: $symptomNow, descriptor: symptomWord, accentFor: symptomSeverityColor)
                    .onChange(of: symptomNow) { _, v in
                        peakSymptom = max(peakSymptom, v)
                        if (v - preSymptom) >= SSTProtocol.sessionStopRise {
                            Haptics.play(.failure)
                            endSession(stoppedForSymptom: true)
                        }
                    }

                Button(role: .destructive) { endSession(stoppedForSymptom: false) } label: {
                    Label("End session", systemImage: "stop.circle")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
            }
            .padding(.horizontal, 4)
        }
    }

    private func tick() {
        elapsed = Int(Date().timeIntervalSince(sessionStartedAt))
        remaining = max(0, total - elapsed)

        if let bpm = workout.bpm {
            // Fresh by construction: SSTWorkout nils bpm after 5s without a
            // sample, so a non-nil bpm here IS the live sensor reading — except
            // the simulator's demo feed, which is never verified.
            readings.append(SessionReading(bpm: bpm, verified: !workout.simulated))

            let z = zone(bpm: bpm, low: band.low, high: band.high)
            if z == .over, lastZone != .over {
                easeOff = true
                Haptics.play(.directionUp)          // crossed above band
            } else if z != .over, lastZone == .over {
                easeOff = false
                Haptics.play(.success)              // returned in-band
            }
            lastZone = z
            overCeiling = bpm >= band.hrt
        }

        // Live tick to the clinic every ~3s.
        if elapsed % 3 == 0, let bpm = workout.bpm {
            let phaseLabel = zone(bpm: bpm, low: band.low, high: band.high).rawValue
            Task {
                await SSTSync.postLiveTick(
                    clinicCode: flow.state.clinicCode ?? "",
                    patientLabel: flow.state.patientName ?? "",
                    patientRef: flow.state.patientRef,
                    bpm: bpm,
                    bandLow: band.low,
                    bandHigh: band.high,
                    elapsedSec: elapsed,
                    phase: phaseLabel
                )
            }
        }

        if remaining == 0 { endSession(stoppedForSymptom: false) }
    }

    private func endSession(stoppedForSymptom: Bool) {
        self.stoppedForSymptom = stoppedForSymptom
        Haptics.play(.stop)
        phase = .summary
    }

    // MARK: - Summary + feeling

    private var avgHR: Int { readings.isEmpty ? 0 : readings.map(\.bpm).reduce(0, +) / readings.count }
    private var peakHR: Int { readings.map(\.bpm).max() ?? 0 }
    private var minutesPct: Int { total == 0 ? 0 : min(100, Int(Double(elapsed) / Double(total) * 100)) }
    private var timeInBandPct: Int {
        guard !readings.isEmpty else { return 0 }
        let inBand = readings.filter { zone(bpm: $0.bpm, low: band.low, high: band.high) == .inBand }.count
        return Int(Double(inBand) / Double(readings.count) * 100)
    }

    private var summaryView: some View {
        ScrollView {
            VStack(spacing: 10) {
                ScreenTitle(text: stoppedForSymptom ? "Stopped early" : "Nice work")

                statRow("Time", mmss(elapsed) + " / \(mmss(total))")
                statRow("In band", "\(timeInBandPct)%")
                statRow("Avg HR", avgHR > 0 ? "\(avgHR) bpm" : "–")
                statRow("Peak HR", peakHR > 0 ? "\(peakHR) bpm" : "–")
                statRow("Symptoms", "\(preSymptom) → \(peakSymptom)")

                Divider()
                Text("How do you feel vs before?")
                    .font(.footnote).foregroundStyle(.secondary)
                Text("Tap one — that saves the session.")
                    .font(.caption2).foregroundStyle(.tertiary)
                // One tap ends the flow: the feeling answer IS the save.
                // People are post-exercise on a small screen — no extra confirm.
                HStack(spacing: 6) {
                    ForEach(Feeling.allCases, id: \.self) { f in
                        Button {
                            feeling = f
                            Haptics.play(.success)
                            commit()
                        } label: {
                            Text(f.title).font(.caption).frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                        .tint(tint(for: f))
                    }
                }
            }
            .padding(.horizontal, 4)
        }
    }

    private func statRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label).font(.caption).foregroundStyle(.secondary)
            Spacer()
            Text(value).font(.caption).fontWeight(.semibold).monospacedDigit()
        }
    }

    private func tint(for f: Feeling) -> Color {
        switch f {
        case .better: return .green
        case .same:   return .blue
        case .worse:  return .orange
        }
    }

    private func commit() {
        guard let feeling else { return }
        // "Worse" is a global post-session worsening → ensure it registers as a
        // flare so progression treats it honestly (see divergence notes).
        var peak = peakSymptom
        if feeling == .worse { peak = max(peak, preSymptom + SSTProtocol.sessionStopRise) }

        // Dropout seconds produce NO readings, so session verification must
        // also require the readings to COVER the session — otherwise a mostly
        // sensor-dark session would still count as fully verified evidence.
        let coveragePct = elapsed > 0 ? readings.count * 100 / elapsed : 0
        let verified = coveragePct >= SSTProtocol.verifiedReadingMinPct
            && SSTProtocol.sessionVerified(readings: readings, source: .liveWatch)
        let log = SessionLog(
            avgHeartRate: avgHR,
            peakHeartRate: peakHR,
            minutesPct: minutesPct,
            preSymptom: preSymptom,
            peakSymptom: peak,
            verified: verified,
            nextDayFlare: false
        )
        flow.commitSession(log, feeling: feeling, timeInBandPct: timeInBandPct)
        phase = .decision
    }

    // MARK: - Progression decision card

    @ViewBuilder
    private var decisionView: some View {
        ScrollView {
            VStack(spacing: 12) {
                switch flow.lastDecision {
                case .advance(let lo, let hi):
                    MessageCard(icon: "arrow.up.circle.fill", iconColor: .green,
                                title: "Ready to progress",
                                body: "Your clean runs earned a step up. New band \(lo)–\(hi) bpm.")
                    PrimaryButton(title: "Update band", systemImage: "arrow.up") {
                        flow.applyAdvance(newLower: lo, newUpper: hi)
                        flow.goHome()
                    }
                    Button("Not yet") { flow.goHome() }.buttonStyle(.bordered)

                case .regress:
                    MessageCard(icon: "arrow.down.circle.fill", iconColor: .orange,
                                title: "Band eased",
                                body: "We've lowered your band to settle recent flares. It's already updated.")
                    PrimaryButton(title: "Done", tint: .gray) { flow.goHome() }

                case .rest:
                    MessageCard(icon: "bed.double.circle.fill", iconColor: .orange,
                                title: "Rest day",
                                body: "Two sessions in a row provoked your symptoms. Take a rest day today — we've eased your band back. Check in with your clinician before your next session, then resume gently.")
                    PrimaryButton(title: "Done", tint: .gray) { flow.goHome() }

                case .retest:
                    MessageCard(icon: "arrow.clockwise.circle.fill", iconColor: .blue,
                                title: "Time to re-test",
                                body: "You're at the top of your measured threshold. Run a fresh graded test to move it.")
                    PrimaryButton(title: "Re-test now", systemImage: "figure.run") {
                        if flow.canRetest { flow.startRetest() } else { flow.goHome() }
                    }
                    Button("Later") { flow.goHome() }.buttonStyle(.bordered)

                case .hold, .none:
                    MessageCard(icon: "checkmark.circle.fill", iconColor: .green,
                                title: "Keep going",
                                body: "Session logged. Stay in your band and keep the streak.")
                    PrimaryButton(title: "Done", tint: .gray) { flow.goHome() }
                }
            }
            .padding(.horizontal, 4)
            .onAppear { Haptics.play(.notification) }
        }
    }
}

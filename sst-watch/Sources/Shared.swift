import SwiftUI
import WatchKit

// Shared UI atoms + helpers for the standalone SST Trainer watch app.
// Watch-appropriate: big legible type, large tap targets, Digital Crown for
// numbers, real haptics. Nothing here invents a heart rate — HR is always read
// live from SSTWorkout and shown as dashes when there is no fresh reading.

// MARK: - Haptics

enum Haptics {
    static func play(_ type: WKHapticType) { WKInterfaceDevice.current().play(type) }
}

// MARK: - Training zone

enum Zone: String {
    case under, inBand = "in", over

    var color: Color {
        switch self {
        case .under:  return .blue
        case .inBand: return .green
        case .over:   return .orange
        }
    }

    var label: String {
        switch self {
        case .under:  return "Below band"
        case .inBand: return "In band"
        case .over:   return "Above band"
        }
    }
}

func zone(bpm: Int, low: Int, high: Int) -> Zone {
    if bpm < low { return .under }
    if bpm > high { return .over }
    return .inBand
}

// MARK: - Heart-rate readout (big + central, dashes when no fresh reading)

struct HRReadout: View {
    let bpm: Int?
    var tint: Color = .primary

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 4) {
            Image(systemName: "heart.fill")
                .foregroundStyle(.red)
                .font(.title3)
                .symbolEffect(.pulse, isActive: bpm != nil)
            Text(bpm.map(String.init) ?? "– –")
                .font(.system(size: 48, weight: .bold, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(tint)
                .contentTransition(.numericText())
            Text("bpm")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }
}

// MARK: - Band ring — premium HR-zone gauge (Activity-ring language)
//
// A 270° arc (gap at the bottom) that reads like a native watchOS ring: a muted
// warm-up zone, the bright training BAND as the hero, and an amber run-up to the
// ceiling. Big centred value. Used on Home (the band) and Result (the threshold).

struct BandRing: View {
    let low: Int
    let high: Int
    let ceiling: Int
    var centerBig: String
    var centerSmall: String
    var bigColor: Color = .green
    var lineWidth: CGFloat = 12
    var size: CGFloat = 130

    // Scale the arc to (bandLow − 12) … ceiling so the band is prominent, not a
    // sliver lost against a wide resting-to-ceiling range.
    private var floorHR: Double { Double(low) - 12 }
    private let arc = 0.75          // 270°
    private let rot = 135.0         // gap centred at the bottom
    private func frac(_ v: Int) -> Double {
        let span = Double(ceiling) - floorHR
        guard span > 0 else { return 0 }
        return min(1, max(0, (Double(v) - floorHR) / span))
    }

    var body: some View {
        ZStack {
            Circle().trim(from: 0, to: arc)
                .stroke(Color.white.opacity(0.10), style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(rot))
            Circle().trim(from: 0, to: frac(low) * arc)
                .stroke(Color.blue.opacity(0.40), style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(rot))
            Circle().trim(from: frac(high) * arc, to: arc)
                .stroke(Color.orange.opacity(0.55), style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(rot))
            Circle().trim(from: frac(low) * arc, to: frac(high) * arc)
                .stroke(
                    LinearGradient(colors: [Color(red: 0.16, green: 0.78, blue: 0.42),
                                            Color(red: 0.46, green: 0.94, blue: 0.58)],
                                   startPoint: .leading, endPoint: .trailing),
                    style: StrokeStyle(lineWidth: lineWidth + 1.5, lineCap: .round)
                )
                .rotationEffect(.degrees(rot))
            VStack(spacing: -1) {
                Text(centerBig)
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(bigColor)
                    .lineLimit(1)
                    .minimumScaleFactor(0.5)
                    .frame(maxWidth: size - lineWidth * 3.4)
                Text(centerSmall)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(.secondary)
                    .textCase(.uppercase)
            }
        }
        .frame(width: size, height: size)
    }
}

// MARK: - 0–10 (and any small integer range) score picker
//
// Deliberately NOT crown-driven: a focusable digitalCrownRotation inside a
// ScrollView captures the crown and kills page scrolling (broke the safety
// check screen). Big −/+ targets are also simpler for foggy patients.

struct CrownScorePicker: View {
    let title: String
    @Binding var value: Int
    var range: ClosedRange<Int> = 0...10
    var accent: Color = .blue
    /// Plain-language word for the current value ("Mild", "Hard") — scores mean
    /// nothing to a patient mid-exercise without one.
    var descriptor: ((Int) -> String)? = nil
    /// Value-dependent accent (e.g. severity colours) — overrides `accent`.
    var accentFor: ((Int) -> Color)? = nil

    private var liveAccent: Color { accentFor?(value) ?? accent }

    var body: some View {
        VStack(spacing: 2) {
            Text(title)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            HStack(spacing: 10) {
                stepButton("minus", enabled: value > range.lowerBound) { value -= 1 }
                Text("\(value)")
                    .font(.system(size: 40, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(liveAccent)
                    .contentTransition(.numericText())
                    .frame(minWidth: 52)
                stepButton("plus", enabled: value < range.upperBound) { value += 1 }
            }
            if let word = descriptor?(value) {
                Text(word)
                    .font(.caption2).fontWeight(.semibold)
                    .foregroundStyle(liveAccent)
                    .contentTransition(.opacity)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
    }

    private func stepButton(_ symbol: String, enabled: Bool, action: @escaping () -> Void) -> some View {
        Button {
            action()
            Haptics.play(.click)
        } label: {
            Image(systemName: symbol)
                .font(.title3.weight(.bold))
                .frame(width: 40, height: 36)
        }
        .buttonStyle(.bordered)
        .disabled(!enabled)
    }
}

// MARK: - HR source status (under the readout wherever HR is required)
//
// The watch IS the wearable — its own sensor via Health access. This makes the
// three non-reading states explicit instead of a dead "waiting…" line, and
// brands the simulator's demo feed so it can never pass for a measurement.

struct HRSourceStatus: View {
    @ObservedObject var workout: SSTWorkout

    var body: some View {
        if workout.simulated {
            Label("Simulated heart rate — demo only", systemImage: "wand.and.stars")
                .font(.caption2).foregroundStyle(.orange)
                .multilineTextAlignment(.center)
        } else if workout.bpm == nil {
            if workout.authorized {
                Text("Reading your heart rate — keep the watch snug on your wrist…")
                    .font(.caption2).foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            } else {
                VStack(spacing: 6) {
                    Text("Health access is off — SST reads your heart rate from this watch.")
                        .font(.caption2).foregroundStyle(.orange)
                        .multilineTextAlignment(.center)
                    Button {
                        Task { await workout.requestAuthorization() }
                    } label: {
                        Label("Allow Health access", systemImage: "heart.text.square")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }
            }
        }
    }
}

// MARK: - Buttons

struct PrimaryButton: View {
    let title: String
    var systemImage: String? = nil
    var tint: Color = .blue
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                if let systemImage { Image(systemName: systemImage) }
                Text(title).fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.borderedProminent)
        .tint(tint)
        .controlSize(.large)
    }
}

// MARK: - Message card (welcome-back / blocks / info)

struct MessageCard: View {
    var icon: String
    var iconColor: Color = .secondary
    var title: String
    var message: String

    // Keep the readable `body:` call-site label without colliding with the
    // View's `body` (a stored property can't be named `body`).
    init(icon: String, iconColor: Color = .secondary, title: String, body message: String) {
        self.icon = icon
        self.iconColor = iconColor
        self.title = title
        self.message = message
    }

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.largeTitle)
                .foregroundStyle(iconColor)
            Text(title)
                .font(.headline)
                .multilineTextAlignment(.center)
            Text(message)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Section title

struct ScreenTitle: View {
    let text: String
    var subtitle: String? = nil
    var body: some View {
        VStack(spacing: 1) {
            Text(text).font(.headline)
            if let subtitle {
                Text(subtitle).font(.caption2).foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Plain-language scale anchors

/// Severity → colour: none green, mild blue, moderate orange, severe+ red.
func symptomSeverityColor(_ v: Int) -> Color {
    switch v {
    case 0:      return .green
    case 1...3:  return .blue
    case 4...6:  return .orange
    default:     return .red
    }
}

/// 0–10 symptom severity in words (VAS anchors a patient can act on).
func symptomWord(_ v: Int) -> String {
    switch v {
    case 0:      return "None"
    case 1...3:  return "Mild"
    case 4...6:  return "Moderate"
    case 7...9:  return "Severe"
    default:     return "Worst possible"
    }
}

/// Borg 6–20 effort in words (standard RPE verbal anchors).
func borgWord(_ v: Int) -> String {
    switch v {
    case ...6:    return "No effort"
    case 7...8:   return "Extremely light"
    case 9...10:  return "Very light"
    case 11...12: return "Light"
    case 13...14: return "Somewhat hard"
    case 15...16: return "Hard"
    case 17...18: return "Very hard"
    case 19:      return "Extremely hard"
    default:      return "Maximal effort"
    }
}

// MARK: - Time formatting

func mmss(_ seconds: Int) -> String {
    let s = max(0, seconds)
    return String(format: "%d:%02d", s / 60, s % 60)
}

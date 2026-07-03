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

// MARK: - Digital Crown 0–10 (and any small integer range) picker

struct CrownScorePicker: View {
    let title: String
    @Binding var value: Int
    var range: ClosedRange<Int> = 0...10
    var accent: Color = .blue

    @State private var crown = 0.0

    var body: some View {
        VStack(spacing: 2) {
            Text(title)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Text("\(value)")
                .font(.system(size: 40, weight: .bold, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(accent)
                .contentTransition(.numericText())
            Text("Turn the crown")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
        .focusable()
        .digitalCrownRotation(
            $crown,
            from: Double(range.lowerBound),
            through: Double(range.upperBound),
            by: 1,
            sensitivity: .low,
            isContinuous: false,
            isHapticFeedbackEnabled: true
        )
        .onChange(of: crown) { _, newValue in
            let v = Int(newValue.rounded())
            if v != value { value = v }
        }
        .onAppear { crown = Double(value) }
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

// MARK: - Time formatting

func mmss(_ seconds: Int) -> String {
    let s = max(0, seconds)
    return String(format: "%d:%02d", s / 60, s % 60)
}

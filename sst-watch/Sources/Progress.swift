import SwiftUI

// Progress — the latest progression decision plus a compact session list with
// a verified badge. Read-only; named ProgressScreen to avoid the SwiftUI
// ProgressView clash.

struct ProgressScreen: View {
    @EnvironmentObject var flow: SSTFlow

    private var sessions: [SessionLog] { flow.state.sessions }

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                ScreenTitle(text: "Progress",
                            subtitle: "\(flow.state.verifiedSessionCount) verified sessions")

                if let d = flow.lastDecision {
                    decisionBanner(d)
                }

                if sessions.isEmpty {
                    MessageCard(icon: "list.bullet.rectangle",
                                title: "No sessions yet",
                                body: "Your training history will show here.")
                } else {
                    VStack(spacing: 6) {
                        ForEach(Array(sessions.enumerated().reversed()), id: \.offset) { item in
                            sessionRow(index: item.offset, log: item.element)
                        }
                    }
                }

                PrimaryButton(title: "Back", systemImage: "chevron.left", tint: .gray) {
                    flow.goHome()
                }
            }
            .padding(.horizontal, 4)
        }
    }

    private func decisionBanner(_ d: ProgressionDecision) -> some View {
        let (text, icon, color): (String, String, Color) = {
            switch d {
            case .advance: return ("Progressing", "arrow.up.circle.fill", .green)
            case .hold:    return ("Holding steady", "equal.circle.fill", .blue)
            case .regress: return ("Band eased", "arrow.down.circle.fill", .orange)
            case .retest:  return ("Re-test due", "arrow.clockwise.circle.fill", .blue)
            }
        }()
        return Label(text, systemImage: icon)
            .font(.footnote).fontWeight(.semibold)
            .foregroundStyle(color)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 6)
            .background(color.opacity(0.12), in: RoundedRectangle(cornerRadius: 10))
    }

    private func sessionRow(index: Int, log: SessionLog) -> some View {
        HStack(spacing: 8) {
            Image(systemName: log.verified ? "checkmark.seal.fill" : "seal")
                .foregroundStyle(log.verified ? .green : .secondary)
                .font(.footnote)
            VStack(alignment: .leading, spacing: 1) {
                Text("Session \(index + 1)").font(.caption).fontWeight(.semibold)
                Text("\(log.avgHeartRate) avg · \(log.minutesPct)% · sx \(log.preSymptom)→\(log.peakSymptom)")
                    .font(.caption2).foregroundStyle(.secondary)
            }
            Spacer()
            if log.flare {
                Image(systemName: "flame.fill").foregroundStyle(.orange).font(.caption2)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 4)
        .padding(.horizontal, 6)
        .background(.gray.opacity(0.12), in: RoundedRectangle(cornerRadius: 8))
    }
}

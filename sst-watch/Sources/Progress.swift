import SwiftUI
import Charts

// Progress — the recovery-trajectory instrument (serial MEASURED HRt, the
// core wedge — mirrors SstTrajectory on the web), the latest progression
// decision, and a compact session list with a verified badge. Read-only;
// named ProgressScreen to avoid the SwiftUI ProgressView clash.
//
// Trajectory disciplines (same as web): plot ONLY verified measured points;
// non-measurable tests (no-intolerance / red-flag) are clinical events listed
// below, never plotted; unverified (sim) measurements are counted, not hidden.
// It is a trend to interpret, not a recovery verdict.

struct ProgressScreen: View {
    @EnvironmentObject var flow: SSTFlow

    private var sessions: [SessionLog] { flow.state.sessions }
    private var records: [ThresholdRecord] { flow.state.thresholds ?? [] }
    private var plottable: [ThresholdRecord] { records.filter { $0.hrt != nil && $0.verified } }
    private var nonMeasurable: [ThresholdRecord] { records.filter { $0.hrt == nil } }
    private var excluded: Int { records.count - plottable.count - nonMeasurable.count }

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                ScreenTitle(text: "Progress",
                            subtitle: "\(flow.state.verifiedSessionCount) verified sessions")

                if !records.isEmpty {
                    trajectory
                }

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

    // MARK: - Measured-HRt trajectory

    @ViewBuilder
    private var trajectory: some View {
        VStack(spacing: 4) {
            HStack {
                Text("Your threshold over time")
                    .font(.caption).fontWeight(.semibold)
                Spacer()
                if let latest = plottable.last?.hrt {
                    Text("\(latest) bpm")
                        .font(.caption).fontWeight(.bold)
                        .monospacedDigit()
                        .foregroundStyle(.green)
                }
            }

            if plottable.isEmpty {
                Text("Measured points appear here after a graded test with live heart rate.")
                    .font(.caption2).foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            } else {
                Chart(Array(plottable.enumerated()), id: \.offset) { item in
                    LineMark(
                        x: .value("Test", item.offset),
                        y: .value("HRt", item.element.hrt ?? 0)
                    )
                    .foregroundStyle(.teal)
                    .lineStyle(StrokeStyle(lineWidth: 2, lineCap: .round))
                    PointMark(
                        x: .value("Test", item.offset),
                        y: .value("HRt", item.element.hrt ?? 0)
                    )
                    .foregroundStyle(.green)
                }
                .chartXAxis(.hidden)
                .chartYScale(domain: yDomain)
                .chartYAxis { AxisMarks(position: .leading, values: .automatic(desiredCount: 3)) }
                .frame(height: 72)

                if let first = plottable.first?.hrt, let latest = plottable.last?.hrt, latest != first {
                    Text(latest > first ? "▲ +\(latest - first) bpm since your first test" : "▼ \(latest - first) bpm since your first test")
                        .font(.caption2).fontWeight(.semibold)
                        .foregroundStyle(latest > first ? .green : .orange)
                }
                Text("A measured trend — not a recovery verdict.")
                    .font(.system(size: 10)).foregroundStyle(.tertiary)
            }

            // Clinical events without a measurable HRt — listed, never plotted.
            ForEach(Array(nonMeasurable.enumerated()), id: \.offset) { item in
                HStack(spacing: 4) {
                    Image(systemName: item.element.interpretation == .redFlag ? "flag.fill" : "checkmark.circle")
                        .font(.system(size: 9))
                        .foregroundStyle(item.element.interpretation == .redFlag ? .red : .green)
                    Text(item.element.interpretation == .redFlag ? "Red flag — test stopped" : "No intolerance found")
                        .font(.system(size: 10)).foregroundStyle(.secondary)
                    Spacer()
                    Text(item.element.date, format: .dateTime.day().month(.abbreviated))
                        .font(.system(size: 10)).foregroundStyle(.tertiary)
                }
            }
            if excluded > 0 {
                Text("\(excluded) unverified measurement\(excluded == 1 ? "" : "s") not plotted")
                    .font(.system(size: 10)).foregroundStyle(.tertiary)
            }
        }
        .padding(.vertical, 6)
        .padding(.horizontal, 8)
        .background(.gray.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))
    }

    /// Pad the y-range so a flat-ish curve isn't pinned to the plot edges.
    private var yDomain: ClosedRange<Int> {
        let values = plottable.compactMap(\.hrt)
        let lo = (values.min() ?? 100) - 8
        let hi = (values.max() ?? 160) + 8
        return max(0, lo)...hi
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

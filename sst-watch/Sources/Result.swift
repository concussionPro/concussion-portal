import SwiftUI

// Result / prescription reveal. Physiologic → show the measured threshold and
// the training band. No-intolerance → reassurance + retest later. Red flag →
// stop and seek review. Continue routes Home (Home adapts when there's no band).

struct ResultView: View {
    @EnvironmentObject var flow: SSTFlow

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                switch flow.lastResult?.interpretation {
                case .physiologic:
                    physiologic
                case .noIntolerance:
                    MessageCard(
                        icon: "checkmark.circle.fill",
                        iconColor: .green,
                        title: "No intolerance found",
                        body: "You reached the top of the test without a symptom rise. That's a good sign — retest in a couple of days to set a band."
                    )
                case .redFlag:
                    MessageCard(
                        icon: "cross.case.fill",
                        iconColor: .orange,
                        title: "Stop for now",
                        body: "The test flagged something that needs a clinician. Please seek medical review before training."
                    )
                case .none:
                    MessageCard(
                        icon: "questionmark.circle",
                        title: "No result",
                        body: "Let's try the test again."
                    )
                }

                PrimaryButton(title: "Continue", systemImage: "arrow.right") {
                    flow.acceptResult()
                }
            }
            .padding(.horizontal, 4)
            .onAppear { Haptics.play(.notification) }
        }
    }

    @ViewBuilder
    private var physiologic: some View {
        if let r = flow.lastResult, let hrt = r.hrt, let lo = r.bandLow, let hi = r.bandHigh {
            VStack(spacing: 10) {
                ScreenTitle(text: "Your threshold")
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text("\(hrt)")
                        .font(.system(size: 46, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(.red)
                    Text("bpm").font(.caption).foregroundStyle(.secondary)
                }
                Text("This is where your symptoms started to rise.")
                    .font(.caption2).foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)

                Divider()

                Text("Train at")
                    .font(.footnote).foregroundStyle(.secondary)
                Text("\(lo)–\(hi) bpm")
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(.green)
                Text("Keep your heart rate in this band. It stays safely under your threshold.")
                    .font(.caption2).foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
    }
}

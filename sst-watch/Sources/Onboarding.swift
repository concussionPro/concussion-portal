import SwiftUI

// First-run funnel: clinic code → patient name → symptom profile → readiness.
// Watch text entry is limited, so the code field leans on scribble/dictation
// with an explicit submit and a live validation result.

// MARK: - Data agreement (single screen, one button — never a toggle stack)

struct ConsentView: View {
    @EnvironmentObject var flow: SSTFlow

    private static let points: [(icon: String, text: String)] = [
        ("heart.fill", "Reads your heart rate from this watch during tests and training"),
        ("waveform.path.ecg", "Keeps the symptom scores you enter"),
        ("applewatch", "Everything is stored on this watch — no account"),
        ("building.2", "Shared with your clinic only if you link one"),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                ScreenTitle(text: "Your data", subtitle: "One agreement, in plain terms")

                VStack(alignment: .leading, spacing: 8) {
                    ForEach(Self.points, id: \.text) { p in
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: p.icon)
                                .foregroundStyle(.blue)
                                .font(.caption)
                                .frame(width: 16)
                            Text(p.text).font(.caption2)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                PrimaryButton(title: "Agree & continue", systemImage: "checkmark") {
                    flow.acceptConsent()
                }
                Text("The watch will ask for Health access next.")
                    .font(.caption2).foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal, 4)
        }
    }
}

// MARK: - Clinic code + patient name (optional — self-guided needs neither)

struct OnboardingView: View {
    @EnvironmentObject var flow: SSTFlow

    @State private var code = ""
    @State private var name = ""
    @State private var checking = false
    @State private var validated: Bool? = nil
    @State private var clinicName: String? = nil

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                ScreenTitle(text: "Welcome", subtitle: "Let's link your clinic")

                VStack(alignment: .leading, spacing: 4) {
                    Text("Clinic code").font(.caption).foregroundStyle(.secondary)
                    TextField("e.g. ABC123", text: $code)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()
                        .submitLabel(.go)
                        .onSubmit(validate)
                        .onChange(of: code) { _, _ in validated = nil }
                }

                if checking {
                    ProgressView()
                } else if let ok = validated {
                    if ok {
                        Label(clinicName ?? "Clinic found", systemImage: "checkmark.seal.fill")
                            .font(.footnote)
                            .foregroundStyle(.green)
                    } else {
                        Label("Code not recognised", systemImage: "xmark.octagon.fill")
                            .font(.footnote)
                            .foregroundStyle(.orange)
                    }
                }

                if validated != true {
                    PrimaryButton(title: "Check code", systemImage: "arrow.right.circle") {
                        validate()
                    }
                    .disabled(code.trimmingCharacters(in: .whitespaces).isEmpty || checking)

                    // Clinic-gated per TGA (owner, 2026-07-05): a validated clinic
                    // code is the activation key — public download, but no code
                    // means no program. There is NO self-guided path in any build.
                    Text("Your clinician's code links your training to their review — ask your clinic for it.")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }

                if validated == true {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Your name").font(.caption).foregroundStyle(.secondary)
                        TextField("First name", text: $name)
                            .textInputAutocapitalization(.words)
                            .autocorrectionDisabled()
                    }
                    PrimaryButton(title: "Continue", systemImage: "arrow.right") {
                        flow.completeOnboarding(
                            code: code.trimmingCharacters(in: .whitespaces).uppercased(),
                            clinicName: clinicName,
                            patientName: name.trimmingCharacters(in: .whitespaces)
                        )
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
            .padding(.horizontal, 4)
        }
    }

    private func validate() {
        let trimmed = code.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        checking = true
        Task {
            let result = await SSTSync.validateCode(trimmed)
            await MainActor.run {
                checking = false
                validated = result.valid
                clinicName = result.clinicName
                if result.valid { Haptics.play(.success) } else { Haptics.play(.failure) }
            }
        }
    }
}

// MARK: - Symptom profile (multi-select)

struct SymptomProfileView: View {
    @EnvironmentObject var flow: SSTFlow

    static let options = [
        "Headache", "Dizziness", "Nausea", "Fog",
        "Pressure in head", "Balance", "Light sensitivity",
        "Noise sensitivity", "Neck pain"
    ]

    @State private var selected: Set<String> = []

    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                Button { flow.goBack() } label: {
                    Label("Back", systemImage: "chevron.left").font(.caption2)
                }
                .buttonStyle(.plain)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
                ScreenTitle(text: "Your symptoms", subtitle: "We'll ask about these")

                ForEach(Self.options, id: \.self) { symptom in
                    Button {
                        if selected.contains(symptom) { selected.remove(symptom) }
                        else { selected.insert(symptom) }
                        Haptics.play(.click)
                    } label: {
                        HStack {
                            Image(systemName: selected.contains(symptom) ? "checkmark.circle.fill" : "circle")
                                .foregroundStyle(selected.contains(symptom) ? .green : .secondary)
                            Text(symptom)
                            Spacer()
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }

                PrimaryButton(title: "Continue", systemImage: "arrow.right") {
                    flow.setSymptoms(selected)
                }
                .disabled(selected.isEmpty)
                .padding(.top, 4)
            }
            .padding(.horizontal, 4)
        }
        .onAppear { if selected.isEmpty { selected = flow.selectedSymptoms } }
    }
}

// MARK: - Readiness (red-flag checklist + resting score + acknowledgement)

struct ReadinessView: View {
    @EnvironmentObject var flow: SSTFlow

    static let redFlags = [
        "Worsening headache",
        "Repeated vomiting",
        "Weakness or numbness",
        "Slurred speech",
        "Seizure",
        "Increasing confusion",
        "Loss of consciousness"
    ]

    @State private var flagged: Set<String> = []
    @State private var resting = 0
    @State private var acknowledged = false

    private var hasRedFlag: Bool { !flagged.isEmpty }
    private var restingTooHigh: Bool { resting >= SSTProtocol.maxRestingToTest }

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                Button { flow.goBack() } label: {
                    Label("Back", systemImage: "chevron.left").font(.caption2)
                }
                .buttonStyle(.plain)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
                ScreenTitle(text: "Safety check", subtitle: "Before we start")

                VStack(alignment: .leading, spacing: 6) {
                    Text("Any of these right now?")
                        .font(.footnote).foregroundStyle(.secondary)
                    ForEach(Self.redFlags, id: \.self) { flag in
                        Button {
                            if flagged.contains(flag) { flagged.remove(flag) }
                            else { flagged.insert(flag); Haptics.play(.directionUp) }
                        } label: {
                            HStack {
                                Image(systemName: flagged.contains(flag) ? "exclamationmark.triangle.fill" : "circle")
                                    .foregroundStyle(flagged.contains(flag) ? .orange : .secondary)
                                Text(flag).font(.caption)
                                Spacer()
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                    }
                }

                if hasRedFlag {
                    MessageCard(
                        icon: "cross.case.fill",
                        iconColor: .orange,
                        title: "Seek medical review",
                        body: "Please stop and get checked before any training."
                    )
                    PrimaryButton(title: "I understand", tint: .orange) {
                        flow.recordRedFlag()
                    }
                } else {
                    Divider()
                    CrownScorePicker(title: "How bad are your symptoms right now?", value: $resting, descriptor: symptomWord, accentFor: symptomSeverityColor)

                    if restingTooHigh {
                        MessageCard(
                            icon: "bed.double.fill",
                            iconColor: .blue,
                            title: "Rest today",
                            body: "Your symptoms are high. Try again when they settle."
                        )
                        PrimaryButton(title: "Okay", tint: .gray) { flow.blockRestToday() }
                    } else {
                        Toggle(isOn: $acknowledged) {
                            Text("I feel safe to do a light exertion test.")
                                .font(.caption)
                        }
                        .padding(.vertical, 2)

                        PrimaryButton(title: "Start test", systemImage: "figure.run") {
                            flow.beginGradedTest(restingSymptom: resting)
                        }
                        .disabled(!acknowledged)
                    }
                }
            }
            .padding(.horizontal, 4)
        }
    }
}

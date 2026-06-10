import { MaterialIcons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useMemo, useState } from "react"
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native"

type Role = "farmer" | "manager" | "buyer"

type FieldConfig = {
  label: string
  placeholder: string
  icon: keyof typeof MaterialIcons.glyphMap
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric"
}

const roles: Role[] = ["farmer", "manager", "buyer"]
const logo = require("../../assets/cemslogo.svg")

const roleDetails: Record<
  Role,
  {
    title: string
    intro: string
    totalSteps: number
    stepTwoTitle: string
    stepTwoIntro: string
    stepTwoFields: FieldConfig[]
    doneNote: string
  }
> = {
  farmer: {
    title: "Personal Details",
    intro:
      "Please provide your basic information to begin building your farmer profile.",
    totalSteps: 3,
    stepTwoTitle: "Farm Basics",
    stepTwoIntro: "Tell us about your farm scale so CEMS can tailor export estimates.",
    stepTwoFields: [
      { label: "Number of Trees Owned", placeholder: "e.g. 500", icon: "forest", keyboardType: "numeric" },
      { label: "Expected Yield Per Season (kg)", placeholder: "e.g. 15000", icon: "scale", keyboardType: "numeric" },
      { label: "Village / Location", placeholder: "e.g. Kimalel Village", icon: "location-on" },
    ],
    doneNote: "Your manager will verify and activate your account.",
  },
  manager: {
    title: "Quick Setup",
    intro: "Let's get your manager profile set up.",
    totalSteps: 2,
    stepTwoTitle: "Sector Details",
    stepTwoIntro: "Tell us about your assigned cooperative sector.",
    stepTwoFields: [
      { label: "Assigned Cooperative Sector", placeholder: "e.g. Northern Region", icon: "domain" },
      { label: "Number of Managed Farmers", placeholder: "e.g. 25", icon: "groups", keyboardType: "numeric" },
    ],
    doneNote: "You can complete your full manager profile later in Settings.",
  },
  buyer: {
    title: "Quick Setup",
    intro: "Let's get your buyer account set up.",
    totalSteps: 2,
    stepTwoTitle: "Business Basics",
    stepTwoIntro: "Tell us about your business so we can match you to export-ready supply.",
    stepTwoFields: [
      { label: "Company Name", placeholder: "e.g. Global Fruits Ltd.", icon: "business" },
      { label: "Primary Export Region", placeholder: "e.g. European Union", icon: "public" },
    ],
    doneNote: "You can complete your full buyer profile later in Settings.",
  },
}

export default function OnboardingScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ role?: string }>()
  const initialRole = roles.includes(params.role as Role) ? (params.role as Role) : "farmer"
  const [role, setRole] = useState<Role>(initialRole)
  const [step, setStep] = useState(1)
  const [confirmed, setConfirmed] = useState(false)
  const { width } = useWindowDimensions()
  const isWide = width >= 760
  const details = roleDetails[role]

  const stepLabel = useMemo(() => `STEP ${step} OF ${details.totalSteps}`, [details.totalSteps, step])

  function switchRole(nextRole: Role) {
    setRole(nextRole)
    setStep(1)
    setConfirmed(false)
  }

  function next() {
    if (step < details.totalSteps) {
      setStep((value) => value + 1)
      return
    }
    router.replace(`/${role}`)
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={[styles.card, isWide && styles.cardWide]}>
        <View style={styles.brandLine}>
          <Image source={logo} style={styles.logo} contentFit="contain" />
          <Text style={styles.brandText}>CEMS</Text>
        </View>

        <View style={styles.roleTabs}>
          {roles.map((item) => (
            <Pressable
              key={item}
              style={[styles.roleTab, item === role && styles.roleTabActive]}
              onPress={() => switchRole(item)}
            >
              <Text style={[styles.roleTabText, item === role && styles.roleTabTextActive]}>
                {item[0].toUpperCase() + item.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.progressHeader}>
          <Text style={styles.stepLabel}>{stepLabel}</Text>
          <View style={styles.dots}>
            {Array.from({ length: details.totalSteps }).map((_, index) => (
              <View key={index} style={[styles.dot, index + 1 <= step && styles.dotActive]} />
            ))}
          </View>
        </View>

        {step === 1 ? (
          <PersonalStep role={role} title={details.title} intro={details.intro} onNext={next} />
        ) : role === "farmer" && step === 3 ? (
          <ReviewStep
            confirmed={confirmed}
            setConfirmed={setConfirmed}
            onBack={() => setStep(2)}
            onFinish={next}
            note={details.doneNote}
          />
        ) : (
          <DetailsStep
            title={details.stepTwoTitle}
            intro={details.stepTwoIntro}
            fields={details.stepTwoFields}
            note={details.doneNote}
            isFinal={step === details.totalSteps}
            onBack={() => setStep(1)}
            onNext={next}
          />
        )}
      </View>
    </ScrollView>
  )
}

function PersonalStep({
  role,
  title,
  intro,
  onNext,
}: {
  role: Role
  title: string
  intro: string
  onNext: () => void
}) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.intro}>{intro}</Text>

      {role !== "farmer" ? (
        <>
          <Pressable style={styles.googleButton}>
            <MaterialIcons name="account-circle" size={24} color="#0f5238" />
            <Text style={styles.googleText}>Continue with Google</Text>
          </Pressable>
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>
        </>
      ) : null}

      <FormField label="Full Name" placeholder="e.g. Jane Doe" icon="person-outline" />
      <FormField label="Email Address" placeholder="maria@example.com" icon="mail-outline" keyboardType="email-address" />
      <FormField label="Phone Number" placeholder="+254 XXX XXX XXX" icon="phone" keyboardType="phone-pad" />
      {role === "farmer" ? (
        <FormField label="Village / Location" placeholder="e.g. Kimalel Village" icon="location-on" />
      ) : null}

      <Pressable style={styles.primaryButton} onPress={onNext}>
        <Text style={styles.primaryText}>Next Step</Text>
        <MaterialIcons name="arrow-forward" size={22} color="#ffffff" />
      </Pressable>
    </View>
  )
}

function DetailsStep({
  title,
  intro,
  fields,
  note,
  isFinal,
  onBack,
  onNext,
}: {
  title: string
  intro: string
  fields: FieldConfig[]
  note: string
  isFinal: boolean
  onBack: () => void
  onNext: () => void
}) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.intro}>{intro}</Text>
      {fields.map((field) => (
        <FormField key={field.label} {...field} />
      ))}
      <View style={styles.actionRow}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={20} color="#605f50" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable style={styles.nextButton} onPress={onNext}>
          <Text style={styles.nextText}>{isFinal ? "Finish Setup" : "Next Step"}</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
        </Pressable>
      </View>
      {isFinal ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  )
}

function ReviewStep({
  confirmed,
  setConfirmed,
  onBack,
  onFinish,
  note,
}: {
  confirmed: boolean
  setConfirmed: (value: boolean) => void
  onBack: () => void
  onFinish: () => void
  note: string
}) {
  return (
    <View>
      <Text style={[styles.title, styles.centerText]}>Review & Submit</Text>
      <Text style={[styles.intro, styles.centerText]}>
        Please review your information carefully before final submission.
      </Text>
      <View style={styles.reviewPanel}>
        <ReviewGroup
          icon="person-outline"
          title="Personal Details"
          rows={[
            ["Full Name", "Elias Thorne"],
            ["Phone Number", "+254 712 345 678"],
            ["Email Address", "elias.thorne@example.com"],
          ]}
        />
        <ReviewGroup
          icon="terrain"
          title="Farm Information"
          rows={[
            ["Farm Name", "Green Valley Estate"],
            ["Primary Crop", "Hass Avocados"],
            ["Acreage", "12.5 Acres"],
            ["Location", "Murang'a County"],
          ]}
        />
      </View>

      <Pressable style={styles.confirmLine} onPress={() => setConfirmed(!confirmed)}>
        <View style={[styles.checkbox, confirmed && styles.checkboxActive]}>
          {confirmed ? <MaterialIcons name="check" size={17} color="#ffffff" /> : null}
        </View>
        <Text style={styles.confirmText}>I confirm my details are accurate.</Text>
      </Pressable>

      <View style={styles.actionRow}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={20} color="#605f50" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable
          style={[styles.nextButton, !confirmed && styles.disabledButton]}
          onPress={confirmed ? onFinish : undefined}
        >
          <Text style={styles.nextText}>Complete Registration</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
        </Pressable>
      </View>
      <Text style={styles.note}>{note}</Text>
    </View>
  )
}

function ReviewGroup({
  icon,
  title,
  rows,
}: {
  icon: keyof typeof MaterialIcons.glyphMap
  title: string
  rows: [string, string][]
}) {
  return (
    <View style={styles.reviewGroup}>
      <View style={styles.reviewTitleLine}>
        <MaterialIcons name={icon} size={25} color="#605f50" />
        <Text style={styles.reviewTitle}>{title}</Text>
      </View>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>{label}</Text>
          <Text style={styles.reviewValue}>{value}</Text>
        </View>
      ))}
    </View>
  )
}

function FormField({ label, placeholder, icon, keyboardType }: FieldConfig) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <MaterialIcons name={icon} size={22} color="#707973" />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#707973"
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#fcf9f8",
  },
  content: {
    minHeight: "100%",
    padding: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 720,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 24,
    shadowColor: "#2d6a4f",
    shadowOpacity: 0.09,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 7,
  },
  cardWide: {
    padding: 42,
  },
  brandLine: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
  logo: {
    width: 24,
    height: 24,
  },
  brandText: {
    color: "#0f5238",
    fontSize: 20,
    fontWeight: "900",
  },
  roleTabs: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#f6f3f2",
    borderRadius: 999,
    padding: 5,
    marginBottom: 24,
  },
  roleTab: {
    flex: 1,
    minHeight: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  roleTabActive: {
    backgroundColor: "#2d6a4f",
  },
  roleTabText: {
    color: "#605f50",
    fontWeight: "900",
  },
  roleTabTextActive: {
    color: "#ffffff",
  },
  progressHeader: {
    alignItems: "center",
    marginBottom: 30,
  },
  stepLabel: {
    color: "#605f50",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.8,
    marginBottom: 12,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    borderColor: "#707973",
    borderWidth: 1.5,
  },
  dotActive: {
    backgroundColor: "#2d6a4f",
    borderColor: "#2d6a4f",
  },
  title: {
    color: "#1b1b1b",
    fontSize: 40,
    lineHeight: 48,
    fontWeight: "900",
    marginBottom: 12,
  },
  intro: {
    color: "#404943",
    fontSize: 18,
    lineHeight: 29,
    marginBottom: 28,
  },
  centerText: {
    textAlign: "center",
  },
  googleButton: {
    minHeight: 54,
    borderRadius: 16,
    borderColor: "#bfc9c1",
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 14,
  },
  googleText: {
    color: "#1b1b1b",
    fontSize: 16,
    fontWeight: "800",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e2e1",
  },
  dividerText: {
    color: "#707973",
  },
  fieldBlock: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: "#1b1b1b",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputShell: {
    minHeight: 58,
    borderColor: "#bfc9c1",
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  input: {
    flex: 1,
    color: "#1b1b1b",
    fontSize: 16,
    outlineStyle: "none" as never,
  },
  primaryButton: {
    alignSelf: "flex-end",
    minHeight: 58,
    borderRadius: 999,
    backgroundColor: "#2d6a4f",
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 12,
  },
  primaryText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
  },
  actionRow: {
    borderTopColor: "#e5e2e1",
    borderTopWidth: 1,
    paddingTop: 20,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
  },
  backButton: {
    minHeight: 48,
    borderRadius: 999,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backText: {
    color: "#605f50",
    fontSize: 16,
    fontWeight: "900",
  },
  nextButton: {
    minHeight: 50,
    borderRadius: 999,
    backgroundColor: "#2d6a4f",
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  disabledButton: {
    opacity: 0.45,
  },
  nextText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  note: {
    color: "#707973",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 16,
  },
  reviewPanel: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    borderColor: "#e5e2e1",
    borderWidth: 1,
    marginBottom: 22,
  },
  reviewGroup: {
    marginBottom: 24,
  },
  reviewTitleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomColor: "#e5e2e1",
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 16,
  },
  reviewTitle: {
    color: "#605f50",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
  },
  reviewRow: {
    marginBottom: 14,
  },
  reviewLabel: {
    color: "#707973",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  reviewValue: {
    color: "#313030",
    fontSize: 17,
  },
  confirmLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  checkbox: {
    width: 25,
    height: 25,
    borderRadius: 4,
    borderColor: "#707973",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#2d6a4f",
    borderColor: "#2d6a4f",
  },
  confirmText: {
    color: "#313030",
    fontSize: 16,
  },
})

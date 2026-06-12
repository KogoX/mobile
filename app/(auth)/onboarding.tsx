import { MaterialIcons } from "@expo/vector-icons"
import { useRouter, useLocalSearchParams } from "expo-router"
import { useMemo, useState } from "react"
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native"

type Role = "farmer" | "manager" | "buyer"

type FieldConfig = {
  label: string
  placeholder: string
  icon: keyof typeof MaterialIcons.glyphMap
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric"
}

const roles: Role[] = ["farmer", "manager", "buyer"]

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
    intro: "Please provide your basic information to begin building your farmer profile. This helps us ensure accurate records and personalized support.",
    totalSteps: 3,
    stepTwoTitle: "Farm Details",
    stepTwoIntro: "Tell us about your agricultural operation. This helps us customize data models and export estimates for your specific yield capacity.",
    stepTwoFields: [
      { label: "Farm Name", placeholder: "e.g. Green Valley Estate", icon: "park" },
      { label: "Trees Currently In Production", placeholder: "e.g. 500", icon: "forest", keyboardType: "numeric" },
      { label: "Estimated Yield (Season)", placeholder: "e.g. 15000", icon: "scale", keyboardType: "numeric" },
      { label: "Nearest Town or Hub", placeholder: "Enter closest municipality", icon: "location-on" },
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
  
  const [role] = useState<Role>(initialRole)
  const [step, setStep] = useState(1)
  const [confirmed, setConfirmed] = useState(false)
  
  const { width } = useWindowDimensions()
  const isWide = width >= 760
  const details = roleDetails[role]

  const stepLabel = useMemo(() => `STEP ${step} OF ${details.totalSteps}`, [details.totalSteps, step])

  function next() {
    if (step < details.totalSteps) {
      setStep((value) => value + 1)
      return
    }
    router.replace(`/${role}`)
  }

  // Determine text alignment based on role (Farmer is left-aligned in mockups, others centered)
  const isCentered = role !== "farmer" || step === 3

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-stone-500"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View 
          className={`bg-[#FAFAFA] rounded-3xl p-6 md:p-10 shadow-xl relative overflow-hidden w-full ${
            isWide ? 'max-w-2xl' : 'max-w-md'
          }`}
        >
          {/* Decorative Bottom Right Circle Overlay */}
          <View className="absolute -bottom-16 -right-16 opacity-[0.03] pointer-events-none">
            <View className="w-56 h-56 rounded-full border-[16px] border-[#2A5C43] items-center justify-center">
              <View className="w-28 h-28 rounded-full border-[16px] border-[#2A5C43]" />
            </View>
          </View>

          {/* Progress Header */}
          <View className="items-center mb-8 mt-2">
            <Text className="text-[10px] font-black text-gray-500 tracking-[0.2em] uppercase mb-3">
              {stepLabel}
            </Text>
            <View className="flex-row gap-2">
              {Array.from({ length: details.totalSteps }).map((_, index) => (
                <View 
                  key={index} 
                  className={`w-2.5 h-2.5 rounded-full border-2 ${
                    index + 1 <= step 
                      ? 'bg-[#2A5C43] border-[#2A5C43]' 
                      : 'bg-transparent border-gray-300'
                  }`} 
                />
              ))}
            </View>
          </View>

          {/* Dynamic Steps */}
          {step === 1 ? (
            <PersonalStep 
              role={role} 
              title={details.title} 
              intro={details.intro} 
              onNext={next} 
              centered={isCentered}
            />
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
              centered={isCentered}
            />
          )}

          {/* Footer Copyright */}
          <View className="mt-12 pt-6 border-t border-gray-200 items-center">
            <Text className="text-[10px] text-gray-400 font-bold tracking-wider uppercase mb-2">
              © 2026 CEMS Agricultural Platform
            </Text>
            <View className="flex-row gap-4">
              <Text className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">Privacy Policy</Text>
              <Text className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">Terms</Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function PersonalStep({ role, title, intro, onNext, centered }: { role: Role; title: string; intro: string; onNext: () => void; centered: boolean }) {
  return (
    <View>
      <Text className={`text-3xl md:text-4xl font-black text-[#2A5C43] mb-3 ${centered ? 'text-center' : 'text-left'}`}>
        {title}
      </Text>
      <Text className={`text-sm text-gray-600 mb-8 leading-relaxed ${centered ? 'text-center px-4' : 'text-left pr-4'}`}>
        {intro}
      </Text>

      {role !== "farmer" && (
        <>
          <Pressable className="flex-row items-center justify-center bg-white border border-gray-200 rounded-2xl py-4 mb-5 shadow-sm active:opacity-70">
            <MaterialIcons name="account-circle" size={22} color="#EA4335" />
            <Text className="ml-3 font-bold text-gray-800 text-sm">Continue with Google</Text>
          </Pressable>
          <View className="flex-row items-center gap-4 mb-6 px-4">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="text-gray-400 font-bold text-xs uppercase">or</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>
        </>
      )}

      <FormField label="Full Name" placeholder="e.g. Jane Doe" icon="person-outline" />
      <FormField label="Email Address" placeholder="maria@example.com" icon="mail-outline" keyboardType="email-address" />
      <FormField label="Phone Number" placeholder="+254 XXX XXX XXX" icon="phone" keyboardType="phone-pad" />
      
      {role === "farmer" && (
        <FormField label="Village / Location" placeholder="e.g. Kimalel Village" icon="location-on" />
      )}

      <View className={`mt-4 ${centered ? 'items-center' : 'items-end'}`}>
        <Pressable 
          className="bg-[#2A5C43] rounded-full py-4 px-8 flex-row items-center shadow-md active:opacity-80" 
          onPress={onNext}
        >
          <Text className="text-white font-bold text-sm mr-2">Next Step</Text>
          <MaterialIcons name="arrow-forward" size={18} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  )
}

function DetailsStep({ title, intro, fields, note, isFinal, onBack, onNext, centered }: { title: string; intro: string; fields: FieldConfig[]; note: string; isFinal: boolean; onBack: () => void; onNext: () => void; centered: boolean }) {
  return (
    <View>
      <Text className={`text-3xl md:text-4xl font-black text-[#2A5C43] mb-3 ${centered ? 'text-center' : 'text-left'}`}>
        {title}
      </Text>
      <Text className={`text-sm text-gray-600 mb-8 leading-relaxed ${centered ? 'text-center px-4' : 'text-left pr-4'}`}>
        {intro}
      </Text>

      {fields.map((field) => (
        <FormField key={field.label} {...field} />
      ))}

      <View className="flex-row items-center justify-between mt-6 pt-6 border-t border-gray-100">
        <Pressable className="flex-row items-center py-2 px-1 active:opacity-60" onPress={onBack}>
          <MaterialIcons name="arrow-back" size={18} color="#71717A" />
          <Text className="ml-2 font-bold text-gray-500 text-sm">Back</Text>
        </Pressable>
        <Pressable 
          className="bg-[#2A5C43] rounded-full py-3.5 px-6 flex-row items-center shadow-md active:opacity-80" 
          onPress={onNext}
        >
          <Text className="text-white font-bold text-sm mr-2">{isFinal ? "Finish Setup" : "Next Step"}</Text>
          <MaterialIcons name="arrow-forward" size={18} color="#ffffff" />
        </Pressable>
      </View>

      {isFinal && (
        <Text className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-6 px-4">
          {note}
        </Text>
      )}
    </View>
  )
}

function ReviewStep({ confirmed, setConfirmed, onBack, onFinish, note }: { confirmed: boolean; setConfirmed: (v: boolean) => void; onBack: () => void; onFinish: () => void; note: string }) {
  return (
    <View>
      <Text className="text-3xl md:text-4xl font-black text-[#2A5C43] mb-3 text-center">
        Review & Submit
      </Text>
      <Text className="text-sm text-gray-600 mb-8 leading-relaxed text-center px-4">
        Please review your information carefully before final submission.
      </Text>

      <View className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-6">
        <ReviewGroup
          icon="person-outline"
          title="Personal Details"
          rows={[
            ["Full Name", "Elias Thorne"],
            ["Phone Number", "+254 712 345 678"],
            ["Email Address", "elias.thorne@example.com"],
          ]}
        />
        <View className="h-px bg-gray-100 w-full my-4" />
        <ReviewGroup
          icon="eco"
          title="Farm Information"
          rows={[
            ["Farm Name", "Green Valley Estate"],
            ["Primary Crop", "Hass Avocados"],
            ["Acreage", "12.5 Acres"],
            ["Location", "Murang'a County"],
          ]}
        />
      </View>

      <Pressable 
        className="flex-row items-center bg-[#F9F9F9] border border-gray-200 rounded-xl p-4 mb-6 active:opacity-70" 
        onPress={() => setConfirmed(!confirmed)}
      >
        <View className={`w-5 h-5 rounded border items-center justify-center mr-3 ${
          confirmed ? 'bg-[#2A5C43] border-[#2A5C43]' : 'border-gray-400 bg-white'
        }`}>
          {confirmed && <MaterialIcons name="check" size={14} color="#ffffff" />}
        </View>
        <Text className="text-sm font-semibold text-gray-700 flex-1">
          I confirm all details are accurate.
        </Text>
      </Pressable>

      <View className="flex-row items-center justify-between mt-2 pt-6 border-t border-gray-100">
        <Pressable className="flex-row items-center py-2 px-1 active:opacity-60" onPress={onBack}>
          <MaterialIcons name="arrow-back" size={18} color="#71717A" />
          <Text className="ml-2 font-bold text-gray-500 text-sm">Back</Text>
        </Pressable>
        <Pressable
          className={`bg-[#2A5C43] rounded-full py-3.5 px-6 flex-row items-center shadow-md ${!confirmed ? 'opacity-50' : 'active:opacity-80'}`}
          onPress={confirmed ? onFinish : undefined}
        >
          <Text className="text-white font-bold text-sm mr-2">Complete Registration</Text>
          <MaterialIcons name="check-circle-outline" size={18} color="#ffffff" />
        </Pressable>
      </View>

      <Text className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-6 px-4">
        {note}
      </Text>
    </View>
  )
}

function ReviewGroup({ icon, title, rows }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; rows: [string, string][] }) {
  return (
    <View>
      <View className="flex-row items-center mb-4">
        <View className="bg-[#EAF0EC] p-2 rounded-full mr-3">
          <MaterialIcons name={icon} size={18} color="#2A5C43" />
        </View>
        <Text className="text-base font-black text-gray-800">{title}</Text>
      </View>
      <View className="pl-2">
        {rows.map(([label, value]) => (
          <View key={label} className="mb-3">
            <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              {label}
            </Text>
            <Text className="text-sm font-semibold text-gray-800">
              {value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function FormField({ label, placeholder, icon, keyboardType }: FieldConfig) {
  return (
    <View className="mb-5">
      <Text className="text-xs font-bold text-gray-700 mb-2 ml-1 tracking-wide">
        {label}
      </Text>
      <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 py-3.5 shadow-sm">
        <MaterialIcons name={icon} size={20} color="#A1A1AA" />
        <TextInput
          className="flex-1 ml-3 text-gray-800 font-medium text-sm"
          placeholder={placeholder}
          placeholderTextColor="#A1A1AA"
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
          style={{ outlineStyle: "none" } as never}
        />
      </View>
    </View>
  )
}
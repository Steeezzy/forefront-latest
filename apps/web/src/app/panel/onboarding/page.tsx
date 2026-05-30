"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Globe, Bot, BookOpen, CheckCircle, ArrowRight,
  Mic, MessageSquare, Phone, Sparkles
} from "lucide-react";

const INDUSTRIES = [
  { id: "healthcare", label: "Healthcare", icon: "🏥" },
  { id: "education", label: "Education", icon: "🎓" },
  { id: "ecommerce", label: "E-Commerce", icon: "🛒" },
  { id: "realestate", label: "Real Estate", icon: "🏠" },
  { id: "restaurant", label: "Restaurant", icon: "🍽️" },
  { id: "finance", label: "Finance", icon: "💰" },
  { id: "travel", label: "Travel", icon: "✈️" },
  { id: "services", label: "Services", icon: "🔧" },
  { id: "other", label: "Other", icon: "📦" },
];

const LANGUAGES = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "हिन्दी (Hindi)" },
  { code: "ta-IN", label: "தமிழ் (Tamil)" },
  { code: "te-IN", label: "తెలుగు (Telugu)" },
  { code: "kn-IN", label: "ಕನ್ನಡ (Kannada)" },
  { code: "ml-IN", label: "മലയാളം (Malayalam)" },
  { code: "mr-IN", label: "मराठी (Marathi)" },
  { code: "bn-IN", label: "বাংলা (Bengali)" },
  { code: "gu-IN", label: "ગુજરાતી (Gujarati)" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ (Punjabi)" },
];

const STEPS = [
  { id: 1, title: "Your Business", icon: Building2 },
  { id: 2, title: "Industry", icon: Globe },
  { id: 3, title: "Language", icon: Mic },
  { id: 4, title: "First Agent", icon: Bot },
  { id: 5, title: "All Set!", icon: CheckCircle },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [language, setLanguage] = useState("en-IN");
  const [agentName, setAgentName] = useState("");
  const [agentType, setAgentType] = useState("support");
  const [saving, setSaving] = useState(false);

  const workspaceId = typeof window !== "undefined" ? localStorage.getItem("workspaceId") || "" : "";

  const handleComplete = async () => {
    setSaving(true);
    try {
      // Save workspace settings
      await fetch("/api/workspaces/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          workspaceId,
          business_name: businessName,
          industry,
          language,
        }),
      });

      // Create first agent if name provided
      if (agentName) {
        await fetch("/api/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            workspaceId,
            name: agentName,
            type: agentType,
            language,
          }),
        });
      }

      // Mark onboarding complete
      localStorage.setItem("onboarding_complete", "true");

      router.push("/panel/dashboard");
    } catch (err) {
      console.error("Onboarding error:", err);
    } finally {
      setSaving(false);
    }
  };

  const canProceed =
    (step === 1 && businessName.trim()) ||
    (step === 2 && industry) ||
    (step === 3 && language) ||
    (step === 4) ||
    step === 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step > s.id ? "bg-emerald-500 text-white" :
                step === s.id ? "bg-gray-900 text-white" :
                "bg-gray-200 text-gray-400"
              }`}>
                {step > s.id ? <CheckCircle size={16} /> : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 ${step > s.id ? "bg-emerald-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 bg-gray-900 rounded-xl flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Welcome to Qestron</h2>
                  <p className="text-sm text-gray-500">What&apos;s your business called?</p>
                </div>
              </div>
              <input
                type="text"
                placeholder="e.g. Sharma Clinic, QuickBite Foods..."
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">What&apos;s your industry?</h2>
              <p className="text-sm text-gray-500 mb-6">We&apos;ll configure AI templates tailored for your sector.</p>
              <div className="grid grid-cols-3 gap-3">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind.id}
                    onClick={() => setIndustry(ind.id)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      industry === ind.id
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-2xl mb-1">{ind.icon}</div>
                    <div className="text-xs font-medium text-gray-700">{ind.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Primary language?</h2>
              <p className="text-sm text-gray-500 mb-6">Your AI agent will speak this language. You can add more later.</p>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`px-4 py-3 rounded-xl border-2 text-left text-sm transition-all ${
                      language === lang.code
                        ? "border-gray-900 bg-gray-50 font-medium"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Create your first AI agent</h2>
              <p className="text-sm text-gray-500 mb-6">Optional — you can skip and create one later.</p>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Agent name (e.g. Priya, Support Bot)"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "support", label: "Support", icon: MessageSquare, desc: "Answer questions" },
                    { id: "sales", label: "Sales", icon: Phone, desc: "Qualify leads" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setAgentType(t.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        agentType === t.id ? "border-gray-900 bg-gray-50" : "border-gray-200"
                      }`}
                    >
                      <t.icon size={18} className="mb-1 text-gray-700" />
                      <div className="text-sm font-medium text-gray-900">{t.label}</div>
                      <div className="text-xs text-gray-500">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
                <Sparkles className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re all set!</h2>
              <p className="text-sm text-gray-500 mb-6">
                {businessName} is configured for {INDUSTRIES.find((i) => i.id === industry)?.label || "your industry"}.
                {agentName && ` ${agentName} is ready to go.`}
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="text-sm text-gray-500 hover:text-gray-700">
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed}
                className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-40 flex items-center gap-2"
              >
                {step === 4 && !agentName ? "Skip" : "Continue"}
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={saving}
                className="px-8 py-3 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
              >
                <Sparkles size={14} />
                {saving ? "Setting up..." : "Go to Dashboard"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

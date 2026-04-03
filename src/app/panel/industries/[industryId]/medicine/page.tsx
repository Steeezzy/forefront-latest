"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  Plus,
  Pill,
  Clock,
  Calendar,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Trash2,
  Settings,
} from "lucide-react";
import { industries } from "@/data/industries";
import { languages } from "@/data/languages";

type MedicineInput = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  scheduleTimes: string[];
  durationDays: number;
  instructions: string;
};

// Mock data
const mockReminders = [
  {
    id: "r1",
    patientName: "Maria Garcia",
    medicineName: "Amoxicillin",
    dosage: "500mg",
    frequency: "3 times/day",
    scheduleTimes: ["08:00", "14:00", "20:00"],
    dosesTaken: 12,
    totalDoses: 21,
    complianceRate: 100,
  },
  {
    id: "r2",
    patientName: "James Wilson",
    medicineName: "Lisinopril",
    dosage: "10mg",
    frequency: "1 time/day",
    scheduleTimes: ["09:00"],
    dosesTaken: 4,
    totalDoses: 30,
    complianceRate: 80,
  },
];

const mockFollowups = [
  {
    id: "f1",
    patientName: "Sarah Chen",
    doctorName: "Dr. Smith",
    reason: "Post-op checkup",
    scheduledDate: "Today, 2:30 PM",
    confirmed: true,
  },
  {
    id: "f2",
    patientName: "Robert Kim",
    doctorName: "Dr. Jones",
    reason: "Routine cleaning",
    scheduledDate: "Tomorrow, 10:00 AM",
    confirmed: false,
  },
];

export default function MedicinePage() {
  const params = useParams();
  const router = useRouter();
  const industryId = params.industryId as string;
  const industry = industries.find((i) => i.id === industryId);

  // Security barrier: only allow healthcare/medical related industries
  const allowedIndustries = ["healthcare", "dental", "vet"];
  const isAllowed = allowedIndustries.includes(industryId);

  const [activeTab, setActiveTab] = useState("active");

  // Form states
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en-IN");
  const [medicines, setMedicines] = useState<MedicineInput[]>([
    {
      id: "m1",
      name: "",
      dosage: "",
      frequency: "3 times/day",
      scheduleTimes: ["08:00"],
      durationDays: 7,
      instructions: "",
    },
  ]);
  const [followupDate, setFollowupDate] = useState("");
  const [followupDoctor, setFollowupDoctor] = useState("");
  const [followupReason, setFollowupReason] = useState("");

  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 text-4xl">🔒</div>
        <h2 className="text-xl font-bold text-text-primary">Feature Unavailable</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Medicine & Follow-up tracking is only available for Healthcare, Dental, and Veterinary industries.
        </p>
        <button
          onClick={() => router.push(`/panel/industries/${industryId}/workspace`)}
          className="mt-6 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-black hover:brightness-110"
        >
          Return to Workspace
        </button>
      </div>
    );
  }

  const addMedicine = () => {
    setMedicines([
      ...medicines,
      {
        id: `m${Date.now()}`,
        name: "",
        dosage: "",
        frequency: "1 time/day",
        scheduleTimes: ["09:00"],
        durationDays: 7,
        instructions: "",
      },
    ]);
  };

  const removeMedicine = (id: string) => {
    setMedicines(medicines.filter((m) => m.id !== id));
  };

  const updateMedicine = (id: string, field: keyof MedicineInput, value: any) => {
    setMedicines(
      medicines.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const addScheduleTime = (id: string) => {
    setMedicines(
      medicines.map((m) =>
        m.id === id ? { ...m, scheduleTimes: [...m.scheduleTimes, "12:00"] } : m
      )
    );
  };

  const removeScheduleTime = (medId: string, index: number) => {
    setMedicines(
      medicines.map((m) =>
        m.id === medId
          ? { ...m, scheduleTimes: m.scheduleTimes.filter((_, i) => i !== index) }
          : m
      )
    );
  };

  const updateScheduleTime = (medId: string, index: number, value: string) => {
    setMedicines(
      medicines.map((m) => {
        if (m.id === medId) {
          const newTimes = [...m.scheduleTimes];
          newTimes[index] = value;
          return { ...m, scheduleTimes: newTimes };
        }
        return m;
      })
    );
  };

  const tabs = [
    { id: "active", icon: <Pill size={14} />, label: "Active Reminders" },
    { id: "followup", icon: <Calendar size={14} />, label: "Follow-ups" },
    { id: "compliance", icon: <FileText size={14} />, label: "Compliance" },
    { id: "new", icon: <Plus size={14} />, label: "Add Patient" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Back & Header */}
      <button
        onClick={() => router.push(`/panel/industries/${industryId}/workspace`)}
        className="flex items-center gap-1 text-[13px] font-medium text-text-muted transition-colors hover:text-accent"
      >
        <ChevronLeft size={16} /> Back to Workspace
      </button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0a192f] border border-accent/20 text-accent text-2xl shadow-lg">
            <Pill size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Medicine Tracking
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Automated 22-language dosage reminders & compliance tracking
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-subtle pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-all",
              activeTab === tab.id
                ? "bg-accent-dim text-accent"
                : "bg-bg-card text-text-muted hover:bg-bg-elevated hover:text-text-secondary"
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* ════════════════════════════════════════ */}
          {/* TAB: ACTIVE REMINDERS                    */}
          {/* ════════════════════════════════════════ */}
          {activeTab === "active" && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {mockReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="rounded-xl border border-border-subtle bg-bg-card p-5 shadow-sm transition-all hover:border-accent/50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">
                        {reminder.patientName}
                      </h3>
                      <div className="mt-1 flex items-center gap-2 text-[13px] text-text-secondary">
                        <Pill size={14} className="text-accent" />
                        <span className="font-semibold">{reminder.medicineName}</span> • {reminder.dosage}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-bold",
                          reminder.complianceRate >= 90
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-yellow-500/10 text-yellow-500"
                        )}
                      >
                        {reminder.complianceRate}% Compliance
                      </span>
                      <span className="mt-1 text-[11px] text-text-muted">
                        {reminder.dosesTaken} / {reminder.totalDoses} Doses
                      </span>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                      <Clock size={12} /> Today's Schedule
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {reminder.scheduleTimes.map((time, idx) => (
                        <span
                          key={idx}
                          className="rounded-md border border-border-default bg-bg-elevated px-3 py-1.5 text-[12px] font-mono text-text-secondary"
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2 border-t border-border-subtle pt-4">
                    <button className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-[12px] font-bold text-emerald-500 transition-colors hover:bg-emerald-500/20">
                      <CheckCircle2 size={14} /> Mark Taken
                    </button>
                    <button className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-[12px] font-bold text-red-500 transition-colors hover:bg-red-500/20">
                      <XCircle size={14} /> Mark Missed
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ════════════════════════════════════════ */}
          {/* TAB: FOLLOW-UPS                          */}
          {/* ════════════════════════════════════════ */}
          {activeTab === "followup" && (
            <div className="space-y-4">
              {mockFollowups.map((followup) => (
                <div
                  key={followup.id}
                  className="flex items-center justify-between rounded-xl border border-border-default bg-bg-card p-4 transition-colors hover:border-accent"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl text-xl",
                        followup.confirmed
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-yellow-500/10 text-yellow-500"
                      )}
                    >
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-text-primary">
                        {followup.patientName}
                      </h3>
                      <div className="mt-0.5 text-[12px] text-text-secondary">
                        {followup.doctorName} • {followup.reason}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-accent">
                        <Clock size={12} /> {followup.scheduledDate}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 text-right">
                    <span
                      className={cn(
                        "rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                        followup.confirmed
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-bg-elevated text-text-muted"
                      )}
                    >
                      {followup.confirmed ? "Confirmed via SMS" : "Pending Confirmation"}
                    </span>
                    {!followup.confirmed && (
                      <button className="text-[12px] font-semibold text-accent hover:underline">
                        Manually Confirm
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ════════════════════════════════════════ */}
          {/* TAB: ADD REMINDER                        */}
          {/* ════════════════════════════════════════ */}
          {activeTab === "new" && (
            <div className="rounded-xl border border-border-default bg-bg-card shadow-sm">
              <div className="border-b border-border-subtle p-6">
                <h2 className="text-lg font-bold text-text-primary">
                  New Patient Protocol
                </h2>
                <p className="text-[13px] text-text-secondary">
                  Configure automated medicine and follow-up reminders in 22 languages.
                </p>
              </div>

              <div className="p-6 space-y-8">
                {/* 1. Patient Details */}
                <section>
                  <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    <User size={14} /> Patient Details
                  </div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-[12px] font-semibold text-text-secondary">
                        Patient Name
                      </label>
                      <input
                        className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2.5 text-[13px] text-text-primary outline-none focus:border-accent"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-semibold text-text-secondary">
                        Phone Number (SMS/Voice)
                      </label>
                      <input
                        className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2.5 text-[13px] text-text-primary outline-none focus:border-accent"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-semibold text-text-secondary">
                        Preferred Language
                      </label>
                      <select
                        className="w-full rounded-lg border border-border-default bg-bg-elevated px-4 py-2.5 text-[13px] text-text-primary outline-none focus:border-accent"
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                      >
                        {languages.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                {/* 2. Medicine Details */}
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                      <Pill size={14} /> Prescriptions
                    </div>
                  </div>

                  <div className="space-y-4">
                    {medicines.map((medicine, mIdx) => (
                      <div
                        key={medicine.id}
                        className="relative rounded-xl border border-border-subtle bg-bg-elevated p-5"
                      >
                        {medicines.length > 1 && (
                          <button
                            onClick={() => removeMedicine(medicine.id)}
                            className="absolute right-3 top-3 text-text-muted hover:text-red-500"
                          >
                            <XCircle size={18} />
                          </button>
                        )}

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
                          <div className="md:col-span-2">
                            <label className="mb-1.5 block text-[12px] font-semibold text-text-secondary">
                              Medicine Name
                            </label>
                            <input
                              className="w-full rounded-lg border border-border-default bg-bg-card px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent"
                              value={medicine.name}
                              onChange={(e) => updateMedicine(medicine.id, "name", e.target.value)}
                              placeholder="e.g. Amoxicillin"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[12px] font-semibold text-text-secondary">
                              Dosage
                            </label>
                            <input
                              className="w-full rounded-lg border border-border-default bg-bg-card px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent"
                              value={medicine.dosage}
                              onChange={(e) => updateMedicine(medicine.id, "dosage", e.target.value)}
                              placeholder="e.g. 500mg"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[12px] font-semibold text-text-secondary">
                              Duration (Days)
                            </label>
                            <input
                              type="number"
                              className="w-full rounded-lg border border-border-default bg-bg-card px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent"
                              value={medicine.durationDays}
                              onChange={(e) => updateMedicine(medicine.id, "durationDays", Number(e.target.value))}
                            />
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-[12px] font-semibold text-text-secondary">
                              Schedule Settings
                            </label>
                            <div className="space-y-2">
                              {medicine.scheduleTimes.map((time, tIdx) => (
                                <div key={tIdx} className="flex items-center gap-2">
                                  <input
                                    type="time"
                                    className="rounded-lg border border-border-default bg-bg-card px-3 py-1.5 text-[13px] text-text-primary outline-none focus:border-accent"
                                    value={time}
                                    onChange={(e) => updateScheduleTime(medicine.id, tIdx, e.target.value)}
                                  />
                                  {medicine.scheduleTimes.length > 1 && (
                                    <button
                                      onClick={() => removeScheduleTime(medicine.id, tIdx)}
                                      className="text-text-muted hover:text-red-500"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                onClick={() => addScheduleTime(medicine.id)}
                                className="flex items-center gap-1 text-[12px] font-semibold text-accent hover:underline"
                              >
                                <Plus size={12} /> Add Time Slot
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[12px] font-semibold text-text-secondary">
                              Special Instructions
                            </label>
                            <textarea
                              rows={2}
                              className="w-full resize-none rounded-lg border border-border-default bg-bg-card px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent"
                              value={medicine.instructions}
                              onChange={(e) => updateMedicine(medicine.id, "instructions", e.target.value)}
                              placeholder="e.g. Take after food with plenty of water"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={addMedicine}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-default py-4 text-[13px] font-semibold text-text-muted transition-colors hover:border-accent hover:text-accent"
                    >
                      <Plus size={16} /> Add Another Prescription
                    </button>
                  </div>
                </section>

                {/* 3. Auto Follow-up (Optional) */}
                <section>
                  <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    <Calendar size={14} /> Schedule Auto-Followup
                  </div>
                  <div className="rounded-xl border border-border-subtle bg-bg-elevated p-5">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                      <div>
                        <label className="mb-1.5 block text-[12px] font-semibold text-text-secondary">
                          Follow-up Date
                        </label>
                        <input
                          type="datetime-local"
                          className="w-full rounded-lg border border-border-default bg-bg-card px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent"
                          value={followupDate}
                          onChange={(e) => setFollowupDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[12px] font-semibold text-text-secondary">
                          Assign Doctor
                        </label>
                        <input
                          className="w-full rounded-lg border border-border-default bg-bg-card px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent"
                          value={followupDoctor}
                          onChange={(e) => setFollowupDoctor(e.target.value)}
                          placeholder="Dr. Name"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[12px] font-semibold text-text-secondary">
                          Reason for Visit
                        </label>
                        <input
                          className="w-full rounded-lg border border-border-default bg-bg-card px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent"
                          value={followupReason}
                          onChange={(e) => setFollowupReason(e.target.value)}
                          placeholder="Post-treatment check"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Submit Footer */}
              <div className="flex items-center justify-between border-t border-border-subtle bg-bg-elevated p-6">
                <div className="text-[12px] text-text-muted">
                  Patient will receive initial setup text in their native language upon activation.
                </div>
                <button
                  className="rounded-lg bg-accent px-8 py-3 text-[14px] font-bold text-black shadow-lg shadow-accent/20 transition-all hover:brightness-110"
                >
                  Start Automation Sequence
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════ */}
          {/* TAB: COMPLIANCE                          */}
          {/* ════════════════════════════════════════ */}
          {activeTab === "compliance" && (
            <div className="rounded-xl border border-border-default bg-bg-card p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Compliance Report</h2>
                  <p className="text-[13px] text-text-secondary">Overall patient adherence metrics across all active treatments</p>
                </div>
                <button className="rounded-md border border-border-default bg-bg-elevated px-4 py-2 text-[12px] font-semibold text-text-secondary hover:text-accent">
                  Export CSV
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg-elevated text-[11px] uppercase tracking-wider text-text-muted">
                    <tr>
                      <th className="px-4 py-3 font-semibold rounded-tl-lg">Patient</th>
                      <th className="px-4 py-3 font-semibold">Medicine</th>
                      <th className="px-4 py-3 font-semibold">Rate</th>
                      <th className="px-4 py-3 font-semibold">Taken/Missed/Total</th>
                      <th className="px-4 py-3 font-semibold rounded-tr-lg">Completion Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {mockReminders.map((r) => (
                      <tr key={r.id} className="transition-colors hover:bg-bg-elevated/50">
                        <td className="px-4 py-4 font-medium text-text-primary">{r.patientName}</td>
                        <td className="px-4 py-4 text-text-secondary">{r.medicineName} {r.dosage}</td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold",
                              r.complianceRate >= 90
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-yellow-500/10 text-yellow-500"
                            )}
                          >
                            {r.complianceRate}%
                          </span>
                        </td>
                        <td className="px-4 py-4 text-text-secondary">
                          <span className="text-emerald-500">{r.dosesTaken}</span> /{" "}
                          <span className="text-red-500">{(r.totalDoses || 21) - r.dosesTaken}</span> / {r.totalDoses || 21}
                        </td>
                        <td className="px-4 py-4 text-text-secondary">Next Week</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

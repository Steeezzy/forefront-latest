import { INDUSTRY_CONFIGS } from "@/data/auto-config";
import { industries } from "@/data/industries";
import { sampleConversations } from "@/data/sample-conversations";
import { industryBundles } from "@/data/template-bundles";
import type { Industry } from "@/types";
import type {
  IndustryBlueprint,
  IndustryCapabilityModule,
  IndustryComplianceBadge,
  IndustryHeroStat,
  IndustryKpiSnapshot,
  IndustryLaunchChecklistItem,
  IndustryWorkflowReadiness,
  IndustryWorkflowSummary,
} from "@/types/industry-experience";

type CapabilityTemplate = {
  id: string;
  title: string;
  description: string;
  channels: string[];
};

type CategoryDefault = {
  activeChannels: string[];
  workflowReadiness: IndustryWorkflowReadiness;
  capabilityTemplates: CapabilityTemplate[];
  complianceBadges: IndustryComplianceBadge[];
  workflowSummary: IndustryWorkflowSummary;
  integrationsFocus: string[];
};

type IndustryOverride = {
  heroOutcome: string;
  heroDetail: string;
  activeChannels?: string[];
  workflowReadiness?: IndustryWorkflowReadiness;
  kpiSnapshot: IndustryKpiSnapshot[];
  integrationsFocus?: string[];
  workflowSummary?: IndustryWorkflowSummary;
  complianceBadges?: IndustryComplianceBadge[];
  launchChecklist?: IndustryLaunchChecklistItem[];
};

const CATEGORY_DEFAULTS: Record<Industry["category"], CategoryDefault> = {
  healthcare: {
    activeChannels: ["Voice", "Chat", "SMS", "Email"],
    workflowReadiness: {
      label: "Operational blueprint",
      note: "Triage, reminders, and compliant handoffs are already mapped.",
      tone: "ready",
    },
    capabilityTemplates: [
      {
        id: "intake",
        title: "Front desk coverage",
        description: "Turn incoming calls into booked visits or safe escalation paths.",
        channels: ["Voice", "Chat"],
      },
      {
        id: "automation",
        title: "Care continuity automations",
        description: "Keep reminders, follow-ups, and missed-visit recovery running automatically.",
        channels: ["SMS", "Voice"],
      },
      {
        id: "knowledge",
        title: "Approved knowledge guidance",
        description: "Ground answers in services, FAQs, and escalation rules before launch.",
        channels: ["Chat", "Email"],
      },
    ],
    complianceBadges: [
      {
        label: "Consent-ready scripting",
        tone: "ready",
        note: "Disclosure and opt-in language can be reviewed before going live.",
      },
      {
        label: "Emergency escalation",
        tone: "review",
        note: "Urgent cases are routed out of automation and into human follow-up.",
      },
      {
        label: "Audit-friendly coverage",
        tone: "optional",
        note: "Templates are structured to support logging and review workflows.",
      },
    ],
    workflowSummary: {
      headline: "Patient access orchestration",
      description:
        "Blend scheduling, triage, reminders, and human escalation into one reliable front-door workflow.",
      automationMoments: [
        "Appointment confirmation and reminders",
        "Urgent symptom escalation",
        "Billing or refill handoff",
      ],
    },
    integrationsFocus: [
      "Scheduling sync",
      "Patient or CRM context",
      "Reminder delivery",
      "Escalation logging",
    ],
  },
  "home-services": {
    activeChannels: ["Voice", "Chat", "SMS", "Email"],
    workflowReadiness: {
      label: "Dispatch-ready workflow",
      note: "Lead intake, emergency routing, and follow-up flows are seeded.",
      tone: "ready",
    },
    capabilityTemplates: [
      {
        id: "intake",
        title: "Dispatch-first intake",
        description: "Capture job details fast and separate emergency calls from normal scheduling.",
        channels: ["Voice", "Chat"],
      },
      {
        id: "automation",
        title: "Field operations automation",
        description: "Keep estimates, technician updates, and payment nudges moving without manual chasing.",
        channels: ["SMS", "Email"],
      },
      {
        id: "knowledge",
        title: "Service knowledge support",
        description: "Seed common service questions, pricing guidance, and after-hours answers.",
        channels: ["Chat", "Voice"],
      },
    ],
    complianceBadges: [
      {
        label: "After-hours routing",
        tone: "ready",
        note: "Escalation scripts and callback promises are part of the seeded flow.",
      },
      {
        label: "Estimate review",
        tone: "review",
        note: "Pricing should be checked before enabling fully automated quoting.",
      },
      {
        label: "Operational logs",
        tone: "optional",
        note: "Dispatch and payment actions can be monitored from the existing workspace tools.",
      },
    ],
    workflowSummary: {
      headline: "Dispatch to follow-up workflow",
      description:
        "Route every lead through triage, scheduling, field updates, and payment recovery without losing urgency.",
      automationMoments: [
        "Emergency callback prioritization",
        "Job scheduling and reminder sequences",
        "Post-job payment follow-up",
      ],
    },
    integrationsFocus: [
      "Job scheduling",
      "Technician dispatch",
      "Payments",
      "Customer follow-up",
    ],
  },
  hospitality: {
    activeChannels: ["Voice", "Chat", "SMS", "WhatsApp"],
    workflowReadiness: {
      label: "Guest-facing blueprint",
      note: "Reservation, FAQ, and win-back journeys are already framed for launch.",
      tone: "guided",
    },
    capabilityTemplates: [
      {
        id: "intake",
        title: "Reservations and requests",
        description: "Capture bookings, service requests, and special instructions in one place.",
        channels: ["Voice", "Chat"],
      },
      {
        id: "automation",
        title: "Guest lifecycle automation",
        description: "Send confirmations, reminders, offers, and service follow-ups automatically.",
        channels: ["SMS", "WhatsApp"],
      },
      {
        id: "knowledge",
        title: "Experience and menu knowledge",
        description: "Keep pricing, hours, offers, and service details ready across channels.",
        channels: ["Chat", "Voice"],
      },
    ],
    complianceBadges: [
      {
        label: "Offer disclosures",
        tone: "review",
        note: "Promotions and cancellation policy wording should be finalized before launch.",
      },
      {
        label: "Review request cadence",
        tone: "ready",
        note: "Post-visit nudges and win-back timing are already represented in the blueprint.",
      },
      {
        label: "Manual handoff safety net",
        tone: "optional",
        note: "Complex events and special requests can still be routed to staff.",
      },
    ],
    workflowSummary: {
      headline: "Guest conversion workflow",
      description:
        "Move visitors from booking intent to confirmed reservation, follow-up, and re-engagement with minimal friction.",
      automationMoments: [
        "Instant reservation confirmation",
        "Pre-visit reminder sequences",
        "Review and win-back outreach",
      ],
    },
    integrationsFocus: [
      "Booking sync",
      "Customer profiles",
      "Offer delivery",
      "Feedback capture",
    ],
  },
  professional: {
    activeChannels: ["Voice", "Chat", "Email", "SMS"],
    workflowReadiness: {
      label: "Qualification workflow",
      note: "Lead intake, routing, and consultation booking are ready for refinement.",
      tone: "guided",
    },
    capabilityTemplates: [
      {
        id: "intake",
        title: "Lead qualification",
        description: "Screen inbound demand quickly and route serious prospects to the right queue.",
        channels: ["Voice", "Chat"],
      },
      {
        id: "automation",
        title: "Consultation automation",
        description: "Handle booking, reminders, document collection, and follow-up in one pipeline.",
        channels: ["Email", "SMS"],
      },
      {
        id: "knowledge",
        title: "Policy and service answers",
        description: "Seed safe FAQs, case intake details, and service boundaries before launch.",
        channels: ["Chat", "Email"],
      },
    ],
    complianceBadges: [
      {
        label: "Sensitive-topic review",
        tone: "review",
        note: "Final wording should be reviewed for legal, financial, or policy-sensitive claims.",
      },
      {
        label: "Escalation controls",
        tone: "ready",
        note: "High-risk conversations stay mapped to human handoff paths.",
      },
      {
        label: "Audit visibility",
        tone: "optional",
        note: "Consultation and intake flows can be observed from the existing workspace tooling.",
      },
    ],
    workflowSummary: {
      headline: "Qualification to handoff workflow",
      description:
        "Handle first contact, qualify intent, book the next action, and keep documentation moving.",
      automationMoments: [
        "Lead qualification",
        "Consultation booking",
        "Document or payment follow-up",
      ],
    },
    integrationsFocus: [
      "CRM capture",
      "Calendars",
      "Payments or documents",
      "Escalation tracking",
    ],
  },
  retail: {
    activeChannels: ["Voice", "Chat", "Email", "SMS"],
    workflowReadiness: {
      label: "Operations playbook",
      note: "Tracking, inventory, and order communication flows are seeded.",
      tone: "guided",
    },
    capabilityTemplates: [
      {
        id: "intake",
        title: "Order and status intake",
        description: "Turn status questions and delivery issues into structured requests fast.",
        channels: ["Voice", "Chat"],
      },
      {
        id: "automation",
        title: "Operations follow-through",
        description: "Automate confirmation, exception handling, and post-delivery outreach.",
        channels: ["Email", "SMS"],
      },
      {
        id: "knowledge",
        title: "Catalog and policy answers",
        description: "Keep inventory, returns, and dispatch guidance available across customer channels.",
        channels: ["Chat", "Voice"],
      },
    ],
    complianceBadges: [
      {
        label: "Notification cadence",
        tone: "ready",
        note: "Operational updates are framed for customer-friendly follow-up timing.",
      },
      {
        label: "Inventory review",
        tone: "review",
        note: "Stock-dependent answers should be verified once live data is connected.",
      },
      {
        label: "Escalation fallback",
        tone: "optional",
        note: "Delivery disputes and edge cases remain visible to staff for intervention.",
      },
    ],
    workflowSummary: {
      headline: "Order resolution workflow",
      description:
        "Handle customer updates, delivery checks, and follow-up actions without losing operational context.",
      automationMoments: [
        "Dispatch and delivery updates",
        "Inventory or order confirmation",
        "Post-resolution follow-up",
      ],
    },
    integrationsFocus: [
      "Inventory visibility",
      "Order systems",
      "Notifications",
      "Escalation queues",
    ],
  },
  education: {
    activeChannels: ["Voice", "Chat", "SMS", "Email"],
    workflowReadiness: {
      label: "Admissions blueprint",
      note: "Enrollment, class support, and parent communication flows are already framed.",
      tone: "ready",
    },
    capabilityTemplates: [
      {
        id: "intake",
        title: "Admissions and enrollment intake",
        description: "Qualify inquiries, book consultations, and move families to the next step quickly.",
        channels: ["Voice", "Chat"],
      },
      {
        id: "automation",
        title: "Class and reminder automation",
        description: "Coordinate reminders, registration nudges, and follow-up messages without manual effort.",
        channels: ["SMS", "Email"],
      },
      {
        id: "knowledge",
        title: "Program and policy guidance",
        description: "Keep schedules, fees, and support information grounded in approved answers.",
        channels: ["Chat", "Voice"],
      },
    ],
    complianceBadges: [
      {
        label: "Guardian communication review",
        tone: "review",
        note: "Parent-facing language and student data handling should be confirmed before launch.",
      },
      {
        label: "Enrollment handoff",
        tone: "ready",
        note: "High-intent leads are routed cleanly into booking or staff escalation.",
      },
      {
        label: "Progress visibility",
        tone: "optional",
        note: "The blueprint highlights where reminders and student support actions should be observed.",
      },
    ],
    workflowSummary: {
      headline: "Inquiry to enrollment workflow",
      description:
        "Guide parents and students from first inquiry through booking, registration, reminders, and support.",
      automationMoments: [
        "Consultation booking",
        "Registration reminders",
        "Post-enrollment support follow-up",
      ],
    },
    integrationsFocus: [
      "Enrollment CRM",
      "Scheduling",
      "Learning systems",
      "Family messaging",
    ],
  },
};

const INDUSTRY_OVERRIDES: Record<string, IndustryOverride> = {
  dental: {
    heroOutcome: "Convert patient calls into confirmed appointments without losing urgent triage.",
    heroDetail:
      "This blueprint combines front-desk voice coverage, appointment capture, reminder automations, and safe escalation guidance for time-sensitive cases.",
    kpiSnapshot: [
      {
        label: "Booking coverage",
        value: "24/7",
        detail: "Always-on scheduling and FAQ handling",
        trend: "up",
      },
      {
        label: "Urgent routing target",
        value: "<2 min",
        detail: "Emergency calls should exit automation immediately",
        trend: "flat",
      },
      {
        label: "Reminder recovery",
        value: "+18%",
        detail: "Blueprint target for reducing missed appointments",
        trend: "up",
      },
    ],
    workflowSummary: {
      headline: "Patient access workflow",
      description:
        "Route every caller from greeting to booking, FAQ resolution, or urgent escalation without forcing manual front-desk handoffs.",
      automationMoments: [
        "Appointment confirmation and reminders",
        "Missed-appointment recovery",
        "Billing and refill handoff",
      ],
    },
  },
  salon: {
    heroOutcome: "Fill more chairs by turning every inquiry into a booking, reminder, or win-back moment.",
    heroDetail:
      "The salon blueprint is tuned for appointment capture, service discovery, stylist selection, review requests, and client retention across voice and chat.",
    activeChannels: ["Voice", "Chat", "WhatsApp", "SMS"],
    kpiSnapshot: [
      {
        label: "Rebooking window",
        value: "30 days",
        detail: "Win-back timing already built into the launch plan",
        trend: "flat",
      },
      {
        label: "Review capture target",
        value: "+22%",
        detail: "Automated post-visit nudges improve repeat visibility",
        trend: "up",
      },
      {
        label: "After-hours coverage",
        value: "24/7",
        detail: "Bookings and FAQs stay available outside salon hours",
        trend: "up",
      },
    ],
    workflowSummary: {
      headline: "Guest booking and retention workflow",
      description:
        "Handle new bookings, service questions, rebook reminders, and loyalty nudges from one guest-facing workflow.",
      automationMoments: [
        "Booking confirmation",
        "Day-before reminder calls",
        "Birthday and win-back offers",
      ],
    },
  },
  hvac: {
    heroOutcome: "Capture urgent service demand fast and route it into dispatch without losing quote or payment follow-up.",
    heroDetail:
      "This home-services blueprint is optimized for emergency screening, quote intake, technician scheduling, and post-job recovery across voice-first interactions.",
    kpiSnapshot: [
      {
        label: "Emergency callback target",
        value: "<5 min",
        detail: "Critical service requests should be surfaced immediately",
        trend: "flat",
      },
      {
        label: "Quote response lift",
        value: "+16%",
        detail: "Structured intake reduces lost estimate requests",
        trend: "up",
      },
      {
        label: "Payment nudges",
        value: "3-step",
        detail: "Follow-up sequence is already baked into the blueprint",
        trend: "up",
      },
    ],
  },
  restaurant: {
    heroOutcome: "Turn reservation calls and menu questions into confirmed tables, takeout orders, and repeat visits.",
    heroDetail:
      "The restaurant blueprint keeps reservation capture, menu FAQ, delivery confirmation, and post-visit outreach inside a single guest-facing system.",
    kpiSnapshot: [
      {
        label: "Reservation response",
        value: "Instant",
        detail: "Availability checks stay in the first interaction",
        trend: "up",
      },
      {
        label: "Table recovery target",
        value: "+12%",
        detail: "Reminder flows aim to reduce empty-table no-shows",
        trend: "up",
      },
      {
        label: "Order updates",
        value: "2-way",
        detail: "Guests can confirm or question delivery status quickly",
        trend: "flat",
      },
    ],
  },
  realestate: {
    heroOutcome: "Qualify leads faster and move serious buyers into showings without slowing brokers down.",
    heroDetail:
      "This blueprint covers listing inquiries, showing coordination, property FAQs, and follow-up sequences designed for high-intent prospects.",
    kpiSnapshot: [
      {
        label: "Lead response target",
        value: "<60 sec",
        detail: "New inquiries stay warm through immediate intake",
        trend: "flat",
      },
      {
        label: "Showing conversion",
        value: "+14%",
        detail: "Blueprint target for structured follow-up to booking",
        trend: "up",
      },
      {
        label: "After-hours capture",
        value: "24/7",
        detail: "Property questions and lead intake stay active overnight",
        trend: "up",
      },
    ],
  },
  legal: {
    heroOutcome: "Screen new matters, book consultations, and protect staff time with a tighter intake workflow.",
    heroDetail:
      "The legal blueprint emphasizes safe case qualification, consultation routing, FAQ coverage, and controlled escalation for high-risk conversations.",
    kpiSnapshot: [
      {
        label: "Consultation scheduling",
        value: "1 flow",
        detail: "Intake and booking stay connected inside one path",
        trend: "flat",
      },
      {
        label: "Lead quality target",
        value: "+19%",
        detail: "Stronger qualification helps staff focus on serious matters",
        trend: "up",
      },
      {
        label: "Sensitive escalation",
        value: "Immediate",
        detail: "High-risk topics remain mapped to humans",
        trend: "watch",
      },
    ],
    complianceBadges: [
      {
        label: "Matter-intake review",
        tone: "review",
        note: "Final intake wording should be reviewed for practice-specific compliance.",
      },
      {
        label: "Human escalation controls",
        tone: "ready",
        note: "Complex or sensitive matters remain routed to staff.",
      },
      {
        label: "Consultation audit trail",
        tone: "optional",
        note: "The workflow is structured to support downstream review and logging.",
      },
    ],
  },
  gym: {
    heroOutcome: "Keep classes full and membership leads moving with always-on booking, answers, and win-back outreach.",
    heroDetail:
      "The gym blueprint combines membership intake, class scheduling, promotional sequences, and reminder flows into one retention-oriented experience.",
    kpiSnapshot: [
      {
        label: "Class fill support",
        value: "+15%",
        detail: "Blueprint target for reducing open capacity",
        trend: "up",
      },
      {
        label: "Trial follow-up",
        value: "7 days",
        detail: "Lead nurture cadence is already shaped into the workflow",
        trend: "flat",
      },
      {
        label: "Membership coverage",
        value: "24/7",
        detail: "Prospects can ask, book, and re-engage outside office hours",
        trend: "up",
      },
    ],
  },
  vet: {
    heroOutcome: "Handle pet appointment calls quickly while keeping emergency escalation obvious and safe.",
    heroDetail:
      "The veterinary blueprint adapts the healthcare flow for pet care intake, reminder coverage, emergency screening, and follow-up reassurance.",
    kpiSnapshot: [
      {
        label: "Emergency recognition",
        value: "Priority",
        detail: "Critical pet care concerns should leave automation quickly",
        trend: "watch",
      },
      {
        label: "Reminder coverage",
        value: "24/7",
        detail: "Vaccination and visit reminders stay consistent",
        trend: "up",
      },
      {
        label: "Follow-up cadence",
        value: "48 hrs",
        detail: "Post-visit check-ins are part of the launch checklist",
        trend: "flat",
      },
    ],
  },
  autorepair: {
    heroOutcome: "Move service calls from symptom intake to confirmed bay time and payment follow-up with less front-desk drag.",
    heroDetail:
      "This blueprint supports estimate requests, diagnostic scheduling, service reminders, roadside or dispatch-style escalation, and payment recovery.",
    kpiSnapshot: [
      {
        label: "Estimate capture",
        value: "+17%",
        detail: "Blueprint target for reducing lost quote inquiries",
        trend: "up",
      },
      {
        label: "Service booking target",
        value: "<3 min",
        detail: "Vehicle intake should reach a scheduled slot quickly",
        trend: "flat",
      },
      {
        label: "Payment follow-up",
        value: "Automated",
        detail: "Reminder sequences are included in the seeded workflow",
        trend: "up",
      },
    ],
  },
  insurance: {
    heroOutcome: "Capture quotes, support claims, and keep policyholder questions moving without overloading agents.",
    heroDetail:
      "The insurance blueprint is tuned for quote intake, claims support, payment reminders, and high-confidence escalation for policy-sensitive topics.",
    activeChannels: ["Voice", "Chat", "Email", "SMS"],
    kpiSnapshot: [
      {
        label: "Quote intake speed",
        value: "1 session",
        detail: "Lead capture and follow-up stay connected end to end",
        trend: "flat",
      },
      {
        label: "Renewal coverage",
        value: "+13%",
        detail: "Reminder sequences are built into the support journey",
        trend: "up",
      },
      {
        label: "Policy escalation",
        value: "Guarded",
        detail: "Sensitive guidance remains routed to licensed staff",
        trend: "watch",
      },
    ],
    complianceBadges: [
      {
        label: "Policy-language review",
        tone: "review",
        note: "Coverage, claims, and renewal language should be reviewed before launch.",
      },
      {
        label: "Payment reminder controls",
        tone: "ready",
        note: "Reminder paths are structured without changing billing behavior.",
      },
      {
        label: "Escalation auditability",
        tone: "optional",
        note: "The blueprint keeps escalation checkpoints visible for staff review.",
      },
    ],
  },
  education: {
    heroOutcome: "Turn parent and student questions into booked consultations, registrations, and lower-friction enrollment.",
    heroDetail:
      "The education blueprint supports program discovery, tutoring inquiries, registration nudges, and ongoing communication with families.",
    kpiSnapshot: [
      {
        label: "Consultation booking",
        value: "+18%",
        detail: "Blueprint target for converting inquiries into meetings",
        trend: "up",
      },
      {
        label: "Registration reminders",
        value: "Automated",
        detail: "Timed nudges are part of the seeded student journey",
        trend: "up",
      },
      {
        label: "Family response target",
        value: "<2 min",
        detail: "Critical questions should receive a clear next step quickly",
        trend: "flat",
      },
    ],
  },
  logistics: {
    heroOutcome: "Resolve shipment questions, delivery updates, and operational follow-up without sending customers into manual loops.",
    heroDetail:
      "The logistics blueprint is designed for dispatch-style communication, delivery confirmation, tracking questions, and structured exception handling.",
    activeChannels: ["Voice", "Chat", "Email", "SMS"],
    kpiSnapshot: [
      {
        label: "Tracking resolution",
        value: "Self-serve",
        detail: "Common package questions stay inside the first interaction",
        trend: "up",
      },
      {
        label: "Delivery updates",
        value: "Proactive",
        detail: "Notification moments are built into the workflow outline",
        trend: "up",
      },
      {
        label: "Exception handoff",
        value: "<1 step",
        detail: "Operational edge cases should move to staff without confusion",
        trend: "flat",
      },
    ],
  },
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function humanizeTemplateId(id: string) {
  return id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildHeroStats(
  industry: Industry,
  activeChannels: string[],
  recommendedIntegrations: string[],
  voiceCount: number,
  chatCount: number
): IndustryHeroStat[] {
  const validatedTurns = sampleConversations[industry.id]?.length ?? 0;

  return [
    {
      label: "Voice flows",
      value: String(voiceCount),
      detail: `${industry.callsPerMonth} monthly-call blueprint coverage`,
    },
    {
      label: "Chat flows",
      value: String(chatCount),
      detail: `${activeChannels.slice(0, 2).join(" + ")} journeys seeded`,
    },
    {
      label: "Priority apps",
      value: String(recommendedIntegrations.length),
      detail: recommendedIntegrations.slice(0, 2).join(" • "),
    },
    {
      label: "QA turns",
      value: String(validatedTurns),
      detail: "Sample interaction path included for testing",
    },
  ];
}

function buildCapabilityModules(
  industry: Industry,
  activeChannels: string[],
  templates: CapabilityTemplate[],
  featureHighlights: string[],
  automationHighlights: string[],
  knowledgeHighlights: string[],
  voiceIds: string[],
  chatIds: string[]
): IndustryCapabilityModule[] {
  const moduleHighlights = [
    unique([...featureHighlights.slice(0, 3), ...industry.tags.slice(0, 2)]).slice(0, 3),
    unique([
      ...automationHighlights.slice(0, 3),
      `Supports ${voiceIds.length} voice flows`,
      `Supports ${chatIds.length} chat flows`,
    ]).slice(0, 3),
    unique([
      ...knowledgeHighlights.slice(0, 2),
      ...voiceIds.slice(0, 1).map((id) => `${humanizeTemplateId(id)} playbook`),
    ]).slice(0, 3),
  ];

  return templates.map((template, index) => ({
    id: template.id,
    title: template.title,
    description: template.description,
    channels: template.channels.length > 0 ? template.channels : activeChannels.slice(0, 3),
    highlights: moduleHighlights[index],
  }));
}

function buildLaunchChecklist(
  industry: Industry,
  activeChannels: string[],
  recommendedIntegrations: string[],
  voiceCount: number,
  knowledgeTopicCount: number
): IndustryLaunchChecklistItem[] {
  return [
    {
      label: "Seeded workspace assets",
      description: `${voiceCount} voice flows and the core assistant setup are already mapped for ${industry.name}.`,
      status: "included",
    },
    {
      label: "Channel rollout plan",
      description: `Primary customer channels are prepared for ${activeChannels.join(", ")} coverage.`,
      status: "included",
    },
    {
      label: "Priority integrations",
      description: `Connect ${recommendedIntegrations.join(", ")} before going live with automation.`,
      status: "recommended",
    },
    {
      label: "Knowledge review",
      description: `Review ${knowledgeTopicCount} seeded topics plus the top FAQs before launch.`,
      status: "recommended",
    },
    {
      label: "Launch QA pass",
      description: "Run one voice path, one chat path, and one escalation test before enabling traffic.",
      status: "optional",
    },
  ];
}

const blueprints: Record<string, IndustryBlueprint> = {};

for (const industry of industries) {
  const config = INDUSTRY_CONFIGS[industry.id];
  const bundle = industryBundles[industry.id];
  const override = INDUSTRY_OVERRIDES[industry.id];

  if (!config || !bundle || !override) {
    continue;
  }

  const defaults = CATEGORY_DEFAULTS[industry.category];
  const activeChannels = override.activeChannels ?? defaults.activeChannels;
  const complianceBadges = override.complianceBadges ?? defaults.complianceBadges;
  const workflowReadiness = override.workflowReadiness ?? defaults.workflowReadiness;
  const workflowSummary = override.workflowSummary ?? defaults.workflowSummary;
  const integrationsFocus = override.integrationsFocus ?? defaults.integrationsFocus;

  blueprints[industry.id] = {
    industryId: industry.id,
    heroOutcome: override.heroOutcome,
    heroDetail: override.heroDetail,
    activeChannels,
    heroStats: buildHeroStats(
      industry,
      activeChannels,
      bundle.recommendedIntegrations,
      bundle.voiceTemplateIds.length,
      bundle.chatTemplateIds.length
    ),
    workflowReadiness,
    capabilityModules: buildCapabilityModules(
      industry,
      activeChannels,
      defaults.capabilityTemplates,
      config.features,
      config.automations.map((item) => item.description),
      config.knowledgeBaseTopics,
      bundle.voiceTemplateIds,
      bundle.chatTemplateIds
    ),
    kpiSnapshot: override.kpiSnapshot,
    complianceBadges,
    launchChecklist:
      override.launchChecklist ??
      buildLaunchChecklist(
        industry,
        activeChannels,
        bundle.recommendedIntegrations,
        bundle.voiceTemplateIds.length,
        config.knowledgeBaseTopics.length
      ),
    integrationsFocus,
    workflowSummary,
  };
}

export const INDUSTRY_BLUEPRINTS = blueprints;

export function getIndustryBlueprint(industryId: string) {
  return INDUSTRY_BLUEPRINTS[industryId] ?? null;
}

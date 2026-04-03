"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Phone, Bot, Database, Activity, Stethoscope,
  TrendingUp, TrendingDown, Clock, Plus, Trash2, Edit2, Check, Copy, Mail
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { industries } from "@/data/industries";
import { INDUSTRY_CONFIGS, getIndustryConfig } from "@/data/auto-config";
import { StatCard } from "@/components/ui/StatCard";
import { apiFetch } from "@/lib/api";

// Mock Data
const revenueData = [
  { day: 'Mon', revenue: 4200, offline: 1200 },
  { day: 'Tue', revenue: 5100, offline: 1500 },
  { day: 'Wed', revenue: 4800, offline: 1300 },
  { day: 'Thu', revenue: 6200, offline: 1800 },
  { day: 'Fri', revenue: 8400, offline: 2100 },
  { day: 'Sat', revenue: 9500, offline: 2500 },
  { day: 'Sun', revenue: 7100, offline: 2000 },
];

const pieData = [
  { name: 'Online / AI', value: 75 },
  { name: 'Offline / Manual', value: 25 },
];
const pieColors = ["var(--accent)", "var(--voice)"];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface WorkspaceWhatsAppConfig {
  id: string;
  workspace_id: string;
  phone_number_id: string;
  business_account_id?: string | null;
  display_phone_number?: string | null;
  enabled: boolean;
  webhook_verified: boolean;
  masked_access_token?: string;
}

interface WorkspaceWhatsAppConversation {
  id: string;
  customer_phone: string;
  customer_name?: string | null;
  message_count: number;
  status: string;
  last_message_at?: string | null;
}

interface WorkspaceInstagramConfig {
  id: string;
  workspace_id: string;
  instagram_account_id: string;
  page_id: string;
  instagram_username?: string | null;
  enabled: boolean;
  webhook_verified: boolean;
  masked_access_token?: string;
}

interface WorkspaceInstagramConversation {
  id: string;
  sender_id: string;
  sender_username?: string | null;
  message_count: number;
  status: string;
  last_message_at?: string | null;
}

interface WorkspaceFacebookConfig {
  id: string;
  workspace_id: string;
  page_id: string;
  page_name?: string | null;
  app_secret?: string | null;
  enabled: boolean;
  webhook_verified: boolean;
  masked_page_access_token?: string;
}

interface WorkspaceFacebookConversation {
  id: string;
  sender_id: string;
  sender_name?: string | null;
  message_count: number;
  status: string;
  last_message_at?: string | null;
}

interface WorkspaceEmailConfig {
  id: string;
  workspace_id: string;
  provider: string;
  inbox_email: string;
  display_name?: string | null;
  enabled: boolean;
  webhook_verified: boolean;
  masked_smtp_password?: string | null;
  masked_imap_password?: string | null;
}

interface WorkspaceEmailConversation {
  id: string;
  customer_email: string;
  customer_name?: string | null;
  subject?: string | null;
  message_count: number;
  status: string;
  last_message_at?: string | null;
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const industryId = params.industryId as string;

  const [activeTab, setActiveTab] = useState("overview");
  const [workspaceId, setWorkspaceId] = useState(
    (searchParams.get("workspaceId") || searchParams.get("workspace_id") || "").trim()
  );

  const industry = industries.find(i => i.id === industryId);
  const config = getIndustryConfig(industryId);

  // States for Editable Fields
  const [isEditingVoice, setIsEditingVoice] = useState(false);
  const [voiceForm, setVoiceForm] = useState({ name: config?.agentName || "", greeting: config?.greeting || "", afterHours: "We're currently unavailable." });
  
  const [isEditingChat, setIsEditingChat] = useState(false);
  const [chatForm, setChatForm] = useState({ title: "Widget", welcome: "How can I help you?", personality: "Professional" });

  const [whatsappConfig, setWhatsappConfig] = useState<WorkspaceWhatsAppConfig | null>(null);
  const [whatsappConversations, setWhatsappConversations] = useState<WorkspaceWhatsAppConversation[]>([]);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [isConnectingWhatsApp, setIsConnectingWhatsApp] = useState(false);
  const [isTestingWhatsApp, setIsTestingWhatsApp] = useState(false);

  const [instagramConfig, setInstagramConfig] = useState<WorkspaceInstagramConfig | null>(null);
  const [instagramConversations, setInstagramConversations] = useState<WorkspaceInstagramConversation[]>([]);
  const [instagramLoading, setInstagramLoading] = useState(false);
  const [instagramMessage, setInstagramMessage] = useState("");
  const [isConnectingInstagram, setIsConnectingInstagram] = useState(false);
  const [isTestingInstagram, setIsTestingInstagram] = useState(false);

  const [facebookConfig, setFacebookConfig] = useState<WorkspaceFacebookConfig | null>(null);
  const [facebookConversations, setFacebookConversations] = useState<WorkspaceFacebookConversation[]>([]);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [facebookMessage, setFacebookMessage] = useState("");
  const [isConnectingFacebook, setIsConnectingFacebook] = useState(false);
  const [isTestingFacebook, setIsTestingFacebook] = useState(false);

  const [emailConfig, setEmailConfig] = useState<WorkspaceEmailConfig | null>(null);
  const [emailConversations, setEmailConversations] = useState<WorkspaceEmailConversation[]>([]);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [isConnectingEmail, setIsConnectingEmail] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  const [whatsappConnectForm, setWhatsappConnectForm] = useState({
    phoneNumberId: "",
    accessToken: "",
    verifyToken: "",
    businessAccountId: "",
  });

  const [whatsappTestForm, setWhatsappTestForm] = useState({
    phone: "",
    message: "Hello from your Questron workspace test.",
  });

  const [instagramConnectForm, setInstagramConnectForm] = useState({
    instagramAccountId: "",
    pageId: "",
    accessToken: "",
    verifyToken: "",
    instagramUsername: "",
  });

  const [instagramTestForm, setInstagramTestForm] = useState({
    recipientId: "",
    message: "Hello from your Instagram DM test.",
  });

  const [facebookConnectForm, setFacebookConnectForm] = useState({
    pageId: "",
    pageAccessToken: "",
    verifyToken: "",
    appSecret: "",
    pageName: "",
  });

  const [facebookTestForm, setFacebookTestForm] = useState({
    recipientId: "",
    message: "Hello from your Facebook Messenger test.",
  });

  const [emailConnectForm, setEmailConnectForm] = useState({
    provider: "smtp",
    inboxEmail: "",
    displayName: "",
    verifyToken: "",
    smtpHost: "",
    smtpPort: "587",
    smtpUsername: "",
    smtpPassword: "",
    imapHost: "",
    imapPort: "993",
    imapUsername: "",
    imapPassword: "",
    webhookSecret: "",
  });

  const [emailTestForm, setEmailTestForm] = useState({
    toEmail: "",
    subject: "Workspace Email Test",
    message: "Hello from your Forefront email channel test.",
  });

  const webhookUrl = useMemo(() => {
    return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/webhooks/whatsapp`;
  }, []);

  const instagramWebhookUrl = useMemo(() => {
    return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/webhooks/instagram`;
  }, []);

  const facebookWebhookUrl = useMemo(() => {
    return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/webhooks/facebook`;
  }, []);

  const emailWebhookUrl = useMemo(() => {
    return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/webhooks/email`;
  }, []);

  if (!industry || !config) return <div className="p-8 text-[var(--text-primary)]">Loading Workspace...</div>;

  const isMedical = industry.category === "healthcare"; // Actually, prompt said "medical, dental, and veterinary", which maps to category "healthcare" in industries.ts

  const loadWhatsAppState = async () => {
    if (!workspaceId) {
      setWhatsappConfig(null);
      setWhatsappConversations([]);
      return;
    }

    setWhatsappLoading(true);
    setWhatsappMessage("");
    try {
      const configRes = await apiFetch<{ config: WorkspaceWhatsAppConfig | null }>(
        `/api/whatsapp/${workspaceId}/config`
      );
      setWhatsappConfig(configRes?.config || null);

      const convRes = await apiFetch<{ conversations: WorkspaceWhatsAppConversation[] }>(
        `/api/whatsapp/${workspaceId}/conversations?status=active&page=1&limit=20`
      );
      setWhatsappConversations(convRes?.conversations || []);
    } catch (error: any) {
      setWhatsappMessage(error?.message || "Failed to load WhatsApp settings");
    } finally {
      setWhatsappLoading(false);
    }
  };

  const loadInstagramState = async () => {
    if (!workspaceId) {
      setInstagramConfig(null);
      setInstagramConversations([]);
      return;
    }

    setInstagramLoading(true);
    setInstagramMessage("");
    try {
      const configRes = await apiFetch<{ config: WorkspaceInstagramConfig | null }>(
        `/api/instagram/${workspaceId}/config`
      );
      setInstagramConfig(configRes?.config || null);

      const convRes = await apiFetch<{ conversations: WorkspaceInstagramConversation[] }>(
        `/api/instagram/${workspaceId}/conversations?status=active&page=1&limit=20`
      );
      setInstagramConversations(convRes?.conversations || []);
    } catch (error: any) {
      setInstagramMessage(error?.message || "Failed to load Instagram settings");
    } finally {
      setInstagramLoading(false);
    }
  };

  const loadFacebookState = async () => {
    if (!workspaceId) {
      setFacebookConfig(null);
      setFacebookConversations([]);
      return;
    }

    setFacebookLoading(true);
    setFacebookMessage("");
    try {
      const configRes = await apiFetch<{ config: WorkspaceFacebookConfig | null }>(
        `/api/facebook/${workspaceId}/config`
      );
      setFacebookConfig(configRes?.config || null);

      const convRes = await apiFetch<{ conversations: WorkspaceFacebookConversation[] }>(
        `/api/facebook/${workspaceId}/conversations?status=active&page=1&limit=20`
      );
      setFacebookConversations(convRes?.conversations || []);
    } catch (error: any) {
      setFacebookMessage(error?.message || "Failed to load Facebook settings");
    } finally {
      setFacebookLoading(false);
    }
  };

  const loadEmailState = async () => {
    if (!workspaceId) {
      setEmailConfig(null);
      setEmailConversations([]);
      return;
    }

    setEmailLoading(true);
    setEmailMessage("");
    try {
      const configRes = await apiFetch<{ config: WorkspaceEmailConfig | null }>(
        `/api/email/${workspaceId}/config`
      );
      setEmailConfig(configRes?.config || null);

      const convRes = await apiFetch<{ conversations: WorkspaceEmailConversation[] }>(
        `/api/email/${workspaceId}/conversations?status=active&page=1&limit=20`
      );
      setEmailConversations(convRes?.conversations || []);
    } catch (error: any) {
      setEmailMessage(error?.message || "Failed to load Email settings");
    } finally {
      setEmailLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "settings") {
      void loadWhatsAppState();
      void loadInstagramState();
      void loadFacebookState();
      void loadEmailState();
    }
  }, [activeTab, workspaceId]);

  const connectWhatsApp = async () => {
    if (!workspaceId) {
      setWhatsappMessage("Enter a workspace ID first.");
      return;
    }

    if (!whatsappConnectForm.phoneNumberId || !whatsappConnectForm.accessToken || !whatsappConnectForm.verifyToken) {
      setWhatsappMessage("phoneNumberId, accessToken, and verifyToken are required.");
      return;
    }

    setIsConnectingWhatsApp(true);
    setWhatsappMessage("");
    try {
      await apiFetch(`/api/whatsapp/${workspaceId}/connect`, {
        method: "POST",
        body: JSON.stringify(whatsappConnectForm),
      });
      setWhatsappMessage("WhatsApp connected successfully.");
      await loadWhatsAppState();
    } catch (error: any) {
      setWhatsappMessage(error?.message || "Failed to connect WhatsApp");
    } finally {
      setIsConnectingWhatsApp(false);
    }
  };

  const disconnectWhatsApp = async () => {
    if (!workspaceId) return;
    setWhatsappMessage("");
    try {
      await apiFetch(`/api/whatsapp/${workspaceId}/config`, {
        method: "DELETE",
      });
      setWhatsappMessage("WhatsApp disconnected.");
      await loadWhatsAppState();
    } catch (error: any) {
      setWhatsappMessage(error?.message || "Failed to disconnect WhatsApp");
    }
  };

  const sendWhatsAppTest = async () => {
    if (!workspaceId) {
      setWhatsappMessage("Enter a workspace ID first.");
      return;
    }
    if (!whatsappTestForm.phone || !whatsappTestForm.message) {
      setWhatsappMessage("Enter both phone and message to send a test.");
      return;
    }

    setIsTestingWhatsApp(true);
    setWhatsappMessage("");
    try {
      await apiFetch(`/api/whatsapp/${workspaceId}/test`, {
        method: "POST",
        body: JSON.stringify(whatsappTestForm),
      });
      setWhatsappMessage("Test message sent.");
      await loadWhatsAppState();
    } catch (error: any) {
      setWhatsappMessage(error?.message || "Failed to send test message");
    } finally {
      setIsTestingWhatsApp(false);
    }
  };

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setWhatsappMessage("Webhook URL copied.");
    } catch {
      setWhatsappMessage("Could not copy webhook URL.");
    }
  };

  const connectInstagram = async () => {
    if (!workspaceId) {
      setInstagramMessage("Enter a workspace ID first.");
      return;
    }

    if (!instagramConnectForm.instagramAccountId || !instagramConnectForm.pageId || !instagramConnectForm.accessToken || !instagramConnectForm.verifyToken) {
      setInstagramMessage("instagramAccountId, pageId, accessToken, and verifyToken are required.");
      return;
    }

    setIsConnectingInstagram(true);
    setInstagramMessage("");
    try {
      await apiFetch(`/api/instagram/${workspaceId}/connect`, {
        method: "POST",
        body: JSON.stringify(instagramConnectForm),
      });
      setInstagramMessage("Instagram connected successfully.");
      await loadInstagramState();
    } catch (error: any) {
      setInstagramMessage(error?.message || "Failed to connect Instagram");
    } finally {
      setIsConnectingInstagram(false);
    }
  };

  const disconnectInstagram = async () => {
    if (!workspaceId) return;
    setInstagramMessage("");
    try {
      await apiFetch(`/api/instagram/${workspaceId}/config`, {
        method: "DELETE",
      });
      setInstagramMessage("Instagram disconnected.");
      await loadInstagramState();
    } catch (error: any) {
      setInstagramMessage(error?.message || "Failed to disconnect Instagram");
    }
  };

  const sendInstagramTest = async () => {
    if (!workspaceId) {
      setInstagramMessage("Enter a workspace ID first.");
      return;
    }
    if (!instagramTestForm.recipientId || !instagramTestForm.message) {
      setInstagramMessage("Enter both recipientId and message for test DM.");
      return;
    }

    setIsTestingInstagram(true);
    setInstagramMessage("");
    try {
      await apiFetch(`/api/instagram/${workspaceId}/test`, {
        method: "POST",
        body: JSON.stringify(instagramTestForm),
      });
      setInstagramMessage("Instagram test DM sent.");
      await loadInstagramState();
    } catch (error: any) {
      setInstagramMessage(error?.message || "Failed to send Instagram test DM");
    } finally {
      setIsTestingInstagram(false);
    }
  };

  const copyInstagramWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(instagramWebhookUrl);
      setInstagramMessage("Instagram webhook URL copied.");
    } catch {
      setInstagramMessage("Could not copy Instagram webhook URL.");
    }
  };

  const connectFacebook = async () => {
    if (!workspaceId) {
      setFacebookMessage("Enter a workspace ID first.");
      return;
    }

    if (!facebookConnectForm.pageId || !facebookConnectForm.pageAccessToken || !facebookConnectForm.verifyToken) {
      setFacebookMessage("pageId, pageAccessToken, and verifyToken are required.");
      return;
    }

    setIsConnectingFacebook(true);
    setFacebookMessage("");
    try {
      await apiFetch(`/api/facebook/${workspaceId}/connect`, {
        method: "POST",
        body: JSON.stringify(facebookConnectForm),
      });
      setFacebookMessage("Facebook Messenger connected successfully.");
      await loadFacebookState();
    } catch (error: any) {
      setFacebookMessage(error?.message || "Failed to connect Facebook Messenger");
    } finally {
      setIsConnectingFacebook(false);
    }
  };

  const disconnectFacebook = async () => {
    if (!workspaceId) return;
    setFacebookMessage("");
    try {
      await apiFetch(`/api/facebook/${workspaceId}/config`, {
        method: "DELETE",
      });
      setFacebookMessage("Facebook Messenger disconnected.");
      await loadFacebookState();
    } catch (error: any) {
      setFacebookMessage(error?.message || "Failed to disconnect Facebook Messenger");
    }
  };

  const sendFacebookTest = async () => {
    if (!workspaceId) {
      setFacebookMessage("Enter a workspace ID first.");
      return;
    }
    if (!facebookTestForm.recipientId || !facebookTestForm.message) {
      setFacebookMessage("Enter both recipientId and message for test message.");
      return;
    }

    setIsTestingFacebook(true);
    setFacebookMessage("");
    try {
      await apiFetch(`/api/facebook/${workspaceId}/test`, {
        method: "POST",
        body: JSON.stringify(facebookTestForm),
      });
      setFacebookMessage("Facebook test message sent.");
      await loadFacebookState();
    } catch (error: any) {
      setFacebookMessage(error?.message || "Failed to send Facebook test message");
    } finally {
      setIsTestingFacebook(false);
    }
  };

  const copyFacebookWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(facebookWebhookUrl);
      setFacebookMessage("Facebook webhook URL copied.");
    } catch {
      setFacebookMessage("Could not copy Facebook webhook URL.");
    }
  };

  const connectEmail = async () => {
    if (!workspaceId) {
      setEmailMessage("Enter a workspace ID first.");
      return;
    }

    if (!emailConnectForm.inboxEmail || !emailConnectForm.verifyToken) {
      setEmailMessage("inboxEmail and verifyToken are required.");
      return;
    }

    setIsConnectingEmail(true);
    setEmailMessage("");
    try {
      await apiFetch(`/api/email/${workspaceId}/connect`, {
        method: "POST",
        body: JSON.stringify({
          provider: emailConnectForm.provider,
          inboxEmail: emailConnectForm.inboxEmail,
          displayName: emailConnectForm.displayName || null,
          verifyToken: emailConnectForm.verifyToken,
          smtpHost: emailConnectForm.smtpHost || null,
          smtpPort: emailConnectForm.smtpPort ? Number(emailConnectForm.smtpPort) : null,
          smtpUsername: emailConnectForm.smtpUsername || null,
          smtpPassword: emailConnectForm.smtpPassword || null,
          imapHost: emailConnectForm.imapHost || null,
          imapPort: emailConnectForm.imapPort ? Number(emailConnectForm.imapPort) : null,
          imapUsername: emailConnectForm.imapUsername || null,
          imapPassword: emailConnectForm.imapPassword || null,
          webhookSecret: emailConnectForm.webhookSecret || null,
        }),
      });
      setEmailMessage("Email channel connected successfully.");
      await loadEmailState();
    } catch (error: any) {
      setEmailMessage(error?.message || "Failed to connect Email channel");
    } finally {
      setIsConnectingEmail(false);
    }
  };

  const disconnectEmail = async () => {
    if (!workspaceId) return;
    setEmailMessage("");
    try {
      await apiFetch(`/api/email/${workspaceId}/config`, {
        method: "DELETE",
      });
      setEmailMessage("Email channel disconnected.");
      await loadEmailState();
    } catch (error: any) {
      setEmailMessage(error?.message || "Failed to disconnect Email channel");
    }
  };

  const sendEmailTest = async () => {
    if (!workspaceId) {
      setEmailMessage("Enter a workspace ID first.");
      return;
    }

    if (!emailTestForm.toEmail || !emailTestForm.subject || !emailTestForm.message) {
      setEmailMessage("toEmail, subject, and message are required for a test.");
      return;
    }

    setIsTestingEmail(true);
    setEmailMessage("");
    try {
      await apiFetch(`/api/email/${workspaceId}/test`, {
        method: "POST",
        body: JSON.stringify(emailTestForm),
      });
      setEmailMessage("Email test message queued.");
      await loadEmailState();
    } catch (error: any) {
      setEmailMessage(error?.message || "Failed to send test email");
    } finally {
      setIsTestingEmail(false);
    }
  };

  const copyEmailWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(emailWebhookUrl);
      setEmailMessage("Email webhook URL copied.");
    } catch {
      setEmailMessage("Could not copy Email webhook URL.");
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "agents", label: "Agents", icon: Bot },
    { id: "data", label: "Data", icon: Database },
    { id: "profit", label: "Profit", icon: TrendingUp },
    { id: "settings", label: "Settings", icon: Building2 },
    ...(isMedical ? [{ id: "medical", label: "Medical", icon: Stethoscope }] : [])
  ];

  return (
    <div className="flex h-screen flex-col bg-[var(--bg-primary)] font-sans text-[var(--text-primary)]">
      
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-card)] px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg" style={{ background: industry.iconBg, fontSize: '1.2rem' }}>
            {industry.icon}
          </div>
          <div>
            <h1 className="text-lg font-bold">{industry.name} Workspace</h1>
            <p className="text-xs text-[var(--text-secondary)]">Powered by Sarvam AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                activeTab === t.id ? "bg-[var(--accent-dim)] text-[var(--accent)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              )}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Scrollable Area */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {/* ================= OVERVIEW TAB ================= */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                
                {/* 4 KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-[var(--text-secondary)]">Total Interactions</p>
                    <div className="mt-2 text-3xl font-bold font-mono">1,429</div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--accent)]"><TrendingUp size={14}/> +12% this week</div>
                    <div className="mt-3 h-1 w-full bg-[var(--border-default)] rounded-full overflow-hidden"><div className="h-full bg-[var(--accent)] w-[70%]" /></div>
                  </div>
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-[var(--text-secondary)]">AI Resolution Rate</p>
                    <div className="mt-2 text-3xl font-bold font-mono">84%</div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--accent)]"><TrendingUp size={14}/> +4% this week</div>
                    <div className="mt-3 h-1 w-full bg-[var(--border-default)] rounded-full overflow-hidden"><div className="h-full bg-[var(--voice)] w-[84%]" /></div>
                  </div>
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-[var(--text-secondary)]">Revenue Influenced</p>
                    <div className="mt-2 text-3xl font-bold font-mono">₹4,52K</div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--accent)]"><TrendingUp size={14}/> +9% this week</div>
                    <div className="mt-3 h-1 w-full bg-[var(--border-default)] rounded-full overflow-hidden"><div className="h-full bg-[var(--chat)] w-[50%]" /></div>
                  </div>
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-[var(--text-secondary)]">Offline Entries</p>
                    <div className="mt-2 text-3xl font-bold font-mono">312</div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--danger)]"><TrendingDown size={14}/> -2% this week</div>
                    <div className="mt-3 h-1 w-full bg-[var(--border-default)] rounded-full overflow-hidden"><div className="h-full bg-[var(--text-muted)] w-[30%]" /></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Revenue Chart */}
                  <div className="lg:col-span-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm">
                    <h3 className="text-sm font-bold mb-4">Revenue Trend (Last 7 Days)</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                          <defs>
                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" strokeOpacity={0.3} vertical={false} />
                          <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                          <Tooltip 
                            contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#revGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right Column: Pie Chart + Benchmarks */}
                  <div className="space-y-6">
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm flex flex-col items-center justify-center">
                      <h3 className="text-sm font-bold mb-2 w-full text-left">Source Distribution</h3>
                      <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                              {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex gap-4 text-xs mt-2">
                        <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[var(--accent)]"/> Online</span>
                        <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[var(--voice)]"/> Offline</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm">
                      <h3 className="text-sm font-bold mb-4">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {["Log Appointment", "Record Payment", "Add Lead", "Add Customer", "Log Call", "View Profit"].map(a => (
                          <button key={a} className="flex h-10 items-center justify-center rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-medium hover:bg-[var(--border-default)] transition-colors">
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ================= AGENTS TAB ================= */}
            {activeTab === "agents" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Voice Section */}
                <div className="rounded-xl border border-[var(--voice-dim)] bg-[var(--bg-card)] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--voice-dim)] text-[var(--voice)]">
                        <Phone size={20} />
                      </div>
                      <h2 className="text-lg font-bold">Voice Agent</h2>
                    </div>
                    <button onClick={() => setIsEditingVoice(!isEditingVoice)} className="text-xs flex items-center gap-1 text-[var(--voice)] font-medium hover:brightness-125">
                      {isEditingVoice ? <><Check size={14}/> Save</> : <><Edit2 size={14}/> Edit</>}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Agent Name</label>
                      <input disabled={!isEditingVoice} value={voiceForm.name} onChange={e => setVoiceForm({...voiceForm, name: e.target.value})} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] disabled:opacity-70 disabled:border-transparent outline-none focus:border-[var(--voice)]" />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Greeting</label>
                      <textarea disabled={!isEditingVoice} value={voiceForm.greeting} onChange={e => setVoiceForm({...voiceForm, greeting: e.target.value})} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] disabled:opacity-70 disabled:border-transparent outline-none focus:border-[var(--voice)] min-h-[80px]" />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">After Hours Notice</label>
                      <textarea disabled={!isEditingVoice} value={voiceForm.afterHours} onChange={e => setVoiceForm({...voiceForm, afterHours: e.target.value})} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] disabled:opacity-70 disabled:border-transparent outline-none focus:border-[var(--voice)] min-h-[60px]" />
                    </div>
                  </div>

                  {/* Active Templates List */}
                  <div className="mt-8">
                    <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Active Voice Templates</h3>
                    <div className="space-y-2">
                      {config.features.slice(0, 3).map((f, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg bg-[var(--bg-elevated)] px-3 py-2 border border-[var(--border-subtle)]">
                          <span className="text-sm">{f}</span>
                          <div className="h-4 w-8 rounded-full bg-[var(--voice)] relative"><div className="absolute right-0.5 top-0.5 h-3 w-3 rounded-full bg-white"/></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Chat Section */}
                <div className="rounded-xl border border-[var(--chat-dim)] bg-[var(--bg-card)] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--chat-dim)] text-[var(--chat)]">
                        <Bot size={20} />
                      </div>
                      <h2 className="text-lg font-bold">Chatbot</h2>
                    </div>
                    <button onClick={() => setIsEditingChat(!isEditingChat)} className="text-xs flex items-center gap-1 text-[var(--chat)] font-medium hover:brightness-125">
                      {isEditingChat ? <><Check size={14}/> Save</> : <><Edit2 size={14}/> Edit</>}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Widget Title</label>
                      <input disabled={!isEditingChat} value={chatForm.title} onChange={e => setChatForm({...chatForm, title: e.target.value})} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] disabled:opacity-70 disabled:border-transparent outline-none focus:border-[var(--chat)]" />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-secondary)] mb-1.5 block">Welcome Message</label>
                      <textarea disabled={!isEditingChat} value={chatForm.welcome} onChange={e => setChatForm({...chatForm, welcome: e.target.value})} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] disabled:opacity-70 disabled:border-transparent outline-none focus:border-[var(--chat)] min-h-[60px]" />
                    </div>
                  </div>

                  {/* Chat Preview */}
                  <div className="mt-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] overflow-hidden w-full max-w-[280px] mx-auto shadow-lg">
                    <div className="bg-[var(--chat)] px-4 py-3 text-white font-bold text-sm text-center">
                      {chatForm.title}
                    </div>
                    <div className="p-4 bg-[var(--bg-card)] h-32 flex items-end">
                      <div className="bg-[var(--bg-elevated)] text-sm p-3 rounded-2xl rounded-bl-sm border border-[var(--border-default)] shadow-sm text-[var(--text-primary)] max-w-[90%]">
                        {chatForm.welcome}
                      </div>
                    </div>
                    <div className="border-t border-[var(--border-subtle)] p-2 bg-[var(--bg-elevated)] text-xs text-center text-[var(--text-muted)]">
                      Type your message here...
                    </div>
                  </div>
                </div>

                {/* Knowledge Base */}
                <div className="lg:col-span-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">Knowledge Seeds</h2>
                    <button className="flex items-center gap-1.5 text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 hover:bg-[var(--border-default)]">
                      <Plus size={14}/> Add Entry
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {config.sampleFAQs.map((faq, i) => (
                      <div key={i} className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 relative group">
                        <button className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-muted)] hover:text-white"><Edit2 size={14}/></button>
                        <h4 className="font-semibold text-sm mb-1 pr-6">{faq.question}</h4>
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= DATA TAB ================= */}
            {activeTab === "data" && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Offline Data Panel (Manual) */}
                <div className="xl:col-span-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden flex flex-col h-[700px]">
                  <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">Offline Registry</h2>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">Manual logs & operations</p>
                    </div>
                    <button className="bg-[var(--accent)] text-black font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:brightness-110">
                      <Plus size={14}/> Add Entry
                    </button>
                  </div>
                  <div className="flex gap-2 border-b border-[var(--border-subtle)] p-3 bg-[var(--bg-elevated)] overflow-x-auto hide-scrollbar">
                    {["All", "Customer", "Appointment", "Call", "Payment", "Lead"].map(filter => (
                      <button key={filter} className="shrink-0 rounded-full border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:text-white">
                        {filter}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    {/* Mock Offline List */}
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="flex items-center justify-between p-3 mb-2 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--border-default)] bg-[var(--bg-elevated)] group">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-card)] border border-[var(--border-default)]">
                            <Activity size={16} className="text-[var(--text-muted)]"/>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">Offline Customer {i}</span>
                              <span className="text-[10px] bg-[var(--border-default)] px-1.5 py-0.5 rounded text-[var(--text-secondary)]">Customer</span>
                            </div>
                            <div className="text-xs text-[var(--text-muted)] mt-0.5">Added 2 hours ago</div>
                          </div>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] transition-all">
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Online Data Panel */}
                <div className="space-y-6">
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
                    <h2 className="font-bold mb-4">Integrations Sync</h2>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm py-2">
                        <div className="flex items-center gap-2"><span className="text-[18px]">📅</span> Google Calendar</div>
                        <span className="text-[10px] bg-[var(--accent-dim)] text-[var(--accent)] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Synced</span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-2">
                        <div className="flex items-center gap-2"><span className="text-[18px]">💬</span> Twilio Webhooks</div>
                        <span className="text-[10px] bg-[var(--accent-dim)] text-[var(--accent)] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 h-80 flex flex-col">
                    <h2 className="font-bold mb-4">Latest Call Log</h2>
                    <div className="flex-1 overflow-y-auto space-y-2">
                      <div className="text-center text-xs text-[var(--text-muted)] pt-10">
                        <Phone size={24} className="mx-auto mb-2 opacity-50"/>
                        Logs appear here natively from Twilio webhooks
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ================= MEDICAL TAB (Conditional) ================= */}
            {activeTab === "medical" && isMedical && (
              <div className="space-y-6">
                
                {/* Reminders Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Form */}
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-sm">
                    <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><Stethoscope size={20} className="text-[var(--accent)]"/> Schedule Reminder</h2>
                    <p className="text-xs text-[var(--text-secondary)] mb-6">Automated SMS scheduling via Twilio Cron.</p>
                    
                    <div className="space-y-4">
                      <input className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" placeholder="Patient Name" />
                      <input className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" placeholder="+91 Phone Number" />
                      
                      <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-elevated)] rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-[var(--text-secondary)]">MEDICINE 1</span>
                        </div>
                        <input className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" placeholder="Medicine Name (e.g. Paracetamol 500mg)" />
                        <select className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]">
                          <option>1x / Day</option>
                          <option>2x / Day</option>
                          <option>3x / Day</option>
                          <option>As needed</option>
                        </select>
                        <input className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" placeholder="Number of Days (e.g. 5)" type="number" />
                      </div>
                      
                      <div className="p-3 border border-[var(--border-subtle)] bg-[var(--bg-elevated)] rounded-lg space-y-3">
                        <span className="text-xs font-semibold text-[var(--text-secondary)] block">FOLLOW UP OPTS</span>
                        <input className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" placeholder="Doctor Name" />
                        <input className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-card)] px-3 py-1.5 text-[var(--text-muted)] outline-none" type="date" />
                      </div>

                       <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-black transition-all hover:brightness-110">
                        Start Automation <Clock size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Active List */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
                       <h2 className="text-lg font-bold mb-4">Active Compliance Tracks</h2>
                       <div className="space-y-4">
                         {/* Mock adherence card */}
                         <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 relative">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-bold text-sm">Rahul Sharma</h3>
                                <p className="text-xs text-[var(--text-secondary)]">Amoxicillin 250mg • 2x/Day</p>
                              </div>
                              <span className="text-[10px] bg-[var(--accent-dim)] text-[var(--accent)] px-2 py-0.5 rounded-full font-bold">85% Compliant</span>
                            </div>
                            <div className="h-1.5 w-full bg-[var(--border-subtle)] rounded-full overflow-hidden mb-3"><div className="h-full bg-[var(--accent)] w-[85%]" /></div>
                            <div className="flex gap-2">
                               <button className="flex-1 text-[11px] font-medium py-1.5 border border-[var(--accent)] text-[var(--accent)] rounded hover:bg-[var(--accent-dim)] transition-colors">Mark Log. Taken</button>
                               <button className="flex-1 text-[11px] font-medium py-1.5 border border-[var(--danger)] text-[var(--danger)] rounded hover:bg-[var(--danger-dim)] transition-colors">Mark Log. Missed</button>
                            </div>
                         </div>
                       </div>
                    </div>

                    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
                       <h2 className="text-lg font-bold mb-4">Upcoming Follow-Ups</h2>
                       <div className="overflow-x-auto">
                         <table className="w-full text-left text-sm whitespace-nowrap">
                           <thead className="text-[10px] uppercase text-[var(--text-secondary)] border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                             <tr>
                               <th className="px-4 py-2 font-medium">Patient</th>
                               <th className="px-4 py-2 font-medium">Doctor</th>
                               <th className="px-4 py-2 font-medium">Date</th>
                               <th className="px-4 py-2 font-medium">Action</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-[var(--border-subtle)] text-[13px]">
                             <tr className="hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-muted)] text-center">
                               <td colSpan={4} className="py-6">No scheduled follow-ups pending.</td>
                             </tr>
                           </tbody>
                         </table>
                       </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ================= SETTINGS TAB ================= */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">WhatsApp Business</h2>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">Connect your Meta WhatsApp number and route messages into your AI workflow.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                        whatsappConfig?.enabled
                          ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                          : "bg-[var(--danger-dim)] text-[var(--danger)]"
                      )}>
                        <span className={cn("h-2 w-2 rounded-full", whatsappConfig?.enabled ? "bg-[var(--accent)]" : "bg-[var(--danger)]")} />
                        {whatsappConfig?.enabled ? "Connected" : "Disconnected"}
                      </span>
                      <button
                        onClick={() => void loadWhatsAppState()}
                        className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs text-[var(--text-secondary)]">Workspace ID</label>
                      <input
                        value={workspaceId}
                        onChange={(e) => setWorkspaceId(e.target.value)}
                        placeholder="Workspace UUID"
                        className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs text-[var(--text-secondary)]">Webhook URL</label>
                      <div className="flex items-center gap-2">
                        <input
                          value={webhookUrl}
                          readOnly
                          className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-muted)]"
                        />
                        <button
                          onClick={() => void copyWebhookUrl()}
                          className="rounded-lg border border-[var(--border-default)] px-3 py-2 text-xs hover:bg-[var(--bg-elevated)]"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {!whatsappConfig && (
                    <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
                      <input
                        value={whatsappConnectForm.phoneNumberId}
                        onChange={(e) => setWhatsappConnectForm({ ...whatsappConnectForm, phoneNumberId: e.target.value })}
                        placeholder="Phone Number ID"
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />
                      <input
                        value={whatsappConnectForm.businessAccountId}
                        onChange={(e) => setWhatsappConnectForm({ ...whatsappConnectForm, businessAccountId: e.target.value })}
                        placeholder="Business Account ID (optional)"
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />
                      <input
                        value={whatsappConnectForm.verifyToken}
                        onChange={(e) => setWhatsappConnectForm({ ...whatsappConnectForm, verifyToken: e.target.value })}
                        placeholder="Verify Token"
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />
                      <input
                        value={whatsappConnectForm.accessToken}
                        onChange={(e) => setWhatsappConnectForm({ ...whatsappConnectForm, accessToken: e.target.value })}
                        placeholder="Access Token"
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />

                      <button
                        onClick={() => void connectWhatsApp()}
                        disabled={isConnectingWhatsApp || whatsappLoading}
                        className="lg:col-span-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isConnectingWhatsApp ? "Connecting..." : "Connect WhatsApp"}
                      </button>
                    </div>
                  )}

                  {whatsappConfig && (
                    <div className="mt-6 space-y-4">
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                          <div className="text-[10px] uppercase text-[var(--text-secondary)]">Phone Number ID</div>
                          <div className="mt-1 text-sm font-medium">{whatsappConfig.phone_number_id}</div>
                        </div>
                        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                          <div className="text-[10px] uppercase text-[var(--text-secondary)]">Business Account</div>
                          <div className="mt-1 text-sm font-medium">{whatsappConfig.business_account_id || "Not set"}</div>
                        </div>
                        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                          <div className="text-[10px] uppercase text-[var(--text-secondary)]">Access Token</div>
                          <div className="mt-1 text-sm font-medium">{whatsappConfig.masked_access_token || "Masked"}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 lg:grid-cols-4">
                        <input
                          value={whatsappTestForm.phone}
                          onChange={(e) => setWhatsappTestForm({ ...whatsappTestForm, phone: e.target.value })}
                          placeholder="Test phone"
                          className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                        />
                        <input
                          value={whatsappTestForm.message}
                          onChange={(e) => setWhatsappTestForm({ ...whatsappTestForm, message: e.target.value })}
                          placeholder="Test message"
                          className="lg:col-span-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                        />
                        <button
                          onClick={() => void sendWhatsAppTest()}
                          disabled={isTestingWhatsApp}
                          className="rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-medium hover:bg-[var(--bg-elevated)] disabled:opacity-60"
                        >
                          {isTestingWhatsApp ? "Sending..." : "Send Test"}
                        </button>
                      </div>

                      <button
                        onClick={() => void disconnectWhatsApp()}
                        className="rounded-lg border border-[var(--danger)] px-3 py-2 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-dim)]"
                      >
                        Disconnect WhatsApp
                      </button>
                    </div>
                  )}

                  {whatsappMessage && (
                    <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                      {whatsappMessage}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">Instagram DM</h2>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">Connect Instagram direct messages to the same AI response engine.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                        instagramConfig?.enabled
                          ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                          : "bg-[var(--danger-dim)] text-[var(--danger)]"
                      )}>
                        <span className={cn("h-2 w-2 rounded-full", instagramConfig?.enabled ? "bg-[var(--accent)]" : "bg-[var(--danger)]")} />
                        {instagramConfig?.enabled ? "Connected" : "Disconnected"}
                      </span>
                      <button
                        onClick={() => void loadInstagramState()}
                        className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs text-[var(--text-secondary)]">Instagram Webhook URL</label>
                      <div className="flex items-center gap-2">
                        <input
                          value={instagramWebhookUrl}
                          readOnly
                          className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-muted)]"
                        />
                        <button
                          onClick={() => void copyInstagramWebhookUrl()}
                          className="rounded-lg border border-[var(--border-default)] px-3 py-2 text-xs hover:bg-[var(--bg-elevated)]"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2">
                        <div className="text-[10px] uppercase text-[var(--text-secondary)]">Status</div>
                        <div className="mt-1 text-xs font-semibold">{instagramConfig?.enabled ? "Active" : "Not Connected"}</div>
                      </div>
                      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2">
                        <div className="text-[10px] uppercase text-[var(--text-secondary)]">Verified</div>
                        <div className="mt-1 text-xs font-semibold">{instagramConfig?.webhook_verified ? "Yes" : "No"}</div>
                      </div>
                      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2">
                        <div className="text-[10px] uppercase text-[var(--text-secondary)]">Conversations</div>
                        <div className="mt-1 text-xs font-semibold">{instagramConversations.length}</div>
                      </div>
                    </div>
                  </div>

                  {!instagramConfig && (
                    <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
                      <input
                        value={instagramConnectForm.instagramAccountId}
                        onChange={(e) => setInstagramConnectForm({ ...instagramConnectForm, instagramAccountId: e.target.value })}
                        placeholder="Instagram Account ID"
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />
                      <input
                        value={instagramConnectForm.pageId}
                        onChange={(e) => setInstagramConnectForm({ ...instagramConnectForm, pageId: e.target.value })}
                        placeholder="Page ID"
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />
                      <input
                        value={instagramConnectForm.instagramUsername}
                        onChange={(e) => setInstagramConnectForm({ ...instagramConnectForm, instagramUsername: e.target.value })}
                        placeholder="Instagram Username (optional)"
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />
                      <input
                        value={instagramConnectForm.verifyToken}
                        onChange={(e) => setInstagramConnectForm({ ...instagramConnectForm, verifyToken: e.target.value })}
                        placeholder="Verify Token"
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />
                      <input
                        value={instagramConnectForm.accessToken}
                        onChange={(e) => setInstagramConnectForm({ ...instagramConnectForm, accessToken: e.target.value })}
                        placeholder="Access Token"
                        className="lg:col-span-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />

                      <button
                        onClick={() => void connectInstagram()}
                        disabled={isConnectingInstagram || instagramLoading}
                        className="lg:col-span-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isConnectingInstagram ? "Connecting..." : "Connect Instagram"}
                      </button>
                    </div>
                  )}

                  {instagramConfig && (
                    <div className="mt-6 space-y-4">
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                          <div className="text-[10px] uppercase text-[var(--text-secondary)]">Instagram Account</div>
                          <div className="mt-1 text-sm font-medium">{instagramConfig.instagram_account_id}</div>
                        </div>
                        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                          <div className="text-[10px] uppercase text-[var(--text-secondary)]">Page ID</div>
                          <div className="mt-1 text-sm font-medium">{instagramConfig.page_id}</div>
                        </div>
                        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                          <div className="text-[10px] uppercase text-[var(--text-secondary)]">Username</div>
                          <div className="mt-1 text-sm font-medium">{instagramConfig.instagram_username || "Not set"}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 lg:grid-cols-4">
                        <input
                          value={instagramTestForm.recipientId}
                          onChange={(e) => setInstagramTestForm({ ...instagramTestForm, recipientId: e.target.value })}
                          placeholder="Recipient ID"
                          className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                        />
                        <input
                          value={instagramTestForm.message}
                          onChange={(e) => setInstagramTestForm({ ...instagramTestForm, message: e.target.value })}
                          placeholder="Test DM message"
                          className="lg:col-span-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                        />
                        <button
                          onClick={() => void sendInstagramTest()}
                          disabled={isTestingInstagram}
                          className="rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-medium hover:bg-[var(--bg-elevated)] disabled:opacity-60"
                        >
                          {isTestingInstagram ? "Sending..." : "Send Test"}
                        </button>
                      </div>

                      <button
                        onClick={() => void disconnectInstagram()}
                        className="rounded-lg border border-[var(--danger)] px-3 py-2 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-dim)]"
                      >
                        Disconnect Instagram
                      </button>
                    </div>
                  )}

                  {instagramMessage && (
                    <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                      {instagramMessage}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">Facebook Messenger</h2>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">Connect Messenger conversations to your AI and staff handoff workflow.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                        facebookConfig?.enabled
                          ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                          : "bg-[var(--danger-dim)] text-[var(--danger)]"
                      )}>
                        <span className={cn("h-2 w-2 rounded-full", facebookConfig?.enabled ? "bg-[var(--accent)]" : "bg-[var(--danger)]")} />
                        {facebookConfig?.enabled ? "Connected" : "Disconnected"}
                      </span>
                      <button
                        onClick={() => void loadFacebookState()}
                        className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs text-[var(--text-secondary)]">Facebook Webhook URL</label>
                      <div className="flex items-center gap-2">
                        <input
                          value={facebookWebhookUrl}
                          readOnly
                          className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-muted)]"
                        />
                        <button
                          onClick={() => void copyFacebookWebhookUrl()}
                          className="rounded-lg border border-[var(--border-default)] px-3 py-2 text-xs hover:bg-[var(--bg-elevated)]"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2">
                        <div className="text-[10px] uppercase text-[var(--text-secondary)]">Status</div>
                        <div className="mt-1 text-xs font-semibold">{facebookConfig?.enabled ? "Active" : "Not Connected"}</div>
                      </div>
                      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2">
                        <div className="text-[10px] uppercase text-[var(--text-secondary)]">Verified</div>
                        <div className="mt-1 text-xs font-semibold">{facebookConfig?.webhook_verified ? "Yes" : "No"}</div>
                      </div>
                      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2">
                        <div className="text-[10px] uppercase text-[var(--text-secondary)]">Conversations</div>
                        <div className="mt-1 text-xs font-semibold">{facebookConversations.length}</div>
                      </div>
                    </div>
                  </div>

                  {!facebookConfig && (
                    <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
                      <input
                        value={facebookConnectForm.pageId}
                        onChange={(e) => setFacebookConnectForm({ ...facebookConnectForm, pageId: e.target.value })}
                        placeholder="Page ID"
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />
                      <input
                        value={facebookConnectForm.pageName}
                        onChange={(e) => setFacebookConnectForm({ ...facebookConnectForm, pageName: e.target.value })}
                        placeholder="Page Name (optional)"
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />
                      <input
                        value={facebookConnectForm.verifyToken}
                        onChange={(e) => setFacebookConnectForm({ ...facebookConnectForm, verifyToken: e.target.value })}
                        placeholder="Verify Token"
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />
                      <input
                        value={facebookConnectForm.appSecret}
                        onChange={(e) => setFacebookConnectForm({ ...facebookConnectForm, appSecret: e.target.value })}
                        placeholder="App Secret (optional)"
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />
                      <input
                        value={facebookConnectForm.pageAccessToken}
                        onChange={(e) => setFacebookConnectForm({ ...facebookConnectForm, pageAccessToken: e.target.value })}
                        placeholder="Page Access Token"
                        className="lg:col-span-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />

                      <button
                        onClick={() => void connectFacebook()}
                        disabled={isConnectingFacebook || facebookLoading}
                        className="lg:col-span-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isConnectingFacebook ? "Connecting..." : "Connect Facebook Messenger"}
                      </button>
                    </div>
                  )}

                  {facebookConfig && (
                    <div className="mt-6 space-y-4">
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                          <div className="text-[10px] uppercase text-[var(--text-secondary)]">Page ID</div>
                          <div className="mt-1 text-sm font-medium">{facebookConfig.page_id}</div>
                        </div>
                        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                          <div className="text-[10px] uppercase text-[var(--text-secondary)]">Page Name</div>
                          <div className="mt-1 text-sm font-medium">{facebookConfig.page_name || "Not set"}</div>
                        </div>
                        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                          <div className="text-[10px] uppercase text-[var(--text-secondary)]">Token</div>
                          <div className="mt-1 text-sm font-medium">{facebookConfig.masked_page_access_token || "Masked"}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 lg:grid-cols-4">
                        <input
                          value={facebookTestForm.recipientId}
                          onChange={(e) => setFacebookTestForm({ ...facebookTestForm, recipientId: e.target.value })}
                          placeholder="Recipient ID"
                          className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                        />
                        <input
                          value={facebookTestForm.message}
                          onChange={(e) => setFacebookTestForm({ ...facebookTestForm, message: e.target.value })}
                          placeholder="Test message"
                          className="lg:col-span-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                        />
                        <button
                          onClick={() => void sendFacebookTest()}
                          disabled={isTestingFacebook}
                          className="rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-medium hover:bg-[var(--bg-elevated)] disabled:opacity-60"
                        >
                          {isTestingFacebook ? "Sending..." : "Send Test"}
                        </button>
                      </div>

                      <button
                        onClick={() => void disconnectFacebook()}
                        className="rounded-lg border border-[var(--danger)] px-3 py-2 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-dim)]"
                      >
                        Disconnect Facebook Messenger
                      </button>
                    </div>
                  )}

                  {facebookMessage && (
                    <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                      {facebookMessage}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">Email Channel</h2>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">Connect support email inbox and process incoming messages through AI workflows.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                        emailConfig?.enabled
                          ? "bg-[var(--accent-dim)] text-[var(--accent)]"
                          : "bg-[var(--danger-dim)] text-[var(--danger)]"
                      )}>
                        <span className={cn("h-2 w-2 rounded-full", emailConfig?.enabled ? "bg-[var(--accent)]" : "bg-[var(--danger)]")} />
                        {emailConfig?.enabled ? "Connected" : "Disconnected"}
                      </span>
                      <button
                        onClick={() => void loadEmailState()}
                        className="rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs text-[var(--text-secondary)]">Email Webhook URL</label>
                      <div className="flex items-center gap-2">
                        <input
                          value={emailWebhookUrl}
                          readOnly
                          className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-muted)]"
                        />
                        <button
                          onClick={() => void copyEmailWebhookUrl()}
                          className="rounded-lg border border-[var(--border-default)] px-3 py-2 text-xs hover:bg-[var(--bg-elevated)]"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2">
                        <div className="text-[10px] uppercase text-[var(--text-secondary)]">Status</div>
                        <div className="mt-1 text-xs font-semibold">{emailConfig?.enabled ? "Active" : "Not Connected"}</div>
                      </div>
                      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2">
                        <div className="text-[10px] uppercase text-[var(--text-secondary)]">Provider</div>
                        <div className="mt-1 text-xs font-semibold">{emailConfig?.provider || "smtp"}</div>
                      </div>
                      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2">
                        <div className="text-[10px] uppercase text-[var(--text-secondary)]">Conversations</div>
                        <div className="mt-1 text-xs font-semibold">{emailConversations.length}</div>
                      </div>
                    </div>
                  </div>

                  {!emailConfig && (
                    <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
                      <select
                        value={emailConnectForm.provider}
                        onChange={(e) => setEmailConnectForm({ ...emailConnectForm, provider: e.target.value })}
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      >
                        <option value="smtp">SMTP/IMAP</option>
                        <option value="gmail">Gmail</option>
                      </select>
                      <input
                        value={emailConnectForm.inboxEmail}
                        onChange={(e) => setEmailConnectForm({ ...emailConnectForm, inboxEmail: e.target.value })}
                        placeholder="Inbox Email"
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />
                      <input
                        value={emailConnectForm.displayName}
                        onChange={(e) => setEmailConnectForm({ ...emailConnectForm, displayName: e.target.value })}
                        placeholder="Display Name (optional)"
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />
                      <input
                        value={emailConnectForm.verifyToken}
                        onChange={(e) => setEmailConnectForm({ ...emailConnectForm, verifyToken: e.target.value })}
                        placeholder="Verify Token"
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />
                      <input
                        value={emailConnectForm.smtpHost}
                        onChange={(e) => setEmailConnectForm({ ...emailConnectForm, smtpHost: e.target.value })}
                        placeholder="SMTP Host (optional)"
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />
                      <input
                        value={emailConnectForm.smtpPort}
                        onChange={(e) => setEmailConnectForm({ ...emailConnectForm, smtpPort: e.target.value })}
                        placeholder="SMTP Port (optional)"
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />
                      <input
                        value={emailConnectForm.smtpUsername}
                        onChange={(e) => setEmailConnectForm({ ...emailConnectForm, smtpUsername: e.target.value })}
                        placeholder="SMTP Username (optional)"
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />
                      <input
                        value={emailConnectForm.smtpPassword}
                        onChange={(e) => setEmailConnectForm({ ...emailConnectForm, smtpPassword: e.target.value })}
                        placeholder="SMTP Password (optional)"
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />

                      <button
                        onClick={() => void connectEmail()}
                        disabled={isConnectingEmail || emailLoading}
                        className="lg:col-span-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isConnectingEmail ? "Connecting..." : "Connect Email Channel"}
                      </button>
                    </div>
                  )}

                  {emailConfig && (
                    <div className="mt-6 space-y-4">
                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                          <div className="text-[10px] uppercase text-[var(--text-secondary)]">Inbox Email</div>
                          <div className="mt-1 text-sm font-medium">{emailConfig.inbox_email}</div>
                        </div>
                        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                          <div className="text-[10px] uppercase text-[var(--text-secondary)]">Display Name</div>
                          <div className="mt-1 text-sm font-medium">{emailConfig.display_name || "Not set"}</div>
                        </div>
                        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                          <div className="text-[10px] uppercase text-[var(--text-secondary)]">Provider</div>
                          <div className="mt-1 text-sm font-medium">{emailConfig.provider}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 lg:grid-cols-4">
                        <input
                          value={emailTestForm.toEmail}
                          onChange={(e) => setEmailTestForm({ ...emailTestForm, toEmail: e.target.value })}
                          placeholder="Recipient Email"
                          className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                        />
                        <input
                          value={emailTestForm.subject}
                          onChange={(e) => setEmailTestForm({ ...emailTestForm, subject: e.target.value })}
                          placeholder="Email Subject"
                          className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                        />
                        <input
                          value={emailTestForm.message}
                          onChange={(e) => setEmailTestForm({ ...emailTestForm, message: e.target.value })}
                          placeholder="Test email message"
                          className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                        />
                        <button
                          onClick={() => void sendEmailTest()}
                          disabled={isTestingEmail}
                          className="rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm font-medium hover:bg-[var(--bg-elevated)] disabled:opacity-60"
                        >
                          {isTestingEmail ? "Sending..." : "Send Test"}
                        </button>
                      </div>

                      <button
                        onClick={() => void disconnectEmail()}
                        className="rounded-lg border border-[var(--danger)] px-3 py-2 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-dim)]"
                      >
                        Disconnect Email Channel
                      </button>
                    </div>
                  )}

                  {emailMessage && (
                    <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                      {emailMessage}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
                  <h3 className="text-lg font-bold">Email Conversations</h3>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">Recent email conversations connected to this workspace.</p>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left text-sm">
                      <thead className="border-b border-[var(--border-subtle)] text-[10px] uppercase text-[var(--text-secondary)]">
                        <tr>
                          <th className="px-2 py-2 font-medium">Customer</th>
                          <th className="px-2 py-2 font-medium">Email</th>
                          <th className="px-2 py-2 font-medium">Subject</th>
                          <th className="px-2 py-2 font-medium">Messages</th>
                          <th className="px-2 py-2 font-medium">Last Message</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {emailConversations.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-2 py-6 text-center text-xs text-[var(--text-muted)]">
                              {emailLoading ? "Loading conversations..." : "No Email conversations yet."}
                            </td>
                          </tr>
                        )}

                        {emailConversations.map((conversation) => (
                          <tr key={conversation.id} className="hover:bg-[var(--bg-elevated)]">
                            <td className="px-2 py-3 text-sm font-medium">{conversation.customer_name || "Unknown"}</td>
                            <td className="px-2 py-3 text-xs text-[var(--text-secondary)]">{conversation.customer_email}</td>
                            <td className="px-2 py-3 text-xs text-[var(--text-secondary)] max-w-[220px] truncate">{conversation.subject || "(no subject)"}</td>
                            <td className="px-2 py-3 text-xs">{conversation.message_count}</td>
                            <td className="px-2 py-3 text-xs text-[var(--text-secondary)]">
                              {conversation.last_message_at
                                ? new Date(conversation.last_message_at).toLocaleString()
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
                  <h3 className="text-lg font-bold">WhatsApp Conversations</h3>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">Recent customer conversations connected to this workspace.</p>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left text-sm">
                      <thead className="border-b border-[var(--border-subtle)] text-[10px] uppercase text-[var(--text-secondary)]">
                        <tr>
                          <th className="px-2 py-2 font-medium">Customer</th>
                          <th className="px-2 py-2 font-medium">Phone</th>
                          <th className="px-2 py-2 font-medium">Messages</th>
                          <th className="px-2 py-2 font-medium">Status</th>
                          <th className="px-2 py-2 font-medium">Last Message</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {whatsappConversations.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-2 py-6 text-center text-xs text-[var(--text-muted)]">
                              {whatsappLoading ? "Loading conversations..." : "No WhatsApp conversations yet."}
                            </td>
                          </tr>
                        )}

                        {whatsappConversations.map((conversation) => (
                          <tr key={conversation.id} className="hover:bg-[var(--bg-elevated)]">
                            <td className="px-2 py-3 text-sm font-medium">{conversation.customer_name || "Unknown"}</td>
                            <td className="px-2 py-3 text-xs text-[var(--text-secondary)]">{conversation.customer_phone}</td>
                            <td className="px-2 py-3 text-xs">{conversation.message_count}</td>
                            <td className="px-2 py-3">
                              <span className="rounded-full bg-[var(--accent-dim)] px-2 py-1 text-[10px] font-bold uppercase text-[var(--accent)]">
                                {conversation.status}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-xs text-[var(--text-secondary)]">
                              {conversation.last_message_at
                                ? new Date(conversation.last_message_at).toLocaleString()
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Profit empty tab for completion */}
            {activeTab === "profit" && (
              <div className="flex h-64 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
                <span className="text-[var(--text-muted)] text-sm">This module is under construction.</span>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}

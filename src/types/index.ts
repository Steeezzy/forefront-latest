export interface Industry {
  id: string;
  name: string;
  icon: string;
  iconBg: string; // gradient CSS
  subtitle: string;
  tagline: string;
  category: 'healthcare' | 'home-services' | 'hospitality' | 'professional' | 'retail' | 'education';
  tags: string[];
  voiceTemplates: number;
  chatTemplates: number;
  businesses: number;
  integrations: string[];
  callsPerMonth: string;
}

export interface Template {
  id: string;
  name: string;
  category: 'inbound' | 'outbound' | 'hybrid';
  function: string;
  description: string;
  icon: string;
  configFields: ConfigField[];
  requiredIntegrations: string[];
  industries: string[];
  setupTime: string;
  complexity: 'simple' | 'medium' | 'complex';
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'toggle' | 'list';
  options?: string[];
  required: boolean;
  placeholder?: string;
  defaultValue?: any;
}

export interface Workspace {
  id: string;
  userId: string;
  industryId: string;
  name: string;
  status: 'active' | 'testing' | 'paused';
  voiceAgent: VoiceAgentConfig;
  chatbot: ChatbotConfig;
  activeTemplates: string[];
  integrations: WorkspaceIntegration[];
  createdAt: string;
  updatedAt: string;
}

export interface VoiceAgentConfig {
  name: string;
  voice: string; // Sarvam voice ID
  greeting: string;
  afterHoursMessage: string;
  language: string;
  temperature: number;
}

export interface ChatbotConfig {
  widgetTitle: string;
  primaryColor: string;
  welcomeMessage: string;
  position: 'bottom-right' | 'bottom-left';
  personality: string;
  temperature: number;
  collectLeads: boolean;
}

export interface WorkspaceIntegration {
  integrationId: string;
  name: string;
  icon: string;
  connected: boolean;
  lastSynced?: string;
}

export interface Call {
  id: string;
  workspaceId: string;
  direction: 'inbound' | 'outbound';
  callerName: string;
  callerPhone: string;
  duration: string;
  outcome: 'booked' | 'answered' | 'missed' | 'transferred';
  recordingUrl?: string;
  transcript?: string;
  summary?: string;
  templateUsed: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  workspaceId: string;
  role: 'user' | 'assistant' | 'agent';
  content: string;
  timestamp: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface Customer {
  id: string;
  workspaceId: string;
  name: string;
  phone: string;
  email: string;
  tags: string[];
  sentiment: string;
  lastInteraction: string;
  interactions: number;
  notes: string;
}

export interface AnalyticsData {
  totalInteractions: number;
  aiResolutionRate: number;
  voiceCallVolume: number;
  chatVolume: number;
  avgHandleTime: string;
  satisfactionScore: number;
  topIntents: { intent: string; count: number }[];
  callVolumeByDay: { day: string; calls: number }[];
  outcomesBreakdown: { outcome: string; percentage: number }[];
}

export interface NavItem {
  label: string;
  href: string;
  icon: any; // Lucide icon
  badge?: string | number;
  children?: NavItem[];
}

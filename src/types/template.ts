export interface Industry {
    id: string;
    label: string;
    description: string;
    icon: string; // Lucide icon name
    accent_from: string;
    accent_to: string;
    surface: string;
    border: string;
    created_at: string;
}

export interface Template {
    id: string;
    name: string;
    industry_id: string;
    direction: 'inbound' | 'outbound' | 'webcall';
    mode: 'single' | 'multi';
    icon: string; // Lucide icon name
    eyebrow?: string;
    summary: string;
    outcome: string;
    first_message: string;
    objective?: string;
    guidelines: string[];
    variables: string[];
    primary_language: string;
    secondary_language?: string;
    voice: string;
    workflow?: any; // MultiPromptWorkflowTemplate (complex)
    config_schema: Record<string, any>;
    required_integrations: string[];
    is_active: boolean;
    is_featured: boolean;
    created_at: string;
    updated_at: string;
}

export interface TemplateCardProps {
    template: Template;
    onClick?: (template: Template) => void;
}

export interface IndustryCardProps {
    industry: Industry;
    selected: boolean;
    onClick: (industryId: string) => void;
}

// Helper to get industry from template (client-side memo)
export function getIndustryLabel(industryId: string): string {
    const industryMap: Record<string, string> = {
        medical: 'Medical & Healthcare',
        salon: 'Salons & Spas',
        plumbing: 'Plumbing & HVAC',
        hotel: 'Hotels & B&Bs',
        restaurant: 'Restaurants & Cafés',
        auto: 'Auto Repair & Detailing',
        fitness: 'Gyms & Fitness Studios',
        veterinary: 'Veterinary & Pet Services',
        realestate: 'Real Estate',
        law: 'Law Firms',
        insurance: 'Insurance',
        logistics: 'Logistics & Courier',
        driving: 'Driving Schools',
        cleaning: 'Cleaning Services',
        events: 'Event Venues',
        education: 'Tutoring & Education',
        itsupport: 'IT Support',
        funeral: 'Funeral Homes',
        recruitment: 'Recruitment',
        retail: 'Retail & E-commerce',
    };
    return industryMap[industryId] || industryId;
}

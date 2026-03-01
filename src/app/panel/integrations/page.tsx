"use client";

import { useState, useEffect, useCallback } from 'react';
import { IntegrationsSidebar } from '@/components/integrations/IntegrationsSidebar';
import { IntegrationCard } from '@/components/integrations/IntegrationCard';
import { MissingIntegrationBanner } from '@/components/integrations/MissingIntegrationBanner';
import { IntegrationConnectModal } from '@/components/integrations/IntegrationConnectModal';
import { apiFetch } from '@/lib/api';
import {
    Zap, BarChart, Tag, Facebook, Mail, Instagram, MessageCircle, Cloud, Hexagon, Database,
    ShoppingBag, Store, Globe, Star
} from 'lucide-react';

// Using Lucide icons as placeholders where possible, or generic shapes
const integrations = [
    // BI & Analytics
    { id: 'zapier', name: 'Zapier', description: 'Connect Forefront Agent with over 1000 apps using Zapier. With this integration, you can make sure every valuable contact will be sent to your CRM.', category: 'BI & analytics', icon: Zap, iconColor: 'text-orange-500' },
    { id: 'google-analytics', name: 'Google Analytics', description: 'Thanks to integration with Google Analytics you will be able to easily follow events such as "started chat", "finished chat" in your Analytics.', category: 'BI & analytics', icon: BarChart, iconColor: 'text-yellow-500' },
    { id: 'google-tag-manager', name: 'Google Tag Manager', description: 'Streamline data tracking and customer engagement with seamless integration between Forefront Agent and Google Tag Manager.', category: 'BI & analytics', icon: Tag, iconColor: 'text-blue-500' },

    // Communication Channels
    { id: 'facebook', name: 'Facebook', description: 'Connect Forefront Agent with Facebook and handle messages and comments from your customers directly in your panel.', category: 'Communication channels', icon: Facebook, iconColor: 'text-blue-600' },
    { id: 'email', name: 'Email', description: 'With Forefront Agent, you can easily connect your mailbox and receive or send emails directly from the app.', category: 'Communication channels', icon: Mail, iconColor: 'text-blue-400' },
    { id: 'instagram', name: 'Instagram', description: 'Connect your Instagram Business account with Forefront Agent and reply to Direct Messages, Stories and comments.', category: 'Communication channels', icon: Instagram, iconColor: 'text-pink-500' },
    { id: 'whatsapp', name: 'WhatsApp', description: 'Integrate Forefront Agent with WhatsApp and turn your conversations into support tickets or sales opportunities.', category: 'Communication channels', icon: MessageCircle, iconColor: 'text-green-500' },

    // CRM
    { id: 'agile-crm', name: 'Agile CRM', description: 'Integrate Forefront Agent with Agile CRM and create new contacts straight from the conversation.', category: 'CRM', icon: Cloud, iconColor: 'text-blue-300' },
    { id: 'zendesk-sell', name: 'Zendesk Sell', description: 'Integrate Forefront Agent with Zendesk Sell and create new leads straight from the conversation.', category: 'CRM', icon: Hexagon, iconColor: 'text-amber-500' },
    { id: 'pipedrive', name: 'Pipedrive', description: 'Integrate Forefront Agent with Pipedrive and create new deals straight from the conversation.', category: 'CRM', icon: Database, iconColor: 'text-green-600' }, // Placeholder
    { id: 'zoho', name: 'Zoho', description: 'Integrate Forefront Agent with Zoho and create new contacts straight from the conversation.', category: 'CRM', icon: Database, iconColor: 'text-red-500' }, // Placeholder
    { id: 'hubspot', name: 'HubSpot', description: 'Integrate Forefront Agent with HubSpot and create new contacts straight from the conversation.', category: 'CRM', icon: Database, iconColor: 'text-orange-600' }, // Placeholder
    { id: 'salesforce', name: 'Salesforce', description: 'Integrate Forefront Agent with Salesforce and create new contacts straight from the conversation.', category: 'CRM', icon: Cloud, iconColor: 'text-blue-500' },

    // E-commerce
    { id: 'bigcommerce', name: 'BigCommerce', description: 'Provide an excellent shopping experience and turn visitors into happy customers.', category: 'E-commerce', icon: Store, iconColor: 'text-white' },
    { id: 'adobe-commerce', name: 'Adobe Commerce', description: 'Increase your sales by reaching out to your customers with personalized communication.', category: 'E-commerce', icon: Store, iconColor: 'text-red-600' },
    { id: 'prestashop', name: 'PrestaShop', description: 'Talk to your online customers, gather new leads, and boost your sales in one go.', category: 'E-commerce', icon: ShoppingBag, iconColor: 'text-pink-600' },
    { id: 'shopify', name: 'Shopify', description: 'Chat into your visitors up and increase sales by turning them into happy customers.', category: 'E-commerce', icon: ShoppingBag, iconColor: 'text-green-500', installed: true },
    { id: 'woocommerce', name: 'WooCommerce', description: 'Engage your website visitors at the right time to make sure they will finalize their purchase.', category: 'E-commerce', icon: Store, iconColor: 'text-purple-500' },
    { id: 'wordpress', name: 'WordPress', description: 'Enhance your customer service and see your sales skyrocket in no time.', category: 'E-commerce', icon: Globe, iconColor: 'text-white' },

    // Marketing Automation
    { id: 'klaviyo', name: 'Klaviyo', description: 'Connect Forefront Agent with Klaviyo and automatically add new subscribers from the pre-chat survey to your mailing list in Klaviyo.', category: 'Marketing automation', icon: Database, iconColor: 'text-white' }, // Placeholder icon
    { id: 'mailchimp', name: 'Mailchimp', description: 'Connect Forefront Agent with Mailchimp and automatically add new subscribers to your mailing list in Mailchimp.', category: 'Marketing automation', icon: Mail, iconColor: 'text-yellow-500' },
    { id: 'activecampaign', name: 'ActiveCampaign', description: 'Connect Forefront Agent with ActiveCampaign and automatically add new subscribers to your mailing list in ActiveCampaign.', category: 'Marketing automation', icon: Zap, iconColor: 'text-blue-500' },
    { id: 'omnisend', name: 'Omnisend', description: 'Connect Forefront Agent with Omnisend and automatically add new subscribers to your mailing list in Omnisend.', category: 'Marketing automation', icon: Mail, iconColor: 'text-green-500' }, // Placeholder color
    { id: 'mailerlite', name: 'MailerLite', description: 'Connect Forefront Agent with MailerLite and automatically add new subscribers to your mailing list in MailerLite.', category: 'Marketing automation', icon: Mail, iconColor: 'text-green-600' },
    { id: 'brevo', name: 'Brevo', description: 'Connect Forefront Agent with Brevo and automatically add new subscribers to your mailing list in Brevo.', category: 'Marketing automation', icon: MessageCircle, iconColor: 'text-green-700' },

    // Rating & Reviews
    { id: 'judgeme', name: 'Judge.me', description: 'Connect Judge.me to Forefront Agent to collect more reviews and build trust with your customers.', category: 'Rating & reviews', icon: Star, iconColor: 'text-teal-400' },

    // Customer Support
    { id: 'zendesk', name: 'Zendesk', description: 'Create new tickets, directly from the chat window, and manage them in Zendesk.', category: 'Customer support', icon: MessageCircle, iconColor: 'text-green-600' },
];

export default function IntegrationsPage() {
    const [selectedCategory, setSelectedCategory] = useState('E-commerce');
    const [connectedMap, setConnectedMap] = useState<Record<string, string>>({});
    const [selectedIntegration, setSelectedIntegration] = useState<typeof integrations[number] | null>(null);

    // Fetch connected integrations from backend
    const loadStatuses = useCallback(async () => {
        try {
            const data = await apiFetch('/api/integrations');
            if (data?.integrations) {
                const map: Record<string, string> = {};
                data.integrations.forEach((i: any) => {
                    // Convert backend type (google_analytics) to frontend id (google-analytics)
                    const frontendId = i.integration_type.replace(/_/g, '-');
                    map[frontendId] = i.status;
                });
                setConnectedMap(map);
            }
        } catch {
            // Backend may not be reachable — keep defaults
        }
    }, []);

    useEffect(() => {
        loadStatuses();
    }, [loadStatuses]);

    const filteredIntegrations = selectedCategory === 'All integrations'
        ? integrations
        : integrations.filter(item => item.category === selectedCategory);

    const activeCategoryDescription = {
        'All integrations': 'Browse all available integrations.',
        'BI & analytics': 'Discover integrations designed to track data, export insights and influence data-driven decisions.',
        'Communication channels': 'Integrate with communication tools. Speed up your response times to increase customer satisfaction.',
        'CRM': 'Sync contacts, create leads and track conversations with our CRM integrations.',
        'E-commerce': 'Connect Forefront Agent with your e-commerce store and speed up your customer experience.',
        'Marketing automation': 'Automate your marketing workflows.',
        'Rating & reviews': 'Collect and manage customer reviews.',
        'Customer support': 'Enhance your support with these tools.'
    }[selectedCategory];

    return (
        <div className="flex min-h-screen bg-[#0f1115] p-8 overflow-y-auto h-screen">
            {/* Inner Sidebar */}
            <IntegrationsSidebar
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
            />

            {/* Main Content */}
            <div className="flex-1 max-w-6xl">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">{selectedCategory}</h1>
                    <p className="text-zinc-400 text-sm">
                        {activeCategoryDescription || 'Explore our integrations.'}
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredIntegrations.map((integration) => (
                        <IntegrationCard
                            key={integration.id}
                            {...integration}
                            installed={connectedMap[integration.id] === 'connected' || integration.installed}
                            fallbackInitial={integration.name.charAt(0)}
                            onClick={() => setSelectedIntegration(integration)}
                        />
                    ))}

                    {filteredIntegrations.length === 0 && (
                        <div className="col-span-full py-12 text-center text-zinc-500">
                            No integrations found in this category.
                        </div>
                    )}
                </div>

                <MissingIntegrationBanner />
            </div>

            {/* Connect Modal */}
            {selectedIntegration && (
                <IntegrationConnectModal
                    integration={selectedIntegration}
                    currentStatus={connectedMap[selectedIntegration.id] === 'connected' ? 'connected' : null}
                    onClose={() => setSelectedIntegration(null)}
                    onConnected={loadStatuses}
                />
            )}
        </div>
    );
}

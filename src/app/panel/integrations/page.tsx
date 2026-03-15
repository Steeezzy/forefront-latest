"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { IntegrationsSidebar } from '@/components/integrations/IntegrationsSidebar';
import { IntegrationCard } from '@/components/integrations/IntegrationCard';
import { MissingIntegrationBanner } from '@/components/integrations/MissingIntegrationBanner';
import { apiFetch } from '@/lib/api';
import {
    Zap, BarChart, Tag, Facebook, Mail, Instagram, MessageCircle, Cloud, Hexagon,
    ShoppingBag, Store, Globe, Star, Search, Hash
} from 'lucide-react';

// Using Lucide icons as placeholders where possible, or generic shapes
const integrations = [
    // BI & Analytics
    { id: 'zapier', name: 'Zapier', description: 'Connect Questron Agent with over 1000 apps using Zapier. With this integration, you can make sure every valuable contact will be sent to your CRM.', category: 'BI & analytics', icon: Zap, iconColor: 'text-orange-500' },
    { id: 'google-analytics', name: 'Google Analytics', description: 'Thanks to integration with Google Analytics you will be able to easily follow events such as "started chat", "finished chat" in your Analytics.', category: 'BI & analytics', icon: BarChart, iconColor: 'text-yellow-500' },
    { id: 'google-tag-manager', name: 'Google Tag Manager', description: 'Streamline data tracking and customer engagement with seamless integration between Questron Agent and Google Tag Manager.', category: 'BI & analytics', icon: Tag, iconColor: 'text-blue-500' },

    // Communication Channels
    { id: 'facebook', name: 'Facebook', description: 'Connect Questron Agent with Facebook and handle messages and comments from your customers directly in your panel.', category: 'Communication channels', icon: Facebook, iconColor: 'text-blue-600' },
    { id: 'email', name: 'Email', description: 'With Questron Agent, you can easily connect your mailbox and receive or send emails directly from the app.', category: 'Communication channels', icon: Mail, iconColor: 'text-blue-400' },
    { id: 'instagram', name: 'Instagram', description: 'Connect your Instagram Business account with Questron Agent and reply to Direct Messages, Stories and comments.', category: 'Communication channels', icon: Instagram, iconColor: 'text-pink-500' },
    { id: 'whatsapp', name: 'WhatsApp', description: 'Integrate Questron Agent with WhatsApp and turn your conversations into support tickets or sales opportunities.', category: 'Communication channels', icon: MessageCircle, iconColor: 'text-green-500' },

    // CRM
    { id: 'agile-crm', name: 'Agile CRM', description: 'Integrate Questron Agent with Agile CRM and create new contacts straight from the conversation.', category: 'CRM', icon: Cloud, iconColor: 'text-blue-300' },
    { id: 'zendesk-sell', name: 'Zendesk Sell', description: 'Integrate Questron Agent with Zendesk Sell and create new leads straight from the conversation.', category: 'CRM', icon: Hexagon, iconColor: 'text-amber-500' },
    { id: 'pipedrive', name: 'Pipedrive', description: 'Integrate Questron Agent with Pipedrive and create new deals straight from the conversation.', category: 'CRM', icon: Globe, iconColor: 'text-green-600' },
    { id: 'zoho', name: 'Zoho', description: 'Integrate Questron Agent with Zoho and create new contacts straight from the conversation.', category: 'CRM', icon: Zap, iconColor: 'text-red-500' },
    { id: 'hubspot', name: 'HubSpot', description: 'Integrate Questron Agent with HubSpot and create new contacts straight from the conversation.', category: 'CRM', icon: Hexagon, iconColor: 'text-orange-500' },
    { id: 'salesforce', name: 'Salesforce', description: 'Integrate Questron Agent with Salesforce and create new contacts straight from the conversation.', category: 'CRM', icon: Cloud, iconColor: 'text-blue-500' },

    // E-commerce
    { id: 'bigcommerce', name: 'BigCommerce', description: 'Provide an excellent shopping experience and turn visitors into happy customers.', category: 'E-commerce', icon: Store, iconColor: 'text-gray-900' },
    { id: 'adobe-commerce', name: 'Adobe Commerce', description: 'Increase your sales by reaching out to your customers with personalized communication.', category: 'E-commerce', icon: Store, iconColor: 'text-red-600' },
    { id: 'prestashop', name: 'PrestaShop', description: 'Talk to your online customers, gather new leads, and boost your sales in one go.', category: 'E-commerce', icon: ShoppingBag, iconColor: 'text-pink-600' },
    { id: 'shopify', name: 'Shopify', description: 'Chat into your visitors up and increase sales by turning them into happy customers.', category: 'E-commerce', icon: ShoppingBag, iconColor: 'text-green-500', installed: true },
    { id: 'woocommerce', name: 'WooCommerce', description: 'Engage your website visitors at the right time to make sure they will finalize their purchase.', category: 'E-commerce', icon: Store, iconColor: 'text-purple-500' },
    { id: 'wordpress', name: 'WordPress', description: 'Enhance your customer service and see your sales skyrocket in no time.', category: 'E-commerce', icon: Globe, iconColor: 'text-gray-900' },

    // Marketing Automation
    { id: 'klaviyo', name: 'Klaviyo', description: 'Connect Questron Agent with Klaviyo and automatically add new subscribers from the pre-chat survey to your mailing list in Klaviyo.', category: 'Marketing automation', icon: Tag, iconColor: 'text-gray-900' },
    { id: 'mailchimp', name: 'Mailchimp', description: 'Connect Questron Agent with Mailchimp and automatically add new subscribers to your mailing list in Mailchimp.', category: 'Marketing automation', icon: Mail, iconColor: 'text-yellow-500' },
    { id: 'activecampaign', name: 'ActiveCampaign', description: 'Connect Questron Agent with ActiveCampaign and automatically add new subscribers to your mailing list in ActiveCampaign.', category: 'Marketing automation', icon: Zap, iconColor: 'text-blue-500' },
    { id: 'omnisend', name: 'Omnisend', description: 'Connect Questron Agent with Omnisend and automatically add new subscribers to your mailing list in Omnisend.', category: 'Marketing automation', icon: Mail, iconColor: 'text-green-500' }, // Placeholder color
    { id: 'mailerlite', name: 'MailerLite', description: 'Connect Questron Agent with MailerLite and automatically add new subscribers to your mailing list in MailerLite.', category: 'Marketing automation', icon: Mail, iconColor: 'text-green-600' },
    { id: 'brevo', name: 'Brevo', description: 'Connect Questron Agent with Brevo and automatically add new subscribers to your mailing list in Brevo.', category: 'Marketing automation', icon: MessageCircle, iconColor: 'text-green-700' },

    // Rating & Reviews
    { id: 'judgeme', name: 'Judge.me', description: 'Connect Judge.me to Questron Agent to collect more reviews and build trust with your customers.', category: 'Rating & reviews', icon: Star, iconColor: 'text-teal-400' },

    // Customer Support
    { id: 'zendesk', name: 'Zendesk', description: 'Create new tickets, directly from the chat window, and manage them in Zendesk.', category: 'Customer support', icon: MessageCircle, iconColor: 'text-green-600' },

    // Notifications
    { id: 'slack', name: 'Slack', description: 'Get real-time notifications in Slack for new conversations, tickets, and ratings. Keep your team in the loop.', category: 'Communication channels', icon: Hash, iconColor: 'text-purple-500' },
];

export default function IntegrationsPage() {
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState('E-commerce');
    const [searchQuery, setSearchQuery] = useState('');
    const [connectedMap, setConnectedMap] = useState<Record<string, string>>({});

    const handleIntegrationClick = (integration: typeof integrations[number]) => {
        // Always navigate to detail page — shows overview, features, setup steps
        // The detail page handles connect/disconnect state internally
        router.push(`/panel/integrations/detail?type=${integration.id}`);
    };

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

    const filteredIntegrations = integrations
        .filter(item => {
            // When searching, ignore category filter to search across all
            if (!searchQuery.trim()) {
                if (selectedCategory !== 'All integrations' && item.category !== selectedCategory) return false;
            }
            // Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                return item.name.toLowerCase().includes(q) ||
                       item.description.toLowerCase().includes(q) ||
                       item.category.toLowerCase().includes(q);
            }
            return true;
        });

    const activeCategoryDescription = {
        'All integrations': 'Browse all available integrations.',
        'BI & analytics': 'Discover integrations designed to track data, export insights and influence data-driven decisions.',
        'Communication channels': 'Integrate with communication tools. Speed up your response times to increase customer satisfaction.',
        'CRM': 'Sync contacts, create leads and track conversations with our CRM integrations.',
        'E-commerce': 'Connect Questron Agent with your e-commerce store and speed up your customer experience.',
        'Marketing automation': 'Automate your marketing workflows.',
        'Rating & reviews': 'Collect and manage customer reviews.',
        'Customer support': 'Enhance your support with these tools.'
    }[selectedCategory];

    return (
        <div className="flex min-h-screen bg-[#f4f4f5] p-8 overflow-y-auto h-screen">
            {/* Inner Sidebar */}
            <IntegrationsSidebar
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
            />

            {/* Main Content */}
            <div className="flex-1 max-w-6xl">
                <header className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">{selectedCategory}</h1>
                            <p className="text-zinc-400 text-sm">
                                {activeCategoryDescription || 'Explore our integrations.'}
                            </p>
                        </div>
                        <div className="relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search integrations..."
                                className="bg-white border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 placeholder-zinc-500 focus:outline-none focus:border-blue-500 w-64"
                            />
                        </div>
                    </div>
                    {searchQuery && (
                        <p className="text-xs text-zinc-500">
                            {filteredIntegrations.length} result{filteredIntegrations.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
                        </p>
                    )}
                </header>

                {/* Popular section — show when on "All integrations" or "E-commerce" and no search */}
                {!searchQuery && (selectedCategory === 'All integrations' || selectedCategory === 'E-commerce') && (
                    <div className="mb-10">
                        <h2 className="text-gray-900 font-semibold text-base mb-4 flex items-center gap-2">
                            <Star size={16} className="text-yellow-400" />
                            Popular
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {integrations
                                .filter(i => ['shopify', 'hubspot', 'zapier', 'mailchimp', 'facebook', 'whatsapp'].includes(i.id))
                                .map((integration) => (
                                    <IntegrationCard
                                        key={integration.id}
                                        id={integration.id}
                                        {...integration}
                                        installed={connectedMap[integration.id] === 'connected' || integration.installed}
                                        fallbackInitial={integration.name.charAt(0)}
                                        onClick={() => handleIntegrationClick(integration)}
                                    />
                                ))}
                        </div>
                    </div>
                )}

                {/* Section header for category */}
                {!searchQuery && (selectedCategory === 'All integrations' || selectedCategory === 'E-commerce') && (
                    <h2 className="text-gray-900 font-semibold text-base mb-4">
                        {selectedCategory === 'All integrations' ? 'All integrations' : selectedCategory}
                    </h2>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredIntegrations.map((integration) => (
                        <IntegrationCard
                            key={integration.id}
                            id={integration.id}
                            {...integration}
                            installed={connectedMap[integration.id] === 'connected' || integration.installed}
                            fallbackInitial={integration.name.charAt(0)}
                            onClick={() => handleIntegrationClick(integration)}
                        />
                    ))}

                    {filteredIntegrations.length === 0 && (
                        <div className="col-span-full py-12 text-center text-zinc-500">
                            <Search size={32} className="mx-auto mb-3 text-zinc-600" />
                            <p>{searchQuery ? `No integrations match "${searchQuery}"` : 'No integrations found in this category.'}</p>
                        </div>
                    )}
                </div>

                <MissingIntegrationBanner />
            </div>

        </div>
    );
}

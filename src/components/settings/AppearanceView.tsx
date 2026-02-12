"use client";

import { useState } from 'react';
import {
    ChevronDown, Trash2, Home, MessageSquare, Send,
    Lock, Info, AlertCircle, Plus, Globe, Monitor, Smartphone,
    ChevronRight, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

export function AppearanceView() {
    // Accordion State
    const [openSection, setOpenSection] = useState<string | null>('Content');
    const [contentTab, setContentTab] = useState<'Home' | 'Chat' | 'Survey' | 'Minimized'>('Minimized');
    const [visibilityTab, setVisibilityTab] = useState<'Desktop' | 'Mobile'>('Mobile');

    // General State
    const [bgColor, setBgColor] = useState('#0000FF');
    const [actionColor, setActionColor] = useState('#2563eb');

    // Content - Home State
    const [welcomeImage, setWelcomeImage] = useState<'collage' | 'logo'>('collage');
    const [headerText, setHeaderText] = useState('Hi there 👋');
    const [messageText, setMessageText] = useState('Welcome to our website. Ask us anything 🚀');
    const [starters, setStarters] = useState(['Which product is right for me?']);

    // Content - Chat State
    const [offlineMessage, setOfflineMessage] = useState("We're currently unavailable. We'll get back to you when one of our agents is able to respond.");
    const [createTicketOffline, setCreateTicketOffline] = useState(true);
    const [privacyPolicy, setPrivacyPolicy] = useState(false);

    // Content - Survey State
    const [showSurvey, setShowSurvey] = useState(true);
    const [surveyMessage, setSurveyMessage] = useState('Please introduce yourself:');
    const [surveyFields, setSurveyFields] = useState([
        { id: 1, type: 'Email', label: 'Enter your email...', required: true },
        { id: 2, type: 'Name', label: 'Enter your name...', required: false },
    ]);

    // Content - Minimized State
    const [showMinimizedLabel, setShowMinimizedLabel] = useState(true);
    const [minimizedLabel, setMinimizedLabel] = useState('Chat with us 👋');

    // Visibility State
    const [hideOnSpecificPages, setHideOnSpecificPages] = useState(false);
    const [widgetPosition, setWidgetPosition] = useState<'left' | 'right'>('right');
    const [buttonType, setButtonType] = useState<'corner' | 'sidebar'>('corner');
    const [mobileButtonSize, setMobileButtonSize] = useState([50]); // 0-100

    // Multilanguage State
    const [language, setLanguage] = useState('English');

    const toggleSection = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)]">
            {/* Left Column: Settings Form */}
            <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar">

                {/* Header Info */}
                <div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3 mb-6">
                        <Info className="text-blue-400 shrink-0 mt-0.5" size={18} />
                        <p className="text-blue-300 text-sm leading-relaxed">
                            If you can't see the widget on your website, or you want to learn more about detailed Shopify set up instructions - <a href="#" className="underline hover:text-blue-200">read this article</a>.
                        </p>
                    </div>
                </div>

                {/* Section 1: General */}
                <div className="bg-[#18181b] border border-white/5 rounded-xl overflow-hidden">
                    <button
                        onClick={() => toggleSection('General')}
                        className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
                    >
                        <span className="font-semibold text-white">General</span>
                        <ChevronDown size={16} className={cn("text-zinc-400 transition-transform", openSection === 'General' && "rotate-180")} />
                    </button>

                    {openSection === 'General' && (
                        <div className="p-6 border-t border-white/5 space-y-6">
                            <div>
                                <label className="block text-zinc-400 text-sm mb-2">Background color</label>
                                <div className="flex items-center gap-3">
                                    <div className="relative group">
                                        <div className="flex items-center gap-2 bg-[#0f1115] border border-white/10 rounded-lg px-3 py-2 text-white text-sm w-full md:w-64 cursor-pointer hover:border-white/20 transition-colors">
                                            <div className="w-5 h-5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: bgColor }}></div>
                                            <span className="flex-1">Color 1</span>
                                            <ChevronDown size={14} className="text-zinc-500" />
                                        </div>
                                        {/* Hidden real input for functionality */}
                                        <input
                                            type="color"
                                            value={bgColor}
                                            onChange={(e) => setBgColor(e.target.value)}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-sm mb-2">Action color</label>
                                <div className="flex items-center gap-3">
                                    <div className="relative group">
                                        <div className="flex items-center gap-2 bg-[#0f1115] border border-white/10 rounded-lg px-3 py-2 text-white text-sm w-full md:w-64 cursor-pointer hover:border-white/20 transition-colors">
                                            <div className="w-5 h-5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: actionColor }}></div>
                                            <span className="flex-1">Blue</span>
                                            <ChevronDown size={14} className="text-zinc-500" />
                                        </div>
                                        {/* Hidden real input for functionality */}
                                        <input
                                            type="color"
                                            value={actionColor}
                                            onChange={(e) => setActionColor(e.target.value)}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-sm mb-2">Brand logo</label>
                                <div className="bg-[#0f1115] border border-white/10 rounded-lg p-4 flex items-center gap-3 text-zinc-500 text-sm">
                                    <Lock size={16} />
                                    <span>Custom branding is available on the Plus plan. <a href="#" className="underline">Contact us</a> to enable this feature.</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Section 2: Content */}
                <div className="bg-[#18181b] border border-white/5 rounded-xl overflow-hidden">
                    <button
                        onClick={() => toggleSection('Content')}
                        className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
                    >
                        <span className="font-semibold text-white">Content</span>
                        <ChevronDown size={16} className={cn("text-zinc-400 transition-transform", openSection === 'Content' && "rotate-180")} />
                    </button>

                    {openSection === 'Content' && (
                        <div className="p-6 border-t border-white/5 space-y-6">
                            {/* Internal Tabs */}
                            <div className="flex items-center gap-6 border-b border-white/5">
                                {[
                                    { id: 'Home', label: 'Home', icon: Home },
                                    { id: 'Chat', label: 'Chat', icon: MessageSquare },
                                    { id: 'Survey', label: 'Pre-chat survey', icon: AlertCircle },
                                    { id: 'Minimized', label: 'Minimized', icon: ChevronDown } // Placeholder icon
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setContentTab(tab.id as any)}
                                        className={cn(
                                            "flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2",
                                            contentTab === tab.id
                                                ? "text-blue-500 border-blue-500"
                                                : "text-zinc-400 border-transparent hover:text-white"
                                        )}
                                    >
                                        <tab.icon size={16} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Home View */}
                            {contentTab === 'Home' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-zinc-400 text-sm mb-3">Welcome image</label>
                                        <div className="space-y-3">
                                            <label className="flex items-start gap-3 cursor-pointer group">
                                                <div className="mt-0.5">
                                                    <input
                                                        type="radio"
                                                        name="welcomeImage"
                                                        checked={welcomeImage === 'collage'}
                                                        onChange={() => setWelcomeImage('collage')}
                                                        className="accent-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <span className="text-white text-sm font-medium block">Agents collage</span>
                                                    <span className="text-zinc-500 text-xs">Show a collage of your agents' profile pictures at the top of your widget.</span>
                                                </div>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="welcomeImage"
                                                    checked={welcomeImage === 'logo'}
                                                    onChange={() => setWelcomeImage('logo')}
                                                    className="accent-blue-500"
                                                />
                                                <span className="text-white text-sm font-medium">Your logo</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-zinc-400 text-sm mb-1.5">Header</label>
                                        <input
                                            type="text"
                                            value={headerText || ''}
                                            onChange={(e) => setHeaderText(e.target.value)}
                                            className="w-full bg-[#0f1115] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-zinc-400 text-sm mb-1.5">Message</label>
                                        <textarea
                                            value={messageText || ''}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            className="w-full bg-[#0f1115] border border-white/10 rounded-lg px-3 py-2 text-white text-sm min-h-[80px] focus:border-blue-500 focus:outline-none resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-zinc-400 text-sm mb-1.5">Conversation starters</label>
                                        <div className="space-y-2">
                                            {starters.map((starter, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={starter || ''}
                                                        onChange={(e) => {
                                                            const newStarters = [...starters];
                                                            newStarters[index] = e.target.value;
                                                            setStarters(newStarters);
                                                        }}
                                                        className="flex-1 bg-[#0f1115] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const newStarters = starters.filter((_, i) => i !== index);
                                                            setStarters(newStarters);
                                                        }}
                                                        className="text-zinc-500 hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2 border-dashed border-white/20 text-zinc-400 hover:text-white"
                                                onClick={() => setStarters([...starters, ''])}
                                            >
                                                <Plus size={14} className="mr-1" /> Add now
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Chat View */}
                            {contentTab === 'Chat' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-zinc-400 text-sm mb-1.5">Offline message</label>
                                        <textarea
                                            value={offlineMessage}
                                            onChange={(e) => setOfflineMessage(e.target.value)}
                                            className="w-full bg-[#0f1115] border border-white/10 rounded-lg px-3 py-2 text-white text-sm min-h-[80px] focus:border-blue-500 focus:outline-none resize-none"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="text-white text-sm font-medium">Let visitors create ticket when offline</label>
                                        <Switch checked={createTicketOffline} onCheckedChange={setCreateTicketOffline} />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="text-white text-sm font-medium">Privacy policy message</label>
                                        <Switch checked={privacyPolicy} onCheckedChange={setPrivacyPolicy} />
                                    </div>
                                </div>
                            )}

                            {/* Pre-chat Survey View */}
                            {contentTab === 'Survey' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <label className="text-white text-sm font-medium">Display</label>
                                        <Switch checked={showSurvey} onCheckedChange={setShowSurvey} />
                                    </div>

                                    {showSurvey && (
                                        <>
                                            <div>
                                                <label className="block text-zinc-400 text-sm mb-1.5">Message</label>
                                                <input
                                                    type="text"
                                                    value={surveyMessage}
                                                    onChange={(e) => setSurveyMessage(e.target.value)}
                                                    className="w-full bg-[#0f1115] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-zinc-400 text-sm mb-3">Survey fields</label>
                                                <div className="space-y-3">
                                                    {surveyFields.map((field) => (
                                                        <div key={field.id} className="bg-[#0f1115] border border-white/10 rounded-lg p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-white text-sm font-medium">{field.type}</span>
                                                                <button onClick={() => setSurveyFields(surveyFields.filter(f => f.id !== field.id))}>
                                                                    <Trash2 size={16} className="text-zinc-500 hover:text-red-400" />
                                                                </button>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={field.label || ''}
                                                                onChange={(e) => {
                                                                    const newFields = surveyFields.map(f =>
                                                                        f.id === field.id ? { ...f, label: e.target.value } : f
                                                                    );
                                                                    setSurveyFields(newFields);
                                                                }}
                                                                className="w-full bg-transparent border-b border-white/10 px-0 py-1 text-zinc-300 text-sm focus:outline-none focus:border-blue-500 mb-2"
                                                            />
                                                            <label className="flex items-center gap-2">
                                                                <input type="checkbox" className="rounded border-zinc-700 bg-transparent" />
                                                                <span className="text-zinc-500 text-xs">Ask your visitor for permission</span>
                                                            </label>
                                                        </div>
                                                    ))}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full mt-2 border-dashed border-white/20 text-zinc-400 hover:text-white"
                                                    >
                                                        <Plus size={14} className="mr-1" /> Add new
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Minimized View */}
                            {contentTab === 'Minimized' && (
                                <div className="space-y-6">
                                    <div className="bg-blue-500/5 text-blue-300 text-sm p-4 rounded-lg border border-blue-500/10">
                                        You can add button label to encourage visitors to open the widget.
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <label className="text-white text-sm font-medium">Button label</label>
                                        <Switch
                                            checked={showMinimizedLabel}
                                            onCheckedChange={setShowMinimizedLabel}
                                            className="data-[state=checked]:bg-blue-600"
                                        />
                                    </div>

                                    {showMinimizedLabel && (
                                        <div>
                                            <input
                                                type="text"
                                                value={minimizedLabel}
                                                onChange={(e) => setMinimizedLabel(e.target.value)}
                                                className="w-full bg-[#0f1115] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Section 3: Visibility and Position */}
                <div className="bg-[#18181b] border border-white/5 rounded-xl overflow-hidden">
                    <button
                        onClick={() => toggleSection('Visibility')}
                        className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
                    >
                        <span className="font-semibold text-white">Visibility and position</span>
                        <ChevronDown size={16} className={cn("text-zinc-400 transition-transform", openSection === 'Visibility' && "rotate-180")} />
                    </button>

                    {openSection === 'Visibility' && (
                        <div className="p-6 border-t border-white/5 space-y-6">
                            <div className="flex bg-[#0f1115] rounded-lg p-1 w-fit">
                                <button
                                    onClick={() => setVisibilityTab('Desktop')}
                                    className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors", visibilityTab === 'Desktop' ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white")}
                                >
                                    <Monitor size={14} /> Desktop
                                </button>
                                <button
                                    onClick={() => setVisibilityTab('Mobile')}
                                    className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors", visibilityTab === 'Mobile' ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white")}
                                >
                                    <Smartphone size={14} /> Mobile
                                </button>
                            </div>

                            {visibilityTab === 'Mobile' ? (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="block text-white text-sm font-medium">Display</span>
                                            <div className="flex flex-col gap-1 mt-1">
                                                <a href="#" className="text-blue-500 text-xs hover:underline">Hide on specific pages</a>
                                                <a href="#" className="text-blue-500 text-xs hover:underline">Hide or display for specific countries</a>
                                            </div>
                                        </div>
                                        <Switch checked={true} className="data-[state=checked]:bg-blue-600" />
                                    </div>

                                    <div>
                                        <label className="block text-zinc-400 text-sm mb-4">Button position</label>
                                        <div className="flex items-center gap-12">
                                            {/* Left Option */}
                                            <div
                                                onClick={() => setWidgetPosition('left')}
                                                className="cursor-pointer group flex flex-col items-center gap-2"
                                            >
                                                <div className={cn(
                                                    "w-16 h-28 border-2 rounded-[14px] relative bg-[#0f1115] transition-colors",
                                                    widgetPosition === 'left' ? "border-blue-500" : "border-zinc-700 group-hover:border-zinc-600"
                                                )}>
                                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-1 bg-zinc-800 rounded-full"></div>
                                                    <div className="absolute bottom-3 left-2 w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("w-2 h-2 rounded-full", widgetPosition === 'left' ? "bg-blue-500" : "border border-zinc-600")}></div>
                                                    <span className={cn("text-xs font-medium", widgetPosition === 'left' ? "text-white" : "text-zinc-400")}>Left</span>
                                                </div>
                                            </div>

                                            {/* Right Option */}
                                            <div
                                                onClick={() => setWidgetPosition('right')}
                                                className="cursor-pointer group flex flex-col items-center gap-2"
                                            >
                                                <div className={cn(
                                                    "w-16 h-28 border-2 rounded-[14px] relative bg-[#0f1115] transition-colors",
                                                    widgetPosition === 'right' ? "border-blue-500" : "border-zinc-700 group-hover:border-zinc-600"
                                                )}>
                                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-1 bg-zinc-800 rounded-full"></div>
                                                    <div className="absolute bottom-3 right-2 w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("w-2 h-2 rounded-full", widgetPosition === 'right' ? "bg-blue-500" : "border border-zinc-600")}></div>
                                                    <span className={cn("text-xs font-medium", widgetPosition === 'right' ? "text-white" : "text-zinc-400")}>Right</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-zinc-400 text-sm">Button size</label>
                                        </div>
                                        <div className="px-1">
                                            <Slider
                                                value={mobileButtonSize}
                                                onValueChange={setMobileButtonSize}
                                                max={100}
                                                step={1}
                                                className="py-4"
                                            />
                                            <div className="flex justify-between text-xs text-zinc-500 mt-1 font-medium">
                                                <span>Small</span>
                                                <span>Medium</span>
                                                <span>Large</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                // Desktop content fallback or implementation
                                <div className="text-zinc-500 text-sm text-center py-8">
                                    Desktop settings are similar to Mobile. Switch tabs to configure.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Section 4: Multilanguage */}
                <div className="bg-[#18181b] border border-white/5 rounded-xl overflow-hidden mb-8">
                    <button
                        onClick={() => toggleSection('Multilanguage')}
                        className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
                    >
                        <span className="font-semibold text-white">Multilanguage</span>
                        <ChevronDown size={16} className={cn("text-zinc-400 transition-transform", openSection === 'Multilanguage' && "rotate-180")} />
                    </button>

                    {openSection === 'Multilanguage' && (
                        <div className="p-6 border-t border-white/5 space-y-6">
                            <div>
                                <label className="block text-zinc-400 text-sm mb-2">Default language</label>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="w-full bg-[#0f1115] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                                    >
                                        <option>English</option>
                                        <option>Spanish</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-sm mb-2">Translations</label>
                                <div className="bg-[#0f1115] border border-white/10 rounded-lg p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Globe size={16} className="text-zinc-500" />
                                        <span className="text-white text-sm">English</span>
                                    </div>
                                    <a href="#" className="text-blue-500 text-xs font-medium hover:underline">Manage</a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Live Preview */}
            <div className="w-[400px] hidden lg:block bg-[#111111] rounded-2xl p-8 relative overflow-hidden border border-white/5" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                <div className="text-zinc-500 absolute top-4 left-1/2 -translate-x-1/2 text-xs uppercase font-medium">
                    Preview: {contentTab}
                </div>

                <div className="h-full flex flex-col justify-end items-end relative pb-20">

                    {/* Widget Card (Only show if NOT minimized) */}
                    <div className={cn(
                        "w-full max-w-[340px] bg-white rounded-2xl shadow-2xl overflow-hidden relative transition-all duration-300 origin-bottom-right",
                        contentTab === 'Minimized' ? "translate-y-20 opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100"
                    )}>
                        {/* Dynamic Header */}
                        <div className="p-6 text-white pb-8" style={{ backgroundColor: bgColor }}>
                            {contentTab === 'Home' && (
                                <>
                                    <h3 className="text-2xl font-bold mb-1">{headerText}</h3>
                                    <p className="text-white/90 text-sm">{messageText}</p>
                                    {welcomeImage === 'collage' && (
                                        <div className="flex -space-x-2 mt-4">
                                            <div className="w-8 h-8 rounded-full bg-zinc-200 border-2 border-white"></div>
                                            <div className="w-8 h-8 rounded-full bg-zinc-300 border-2 border-white"></div>
                                            <div className="w-8 h-8 rounded-full bg-zinc-400 border-2 border-white"></div>
                                        </div>
                                    )}
                                </>
                            )}

                            {contentTab === 'Chat' && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">FA</div>
                                    <div>
                                        <h3 className="font-bold">Support Team</h3>
                                        <p className="text-xs opacity-80">Online</p>
                                    </div>
                                </div>
                            )}

                            {contentTab === 'Survey' && (
                                <div>
                                    <h3 className="text-xl font-bold mb-1">Welcome!</h3>
                                    <p className="text-white/90 text-sm">Please fill out the form below.</p>
                                </div>
                            )}
                        </div>

                        {/* Dynamic Body */}
                        <div className="bg-white p-4 -mt-4 rounded-t-2xl relative z-10 min-h-[300px]">
                            {contentTab === 'Home' && (
                                <div className="space-y-2 mt-2">
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-xl text-base font-semibold shadow-lg shadow-blue-500/20 mb-4">
                                        Start chat <Send size={18} className="ml-2" />
                                    </Button>

                                    <div className="space-y-2">
                                        {starters.filter(s => s).map((starter, i) => (
                                            <button key={i} className="w-full text-left p-3 rounded-xl bg-gray-50 text-gray-700 text-sm font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors flex justify-between items-center group">
                                                {starter}
                                                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {contentTab === 'Chat' && (
                                <div className="space-y-4 pt-4">
                                    <div className="flex justify-end">
                                        <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%] text-sm">
                                            Hi! I need help with my connection.
                                        </div>
                                    </div>
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%] text-sm">
                                            Hello! I can certainly help you with that. Can you describe the issue?
                                        </div>
                                    </div>
                                    <div className="flex justify-start">
                                        <div className="text-gray-400 text-xs ml-2">Just now</div>
                                    </div>
                                </div>
                            )}

                            {contentTab === 'Survey' && (
                                <div className="space-y-4 pt-2">
                                    {showSurvey ? (
                                        <>
                                            <p className="text-sm font-medium text-gray-700">{surveyMessage}</p>
                                            {surveyFields.map((field) => (
                                                <div key={field.id} className="space-y-1">
                                                    <label className="text-xs text-gray-500">{field.type} {field.required && '*'}</label>
                                                    <input
                                                        type="text"
                                                        placeholder={field.label}
                                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                                    />
                                                </div>
                                            ))}
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2">
                                                Send
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="text-center text-gray-400 text-sm pt-8">Survey is disabled</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Launcher Button Container */}
                    <div
                        className={cn(
                            "absolute bottom-6 flex items-center gap-3 transition-all duration-300 z-20",
                            widgetPosition === 'left' ? "left-6 flex-row" : "right-6 flex-row-reverse"
                        )}
                        style={{
                            transform: `scale(${0.8 + (mobileButtonSize[0] / 100) * 0.4})`, // Scale from 0.8 to 1.2 based on slider
                            transformOrigin: widgetPosition === 'left' ? 'bottom left' : 'bottom right'
                        }}
                    >
                        {/* Label Pill */}
                        {showMinimizedLabel && (
                            <div className="bg-white text-zinc-900 px-4 py-2.5 rounded-full shadow-lg font-medium text-sm animate-in fade-in slide-in-from-bottom-2 duration-300 whitespace-nowrap">
                                {minimizedLabel || 'Chat with us 👋'}
                            </div>
                        )}

                        {/* Icon Circle */}
                        <div
                            className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                            style={{ backgroundColor: actionColor }}
                        >
                            <MessageSquare size={28} className="text-white fill-white" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

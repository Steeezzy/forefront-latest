"use client";

import { cn } from '@/lib/utils';
import { BarChart, MessageSquare, Users, ShoppingCart, Megaphone, Star, Headphones, Layers, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface IntegrationsSidebarProps {
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
}

const categories = [
    { name: "All integrations", icon: Layers, count: 28 },
    { name: "BI & analytics", icon: BarChart, count: 3 },
    { name: "Communication channels", icon: MessageSquare, count: 5 },
    { name: "CRM", icon: Users, count: 6 },
    { name: "E-commerce", icon: ShoppingCart, count: 6 },
    { name: "Marketing automation", icon: Megaphone, count: 6 },
    { name: "Rating & reviews", icon: Star, count: 1 },
    { name: "Customer support", icon: Headphones, count: 1 },
    { name: "Website Builder", icon: Globe, count: null as unknown as number },
];

export function IntegrationsSidebar({ selectedCategory, onSelectCategory }: IntegrationsSidebarProps) {
    const router = useRouter();

    const handleClick = (name: string) => {
        if (name === 'Website Builder') {
            router.push('/panel/integrations/website-builder');
        } else {
            onSelectCategory(name);
        }
    };

    return (
        <div className="w-64 flex-shrink-0 hidden md:block pr-8">
            <h3 className="text-zinc-500 text-xs uppercase font-bold mb-4 px-3">Categories</h3>
            <div className="space-y-1">
                {categories.map(({ name, icon: Icon, count }) => (
                    <button
                        key={name}
                        onClick={() => handleClick(name)}
                        className={cn(
                            "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                            selectedCategory === name
                                ? "bg-blue-500/10 text-blue-400"
                                : "text-zinc-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Icon size={14} className="flex-shrink-0" />
                        <span className="flex-1">{name}</span>
                        {count !== null && (
                            <span className={cn(
                                "text-xs tabular-nums",
                                selectedCategory === name ? "text-blue-400/70" : "text-zinc-600"
                            )}>
                                {count}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

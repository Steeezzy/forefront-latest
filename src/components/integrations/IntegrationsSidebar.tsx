import { BarChart, MessageSquare, Users, ShoppingCart, Megaphone, Star, Headphones, Layers, Globe } from 'lucide-react';

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
    const sidebarStyle: React.CSSProperties = {
        width: '200px',
        background: '#ffffff',
        borderRight: '1px solid #e4e4e7',
        padding: '16px 12px',
    };

    return (
        <div style={sidebarStyle} className="hidden md:block">
            <h3 style={{ fontSize: '10px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px', marginBottom: '12px' }}>Categories</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {categories.map(({ name, icon: Icon, count }) => {
                    const isActive = selectedCategory === name;
                    return (
                        <button
                            key={name}
                            onClick={() => onSelectCategory(name)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '7px 10px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                color: isActive ? '#09090b' : '#52525b',
                                background: isActive ? '#f4f4f5' : 'transparent',
                                fontWeight: isActive ? 500 : 400,
                                cursor: 'pointer',
                                border: 'none',
                                width: '100%',
                                transition: 'all 0.12s'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon size={14} strokeWidth={1.5} />
                                <span>{name}</span>
                            </div>
                            {count !== null && (
                                <span style={{ background: '#f4f4f5', color: '#71717a', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', fontWeight: 400 }}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

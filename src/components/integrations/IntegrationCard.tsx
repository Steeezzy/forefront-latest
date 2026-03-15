import { useState } from 'react';
import { LucideIcon, CheckCircle } from 'lucide-react';
import { getIntegrationMeta } from '@/lib/integration-metadata';

interface IntegrationCardProps {
    id?: string;
    name: string;
    description: string;
    icon?: LucideIcon;
    iconColor?: string;
    installed?: boolean;
    fallbackInitial?: string;
    onClick?: () => void;
}

export function IntegrationCard({ id, name, description, icon: Icon, iconColor, installed, fallbackInitial, onClick }: IntegrationCardProps) {
    const [hovered, setHovered] = useState(false);
    const meta = id ? getIntegrationMeta(id) : null;
    const tags = meta?.tags || [];

    const cardStyle: React.CSSProperties = {
        background: '#ffffff',
        border: '1px solid #e4e4e7',
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: hovered ? '0 4px 12px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
        borderColor: hovered ? '#d4d4d8' : '#e4e4e7',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative'
    };

    const iconWrapperStyle: React.CSSProperties = {
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: '#f4f4f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '12px',
    };

    return (
        <div
            style={cardStyle}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {installed && (
                <div style={{
                    background: '#f0fdf4',
                    color: '#16a34a',
                    border: '1px solid #bbf7d0',
                    borderRadius: '5px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 500,
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <CheckCircle size={10} /> Installed
                </div>
            )}

            <div style={iconWrapperStyle}>
                {Icon && <Icon size={20} className={iconColor} />}
            </div>

            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#09090b', marginBottom: '6px' }}>{name}</h3>
            <p style={{ fontSize: '12px', color: '#71717a', lineHeight: 1.5, marginBottom: '14px', flex: 1 }}>{description}</p>

            {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: 'auto' }}>
                    {tags.slice(0, 3).map((tag) => (
                        <span key={tag} style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 500,
                            background: '#f4f4f5',
                            color: '#52525b',
                            border: '1px solid #e4e4e7',
                            marginRight: '4px'
                        }}>
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

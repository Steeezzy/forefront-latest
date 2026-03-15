"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Globe, PenLine, FileSpreadsheet, Megaphone, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { WebsiteImportModal } from "./WebsiteImportModal";
import { CSVImportModal } from "./CSVImportModal";
import { ZendeskImportModal } from "./ZendeskImportModal";
import { ManualQnAModal } from "./ManualQnAModal";

interface AddKnowledgeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddKnowledgeModal({ isOpen, onClose }: AddKnowledgeModalProps) {
    const [activeModal, setActiveModal] = useState<string | null>(null);

    const handleOptionClick = (optionId: string) => {
        // Open the corresponding sub-modal
        setActiveModal(optionId);
        onClose(); // Close the picker modal
    };

    const options = [
        {
            id: 'website',
            title: 'Website URL',
            description: 'Provide the URL of your site to feed Conversa with knowledge from it.',
            icon: Globe,
            iconColor: 'text-blue-500',
            bgColor: 'bg-blue-500/10'
        },
        {
            id: 'manual',
            title: 'Add manually',
            description: 'Manually write your own specific Q&A.',
            icon: PenLine,
            iconColor: 'text-blue-500',
            bgColor: 'bg-blue-500/10'
        },
        {
            id: 'csv',
            title: 'Import from .CSV file',
            description: 'Add multiple Q&As from .CSV file at once.',
            icon: FileSpreadsheet,
            iconColor: 'text-blue-500',
            bgColor: 'bg-blue-500/10'
        },
        {
            id: 'zendesk',
            title: 'Import Zendesk articles',
            description: 'Import knowledge from your Zendesk Help Center articles.',
            icon: Megaphone,
            iconColor: 'text-blue-500',
            bgColor: 'bg-blue-500/10'
        }
    ];

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl bg-[#ffffff] border-zinc-800 text-gray-900 p-0 overflow-hidden">
                    <div className="p-6 pb-2">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-gray-900 mb-2">Add more knowledge</DialogTitle>
                            <DialogDescription className="text-zinc-400">
                                Choose how you want to provide Conversa with knowledge.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {options.map((option) => (
                                <Card
                                    key={option.id}
                                    onClick={() => handleOptionClick(option.id)}
                                    className="bg-zinc-800/30 border-zinc-800 hover:bg-zinc-800 hover:border-blue-500/50 cursor-pointer transition-all duration-200 group relative overflow-hidden"
                                >
                                    <div className="p-5 flex items-start gap-4 h-full">
                                        <div className={cn("p-2 rounded-lg flex-shrink-0 transition-colors", option.bgColor)}>
                                            <option.icon className={cn("w-5 h-5", option.iconColor)} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-400 transition-colors">
                                                {option.title}
                                            </h3>
                                            <p className="text-sm text-zinc-400 leading-relaxed">
                                                {option.description}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white/50 p-4 border-t border-zinc-800 flex items-center gap-2 text-xs text-zinc-500">
                        <Info className="w-3 h-3" />
                        <span>Difficulty finding the right option? With Plus plan, we can train Conversa for you using any source. <span className="text-zinc-300 font-medium cursor-pointer hover:underline">Contact us</span></span>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Sub-Modals */}
            <WebsiteImportModal
                isOpen={activeModal === 'website'}
                onClose={() => setActiveModal(null)}
            />
            <CSVImportModal
                isOpen={activeModal === 'csv'}
                onClose={() => setActiveModal(null)}
            />
            <ZendeskImportModal
                isOpen={activeModal === 'zendesk'}
                onClose={() => setActiveModal(null)}
            />
            <ManualQnAModal
                isOpen={activeModal === 'manual'}
                onClose={() => setActiveModal(null)}
            />
        </>
    );
}

import * as React from "react"
import { cn } from "@/lib/utils"
// Simplified Modal using standard HTML dialog or a fixed overlay for now.
// A full accessible modal usually requires a library like Dialog from Headless UI or Radix.
// I'll build a custom one for now using fixed positioning to avoid extra deps unless requested.

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title?: string
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-200">
            <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg border animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-4">
                    {title && <h2 className="text-lg font-semibold">{title}</h2>}
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        ✕
                    </button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    )
}

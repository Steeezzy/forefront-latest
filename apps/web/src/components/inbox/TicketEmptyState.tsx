"use client";

import { useState } from 'react';
import { Ticket, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TicketEmptyStateProps {
  onCreateTicket?: () => void;
}

export function TicketEmptyState({ onCreateTicket }: TicketEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mb-6 border border-gray-200">
        <Ticket size={32} className="text-blue-500" />
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-2">No tickets yet</h2>
      <p className="text-zinc-500 text-sm text-center max-w-sm mb-6">
        Tickets help you track and manage customer issues that need follow-up.
        Create your first ticket or convert a conversation.
      </p>

      <Button
        onClick={onCreateTicket}
        className="bg-blue-600 hover:bg-blue-500 text-gray-900 px-5 py-2.5 rounded-xl font-medium flex items-center gap-2"
      >
        <Plus size={16} />
        Create Ticket
      </Button>

      <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg">
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-2">
            <span className="text-lg">📬</span>
          </div>
          <p className="text-xs text-zinc-400 font-medium">Track Issues</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">Keep all customer issues organized</p>
        </div>
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
            <span className="text-lg">🔄</span>
          </div>
          <p className="text-xs text-zinc-400 font-medium">Convert Chats</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">Turn conversations into tickets</p>
        </div>
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
            <span className="text-lg">✅</span>
          </div>
          <p className="text-xs text-zinc-400 font-medium">Resolve</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">Track resolution and SLAs</p>
        </div>
      </div>
    </div>
  );
}

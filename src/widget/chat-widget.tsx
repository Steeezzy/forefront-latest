"use client";

import React, { useState } from 'react';

export function ChatWidget({ workspaceId }: { workspaceId: string }) {
    return (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded shadow-lg">
            ChatWidget Loaded for Workspace: {workspaceId}
        </div>
    );
}

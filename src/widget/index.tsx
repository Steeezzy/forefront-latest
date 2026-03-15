// src/widget/index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { ChatWidget } from "./chat-widget";
// import "./widget.css"; // Commented out until CSS build is ready

// 1. Find the Shadow Root we created in loader.js
const container = document.getElementById("questron-chat-container");

if (container && container.shadowRoot) {
    // 2. Mount React INSIDE the Shadow DOM
    const root = ReactDOM.createRoot(container.shadowRoot);

    // 3. Get Config
    // In a real app, you might fetch this from the script tag attributes
    const workspaceId = (window as any).QUESTRON_ID;

    root.render(
        <React.StrictMode>
            <ChatWidget workspaceId={workspaceId} />
        </React.StrictMode>
    );
}

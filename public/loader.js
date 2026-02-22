// public/loader.js
(function () {
    const SCRIPT_ID = "forefront-widget-script";

    // 1. Prevent duplicate loading
    if (document.getElementById(SCRIPT_ID)) return;

    // 2. Get the Workspace ID from the user's config
    const workspaceId = window.FOREFRONT_ID;
    if (!workspaceId) {
        console.error("Forefront: Missing window.FOREFRONT_ID");
        return;
    }

    console.log("🚀 Forefront Widget Loading for:", workspaceId);

    // 3. Create the Container (Shadow DOM Host)
    const container = document.createElement("div");
    container.id = "forefront-chat-container";
    // Fix it to bottom-right, high z-index
    Object.assign(container.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: "999999",
        width: "0", // Start hidden/small
        height: "0",
    });
    document.body.appendChild(container);

    // 4. Create Shadow DOM (Protects your CSS from their CSS)
    const shadow = container.attachShadow({ mode: "open" });

    // 5. Inject Your Widget Bundle (The React App)
    // In dev, this points to your local Next.js or Vite dev server
    // In prod, this points to your CDN (e.g., Vercel / S3)
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    // TODO: Point this to the actual built bundle URL. 
    // For now, we assume it's served from localhost:3000/widget-bundle.js
    script.src = "http://localhost:3000/widget-bundle.js";
    script.type = "module";

    // Pass the ID to the bundle
    script.setAttribute("data-workspace-id", workspaceId);

    shadow.appendChild(script);
})();

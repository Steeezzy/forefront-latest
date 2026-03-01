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

    // 3. Check if this domain is allowed to load the widget
    const API_BASE = window.FOREFRONT_API_BASE || "http://localhost:3001";
    const currentDomain = window.location.hostname;

    // Load analytics config in parallel with domain check
    var analyticsConfig = null;
    fetch(API_BASE + "/api/integrations/analytics/widget-config/" + encodeURIComponent(workspaceId))
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data && data.success) {
                analyticsConfig = data.configs || {};
                initAnalytics(analyticsConfig);
            }
        })
        .catch(function() { /* analytics optional */ });

    fetch(API_BASE + "/api/domains/widget/check?domain=" + encodeURIComponent(currentDomain) + "&workspaceId=" + encodeURIComponent(workspaceId))
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data && data.allowed === false) {
                console.warn("[Forefront] Widget not authorized for this domain:", currentDomain);
                return;
            }
            mountWidget();
        })
        .catch(function() {
            // If domain check fails (e.g. backend down), load widget anyway for resilience
            mountWidget();
        });

    function mountWidget() {
        // 4. Create the Container (Shadow DOM Host)
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

        // 5. Create Shadow DOM (Protects your CSS from their CSS)
        const shadow = container.attachShadow({ mode: "open" });

        // 6. Inject Your Widget Bundle (The React App)
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
    }

    // ─── Analytics: GA4 + GTM integration ──────────────────────

    function initAnalytics(configs) {
        // GA4: Load gtag.js if measurement ID is configured
        if (configs.ga4 && configs.ga4.measurementId) {
            var gtagScript = document.createElement("script");
            gtagScript.async = true;
            gtagScript.src = "https://www.googletagmanager.com/gtag/js?id=" + configs.ga4.measurementId;
            document.head.appendChild(gtagScript);

            window.dataLayer = window.dataLayer || [];
            window.gtag = function() { window.dataLayer.push(arguments); };
            window.gtag('js', new Date());
            window.gtag('config', configs.ga4.measurementId, { send_page_view: false });
        }

        // GTM: Init dataLayer + load container
        if (configs.gtm && configs.gtm.containerId) {
            window.dataLayer = window.dataLayer || [];
            (function(w,d,s,l,i){
                w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
                var f=d.getElementsByTagName(s)[0], j=d.createElement(s);
                j.async=true; j.src='https://www.googletagmanager.com/gtm.js?id='+i;
                f.parentNode.insertBefore(j,f);
            })(window, document, 'script', 'dataLayer', configs.gtm.containerId);
        }
    }

    /**
     * Track a Forefront widget event to GA4 and/or GTM
     * Called from the widget bundle via window.ForefrontAnalytics.track()
     *
     * Events: forefront_conversation_started, forefront_conversation_rated,
     *   forefront_conversation_reply, forefront_prechat_finished,
     *   forefront_prechat_started, forefront_widget_visitor_started_bot,
     *   forefront_widget_close, forefront_widget_open,
     *   forefront_widget_mute_notifications
     */
    window.ForefrontAnalytics = {
        track: function(eventName, params) {
            params = params || {};
            params.forefront_workspace_id = workspaceId;

            // GA4: send event via gtag
            if (window.gtag) {
                window.gtag('event', eventName, params);
            }

            // GTM: push to dataLayer
            if (window.dataLayer) {
                window.dataLayer.push({
                    event: eventName,
                    forefront: params
                });
            }

            // Server-side tracking (fire and forget)
            try {
                fetch(API_BASE + "/api/integrations/analytics/track", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        workspaceId: workspaceId,
                        eventName: eventName,
                        visitorId: params.visitor_id,
                        threadId: params.thread_id,
                        source: params.source || "widget",
                        parameters: params
                    })
                }).catch(function() {});
            } catch(e) {}
        }
    };
})();

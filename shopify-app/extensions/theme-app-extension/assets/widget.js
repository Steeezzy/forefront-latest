/**
 * Forefront Widget Loader — Automated Zero-Config Version
 * 
 * Fetches configuration via Shopify App Proxy and initializes the widget.
 */
(function () {
  'use strict';

  async function initForefront() {
    const shopDomain = Shopify.shop || window.location.hostname;

    try {
      console.log('[Forefront] Fetching automated configuration...');
      const response = await fetch('/apps/forefront/proxy?shop=' + encodeURIComponent(shopDomain));

      if (!response.ok) {
        throw new Error('Proxy returned status ' + response.status);
      }

      const config = await response.json();

      if (config.success && config.backend_url && config.chatbot_id) {
        window.__FOREFRONT_CONFIG__ = {
          chatbotId: config.chatbot_id,
          backendUrl: config.backend_url.replace(/\/$/, ''),
          shopDomain: shopDomain,
          source: 'shopify'
        };

        console.log('[Forefront] Widget auto-configured successfully.');

        // If there's a global initialization function provided by the bundle, call it
        if (typeof window.initForefrontWidget === 'function') {
          window.initForefrontWidget(window.__FOREFRONT_CONFIG__);
        }
      } else {
        console.warn('[Forefront] Automated setup returned invalid configuration:', config);
      }
    } catch (error) {
      console.error('[Forefront] Failed to initialize automated widget:', error);
    }
  }

  // Run on load
  if (document.readyState === 'complete') {
    initForefront();
  } else {
    window.addEventListener('load', initForefront);
  }
})();

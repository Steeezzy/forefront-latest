/**
 * Questron Widget Loader — Automated Zero-Config Version
 * 
 * Fetches configuration via Shopify App Proxy and initializes the widget.
 */
(function () {
  'use strict';

  async function initQuestron() {
    const shopDomain = Shopify.shop || window.location.hostname;

    try {
      console.log('[Questron] Fetching automated configuration...');
      const response = await fetch('/apps/questron/proxy?shop=' + encodeURIComponent(shopDomain));

      if (!response.ok) {
        throw new Error('Proxy returned status ' + response.status);
      }

      const config = await response.json();

      if (config.success && config.backend_url && config.chatbot_id) {
        window.__QUESTRON_CONFIG__ = {
          chatbotId: config.chatbot_id,
          backendUrl: config.backend_url.replace(/\/$/, ''),
          shopDomain: shopDomain,
          source: 'shopify'
        };

        console.log('[Questron] Widget auto-configured successfully.');

        // If there's a global initialization function provided by the bundle, call it
        if (typeof window.initQuestronWidget === 'function') {
          window.initQuestronWidget(window.__QUESTRON_CONFIG__);
        }
      } else {
        console.warn('[Questron] Automated setup returned invalid configuration:', config);
      }
    } catch (error) {
      console.error('[Questron] Failed to initialize automated widget:', error);
    }
  }

  // Run on load
  if (document.readyState === 'complete') {
    initQuestron();
  } else {
    window.addEventListener('load', initQuestron);
  }
})();

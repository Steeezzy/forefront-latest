/**
 * Generates the full storefront widget script for Script Tag injection.
 * Injected into Shopify storefront; config comes from query params (backendUrl, shopDomain).
 */
export function getShopifyWidgetScript(backendUrl, shopDomain) {
    const safeBackend = JSON.stringify(backendUrl);
    const safeShop = JSON.stringify(shopDomain);
    return `
(function() {
  if (document.getElementById('quoston-chat-widget')) return;
  var config = {
    chatbotId: '',
    backendUrl: ${safeBackend},
    shopDomain: ${safeShop},
    primaryColor: '#4F46E5',
    position: 'bottom-right',
    welcomeMessage: 'Hi! How can we help you today?',
    customer: { id: null, email: null }
  };

  var root = document.createElement('div');
  root.id = 'quoston-chat-widget';
  root.innerHTML = '<div id="quoston-chat-box" style="display:none;"><div id="quoston-chat-header"><div class="quoston-header-content"><div class="quoston-bot-avatar"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg></div><div><h3 class="quoston-title">' + config.welcomeMessage + '</h3><p class="quoston-subtitle">Automated Support</p></div></div><div class="quoston-header-actions"><button id="quoston-reset-btn" title="Reset">Reset</button><button id="quoston-close-btn" title="Close">Close</button></div></div><div id="quoston-chat-messages"><div id="quoston-empty-state"><div class="quoston-empty-avatar"></div><h4 class="quoston-empty-title">Contact Support</h4><p class="quoston-empty-subtitle">How can we help you today?</p></div></div><div id="quoston-typing-indicator" style="display:none;"><div class="quoston-typing-dots"><div></div><div></div><div></div></div></div><div id="quoston-chat-input-area"><div class="quoston-input-wrapper"><input type="text" id="quoston-input" placeholder="Type a message..." autocomplete="off"/><button id="quoston-send-btn" disabled>Send</button></div><p class="quoston-footer-text">Powered by Quoston AI</p></div></div><button id="quoston-toggle-btn"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="white" viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg></button>';
  root.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;font-family:system-ui,sans-serif;color:white;';
  var style = document.createElement('style');
  style.textContent = '#quoston-toggle-btn{background:' + config.primaryColor + ';border:none;border-radius:50%;width:60px;height:60px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;}#quoston-chat-box{width:380px;height:600px;max-height:calc(100vh - 100px);background:#18181b;border-radius:16px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);display:flex;flex-direction:column;margin-bottom:16px;overflow:hidden;}#quoston-chat-header{background:linear-gradient(to right,#18181b,#1e1e24);border-bottom:1px solid rgba(255,255,255,0.05);padding:16px 20px;display:flex;justify-content:space-between;align-items:center;}.quoston-header-content{display:flex;align-items:center;gap:12px;}.quoston-bot-avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(to bottom right,#3b82f6,#1d4ed8);display:flex;align-items:center;justify-content:center;}.quoston-title{margin:0;font-size:14px;font-weight:600;color:white;}.quoston-subtitle{margin:2px 0 0 0;font-size:11px;color:#64748b;}#quoston-chat-messages{flex:1;padding:20px 16px;overflow-y:auto;background:#111115;display:flex;flex-direction:column;gap:16px;}#quoston-empty-state{text-align:center;padding:24px;}.quoston-empty-title{margin:0 0 8px 0;color:white;font-size:14px;}.quoston-empty-subtitle{margin:0;color:#64748b;font-size:12px;}.quoston-msg-row{display:flex;width:100%;}.quoston-msg-start{justify-content:flex-start;}.quoston-msg-end{justify-content:flex-end;}.quoston-msg-group{display:flex;gap:10px;max-width:85%;}.quoston-row{flex-direction:row;}.quoston-row-reverse{flex-direction:row-reverse;}.quoston-msg-avatar{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;}.quoston-bg-gradient{background:linear-gradient(to bottom right,#3b82f6,#1d4ed8);color:white;}.quoston-bg-user{background:#334155;color:white;}.quoston-msg-bubble{padding:10px 14px;font-size:13px;line-height:1.5;border-radius:16px;word-wrap:break-word;}.quoston-msg-user{background:' + config.primaryColor + ';color:white;border-top-right-radius:2px;}.quoston-msg-bot{background:#1e1e24;color:#e2e8f0;border:1px solid rgba(255,255,255,0.05);border-top-left-radius:2px;}.quoston-typing-dots{display:flex;gap:6px;align-items:center;height:20px;}.quoston-typing-dots div{width:6px;height:6px;border-radius:50%;background:#60a5fa;animation:qb 1.4s infinite ease-in-out both;}.quoston-typing-dots div:nth-child(2){animation-delay:-0.16s;}@keyframes qb{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}#quoston-chat-input-area{background:#18181b;border-top:1px solid rgba(255,255,255,0.05);padding:12px 16px;}.quoston-input-wrapper{position:relative;}#quoston-input{width:100%;box-sizing:border-box;background:#27272a;color:white;border:1px solid transparent;border-radius:12px;padding:12px 48px 12px 16px;font-size:14px;}#quoston-send-btn{position:absolute;right:6px;top:50%;transform:translateY(-50%);background:' + config.primaryColor + ';color:white;border:none;padding:8px;border-radius:8px;cursor:pointer;}.quoston-sources{margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;}.quoston-source-badge{font-size:10px;color:#475569;background:rgba(255,255,255,0.03);padding:2px 8px;border-radius:12px;}';
  document.head.appendChild(style);
  document.body.appendChild(root);

  var toggleBtn = root.querySelector('#quoston-toggle-btn');
  var closeBtn = root.querySelector('#quoston-close-btn');
  var resetBtn = root.querySelector('#quoston-reset-btn');
  var chatBox = root.querySelector('#quoston-chat-box');
  var inputField = root.querySelector('#quoston-input');
  var sendBtn = root.querySelector('#quoston-send-btn');
  var msgContainer = root.querySelector('#quoston-chat-messages');
  var emptyState = root.querySelector('#quoston-empty-state');
  var typingIndicator = root.querySelector('#quoston-typing-indicator');
  var isTyping = false;
  var resolvedChatbotId = config.chatbotId || null;
  var hasTriedResolve = false;
  var lastResolveError = '';

  function initChatbot() {
    if (hasTriedResolve) return Promise.resolve();
    if (!config.backendUrl || !config.shopDomain) { hasTriedResolve = true; return Promise.resolve(); }
    hasTriedResolve = true;
    lastResolveError = '';
    var endpoint = config.backendUrl.replace(/\\/$/, '') + '/api/shopify/resolve-agent?shop=' + encodeURIComponent(config.shopDomain);
    return fetch(endpoint, { headers: { 'ngrok-skip-browser-warning': 'true' } })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success && data.agentId) resolvedChatbotId = data.agentId;
        else {
          var err = (data && data.error) ? String(data.error) : '';
          lastResolveError = (err.indexOf('not integrated') !== -1 || err.indexOf('inactive') !== -1) ? 'store_not_connected' : 'network';
        }
      })
      .catch(function() { lastResolveError = 'network'; });
  }
  initChatbot();

  toggleBtn.addEventListener('click', function() {
    chatBox.style.display = chatBox.style.display === 'none' ? 'flex' : 'none';
    if (chatBox.style.display === 'flex') inputField.focus();
  });
  closeBtn.addEventListener('click', function() { chatBox.style.display = 'none'; });
  resetBtn.addEventListener('click', function() {
    msgContainer.querySelectorAll('.quoston-msg-row').forEach(function(m) { m.remove(); });
    emptyState.style.display = 'flex';
    inputField.value = '';
    hasTriedResolve = false;
    lastResolveError = '';
  });
  inputField.addEventListener('input', function() { sendBtn.disabled = !inputField.value.trim() || isTyping; });
  inputField.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !isTyping && inputField.value.trim()) sendMessage();
  });
  sendBtn.addEventListener('click', function() {
    if (!isTyping && inputField.value.trim()) sendMessage();
  });

  function appendMessage(role, text, sources) {
    sources = sources || [];
    emptyState.style.display = 'none';
    var isUser = role === 'user';
    var row = document.createElement('div');
    row.className = 'quoston-msg-row ' + (isUser ? 'quoston-msg-end' : 'quoston-msg-start');
    var group = document.createElement('div');
    group.className = 'quoston-msg-group ' + (isUser ? 'quoston-row-reverse' : 'quoston-row');
    var avatar = document.createElement('div');
    avatar.className = 'quoston-msg-avatar ' + (isUser ? 'quoston-bg-user' : 'quoston-bg-gradient');
    var bubble = document.createElement('div');
    bubble.className = 'quoston-msg-bubble ' + (isUser ? 'quoston-msg-user' : 'quoston-msg-bot');
    bubble.textContent = text;
    group.appendChild(avatar);
    group.appendChild(bubble);
    if (sources.length) {
      var sd = document.createElement('div');
      sd.className = 'quoston-sources';
      sources.forEach(function(s) { var sp = document.createElement('span'); sp.className = 'quoston-source-badge'; sp.textContent = s; sd.appendChild(sp); });
      group.appendChild(sd);
    }
    row.appendChild(group);
    msgContainer.appendChild(row);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  function sendMessage() {
    var runSend = function() {
      if (!resolvedChatbotId) {
        var msg = 'No Chatbot configured. Please connect your store to Quoston.';
        if (lastResolveError === 'store_not_connected') msg = 'This store is not connected to Quoston. Connect it in your Quoston dashboard (Integrations → Shopify).';
        else if (lastResolveError === 'network') msg = 'Could not reach the backend. Check that your Quoston backend is running.';
        appendMessage('bot', msg);
        return;
      }
      var message = inputField.value.trim();
    inputField.value = '';
    inputField.disabled = true;
    isTyping = true;
    sendBtn.disabled = true;
    appendMessage('user', message);
    typingIndicator.style.display = 'block';
    msgContainer.appendChild(typingIndicator);
    msgContainer.scrollTop = msgContainer.scrollHeight;
    var endpoint = config.backendUrl.replace(/\\/$/, '') + '/api/knowledge/chat';
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({ agentId: resolvedChatbotId, question: message, shopDomain: config.shopDomain, customerId: config.customer.id || null })
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        typingIndicator.style.display = 'none';
        if (data.answer) appendMessage('bot', data.answer, data.sources || []);
        else appendMessage('bot', data.reply || "Sorry, I couldn't process that request.");
      })
      .catch(function() {
        typingIndicator.style.display = 'none';
        appendMessage('bot', 'Sorry, something went wrong connecting to the server.');
      })
      .finally(function() {
        isTyping = false;
        inputField.disabled = false;
        inputField.focus();
        sendBtn.disabled = !inputField.value.trim();
      });
    };
    if (!resolvedChatbotId) { initChatbot().then(runSend); return; }
    runSend();
  }
})();
`;
}
//# sourceMappingURL=shopify-widget-script.js.map
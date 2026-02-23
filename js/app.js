/**
 * ═══════════════════════════════════════════════════════════
 *  Beesto AI — v2.2  |  app.js
 *
 *  CHANGES FROM v2.1:
 *  • Zhipu AI (GLM-4 family) built-in — works out of the box,
 *    no API key required from the user.
 *  • Gemini token-limit fix: smarter max_tokens per model +
 *    automatic context trimming to stay within limits.
 *  • All providers: context trimming to avoid overflows.
 *  • Cleaner per-model max_tokens mapping.
 * ═══════════════════════════════════════════════════════════
 */

/* ── INTERNAL DEFAULTS (never exposed in UI) ──────────────── */
const _DEFAULTS = {
  zhipu: '53aac4a7b4e04ce887266b52ee902ca6',
};

function app() {
  return {

    /* ── UI STATE ───────────────────────────────────────── */
    theme: 'dark',
    isDark: true,
    sidebarOpen: window.innerWidth >= 768,
    showSettings: false,
    dragOver: false,
    searchQuery: '',
    toast: '',
    _toastTimer: null,

    /* ── CHAT STATE ─────────────────────────────────────── */
    chats: [],
    currentChatId: null,
    currentChat: null,
    userMessage: '',
    attachments: [],
    isGenerating: false,
    streamingContent: '',
    abortController: null,

    /* ── SETTINGS ───────────────────────────────────────── */
    systemPrompt: 'You are Beesto AI, a highly capable, friendly, and articulate AI assistant. Provide clear, accurate, and well-formatted responses. Use markdown for code blocks, tables, and lists when it adds clarity.',

    apiKeys: { openrouter: '', openai: '', gemini: '', groq: '', xai: '' },

    apiKeyProviders: [
      { id: 'openrouter', name: 'OpenRouter',   placeholder: 'sk-or-v1-…', hint: 'Best option — one key unlocks 100+ models (Claude, GPT-4o, Gemini, LLaMA…)', link: 'https://openrouter.ai/keys',           visible: false },
      { id: 'openai',     name: 'OpenAI',        placeholder: 'sk-…',        hint: 'GPT-4o, GPT-4o Mini, o4-mini',                                               link: 'https://platform.openai.com/api-keys', visible: false },
      { id: 'gemini',     name: 'Google Gemini', placeholder: 'AIzaSy…',     hint: 'Gemini 2.5 Pro, 2.5 Flash, 2.0 Flash — free tier available',                 link: 'https://aistudio.google.com/apikey',   visible: false },
      { id: 'groq',       name: 'Groq',          placeholder: 'gsk_…',       hint: 'Ultra-fast free inference — LLaMA 3.3, Mixtral, Gemma',                      link: 'https://console.groq.com/keys',        visible: false },
      { id: 'xai',        name: 'xAI (Grok)',    placeholder: 'xai-…',       hint: 'Grok 3, Grok 3 Mini, Grok 2 Vision',                                         link: 'https://console.x.ai',                 visible: false },
    ],

    /* ── MODELS ─────────────────────────────────────────── */
    selectedModel: { id: 'glm-4-flash', name: 'GLM-4 Flash ⚡', provider: 'zhipu', vision: false, fast: true },

    modelProviders: [
      {
        name: '✨ Zhipu AI — Built-in (No Key Needed)',
        models: [
          { id: 'glm-4-flash',  name: 'GLM-4 Flash ⚡',  provider: 'zhipu', vision: false, fast: true  },
          { id: 'glm-4',        name: 'GLM-4',            provider: 'zhipu', vision: false, fast: false },
          { id: 'glm-4-plus',   name: 'GLM-4 Plus',       provider: 'zhipu', vision: false, fast: false },
          { id: 'glm-4v',       name: 'GLM-4V Vision',    provider: 'zhipu', vision: true,  fast: false },
          { id: 'glm-4v-flash', name: 'GLM-4V Flash ⚡',  provider: 'zhipu', vision: true,  fast: true  },
          { id: 'glm-z1-flash', name: 'GLM-Z1 Flash',     provider: 'zhipu', vision: false, fast: true  },
        ]
      },
      {
        name: 'Groq — Free & Ultra-Fast',
        models: [
          { id: 'llama-3.3-70b-versatile',      name: 'LLaMA 3.3 70B',        provider: 'groq', vision: false, fast: true },
          { id: 'llama-3.1-8b-instant',         name: 'LLaMA 3.1 8B Instant', provider: 'groq', vision: false, fast: true },
          { id: 'mixtral-8x7b-32768',           name: 'Mixtral 8x7B',         provider: 'groq', vision: false, fast: true },
          { id: 'gemma2-9b-it',                 name: 'Gemma 2 9B',           provider: 'groq', vision: false, fast: true },
          { id: 'llama-3.2-11b-vision-preview', name: 'LLaMA 3.2 11B Vision', provider: 'groq', vision: true,  fast: true },
          { id: 'llama-3.2-90b-vision-preview', name: 'LLaMA 3.2 90B Vision', provider: 'groq', vision: true,  fast: true },
        ]
      },
      {
        name: 'Google Gemini',
        models: [
          { id: 'gemini-2.0-flash',               name: 'Gemini 2.0 Flash', provider: 'gemini', vision: true, fast: true  },
          { id: 'gemini-1.5-flash',               name: 'Gemini 1.5 Flash', provider: 'gemini', vision: true, fast: true  },
          { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash', provider: 'gemini', vision: true, fast: true  },
          { id: 'gemini-1.5-pro',                 name: 'Gemini 1.5 Pro',   provider: 'gemini', vision: true, fast: false },
          { id: 'gemini-2.5-pro-preview-05-06',   name: 'Gemini 2.5 Pro',   provider: 'gemini', vision: true, fast: false },
        ]
      },
      {
        name: 'OpenRouter — 100+ Models',
        models: [
          { id: 'openrouter/auto',                 name: 'Auto — Best Available', provider: 'openrouter', vision: true,  fast: false },
          { id: 'anthropic/claude-sonnet-4-5',     name: 'Claude Sonnet 4.5',     provider: 'openrouter', vision: true,  fast: false },
          { id: 'anthropic/claude-3-5-haiku',      name: 'Claude 3.5 Haiku',      provider: 'openrouter', vision: true,  fast: true  },
          { id: 'openai/gpt-4o',                   name: 'GPT-4o',                provider: 'openrouter', vision: true,  fast: false },
          { id: 'openai/gpt-4o-mini',              name: 'GPT-4o Mini',           provider: 'openrouter', vision: true,  fast: true  },
          { id: 'google/gemini-2.5-pro-preview',   name: 'Gemini 2.5 Pro',        provider: 'openrouter', vision: true,  fast: false },
          { id: 'google/gemini-2.5-flash-preview', name: 'Gemini 2.5 Flash',      provider: 'openrouter', vision: true,  fast: true  },
          { id: 'deepseek/deepseek-r1',            name: 'DeepSeek R1',           provider: 'openrouter', vision: false, fast: false },
          { id: 'meta-llama/llama-4-maverick',     name: 'LLaMA 4 Maverick',      provider: 'openrouter', vision: false, fast: false },
          { id: 'mistralai/mistral-large',         name: 'Mistral Large',         provider: 'openrouter', vision: false, fast: false },
        ]
      },
      {
        name: 'OpenAI',
        models: [
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', vision: true,  fast: true  },
          { id: 'gpt-4o',      name: 'GPT-4o',      provider: 'openai', vision: true,  fast: false },
          { id: 'gpt-4.1',     name: 'GPT-4.1',     provider: 'openai', vision: true,  fast: false },
          { id: 'o4-mini',     name: 'o4-mini',     provider: 'openai', vision: false, fast: true  },
        ]
      },
      {
        name: 'xAI — Grok',
        models: [
          { id: 'grok-3-mini',        name: 'Grok 3 Mini',   provider: 'xai', vision: false, fast: true  },
          { id: 'grok-3',             name: 'Grok 3',        provider: 'xai', vision: false, fast: false },
          { id: 'grok-2-vision-1212', name: 'Grok 2 Vision', provider: 'xai', vision: true,  fast: false },
        ]
      },
    ],

    /* ── SUGGESTIONS ────────────────────────────────────── */
    suggestions: [
      { icon: '💡', title: 'Explain a concept',  subtitle: 'Break down complex topics simply',      text: 'Explain how large language models work in simple terms' },
      { icon: '🧑‍💻', title: 'Write code',         subtitle: 'Any language, any task',                text: 'Write a Python function that fetches data from a REST API with error handling' },
      { icon: '✍️',  title: 'Draft content',       subtitle: 'Emails, essays, summaries',             text: 'Help me write a professional email declining a meeting politely' },
      { icon: '🔍', title: 'Analyse & review',    subtitle: 'Debug code, review writing, find bugs', text: 'Review my code and suggest improvements for readability and performance' },
    ],

    /* ── COMPUTED ───────────────────────────────────────── */
    get filteredChats() {
      const sorted = [...this.chats].sort((a, b) => b.updatedAt - a.updatedAt);
      if (!this.searchQuery.trim()) return sorted;
      const q = this.searchQuery.toLowerCase();
      return sorted.filter(c => c.title.toLowerCase().includes(q));
    },

    get activeProviders() {
      const fromKeys = Object.entries(this.apiKeys)
        .filter(([, v]) => v && v.trim().length > 8)
        .map(([k]) => k);
      if (!fromKeys.includes('zhipu')) fromKeys.unshift('zhipu');
      return fromKeys;
    },

    /* ── INIT ───────────────────────────────────────────── */
    init() {
      this.loadSettings();
      this.loadChatsFromStorage();
      this.autoSelectModel();

      window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change', () => {
        if (this.theme === 'system') this.applyTheme();
      });
      window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) this.sidebarOpen = true;
      });
    },

    autoSelectModel() {
      if (this.selectedModel.provider === 'zhipu') return;
      const currentKey = (this.apiKeys[this.selectedModel.provider] || '').trim();
      if (currentKey.length > 8) return;

      const zhipuGroup = this.modelProviders.find(p => p.models.some(m => m.provider === 'zhipu'));
      if (zhipuGroup) { this.selectedModel = zhipuGroup.models[0]; return; }

      const priority = ['openrouter', 'openai', 'gemini', 'groq', 'xai'];
      for (const pid of priority) {
        if ((this.apiKeys[pid] || '').trim().length <= 8) continue;
        const group = this.modelProviders.find(p => p.models.some(m => m.provider === pid));
        if (group) { this.selectedModel = group.models[0]; return; }
      }
    },

    /* ── THEME ──────────────────────────────────────────── */
    applyTheme() {
      if (this.theme === 'dark')       this.isDark = true;
      else if (this.theme === 'light') this.isDark = false;
      else this.isDark = window.matchMedia('(prefers-color-scheme:dark)').matches;
    },

    toggleTheme() {
      this.theme = this.isDark ? 'light' : 'dark';
      this.applyTheme();
      this.saveSettings();
    },

    /* ── SETTINGS ───────────────────────────────────────── */
    loadSettings() {
      try {
        const s = JSON.parse(localStorage.getItem('beesto-settings') || '{}');
        if (s.theme)        { this.theme = s.theme; this.applyTheme(); }
        if (s.apiKeys)      this.apiKeys = { ...this.apiKeys, ...s.apiKeys };
        if (s.systemPrompt) this.systemPrompt = s.systemPrompt;
        if (s.selectedModel) {
          const found = this.modelProviders.flatMap(p => p.models).find(m => m.id === s.selectedModel.id);
          if (found) this.selectedModel = found;
        }
      } catch (e) { /* use defaults */ }
    },

    saveSettings() {
      try {
        const keysToSave = { ...this.apiKeys };
        delete keysToSave.zhipu; // never persist built-in key
        localStorage.setItem('beesto-settings', JSON.stringify({
          theme: this.theme,
          apiKeys: keysToSave,
          systemPrompt: this.systemPrompt,
          selectedModel: { id: this.selectedModel.id }
        }));
        this.autoSelectModel();
      } catch (e) { console.warn('Settings save failed:', e); }
    },

    /* ── CHAT MANAGEMENT ────────────────────────────────── */
    loadChatsFromStorage() {
      try {
        this.chats = JSON.parse(localStorage.getItem('beesto-chats') || '[]');
        if (this.chats.length > 0) {
          const latest = [...this.chats].sort((a, b) => b.updatedAt - a.updatedAt)[0];
          this.currentChatId = latest.id;
          this.currentChat = this.chats.find(c => c.id === latest.id) || null;
        }
      } catch (e) { this.chats = []; }
    },

    saveChats() {
      try { localStorage.setItem('beesto-chats', JSON.stringify(this.chats)); }
      catch (e) { console.warn('Chat save failed:', e); }
    },

    newChat() {
      const chat = { id: 'c_' + Date.now(), title: 'New conversation', messages: [], createdAt: Date.now(), updatedAt: Date.now() };
      this.chats.unshift(chat);
      this.currentChatId = chat.id;
      this.currentChat = chat;
      this.attachments = [];
      this.userMessage = '';
      this.saveChats();
      if (window.innerWidth < 768) this.sidebarOpen = false;
    },

    loadChat(id) {
      this.currentChatId = id;
      this.currentChat = this.chats.find(c => c.id === id) || null;
      if (window.innerWidth < 768) this.sidebarOpen = false;
      this.$nextTick(() => this.scrollToBottom());
    },

    deleteChat(id) {
      if (!confirm('Delete this conversation?')) return;
      this.chats = this.chats.filter(c => c.id !== id);
      if (this.currentChatId === id) {
        const next = this.filteredChats[0] || null;
        this.currentChatId = next ? next.id : null;
        this.currentChat = next;
      }
      this.saveChats();
    },

    clearAllChats() {
      if (!confirm('Delete ALL conversations? This cannot be undone.')) return;
      this.chats = []; this.currentChatId = null; this.currentChat = null;
      this.saveChats(); this.showSettings = false;
    },

    /* ── FILES ──────────────────────────────────────────── */
    handleFileSelect(e) {
      Array.from(e.target.files).forEach(f => this.processFile(f));
      e.target.value = '';
    },

    handleDrop(e) {
      this.dragOver = false;
      Array.from(e.dataTransfer.files).forEach(f => this.processFile(f));
    },

    processFile(file) {
      if (file.size > 20 * 1024 * 1024) { this.showToast(`"${file.name}" exceeds 20 MB`); return; }
      const reader = new FileReader();
      if (file.type.startsWith('image/')) {
        reader.onload = e => this.attachments.push({ name: file.name, type: file.type, dataUrl: e.target.result, base64: e.target.result.split(',')[1] });
        reader.readAsDataURL(file);
      } else {
        reader.onload = e => this.attachments.push({ name: file.name, type: file.type || 'text/plain', dataUrl: null, textContent: e.target.result });
        reader.readAsText(file);
      }
    },

    /* ── SEND ───────────────────────────────────────────── */
    async sendMessage(prefill) {
      const text = (prefill || this.userMessage || '').trim();
      if (!text && this.attachments.length === 0) return;
      if (this.isGenerating) return;

      if (!this.currentChat) this.newChat();

      this.currentChat.messages.push({ role: 'user', content: text, attachments: [...this.attachments], timestamp: Date.now() });

      if (this.currentChat.messages.filter(m => m.role === 'user').length === 1 && text) {
        this.currentChat.title = text.length > 55 ? text.slice(0, 55) + '…' : text;
      }

      this.userMessage = '';
      this.attachments = [];
      this.currentChat.updatedAt = Date.now();
      this.saveChats();
      this.$nextTick(() => {
        this.scrollToBottom();
        if (this.$refs.msgInput) this.$refs.msgInput.style.height = 'auto';
      });

      await this.callAPI();
    },

    /* ── CALL API ───────────────────────────────────────── */
    async callAPI() {
      const provider = this.selectedModel.provider;
      const key = provider === 'zhipu'
        ? _DEFAULTS.zhipu
        : (this.apiKeys[provider] || '').trim();

      if (!key) {
        const links = {
          openrouter: '[openrouter.ai/keys](https://openrouter.ai/keys)',
          openai:     '[platform.openai.com/api-keys](https://platform.openai.com/api-keys)',
          gemini:     '[aistudio.google.com/apikey](https://aistudio.google.com/apikey)',
          groq:       '[console.groq.com/keys](https://console.groq.com/keys)',
          xai:        '[console.x.ai](https://console.x.ai)',
        };
        let suggestion = '';
        const have = this.activeProviders.filter(p => p !== provider);
        if (have.length > 0) {
          const altGroup = this.modelProviders.find(p => p.models.some(m => m.provider === have[0]));
          if (altGroup) suggestion = `\n\n---\n**💡 Quick fix:** Switch to a **${altGroup.name.split(' — ')[0]}** model using the model picker in the top bar.`;
        }
        this.pushMsg(
          `### 🔑 API Key Required\n\nThe model **${this.selectedModel.name}** needs a **${provider.toUpperCase()}** key.\n\n` +
          `**How to fix:**\n1. Open ⚙️ **Settings** (bottom of sidebar)\n2. Paste your **${provider.toUpperCase()}** key\n3. Click outside to save, then try again\n\n` +
          `📎 Get a free key: ${links[provider] || ''}` + suggestion
        );
        return;
      }

      this.isGenerating = true;
      this.streamingContent = '';
      this.abortController = new AbortController();

      try {
        const messages = this.buildMessages();
        const { url, headers, body } = this.buildRequest(provider, key, messages);

        const resp = await fetch(url, {
          method: 'POST', headers,
          body: JSON.stringify(body),
          signal: this.abortController.signal
        });

        if (!resp.ok) {
          let errMsg = `HTTP ${resp.status}`;
          try {
            const raw = await resp.text();
            const parsed = JSON.parse(raw);
            errMsg = parsed?.error?.message || parsed?.message || raw.slice(0, 400) || errMsg;
          } catch (_) {}
          if (resp.status === 401) errMsg = `Invalid or expired API key for **${provider.toUpperCase()}**. Double-check it in Settings.`;
          else if (resp.status === 429) errMsg = `Rate limit reached on **${provider.toUpperCase()}**. Wait a moment and try again.`;
          else if (resp.status === 402) errMsg = `Insufficient credits on **${provider.toUpperCase()}**. Top up your account.`;
          else if (resp.status === 404) errMsg = `Model **${this.selectedModel.id}** not found. Try a different model.`;
          else if (resp.status === 400) errMsg = `Bad request: ${errMsg}\n\nIf this is a token limit error, try starting a **New conversation**.`;
          throw new Error(errMsg);
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streamDone = false;

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') { streamDone = true; break; }
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content;
              if (typeof delta === 'string') { this.streamingContent += delta; this.scrollToBottom(); }
            } catch (_) {}
          }
        }

        const final = this.streamingContent.trim();
        if (final) {
          this.currentChat.messages.push({ role: 'assistant', content: final, model: this.selectedModel.name, timestamp: Date.now() });
        } else {
          this.pushMsg('*(The model returned an empty response. Try rephrasing your message or switching models.)*');
        }

      } catch (err) {
        if (err.name !== 'AbortError') {
          this.pushMsg(
            `### ❌ Request Failed\n\n${err.message}\n\n` +
            `**Things to try:**\n` +
            `- Verify your API key is correct in ⚙️ Settings\n` +
            `- Make sure the key belongs to **${this.selectedModel.provider.toUpperCase()}**\n` +
            `- Check your internet connection\n` +
            `- Start a **New conversation** if the chat is very long\n` +
            `- Try a different model`
          );
        }
      } finally {
        this.isGenerating = false;
        this.streamingContent = '';
        this.abortController = null;
        if (this.currentChat) this.currentChat.updatedAt = Date.now();
        this.saveChats();
        this.scrollToBottom();
      }
    },

    /* ── MAX TOKENS per model/provider ──────────────────── */
    getMaxTokens() {
      const id = this.selectedModel.id;
      if (id.includes('gemini-2.5-pro'))   return 16384;
      if (id.includes('gemini-2.5-flash')) return 16384;
      if (id.includes('gemini-1.5-pro'))   return 8192;
      if (id.includes('gemini'))           return 8192;
      if (this.selectedModel.provider === 'groq')  return 32768;
      if (this.selectedModel.provider === 'zhipu') return 4096;
      return 4096;
    },

    /* ── CONTEXT TRIMMING ───────────────────────────────── */
    trimMessages(msgs) {
      const provider = this.selectedModel.provider;
      const id = this.selectedModel.id;

      let charLimit;
      if (id.includes('gemini-2.5-pro'))   charLimit = 400000;
      else if (id.includes('gemini-2.5'))  charLimit = 320000;
      else if (id.includes('gemini-1.5'))  charLimit = 600000;
      else if (id.includes('gemini'))      charLimit = 400000;
      else if (provider === 'groq')        charLimit = 480000;
      else if (provider === 'zhipu')       charLimit = 200000;
      else                                 charLimit = 200000;

      const system = msgs.filter(m => m.role === 'system');
      const convo  = msgs.filter(m => m.role !== 'system');

      const charCount = (m) => {
        if (typeof m.content === 'string') return m.content.length;
        if (Array.isArray(m.content)) return m.content.map(p => (p.text || '').length).reduce((a, b) => a + b, 0);
        return 0;
      };

      const sysChars = system.reduce((s, m) => s + charCount(m), 0);
      let remaining = charLimit - sysChars;
      let kept = [];

      for (let i = convo.length - 1; i >= 0; i--) {
        const c = charCount(convo[i]);
        if (remaining - c < 0 && kept.length > 0) break;
        kept.unshift(convo[i]);
        remaining -= c;
      }

      return [...system, ...kept];
    },

    /* ── BUILD REQUEST per provider ─────────────────────── */
    buildRequest(provider, key, messages) {
      const CT   = { 'Content-Type': 'application/json' };
      const AUTH = { 'Authorization': 'Bearer ' + key };
      const trimmed = this.trimMessages(messages);
      const maxTok  = this.getMaxTokens();

      switch (provider) {
        case 'zhipu':
          return {
            url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
            headers: { ...CT, ...AUTH },
            body: { model: this.selectedModel.id, messages: trimmed, stream: true, max_tokens: maxTok, temperature: 0.7 }
          };
        case 'groq':
          return {
            url: 'https://api.groq.com/openai/v1/chat/completions',
            headers: { ...CT, ...AUTH },
            body: { model: this.selectedModel.id, messages: trimmed, stream: true, max_tokens: maxTok, temperature: 0.7 }
          };
        case 'openai':
          return {
            url: 'https://api.openai.com/v1/chat/completions',
            headers: { ...CT, ...AUTH },
            body: { model: this.selectedModel.id, messages: trimmed, stream: true, max_tokens: maxTok }
          };
        case 'gemini':
          return {
            url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
            headers: { ...CT, ...AUTH },
            body: { model: this.selectedModel.id, messages: trimmed, stream: true, max_tokens: maxTok }
          };
        case 'xai':
          return {
            url: 'https://api.x.ai/v1/chat/completions',
            headers: { ...CT, ...AUTH },
            body: { model: this.selectedModel.id, messages: trimmed, stream: true, max_tokens: maxTok }
          };
        case 'openrouter':
        default: {
          const modelId = this.selectedModel.id.replace(/^openrouter\//, '');
          return {
            url: 'https://openrouter.ai/api/v1/chat/completions',
            headers: { ...CT, ...AUTH, 'HTTP-Referer': window.location.href, 'X-Title': 'Beesto AI' },
            body: { model: modelId, messages: trimmed, stream: true, max_tokens: maxTok }
          };
        }
      }
    },

    /* ── BUILD MESSAGES ─────────────────────────────────── */
    buildMessages() {
      const msgs = [];
      if (this.systemPrompt) msgs.push({ role: 'system', content: this.systemPrompt });

      for (const msg of this.currentChat.messages) {
        if (msg.role === 'assistant') {
          msgs.push({ role: 'assistant', content: msg.content || '' });
          continue;
        }
        const images = (msg.attachments || []).filter(a => a.type?.startsWith('image/') && a.base64);
        const texts  = (msg.attachments || []).filter(a => a.textContent);

        if (images.length > 0 && this.selectedModel.vision) {
          const parts = [];
          if (msg.content) parts.push({ type: 'text', text: msg.content });
          images.forEach(a => parts.push({ type: 'image_url', image_url: { url: a.dataUrl, detail: 'auto' } }));
          texts.forEach(a => parts.push({ type: 'text', text: `\n\n[File: ${a.name}]\n\`\`\`\n${a.textContent}\n\`\`\`` }));
          msgs.push({ role: 'user', content: parts });
        } else {
          let text = msg.content || '';
          texts.forEach(a => { text += `\n\n[File: ${a.name}]\n\`\`\`\n${a.textContent}\n\`\`\``; });
          images.forEach(a => {
            if (!this.selectedModel.vision) text += `\n\n[Image: ${a.name} — switch to a Vision model to analyse images]`;
          });
          msgs.push({ role: 'user', content: text });
        }
      }
      return msgs;
    },

    pushMsg(content) {
      if (!this.currentChat) this.newChat();
      this.currentChat.messages.push({ role: 'assistant', content, timestamp: Date.now() });
      this.saveChats();
      this.$nextTick(() => this.scrollToBottom());
    },

    /* ── CONTROLS ───────────────────────────────────────── */
    stopGeneration() { if (this.abortController) this.abortController.abort(); },

    async regenerate() {
      if (!this.currentChat || this.isGenerating) return;
      const msgs = this.currentChat.messages;
      if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
        msgs.pop(); this.saveChats(); await this.callAPI();
      }
    },

    /* ── MARKDOWN ───────────────────────────────────────── */
    renderMarkdown(text) {
      if (!text) return '';
      try {
        const renderer = new marked.Renderer();
        renderer.code = function(code, lang) {
          const language = lang || '';
          let highlighted = '';
          try {
            highlighted = (language && hljs.getLanguage(language))
              ? hljs.highlight(code, { language }).value
              : hljs.highlightAuto(code).value;
          } catch (_) {
            highlighted = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          }
          return (
            `<div class="code-wrapper"><pre>` +
            `<div class="code-block-header">` +
            `<span class="code-block-lang">${language || 'text'}</span>` +
            `<button class="copy-code-btn" data-code="${encodeURIComponent(code)}" ` +
            `onclick="(function(b){navigator.clipboard.writeText(decodeURIComponent(b.dataset.code))` +
            `.then(()=>{b.textContent='✓ Copied';b.classList.add('copied');` +
            `setTimeout(()=>{b.textContent='Copy';b.classList.remove('copied')},2000)})})(this)">Copy</button>` +
            `</div>` +
            `<code class="hljs${language ? ' language-' + language : ''}">${highlighted}</code>` +
            `</pre></div>`
          );
        };
        marked.setOptions({ renderer, breaks: true, gfm: true });
        let html = marked.parse(text);
        html = DOMPurify.sanitize(html, { ADD_ATTR: ['onclick', 'data-code', 'class'], FORCE_BODY: false });
        return html;
      } catch (e) {
        return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
      }
    },

    /* ── UTILITIES ──────────────────────────────────────── */
    copyMessage(text, btn) {
      navigator.clipboard.writeText(text)
        .then(() => {
          this.showToast('Copied to clipboard');
          if (btn) { const o = btn.innerHTML; btn.innerHTML = '✓ Copied'; setTimeout(() => { btn.innerHTML = o; }, 2000); }
        })
        .catch(() => this.showToast('Copy failed'));
    },

    showToast(msg) {
      this.toast = msg;
      if (this._toastTimer) clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => { this.toast = ''; }, 2800);
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const el = document.getElementById('chat-messages');
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      });
    },

    autoResize(el) {
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 180) + 'px';
    },

    exportAllChats() {
      if (!this.chats.length) { this.showToast('No chats to export'); return; }
      const blob = new Blob([JSON.stringify(this.chats, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), { href: url, download: `beesto-ai-${new Date().toISOString().slice(0,10)}.json` });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showToast('Chats exported!');
    }
  };
}

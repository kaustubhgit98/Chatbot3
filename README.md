# 🐝 Beesto AI

A premium, self-hosted AI chatbot with a Claude/GPT-level interface. No server required — just open `index.html` in your browser.

## 🚀 Quick Start

1. Download and extract the ZIP
2. Open `index.html` in any modern browser
3. Click **⚙️ Settings** in the sidebar
4. Add your API key (OpenRouter recommended — one key for 100+ models)
5. Start chatting!

> **Tip:** Get a free [OpenRouter](https://openrouter.ai/keys) key to access Claude, GPT-4o, Gemini, DeepSeek and more with a single key.

---

## 🤖 Supported Providers

| Provider | Models | Get Key |
|---|---|---|
| **OpenRouter** | 100+ models (Claude, GPT, Gemini, LLaMA, DeepSeek…) | [openrouter.ai/keys](https://openrouter.ai/keys) |
| **OpenAI** | GPT-4o, GPT-4o Mini, GPT-4.1, o4-mini | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **Google Gemini** | Gemini 2.5 Pro/Flash, 2.0 Flash, 1.5 Pro/Flash | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| **Groq** | LLaMA 3.3, Mixtral, Gemma (ultra-fast) | [console.groq.com/keys](https://console.groq.com/keys) |
| **xAI** | Grok 3, Grok 3 Mini, Grok 2 Vision | [console.x.ai](https://console.x.ai/) |

---

## ✨ Features

- 🤖 **25+ AI models** across 5 providers
- 📎 **File attachments** — images, code, PDFs, CSV, text
- 👁️ **Vision support** — image analysis with compatible models
- 💬 **Full chat history** — create, search, delete conversations
- ⚡ **Real-time streaming** with stop & regenerate
- 🎨 **Dark / Light / System** theme
- 📝 **Full markdown** — tables, code with syntax highlighting, math
- 🔐 **100% private** — all data stored in your browser only
- 📥 **Export** conversations as JSON
- 📱 **Responsive** — works on mobile, tablet, desktop
- 🔔 **Toast notifications** — helpful feedback on all actions

---

## 📁 Project Structure

```
beesto-ai/
├── index.html       ← Open this in your browser
├── css/
│   └── styles.css   ← All custom styles
├── js/
│   └── app.js       ← Full application logic
└── README.md
```

---

## 🛠 Tech Stack

| Library | Purpose |
|---|---|
| [Tailwind CSS](https://tailwindcss.com) | Utility-first styling |
| [Alpine.js 3](https://alpinejs.dev) | Reactive UI |
| [Marked.js 9](https://marked.js.org) | Markdown rendering |
| [Highlight.js 11](https://highlightjs.org) | Code syntax highlighting |
| [DOMPurify](https://github.com/cure53/DOMPurify) | XSS prevention |
| [Sora](https://fonts.google.com/specimen/Sora) + [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) | Typography |

---

## 🔐 Privacy

All API keys and chat history are stored **only in your browser's localStorage**. No data is ever sent to any server other than your chosen AI provider's API directly.

---

## 📜 License

MIT — free to use, modify, and distribute.

*Built by [kaustubhgit98](https://github.com/kaustubhgit98)*

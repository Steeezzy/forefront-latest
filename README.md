# 🤖 Questron — AI-Powered Business Automation Platform

An intelligent AI-powered business assistant that handles customer calls, manages bookings, and automates marketing — all in one place.

## ✨ Features

- 🏗️ **One-click Industry Workspace Builder** — Automated setup for 12 industries (Dental, Salon, HVAC, etc.)
- 📞 **AI Voice Agent** — Powered by Sarvam AI with support for 22 Indian languages
- 📅 **Smart Booking & Medical Reminders** — Specialized dose logging and compliance tracking
- 💬 **AI Chatbot** — Intelligent customer support with Shopify widget integration
- 📊 **Dynamic Dashboard** — Real-time revenue, profit, and ROI tracking
- 📱 **Outbound Campaigns** — Automated SMS and Call follow-ups and win-back sequences
- 🌐 **Multilingual Support** — Native voice and text support in 22 languages

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, Framer Motion, Recharts, Lucide React
- **Backend**: Node.js, Fastify, TypeScript, PostgreSQL (pg-pool), Redis
- **AI Providers**: [Sarvam AI](https://sarvam.ai) (Primary), Anthropic Claude API (Conversational Logic)
- **Communications**: [Twilio](https://twilio.com) (Voice & SMS infrastructure)
- **Deployment**: Vercel (Frontend), Render (Backend)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL Database
- Twilio Account + Phone Number
- Sarvam AI API Key
- Anthropic API Key

### Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/Steeezzy/forefront-latest.git
   cd forefront-latest
   ```

2. **Frontend Setup**
   ```bash
   npm install
   npm run dev
   ```

3. **Backend Setup**
   ```bash
   cd forefront-backend
   npm install
   npm run dev
   ```

## ⚙️ Environment Variables

Create a `.env` file in the root and `forefront-backend/` with the following:

```env
ANTHROPIC_API_KEY=your_claude_key
SARVAM_API_KEY=your_sarvam_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
DATABASE_URL=your_postgres_url
```

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

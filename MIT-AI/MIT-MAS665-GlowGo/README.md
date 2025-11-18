# 🌟 GlowGo - AI-Powered Beauty & Wellness Marketplace

An intelligent service booking platform that uses multi-agent AI to match customers with beauty and wellness service providers.

![MIT MAS.665](https://img.shields.io/badge/MIT-MAS.665-red)
![Python](https://img.shields.io/badge/Python-3.9+-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)

## ✨ Features

### 🤖 AI-Powered Matching
- **Multi-Agent System** using CrewAI
- **Natural Language Processing** to extract user preferences
- **Intelligent Ranking** based on availability, location, and preferences
- **Quality Assurance** validation of matches

### 💬 Conversational Interface
- Chat-based preference collection
- Real-time AI responses
- Context-aware conversations
- Preference summarization

### 🎨 Beautiful UI
- Glossier-inspired design
- Mobile-first responsive layout
- Smooth animations and transitions
- Professional and trustworthy aesthetic

### 🔐 Secure Authentication
- Google OAuth integration
- JWT-based sessions
- Protected routes

## 🚀 Quick Start

### Option 1: Fast Setup (5 minutes)
See **[QUICK_START.md](./QUICK_START.md)** for the fastest way to get running.

### Option 2: Detailed Setup
See **[GETTING_STARTED.md](./GETTING_STARTED.md)** for comprehensive instructions.

### TL;DR

```bash
# 1. Setup database (Supabase) and get API keys

# 2. Backend
cd glowgo-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Create .env file (see ENV_SETUP.md)
python main.py

# 3. Frontend (new terminal)
cd glowgo-frontend
npm install
# Create .env.local file (see ENV_SETUP.md)
npm run dev

# 4. Open http://localhost:3000
```

## 📁 Project Structure

```
MIT-MAS665-GlowGo/
├── 📄 README.md                    # This file
├── 📄 QUICK_START.md               # 5-minute setup guide
├── 📄 GETTING_STARTED.md           # Detailed setup guide
├── 📄 ENV_SETUP.md                 # Environment variables guide
│
├── 🗄️  database/
│   ├── schema.sql                  # PostgreSQL schema with seed data
│   └── add_preference_sessions_table.sql
│
├── 🐍 glowgo-backend/              # FastAPI Backend
│   ├── main.py                     # Entry point
│   ├── config.py                   # Configuration
│   ├── requirements.txt            # Python dependencies
│   │
│   ├── routers/                    # API endpoints
│   │   ├── auth.py                 # Authentication
│   │   ├── preferences.py          # Preference collection
│   │   ├── matches.py              # Matching & ranking
│   │   └── health.py               # Health check
│   │
│   ├── services/                   # AI Agents & Business Logic
│   │   ├── agents/                 # CrewAI agents
│   │   │   ├── conversation_agent.py
│   │   │   ├── matching_agent.py
│   │   │   ├── ranking_agent.py
│   │   │   └── quality_assurance_agent.py
│   │   ├── crews/                  # Agent crews
│   │   │   ├── preference_crew.py
│   │   │   └── matching_crew.py
│   │   └── tools/                  # Agent tools
│   │
│   ├── models/                     # Database models
│   │   ├── user.py
│   │   ├── preferences.py
│   │   └── database.py
│   │
│   ├── schemas/                    # Pydantic schemas
│   │   ├── auth.py
│   │   ├── preferences.py
│   │   └── matches.py
│   │
│   └── utils/                      # Utilities
│       ├── auth.py                 # JWT handling
│       └── db.py                   # Database helpers
│
└── ⚛️  glowgo-frontend/            # Next.js Frontend
    ├── app/                        # Next.js 14 App Router
    │   ├── page.tsx                # Homepage
    │   ├── layout.tsx              # Root layout
    │   ├── globals.css             # Global styles
    │   ├── auth/login/             # Login page
    │   ├── chat/                   # Chat interface
    │   ├── booking/                # Booking flow
    │   └── matches/                # Match results
    │
    ├── components/                 # React components
    │   ├── Header.tsx
    │   ├── Button.tsx
    │   └── Chat/                   # Chat components
    │
    ├── lib/                        # Libraries
    │   ├── api.ts                  # Axios client
    │   └── chatApi.ts              # Chat API
    │
    ├── hooks/                      # Custom hooks
    │   ├── useApi.ts
    │   └── useChat.ts
    │
    ├── context/                    # React Context
    │   └── AuthContext.tsx
    │
    └── package.json                # Node dependencies
```

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **CrewAI** - Multi-agent AI orchestration
- **Google Gemini** - LLM for natural language understanding
- **PostgreSQL** - Relational database
- **SQLAlchemy** - ORM
- **JWT** - Authentication

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client
- **Zustand** - State management

### Infrastructure
- **Supabase** - PostgreSQL hosting
- **Vercel** - Frontend deployment (recommended)
- **Railway/Render** - Backend deployment (recommended)

## 🎯 How It Works

### 1. User Conversation
```
User: "I need a haircut this week"
AI: "Great! What's your budget range?"
User: "Around $50"
AI: "Any preference for the stylist?"
```

### 2. Preference Extraction
The **Conversation Agent** extracts:
- Service type: `haircut`
- Budget: `$50`
- Timing: `this week`
- Location: User's location
- Other preferences

### 3. Intelligent Matching
The **Matching Agent**:
- Queries database for relevant providers
- Filters by service category, location, availability
- Considers ratings and reviews

### 4. Smart Ranking
The **Ranking Agent**:
- Scores each match based on:
  - Budget fit
  - Availability match
  - Distance from user
  - Rating and reviews
  - Specialization match
- Returns top 5 ranked matches

### 5. Quality Assurance
The **QA Agent**:
- Validates match quality
- Checks for missing information
- Ensures recommendations make sense

### 6. Booking
User selects a provider and books directly through the platform.

## 🧪 Testing

### Backend Tests
```bash
cd glowgo-backend
python test_preference_crew.py
python test_matching_crew.py
python test_debug_flow.py
```

### Frontend
```bash
cd glowgo-frontend
npm run lint
npx tsc --noEmit  # Type checking
```

## 📊 Database Schema

Key tables:
- **users** - Customer accounts
- **merchants** - Service providers
- **services** - Available services
- **bookings** - Confirmed bookings
- **booking_preferences** - User preferences from chat

See `database/schema.sql` for complete schema with seed data.

## 🔑 Required API Keys

See **[ENV_SETUP.md](./ENV_SETUP.md)** for detailed instructions on obtaining:
- Google Gemini API Key (Required)
- Google OAuth Credentials (Required)
- Supabase Database URL (Required)
- SendGrid API Key (Optional)
- OpenAI API Key (Optional)

## 🚢 Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Backend (Railway/Render)
1. Connect GitHub repository
2. Add environment variables
3. Deploy with `python main.py`

## 📝 API Documentation

When the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🤝 Contributing

This is an MIT MAS.665 course project. For improvements:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🎓 Course Information

**Course**: MIT MAS.665 - Software Studio for AI-Augmented Design
**Project**: GlowGo MVP - AI-Powered Service Marketplace
**Year**: 2024-2025

## 🆘 Support

- **Setup Issues**: See [GETTING_STARTED.md](./GETTING_STARTED.md)
- **Quick Questions**: See [QUICK_START.md](./QUICK_START.md)
- **Environment Setup**: See [ENV_SETUP.md](./ENV_SETUP.md)
- **Backend Details**: See `glowgo-backend/README.md`
- **Frontend Details**: See `glowgo-frontend/README.md`

## 🙏 Acknowledgments

- CrewAI for multi-agent framework
- Google Gemini for AI capabilities
- Next.js team for amazing developer experience
- MIT MAS.665 teaching team

---

**Built with ❤️ at MIT**

**Ready to transform the beauty and wellness booking experience! 💅✨**



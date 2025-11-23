# 🌟 GlowGo - AI-Powered Beauty & Wellness Marketplace

An intelligent service booking platform that uses multi-agent AI to match customers with beauty and wellness service providers.

![MIT MAS.665](https://img.shields.io/badge/MIT-MAS.665-red)
![Python](https://img.shields.io/badge/Python-3.9+-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)

## ✨ Features

### 🤖 AI-Powered Matching
- **Multi-Agent System** using CrewAI
- **Advanced Natural Language Processing** to extract user preferences
- **Enhanced Time Parsing** with flexible date/time formats
- **Voice Input Support** with word-to-number conversion
- **Intelligent Ranking** based on availability, location, and preferences
- **Quality Assurance** validation of matches
- **Smart Fallback Suggestions** when no matches found

### 💬 Conversational Interface
- Chat-based preference collection with voice support
- Real-time AI responses
- Context-aware conversations
- **Flexible Time Recognition**:
  - Date only: "next thursday", "tomorrow", "next week"
  - Date + time: "next thursday 3 pm", "tomorrow at 5:30pm"
  - Deadlines: "before next thursday", "by friday 5pm", "after monday"
  - Spoken times: "three pm", "five thirty pm", "eleven o'clock"
- **Intelligent Fallbacks**: Suggests budget/time adjustments when no matches found
- Enhanced preference summarization

### 🎨 Beautiful UI
- Glossier-inspired design
- Mobile-first responsive layout
- Smooth animations and transitions
- Professional and trustworthy aesthetic

### 🔐 Secure Authentication
- Google OAuth integration
- JWT-based sessions
- Protected routes
- Automatic redirect to chat after login

### 🏠 Marketing Landing Page
- **4 full-page sections** with smooth scrolling
- Fixed header with navigation
- Hero section with value proposition
- Problem statement with statistics
- Image mosaic showcasing services
- Video CTA with "GLOW NOW" button
- Mobile-responsive design

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
├── 📄 FRONTEND_FIXES_SUMMARY.md    # Frontend enhancement details
│
├── 🖼️  landingpage/                 # Marketing landing page assets
│   ├── Picture1.png                # Hero image - facial treatment
│   ├── Picture2.png                # Problem section - beauty textures
│   ├── Picture3.png                # Mosaic - skincare application
│   ├── Picture4.png                # Mosaic - beauty tools
│   ├── Picture5.png                # Mosaic - spa setup
│   ├── Picture6.png                # Mosaic - wellness product
│   ├── Video1.mp4                  # CTA background video
│   └── LandingPageLayout.png       # Design reference
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
│   ├── 📚 Documentation/           # Feature documentation
│   │   ├── ENHANCED_TIME_FEATURES.md    # Time parsing guide
│   │   ├── VOICE_TIME_SUPPORT.md        # Voice input guide
│   │   └── QA_VALIDATION_FIX.md         # QA validation details
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
│   │   │   └── matching_crew.py (with fallback suggestions)
│   │   └── tools/                  # Agent tools
│   │       ├── conversation_tools.py (enhanced time parsing)
│   │       ├── matching_tools.py (enhanced availability)
│   │       └── qa_tools.py (flexible validation)
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
    │   ├── page.tsx                # Homepage (renders landing)
    │   ├── layout.tsx              # Root layout with Google OAuth
    │   ├── globals.css             # Global styles
    │   ├── landing/                # Marketing landing page
    │   │   └── page.tsx            # 4-page scrollable landing
    │   ├── auth/login/             # Google OAuth login
    │   ├── chat/                   # AI chat interface
    │   ├── dashboard/              # User dashboard
    │   ├── booking/                # Booking flow
    │   └── matches/                # Match results
    │
    ├── public/
    │   └── landingpage/            # Landing page images & video
    │
    ├── components/                 # React components
    │   ├── Header.tsx
    │   ├── Button.tsx
    │   └── Chat/                   # Chat components
    │       ├── ChatInterface.tsx
    │       └── PreferenceSummary.tsx (enhanced time display)
    │
    ├── types/                      # TypeScript types
    │   └── chat.ts                 # Chat & preference types
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

### 1. User Conversation (Enhanced with Voice Support)
```
User: "I need a haircut next thursday three pm"
AI: "Perfect! I'll find you a haircut for Thursday, Nov 27 at 3:00 PM. What's your budget?"
User: "Around fifty dollars"
AI: "Got it! Looking for stylists within $50..."
```

**Supports flexible time expressions:**
- 📅 **Dates**: "next thursday", "tomorrow", "this weekend", "next week"
- ⏰ **Times**: "3 pm", "five thirty pm", "eleven o'clock"
- 📌 **Deadlines**: "before friday", "by next monday 5pm", "after wednesday"
- 🎤 **Voice**: Spoken numbers automatically converted ("three pm" → "3:00 PM")

### 2. Preference Extraction
The **Conversation Agent** with enhanced NLP extracts:
- Service type: `haircut`
- Budget: `$50` (supports word numbers: "fifty dollars")
- **Enhanced Timing**:
  - `preferred_date`: `2024-11-27` (ISO format)
  - `preferred_time`: `15:00` (24h format)
  - `time_constraint`: `before` / `by` / `after` (if specified)
  - `time_urgency`: `week` (fallback)
- Location: User's location
- Other preferences

### 3. Intelligent Matching with Smart Availability
The **Matching Agent**:
- Queries database for relevant providers
- **Enhanced Time Filtering**:
  - Exact date matching: "next thursday" → finds slots on Nov 27
  - Date range for constraints: "before friday" → searches Nov 18-20
  - Time slot matching: "3 pm" → prioritizes providers with 3:00 PM availability
- Filters by service category, location, availability
- Considers ratings and reviews

### 4. Smart Ranking
The **Ranking Agent** scores each match using:
- 🌟 **Rating (40%)**: Provider rating (0-5 stars)
- 💰 **Price Fit (30%)**: Within budget or not
- 📅 **Availability (20%)**: Number of matching time slots
- 📍 **Distance (10%)**: Miles from user location

Returns top 3-5 ranked matches with detailed scoring breakdown.

### 5. Quality Assurance (Flexible Validation)
The **QA Agent**:
- **Validates completeness** - Accepts ANY form of time information:
  - New format: `preferred_date`, `preferred_time`, `time_constraint`
  - Legacy format: `time_urgency`
- Checks for missing critical information
- Ensures recommendations make sense
- Provides quality scores and recommendations

### 6. Smart Fallback Suggestions
When no matches are found, the system suggests:
```
"No exact matches found. Here are some options:

💡 If you raise your budget to $70, these providers would fit:
   • Elegant Cuts - Available next thursday at 3pm ($65)
   • Style Studio - Available next thursday at 2pm ($68)

💡 If you're flexible on timing, these fit your budget:
   • Quick Cuts - Available this weekend ($45)
   • Budget Styles - Available next week ($48)
```

### 7. Booking
User selects a provider and books directly through the platform.

## 🧪 Testing

### Backend Tests
```bash
cd glowgo-backend

# Test preference extraction crew
python test_preference_crew.py

# Test matching crew with ranking
python test_matching_crew.py

# Test enhanced time parsing (NEW)
python test_time_parsing.py

# Debug full conversation flow
python test_debug_flow.py
```

**Test Coverage for Enhanced Features:**
- ✅ Spoken time recognition ("three pm", "five thirty pm")
- ✅ Date parsing ("next thursday", "tomorrow", "this weekend")
- ✅ Deadline constraints ("before friday", "by monday 5pm")
- ✅ Word-to-number budget conversion ("fifty dollars")
- ✅ QA validation with flexible time formats
- ✅ Fallback suggestions when no matches found

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

## 🚀 Latest Enhancements (v2.0)

### Enhanced Time Parsing & Voice Support
GlowGo now features industry-leading natural language time understanding:

**📅 Flexible Date Recognition**
- Relative dates: "tomorrow", "next thursday", "next week"
- Date ranges: "this weekend", "next weekend", "end of week"
- Compound expressions: "next thursday three pm"

**🎤 Voice Input Support**
- Spoken numbers: "three pm" → "3:00 PM"
- Compound times: "five thirty pm" → "5:30 PM"
- Natural variations: "eleven o'clock", "quarter past two"

**📌 Deadline Constraints**
- Before: "before next friday" → search up to Nov 21
- By: "by monday 5pm" → deadline of Nov 24 at 5:00 PM
- After: "after wednesday" → from Nov 20 onwards

**💡 Intelligent Fallback System**
When no exact matches are found:
- Suggests specific budget adjustments with alternative providers
- Recommends time flexibility options with available slots
- Shows closest possible matches with clear criteria changes

**📖 Full Documentation**
- [Enhanced Time Features Guide](glowgo-backend/ENHANCED_TIME_FEATURES.md) - Complete time parsing documentation
- [Voice Time Support Guide](glowgo-backend/VOICE_TIME_SUPPORT.md) - Voice input specifics
- [QA Validation Details](glowgo-backend/QA_VALIDATION_FIX.md) - Flexible validation system
- [Frontend Fixes Summary](FRONTEND_FIXES_SUMMARY.md) - UI enhancements

## 🆘 Support

- **Setup Issues**: See [GETTING_STARTED.md](./GETTING_STARTED.md)
- **Quick Questions**: See [QUICK_START.md](./QUICK_START.md)
- **Environment Setup**: See [ENV_SETUP.md](./ENV_SETUP.md)
- **Enhanced Features**: See [ENHANCED_TIME_FEATURES.md](glowgo-backend/ENHANCED_TIME_FEATURES.md)
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



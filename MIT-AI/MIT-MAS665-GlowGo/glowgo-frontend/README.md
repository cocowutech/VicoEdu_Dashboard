# GlowGo Frontend

Beautiful, mobile-first Next.js 14 frontend for GlowGo - an AI-powered beauty and wellness service marketplace.

## 🎨 Design System

Built with the **Glossier/Airbnb aesthetic** featuring:

### Colors
- **Blush Pink** (#FAD4D8) - Primary accent
- **Soft Gray** (#F7F7F7) - Secondary background
- **Dark Gray** (#3D3D3D) - Body text
- **Almost Black** (#2D2D2D) - Headings
- **Soft Mint** (#C4EBD8) - Success states
- **Soft Red** (#FECACA) - Error states

### Typography
- **Headings**: Poppins (600 weight)
- **Body**: Inter
- Mobile-accessible font sizes

### Design Elements
- Border radius: 12px (buttons), 16px (cards)
- Soft shadows for depth
- Mobile-first responsive design
- 44px minimum touch targets

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on `http://localhost:8000`

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Set up environment variables**
```bash
cp .env.local.example .env.local
```

3. **Configure `.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

4. **Run development server**
```bash
npm run dev
```

5. **Open your browser**
```
http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
glowgo-frontend/
├── app/                      # Next.js 14 App Router
│   ├── layout.tsx           # Root layout with fonts & providers
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles & Tailwind
│   └── auth/
│       ├── layout.tsx       # Auth pages layout
│       └── login/
│           └── page.tsx     # Login page
├── components/              # Reusable UI components
│   ├── Header.tsx          # Navigation header
│   └── Button.tsx          # Button component (3 variants)
├── context/                 # React Context providers
│   └── AuthContext.tsx     # Authentication state management
├── hooks/                   # Custom React hooks
│   └── useApi.ts           # API call hooks
├── lib/                     # Utility libraries
│   └── api.ts              # Axios client with interceptors
├── types/                   # TypeScript type definitions
│   └── index.ts            # Shared types
├── public/                  # Static assets
├── tailwind.config.ts      # Tailwind with custom colors
├── tsconfig.json           # TypeScript configuration
├── next.config.js          # Next.js configuration
└── package.json            # Dependencies & scripts
```

## 🎯 Key Features

### ✨ Beautiful UI
- Glossier-inspired design with blush pink accents
- Soft shadows and rounded corners
- Clean, minimalist aesthetic
- Professional and trustworthy

### 📱 Mobile-First
- Responsive design for all screen sizes
- Touch-friendly 44px minimum targets
- Mobile hamburger menu
- Optimized for mobile browsing

### 🔐 Authentication Ready
- Google OAuth integration prepared
- Phone & email login placeholders
- JWT token management
- Protected routes support

### ⚡ Performance
- Next.js 14 App Router
- Server-side rendering
- Image optimization
- Code splitting

### 🛠️ Developer Experience
- TypeScript strict mode
- Path aliases (`@/*`)
- ESLint configuration
- Hot reload

## 🧩 Components

### Button Component
Three variants with full accessibility:

```tsx
import Button from '@/components/Button'

// Primary (blush pink)
<Button variant="primary" size="lg">Get Started</Button>

// Secondary (outlined)
<Button variant="secondary" size="md">Learn More</Button>

// Ghost (text only)
<Button variant="ghost" size="sm">Cancel</Button>

// With loading state
<Button loading={true}>Processing...</Button>

// Full width
<Button fullWidth>Continue</Button>
```

### Header Component
Responsive navigation with:
- Logo and branding
- Desktop navigation links
- Mobile hamburger menu
- User authentication state
- Avatar placeholder

## 🔌 API Integration

### Using the API Client

```tsx
import apiClient from '@/lib/api'

// GET request
const response = await apiClient.get('/api/providers')

// POST request
const response = await apiClient.post('/api/bookings', {
  provider_id: 1,
  service: 'Haircut',
  date: '2025-01-20'
})
```

### Using Custom Hooks

```tsx
import { useGet, usePost } from '@/hooks/useApi'

function MyComponent() {
  const { data, loading, error, get } = useGet('/api/providers')
  
  useEffect(() => {
    get()
  }, [])
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return <div>{/* Render data */}</div>
}
```

## 🔐 Authentication

### Using Auth Context

```tsx
import { useAuth } from '@/context/AuthContext'

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <LoginPrompt />
  }
  
  return <div>Welcome, {user.first_name}!</div>
}
```

### Login Flow

```tsx
const { login } = useAuth()

// After receiving token from backend
await login(accessToken)

// User data is automatically fetched and stored
```

## 🎨 Styling with Tailwind

### Custom Colors

```tsx
// Blush pink variants
<div className="bg-blush-500">Primary blush</div>
<div className="bg-blush-100">Light blush</div>
<div className="text-blush-600">Blush text</div>

// Gray variants
<div className="bg-gray-50">Background</div>
<div className="text-gray-900">Heading</div>

// Status colors
<div className="bg-success">Success</div>
<div className="bg-error">Error</div>
```

### Custom Border Radius

```tsx
<button className="rounded-button">Button</button>
<div className="rounded-card">Card</div>
<input className="rounded-input" />
```

### Custom Shadows

```tsx
<div className="shadow-soft">Subtle shadow</div>
<div className="shadow-soft-lg">Larger shadow</div>
```

## 📱 Pages

### Home Page (`/`)
- Hero section with CTA
- Feature highlights
- Responsive layout
- Navigation header

### Login Page (`/auth/login`)
- Google OAuth button (blush pink)
- Phone login option
- Email login option
- Mobile-responsive
- Centered layout

## 🔄 Next Steps

1. ✅ Implement Google OAuth flow
2. ✅ Create dashboard page
3. ✅ Build preference collection chat UI
4. ✅ Create provider listing page
5. ✅ Build booking flow
6. ✅ Add profile management
7. ✅ Implement notifications
8. ✅ Add loading states
9. ✅ Error handling UI
10. ✅ Add animations

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type checking
npx tsc --noEmit
```

## 📦 Dependencies

### Core
- **Next.js 14** - React framework
- **React 18** - UI library
- **TypeScript** - Type safety

### Styling
- **Tailwind CSS** - Utility-first CSS
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

### API & State
- **Axios** - HTTP client
- **Zustand** - State management (optional)
- **@react-oauth/google** - Google OAuth

## 🌐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | ✅ |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID | ✅ |

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

```bash
npm run build
npm start
```

## 🎯 Performance Optimizations

- ✅ Image optimization with Next.js Image
- ✅ Font optimization with next/font
- ✅ Code splitting by route
- ✅ Server-side rendering
- ✅ Static generation where possible

## 🤝 Contributing

This is an MIT MAS.665 course project for GlowGo MVP.

## 📄 License

MIT License

---

**Built with ❤️ using Next.js 14, TypeScript, and Tailwind CSS**



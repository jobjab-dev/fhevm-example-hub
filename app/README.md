# 🌐 FHEVM Example Hub - Web Catalog

> Interactive web interface to browse, explore, and understand FHEVM examples.

## 🚀 Live Demo

Visit the live site: **[fhevm-example-hub.vercel.app](https://fhevm-example-hub.vercel.app)** *(update with your URL)*

## ✨ Features

- **📚 Example Catalog** - Browse all FHEVM examples with descriptions, tags, and code previews
- **🤖 AI Assistant** - Chat with an AI to learn about FHE concepts and get coding help
- **🔍 Smart Search** - Search examples by name, description, or tags
- **📊 Dev Dashboard** - View example statistics and quick scripts

## 🛠️ Tech Stack

- **React 18** + **TypeScript**
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **Google Gemini API** - AI Chat (via Vercel Serverless)

## 📦 Development

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm 9+

### Local Development

```bash
# From the root of the monorepo
npm run dev:web

# Or from this directory
npm run dev
```

### Build for Production

```bash
npm run build
```

## ☁️ Deployment (Vercel)

### 1. Connect Repository

Connect your GitHub repository to Vercel.

### 2. Configure Build Settings

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `app` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 3. Set Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

| Name | Value | Notes |
|------|-------|-------|
| `GEMINI_API_KEY` | `AIzaSy...` | **Required** for AI Chat |

> ⚠️ **Important**: Use `GEMINI_API_KEY` (without `VITE_` prefix) to keep the API key secure on the server-side.

### 4. Deploy

Push to `main` branch or click "Deploy" in Vercel Dashboard.

## 📁 Project Structure

```
app/
├── api/                 # Vercel Serverless Functions
│   └── chat.ts          # AI Chat endpoint (secure API key)
├── src/
│   ├── components/      # React components
│   │   └── AIChat/      # AI chat widget
│   ├── context/         # React contexts
│   ├── data/            # Example catalog data
│   ├── layouts/         # Page layouts
│   ├── pages/           # Page components
│   └── services/        # API services
├── public/              # Static assets
├── vercel.json          # Vercel configuration
└── package.json
```

## 🔗 Related

- [Main Repository](https://github.com/jobjab-dev/fhevm-example-hub) - CLI and examples
- [Zama FHEVM Docs](https://docs.zama.ai/fhevm) - Official documentation

---

<p align="center">
  Built with ❤️ for the Zama Community
</p>

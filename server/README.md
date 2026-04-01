# Ecco Facilities — AI Chat Server

Backend proxy that connects the website chat widget to the Claude API.

## Quick Start

```bash
cd server
npm install
cp .env.example .env
# Edit .env and add your Anthropic API key
npm start
```

The server runs on **http://localhost:3001** by default.

## Get Your API Key

1. Go to https://console.anthropic.com/
2. Create an account or sign in
3. Navigate to **API Keys** and create a new key
4. Copy it into your `.env` file

## Endpoints

| Method | Path          | Description       |
|--------|---------------|-------------------|
| POST   | /api/chat     | Send chat message |
| GET    | /api/health   | Health check      |

## Production Deployment

For production, set `ALLOWED_ORIGINS` in `.env` to your domain:

```
ALLOWED_ORIGINS=https://eccofacilities.com,https://www.eccofacilities.com
```

Update `CONFIG.apiUrl` in `js/chat-widget.js` to point to your production server URL.

### Hosting Options
- **Railway** — `railway up` (easiest)
- **Render** — Connect GitHub repo, auto-deploys
- **DigitalOcean App Platform** — Node.js app
- **VPS** — Use PM2: `pm2 start server.js --name ecco-chat`

## How It Works

1. Visitor types a message in the chat widget
2. Widget sends POST to `/api/chat` with message + conversation history
3. Server forwards to Claude API with Ecco's business knowledge as system prompt
4. Claude's response is returned to the widget
5. If the server is offline, the widget uses built-in fallback responses

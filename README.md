# leadsetu-web — Next.js Frontend

> **Leadsetu** — Bridge Every Lead to Revenue  
> Port: **3000** | Calls: `leadsetu-api` (3001)

## Quick Start

```bash
cp .env.example .env
npm install
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Backend API base URL |
| `NEXT_PUBLIC_WS_URL` | `http://localhost:3001` | WebSocket server URL |

## Project Structure

```
src/
  app/           # Next.js 15 App Router pages
  components/    # Reusable UI components
  hooks/         # React Query data hooks
  lib/           # API client, auth helpers, utils
  store/         # Zustand global state
  types/         # Shared contracts (keep in sync with leadsetu-api)
```

## Connected Services

- **leadsetu-api** (`NEXT_PUBLIC_API_URL`) — All CRM data, auth, webhooks
- **leadsetu-ai** — Accessed indirectly via leadsetu-api (never called directly from browser)

## Brand Colors

- Navy: `#17243A`
- Blue: `#3978EA`

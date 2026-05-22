# AthleteShield Frontend

A privacy-first athlete identity verification platform. AthleteShield provides role-based portals for athletes, coaches, federations, administrators, and investigators — handling verification workflows, credential issuance, and abuse reporting with end-to-end encryption and full audit capabilities.

---

## Overview

AthleteShield connects athletes with sports federations to enable secure identity verification and credential issuance. Key capabilities include:

- **Athlete portal** — manage profiles, upload documents, request verification, view credentials with QR codes
- **Federation portal** — review verification requests, approve/reject with reasons, manage members
- **Admin/Investigator portal** — manage abuse reports, view audit logs, monitor system metrics
- **Public features** — anonymous abuse report submission, report tracking, QR credential verification

---

## Tech Stack

| Technology | Purpose |
|---|---|
| [Next.js 14+](https://nextjs.org/) | React framework with App Router |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |
| [Zustand](https://zustand-demo.pmnd.rs/) | Client state management |
| [TanStack Query](https://tanstack.com/query) | Server state and data fetching |
| [React Hook Form](https://react-hook-form.com/) | Form management |
| [Zod](https://zod.dev/) | Schema validation |
| [Axios](https://axios-http.com/) | HTTP client with interceptors |
| [Recharts](https://recharts.org/) | Data visualization |
| [qrcode.react](https://github.com/zpao/qrcode.react) | QR code generation |
| [html5-qrcode](https://github.com/mebjas/html5-qrcode) | QR code scanning |

---

## Prerequisites

- **Node.js** 18.17 or later
- **npm** 9+ (or pnpm / yarn)
- A running instance of the [AthleteShield backend API](../README.md) (NestJS, default port 4000)

---

## Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd athleteshield-frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy the example env file and fill in your values:

   ```bash
   cp .env.example .env.local
   ```

   See the [Environment Variables](#environment-variables) section for details.

4. **Start the development server**

   ```bash
   npm run dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Create a `.env.local` file in the project root. Use `.env.example` as a template.

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the AthleteShield backend API | `http://localhost:4000/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | Application display name | `AthleteShield` |

> Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Do not store secrets in these variables.

---

## Development

### Start the dev server

```bash
npm run dev
```

Runs Next.js in development mode with hot reload at [http://localhost:3000](http://localhost:3000).

### Lint

```bash
npm run lint
```

Runs ESLint across the project using the Next.js ESLint config.

### Type checking

```bash
npx tsc --noEmit
```

---

## Testing

### Run all tests

```bash
npm test
```

Runs the full Vitest test suite once.

### Run tests with UI

```bash
npm run test:ui
```

Opens the Vitest browser UI for interactive test exploration.

### Run tests with coverage

```bash
npm run test:coverage
```

Generates a coverage report in the `coverage/` directory.

### Run end-to-end tests

```bash
npm run test:e2e
```

Runs Playwright end-to-end tests. Requires the dev server (or a production build) to be running.

> **Note:** E2E tests require a running backend API. Set `NEXT_PUBLIC_API_URL` to point at your test environment before running.

---

## Build & Deploy

### Production build

```bash
npm run build
```

Compiles and optimizes the application for production. Output goes to `.next/`.

### Start production server

```bash
npm start
```

Serves the production build locally. Run `npm run build` first.

### Environment configuration for production

Set the following environment variables in your hosting environment (Vercel, Docker, etc.):

```
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api/v1
NEXT_PUBLIC_APP_NAME=AthleteShield
```

### Deploying to Vercel

1. Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2. Import the project in the [Vercel dashboard](https://vercel.com/new).
3. Set the environment variables under **Project Settings → Environment Variables**.
4. Vercel will automatically run `npm run build` and deploy on every push to the main branch.

### Deploying with Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

> Enable Next.js standalone output by adding `output: 'standalone'` to `next.config.js` when using Docker.

---

## Project Structure

```
athleteshield-frontend/
├── app/                    # Next.js App Router pages
│   ├── (admin)/            # Admin/Investigator portal
│   ├── (athlete)/          # Athlete portal
│   ├── (auth)/             # Login and registration
│   ├── (federation)/       # Federation portal
│   └── (public)/           # Public pages (report, track, verify-qr)
├── components/
│   ├── features/           # Feature-specific components
│   ├── forms/              # Shared form components
│   ├── layouts/            # Layout and navigation components
│   └── ui/                 # Base UI components
├── lib/
│   ├── api/                # Axios API client
│   ├── stores/             # Zustand state stores
│   └── validations/        # Zod validation schemas
├── types/                  # TypeScript type definitions
├── .env.example            # Environment variable template
└── middleware.ts            # Next.js route protection middleware
```

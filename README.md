# Aura Dental CRM

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/casagest/generated-app-20250926-093207)

Aura Dental CRM is an enterprise-grade, AI-powered platform for MedicalCor, built entirely on the Cloudflare ecosystem. It provides a complete, end-to-end solution for managing the patient lifecycle, from initial lead acquisition with 180-day UTM attribution to treatment completion and financial settlement. The system is designed around a high-performance funnel: Lead -> Call Center -> Consultation -> Treatment -> Payment -> dynamic, contract-aware Escrow. AI is deeply integrated to provide intelligent lead scoring, automated qualification chatbots, call summaries, clinical RAG, and 'next best action' recommendations to maximize conversion and efficiency. It features robust security with GDPR by design, multi-tenant RBAC/ABAC for isolated agency partners, and comprehensive financial reporting (CAC, ROAS, P&L) to provide clear business insights and drive growth. The platform is architected for extreme performance and scalability, ensuring rapid lead response times (≤ 2 minutes) and high conversion rates.

## Key Features

-   **End-to-End Patient Lifecycle Management**: Track patients from initial lead to treatment completion.
-   **AI-Powered Intelligence**: Leverage AI for lead scoring, qualification chatbots, call summaries, and "next best action" suggestions.
-   **High-Performance Funnel**: Optimized workflow from Lead -> Call Center -> Consultation -> Treatment -> Payment.
-   **Dynamic Escrow System**: Contract-aware financial settlement logic.
-   **Security & Compliance**: GDPR by design with a full audit trail.
-   **Multi-Tenancy**: Isolated portals for marketing agencies with Role-Based and Attribute-Based Access Control (RBAC/ABAC).
-   **Advanced Analytics**: Real-time KPI and financial reporting, including CAC, ROAS, and P&L statements.
-   **Cloudflare Native**: Built entirely on the Cloudflare stack for unparalleled performance, security, and scalability.

## Technology Stack

-   **Frontend**: React, Vite, TypeScript, Tailwind CSS
-   **UI Components**: shadcn/ui, Lucide React
-   **State Management**: Zustand
-   **Animations**: Framer Motion
-   **Charts & Data Viz**: Recharts
-   **Backend**: Cloudflare Workers, Hono
-   **Database**: Cloudflare D1
-   **Storage**: Cloudflare R2
-   **AI**: Cloudflare Workers AI
-   **Real-time & State**: Cloudflare Durable Objects
-   **Tooling**: Vitest, Wrangler CLI

## Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later)
-   [Bun](https://bun.sh/) package manager
-   A Cloudflare account

### Installation

1.  **Clone the repository:**
    ```sh
    git clone <repository-url>
    cd aura_dental_crm
    ```

2.  **Install dependencies:**
    ```sh
    bun install
    ```

3.  **Configure Environment Variables:**

    Create a `.dev.vars` file in the root of the project for local development. This file is used by Wrangler to load environment variables.

    ```sh
    cp .dev.vars.example .dev.vars
    ```

    Now, edit `.dev.vars` and add your Cloudflare AI Gateway credentials:

    ```ini
    CF_AI_BASE_URL="https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT_ID/YOUR_GATEWAY_ID/openai"
    CF_AI_API_KEY="your-cloudflare-api-key"
    ```

    You can find these values in your Cloudflare dashboard.

4.  **Run the development server:**

    This command starts the Vite frontend server and the Wrangler development server for the backend worker simultaneously.

    ```sh
    bun dev
    ```

    The application will be available at `http://localhost:3000`.

## Development

-   **Frontend**: All frontend code is located in the `src/` directory. Vite provides Hot Module Replacement (HMR) for a fast development experience.
-   **Backend**: The Cloudflare Worker code is in the `worker/` directory. Changes to the worker code will trigger an automatic reload of the local server.
-   **Database Migrations**: D1 migrations are managed by Wrangler. To apply migrations locally, you can run:
    ```sh
    npx wrangler d1 migrations apply <DATABASE_NAME> --local
    ```

## Deployment

This project is designed for seamless deployment to Cloudflare's global network.

1.  **Login to Wrangler:**
    If you haven't already, authenticate Wrangler with your Cloudflare account.
    ```sh
    npx wrangler login
    ```

2.  **Configure Secrets:**
    Set your environment variables as secrets for your production deployment.
    ```sh
    npx wrangler secret put CF_AI_API_KEY
    npx wrangler secret put CF_AI_BASE_URL
    ```

3.  **Deploy the application:**
    The deploy script will build the frontend application and deploy both the static assets and the worker to Cloudflare.
    ```sh
    bun run deploy
    ```
    Wrangler will provide you with the URL of your deployed application.

Alternatively, you can deploy directly from your GitHub repository with a single click.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/casagest/generated-app-20250926-093207)
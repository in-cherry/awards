# Winzy Core

> **Private Repository**: This source code is proprietary and strictly confidential.

Winzy is a multi-tenant platform architected to deliver high-conversion gamification experiences, raffles, and secure checkouts. 

## 🏗 System Architecture

The platform relies on a modern serverless-friendly stack, prioritizing performance, secure multi-tenancy, and fluid user experiences:

- **Framework**: [Next.js (App Router)](https://nextjs.org/) for SSR/SSG and API routes.
- **Language**: TypeScript with strict type-safety.
- **Database Layer**: PostgreSQL managed via Prisma ORM for robust multi-tenant data isolation.
- **Styling & Animation**: Tailwind CSS coupled with Framer Motion (`motion/react`) for fluid gamification UI.
- **Email Delivery**: Custom Nodemailer implementation with SMTP fallback resilience.

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v22+
- **Database**: PostgreSQL instance running locally or via Docker.

### Local Setup

1. **Clone & Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Copy the example environment file and configure the necessary credentials:
   ```bash
   cp .env.example .env
   ```
   *Note: Ensure all critical keys (`JWT_SECRET`, `DATABASE_URL`) are securely generated.*

3. **Database Migration & Client Generation**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Application will be accessible at `http://localhost:3000`.

## ⚙️ Core Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts the development server with HMR. |
| `npm run build` | Creates an optimized production build. |
| `npm run start` | Starts the Next.js production server. |
| `npm run lint` | Runs ESLint and Prettier checks. |
| `npm run email:test`| Validates SMTP configuration and dispatches test templates. |

## 🔑 Environment Variables Reference

### Application & Database
- `DATABASE_URL`: Connection string for PostgreSQL.
- `NEXT_PUBLIC_APP_URL`: Base URL for the application.
- `APP_ROOT_DOMAIN`: Root domain for tenant resolution (e.g., `winzy.com.br`).
- `JWT_SECRET`: Secret key for session signing and auth tokens.

### SMTP & Communication (Nodemailer)
- `SMTP_HOST`: Mail server hostname (e.g., `mail.winzy.com.br`).
- `SMTP_PORT`: Port (typically `465` for SSL or `587` for TLS).
- `SMTP_SECURE`: `true` for 465, `false` for other ports.
- `SMTP_USER` / `SMTP_PASS`: Authentication credentials.
- `SMTP_FROM`: Default sender address.
- `SMTP_TEST_TO`: Default recipient for the test script.
- **Advanced Network Overrides**: `SMTP_FORCE_IPV4`, `SMTP_TLS_REJECT_UNAUTHORIZED`, `SMTP_CONNECTION_TIMEOUT_MS`.

## 📧 Email Delivery Testing

A dedicated script is provided to diagnose SMTP connectivity and test template rendering without interacting with the UI.

**Usage:**
```bash
# Run full diagnostic and send all templates
npm run email:test -- --to=user@domain.com --mode=all

# Verify SMTP connection only
npm run email:test -- --to=user@domain.com --mode=verify

# Test specific templates
npm run email:test -- --to=user@domain.com --mode=welcome --name="Test User"
npm run email:test -- --to=user@domain.com --mode=winner --name="Test User" --raffle="Raffle Name" --ticket=1234
```

### SMTP Troubleshooting (cPanel/HostGator environment)

If you encounter `Connection timeout` or `SSL/TLS` handshake errors:
1. **DNS Resolution**: Ensure the mail subdomain (`mail.winzy.com.br`) is set to "DNS Only" (grey cloud) in Cloudflare.
2. **Firewall/Network**: Verify outbound port `465` is open on the host server.
3. **IPv6 Routing**: If network errors persist, ensure `SMTP_FORCE_IPV4=true` is set.
4. **Certificate Validation**: For temporary local debugging of self-signed certs, use `SMTP_TLS_REJECT_UNAUTHORIZED=false`. **Never use this in production.**

## 🛡 Security Guidelines

- **Zero Trust**: Always validate payloads using Zod schemas (`src/lib/validation/*`) before executing server actions.
- **Tenant Isolation**: Database queries must strictly enforce tenant boundaries based on the resolved `appUrl` or `slug`.
- **Secrets Management**: Never commit `.env` files. Rotate `JWT_SECRET` periodically.

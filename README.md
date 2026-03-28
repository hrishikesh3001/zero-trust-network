# Zero Trust Network Security

A full-stack Zero Trust Network simulation built with React, Node.js, Docker, and Nginx. Every request must carry proof of identity — no token, no access.

**Live Demo:** [zero-trust-network-xi.vercel.app](https://zero-trust-network-xi.vercel.app)

---

## Screenshots

### Login Page

![Login Page](screenshots/login.png)

### Secret Vault

![Vault](screenshots/vault.png)

### Security Dashboard

![Dashboard](screenshots/dashboard.png)

### Alternate Login — Mobile Verification

![Guest Login](screenshots/guest-login.png)

---

## What Is Zero Trust?

Zero Trust means nobody gets access to anything without proving identity at every single step. Even after login, every request is re-verified. No token means instant rejection — not even the backend server is directly reachable from outside.

---

## Features

- **Animated login page** — night scene illustration with moving clouds, blinking stars, and a crescent moon
- **Multi-factor authentication** — Username + Password + TOTP via Google Authenticator
- **JWT tokens** — issued on successful login, expire after 15 minutes, blacklisted on logout
- **Alternate login via QR code** — scan with phone, verify Employee ID + TOTP, PC automatically redirects to vault
- **Rate limiting** — 5 failed attempts triggers a timed lockout, up to 3 rounds before permanent lock
- **Token blacklist** — logged-out tokens are invalidated server-side
- **Input sanitization** — XSS and SQL injection protection on all inputs
- **Nginx identity-aware proxy** — all requests pass through Nginx first, JWT required to reach backend
- **Docker container isolation** — each service runs in its own container, backend not exposed to outside
- **Security dashboard** — live login stats, failed attempt tracking, service health monitoring
- **bcrypt password hashing** — passwords never stored in plain text
- **Helmet.js** — secure HTTP headers on every response

---

## Tech Stack

| Layer            | Technology                      |
| ---------------- | ------------------------------- |
| Frontend         | React + Vite + CSS-in-JS        |
| Backend          | Node.js + Express               |
| Authentication   | JWT + bcrypt + speakeasy (TOTP) |
| Rate Limiting    | express-rate-limit              |
| Security Headers | Helmet.js                       |
| Proxy            | Nginx (Docker)                  |
| Containers       | Docker + Docker Compose         |
| QR Code          | qrcode + uuid                   |
| Frontend Deploy  | Vercel                          |
| Backend Deploy   | Render                          |

---

## Authentication Flow

```
User → POST /api/auth/login
         ↓
    Rate limiter (5 attempts max)
         ↓
    Input sanitization
         ↓
    bcrypt password verify
         ↓
    TOTP code verify (Google Authenticator)
         ↓
    JWT issued (15 min expiry)
         ↓
    Nginx proxy validates JWT on every request
         ↓
    Secret Vault unlocked
```

---

## Alternate Login (QR Code Flow)

```
PC shows QR code on login page
         ↓
Phone scans QR → opens mobile verification page
         ↓
Phone enters Employee ID + TOTP code
         ↓
Server verifies TOTP, issues JWT, stores against tokenId
         ↓
PC polls server every 3 seconds
         ↓
PC detects scan → saves JWT → redirects to vault
         ↓
Phone shows "Access Granted — PC is loading vault"
```

---

## Security Cases Handled

| Case                     | Behaviour                                                |
| ------------------------ | -------------------------------------------------------- |
| No token                 | 401 Unauthorized — blocked by Nginx proxy                |
| Wrong credentials        | "Invalid credentials" — never reveals which field failed |
| 5 failed attempts        | IP locked out for 60 seconds (600s in production)        |
| 3 lockout rounds         | Permanent lock — contact administrator                   |
| Expired JWT              | 401 Token Expired — must login again                     |
| Logged-out token         | Blacklisted server-side — cannot be reused               |
| Guest token on dashboard | 403 Insufficient Scope — blocked by middleware           |

---

## Project Structure

```
zero-trust-network/
├── client/                    ← React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── SamuraiLogin/  ← Login page + QR panel
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Vault.jsx      ← Protected vault page
│   │   │   ├── Dashboard.jsx  ← Security monitoring panel
│   │   │   └── GuestVault.jsx ← Mobile QR verification page
│   │   └── services/
│   │       └── api.js         ← Axios API calls
│   └── vercel.json
├── server/                    ← Node.js + Express backend
│   ├── routes/
│   │   ├── auth.js            ← Login, logout, TOTP, QR, phone-verify
│   │   ├── vault.js           ← Protected vault endpoint
│   │   └── dashboard.js       ← Security stats endpoint
│   ├── middleware/
│   │   ├── verifyToken.js     ← JWT verification + scope checking
│   │   ├── rateLimiter.js     ← Brute force protection
│   │   └── sanitize.js        ← Input sanitization
│   └── services/
│       ├── tokenBlacklist.js  ← Invalidated token storage
│       ├── totp.js            ← Google Authenticator logic
│       └── stats.js           ← Login stats + QR scan tracking
├── proxy/
│   └── nginx.conf             ← Identity-aware proxy config
├── docker/
│   ├── Dockerfile.client
│   ├── Dockerfile.server
│   └── Dockerfile.proxy
├── docker-compose.yml
└── screenshots/
```

---

## Running Locally

**Prerequisites:** Node.js 22+, Docker Desktop

**Backend:**

```bash
cd server
npm install
node index.js
```

**Frontend:**

```bash
cd client
npm install
npm run dev
```

**With Docker:**

```bash
docker compose up --build
```

**Default credentials:**

- Username: `admin`
- Password: `ZeroTrust@2026`
- TOTP: Google Authenticator (set up via TOTP_SECRET in .env)

---

## Environment Variables

**server/.env**

```
PORT=3001
JWT_SECRET=your_64_char_random_secret
TOTP_SECRET=your_base32_totp_secret
NODE_ENV=development
CLIENT_URL=http://localhost:5173
EMPLOYEE_ID=EMP-2026-ADMIN
```

**client/.env**

```
VITE_API_URL=http://localhost:3001/api
```

---

## Deployment

| Service  | Platform | URL                              |
| -------- | -------- | -------------------------------- |
| Frontend | Vercel   | zero-trust-network-xi.vercel.app |
| Backend  | Render   | zero-trust-network.onrender.com  |

---

## Built By

Hrishikeesh — portfolio project demonstrating real-world Zero Trust security concepts including MFA, JWT, Docker isolation, and identity-aware proxying.

# PureFlow Commerce Platform

A mobile app and admin dashboard for a water purifier commerce business with customer, dealer, and admin flows.

## Apps

- Mobile: `apps/mobile`
- Admin: `apps/admin`

## Features

- Customer catalog with 54 products across purifiers, dispensers, pumps, filters, and spares
- Dealer pricing and bulk order flow
- Cart, checkout, service booking, profile, push mock notifications, and order history
- Admin dashboard for order review, dealer approval, and service desk management
- AI social automation script for daily Instagram-ready content generation
- Vercel-ready Next.js admin app

## Local run

```bash
cd apps/mobile
npm install
npm start
```

```bash
cd apps/admin
npm install
npm run dev
```

## Build verification

```bash
cd apps/admin
npm run build
```

## Deployment

The admin dashboard is ready for Vercel deployment with the default Next.js app project. Add environment variables in Vercel for Firebase, Razorpay, and social automation integrations before production use.

## Firebase / AI notes

- Firebase config is initialized with `EXPO_PUBLIC_*` placeholders for a live setup.
- The app falls back to mock data when those values are not configured, so it still runs locally.
- The AI automation script generates a daily product caption and data payload locally when API keys are absent.

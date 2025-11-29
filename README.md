**Created by JokanderX at 11:37 29/11/2025**



**CVX SAAS — Multi-Language CV Builder Platform**

CVX is a full SaaS platform designed to help users create professional CVs in Arabic, English, and French, with a clean step-by-step builder, AI-powered enhancements, live canvas preview, export options, template marketplace, payment system, user accounts, and a complete admin dashboard.

This repository contains the full source code for the backend (NestJS + Prisma + PostgreSQL) and frontend (Next.js + TypeScript).

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_



**✨ Features**

Core User Features

13-step CV Builder Wizard

Live Canvas Preview (real-time visual updates)

Multi-language support (Arabic RTL, English LTR, French LTR)

Multiple CV templates with filters and switching

Import from PDF, Word (docx), and LinkedIn

AI text enhancement, correction, rewriting

AI image generation (profile photos, icons, etc.)

Export to PDF using Puppeteer (pixel-perfect)

Versioning system (user can store multiple CV versions)

Autosave + sync between devices

User Authentication (JWT + Refresh Tokens)

Email verification + password reset

User dashboard: My Documents

Stripe (or local gateway) payment integration

Credits system for AI operations

Admin Features

Full admin panel

User management

Template management

Credits management

Payments history

Analytics (future)

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_



🧩 Project Architecture

cvx/

├── api/                 # Backend (NestJS)

│   ├── prisma/          # Schema, migrations

│   ├── src/

│   │   ├── auth/        # JWT, refresh tokens

│   │   ├── users/

│   │   ├── payments/

│   │   ├── templates/

│   │   ├── ai/

│   │   └── ...modules

│   └── ...

│

└── web-frontend/        # Frontend (Next.js 15 + App Router)

&nbsp;   ├── src/

&nbsp;   │   ├── app/         # Pages \& layouts

&nbsp;   │   ├── components/  # UI components

&nbsp;   │   ├── hooks/

&nbsp;   │   └── services/

&nbsp;   └── public/

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_



**🛠 Tech Stack**



**Frontend**

Next.js 15

TypeScript

TailwindCSS

React Server Components

Zustand (state management)

i18n Routing for multi-language support

Puppeteer-ready HTML templates for PDF exports



**Backend**

NestJS

Prisma ORM

PostgreSQL

JWT + Refresh Token Rotation

BullMQ + Redis (for background jobs)

OpenAI / Groq / Anthropic adapters for AI operations

S3 Storage (file uploads)

Rate limiting + Caching

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_



**🌐 Languages + Localization**

✔ Arabic (RTL)

✔ English

✔ French



The entire frontend is built to support full multilingual rendering, including:

RTL layout switching

Localized templates

Localized form steps

Localized error messages

Localized PDF output

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_



**🚀 Getting Started**

Prerequisites

Install:

Node.js 18+

PostgreSQL 15+

Redis (for queues)

Git

pnpm or npm

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_



🔧 Backend Setup (NestJS)



cd api

npm install



Configure environment variables:

Create .env inside api/:

DATABASE\_URL="postgresql://..."

JWT\_SECRET="..."

REFRESH\_JWT\_SECRET="..."

S3\_BUCKET="..."

OPENAI\_API\_KEY="..."



Run Prisma migrations:

npx prisma migrate dev



Start the backend:

npm run start:dev



🎨 Frontend Setup (Next.js)

cd web-frontend

npm install



Create .env.local:



NEXT\_PUBLIC\_API\_URL=http://localhost:3000

S3\_BUCKET="..."

OPENAI\_API\_KEY="..."



Start the frontend:

npm run dev



Website runs on:

http://localhost:3001



📦 Build \& Production

Backend:

cd api

npm run build

npm run start:prod



Frontend:

cd web-frontend

npm run build

npm start

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_



🧠 AI Operations

CVX supports multiple AI providers:

OpenAI

Groq (LLaMA)

Anthropic

Local embedding models (future)

AI is used for:

CV content rewriting

Grammar correction

Skill generation

Work experience enhancement

Photo generation

Profile avatar clean-up

Each operation consumes credits with configurable cost.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_



💰 Payments \& Credits System

The platform supports:

One-time credit packs

Subscription tiers (future)

Order history

Fraud prevention

Admin manual credit adjustment

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_



🧱 Templates System

CVX provides:

Professional CV templates

Layout switching

Color palettes

Font families

Section toggling

Responsive design

Perfect PDF scaling

Admins can upload new templates from the dashboard.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_



📌 Roadmap

Full subscription billing

Team accounts / HR portal

Drag \& drop section builder

Export to DOCX

Resume parser (AI-powered)

Telegram/WhatsApp bot for instant CV creation

Analytics dashboard

Mobile app (React Native)

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_



📜 License

All rights reserved.

This project is not open-source and cannot be redistributed.

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_



🤝 Author

CVX SAAS

Created on 26/11/2025 by JokanderX

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_



Need help?

If you require additional project files such as the ERD, Prisma schema, API documentation, or Zod validation schemas, feel free to reach out. I can provide all technical resources as needed.


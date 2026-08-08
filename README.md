# RHG Exam Portal

[![Status](https://img.shields.io/badge/Status-Complete_100%25-10b981.svg)](https://github.com/omkar-103/rhg-exam-portal)
[![Next.js](https://img.shields.io/badge/Next.js-15_App_Router-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8.svg)](https://tailwindcss.com/)

A full-stack online examination and learning management platform built for educational institutes, coaching centers, and exam preparation organizations.

---

## Overview

RHG Exam Portal is a comprehensive education management system that provides a dual-interface platform — a student-facing portal for learning and exam practice, and an admin panel for complete operational control. The platform is designed to handle real-world workflows including timed examinations, automated scoring, doubt resolution, video learning, anti-cheat protection, session monitoring, and payment processing.

---

## Features

### Student Portal

- **Dashboard** — Personalized overview with stats, performance trends, score meters, and quick actions
- **Exams** — Browse, purchase, and attempt timed mock exams with anti-cheat protection & auto-evaluation
- **Results** — Detailed score breakdowns, subject-wise analysis, and complete attempt history
- **Learning Videos** — Curated video lecture library with category filtering and interactive player
- **Doubts** — Submit questions and receive verified expert replies with instant answer copy
- **Notifications** — Priority ring indicators, unread pulse dots, and announcement broadcasts
- **Payments** — Secure exam purchase and transaction history with Razorpay chip badges
- **Profile** — Account management, avatar uploads, and personal settings

### Admin Portal

- **Dashboard** — Live platform metrics, stat trend indicators, revenue overview, and recent activity
- **Student Management** — View, filter, paginate, and manage registered student accounts
- **Exam Management** — Create, edit, publish, preview, and configure timed examinations
- **Learning Video Management** — Upload, tag, and manage video lecture content
- **Doubt Management** — Review and reply to student doubts with expert answers
- **Payment Management** — Revenue analytics, transaction status tracking, and invoices
- **Notification Management** — Broadcast targeted announcements to students
- **Analytics** — Enrollment trends, category stats, daily registrations, and top student rankings
- **Audit Logs** — Complete security audit trail across all admin operations with severity filters
- **Session Monitor** — Live anti-cheat monitoring, active exam status, and configurable refresh rates

---

## Technology Stack

- **Next.js 15** — App Router, Server Components, API Routes
- **React 19** — Component-based UI with client hooks
- **TypeScript** — Full end-to-end type safety
- **Tailwind CSS v4** — Design tokens, dark mode, and responsive layout clamps
- **Framer Motion** — Smooth page transitions and micro-animations
- **MongoDB & Mongoose** — Document store and schema modeling
- **JWT Authentication** — Secure cookie-based stateless authentication
- **Razorpay** — Payment gateway integration
- **Recharts** — Responsive analytics charts and performance trends

---

## Key API Routes Overview

| Route | Method | Description |
|---|---|---|
| `/api/auth/login` | `POST` | User authentication & JWT issuance |
| `/api/auth/register` | `POST` | New student account registration |
| `/api/exams` | `GET`, `POST` | Fetch available exams / Create exam (Admin) |
| `/api/exams/[id]/attempt` | `POST` | Start or submit an exam attempt |
| `/api/admin/analytics` | `GET` | Aggregated platform metrics and chart data |
| `/api/admin/audit-logs` | `GET` | Activity and security log audit trail |
| `/api/admin/sessions` | `GET` | Live exam session and student monitoring data |

---

## Project Status

The complete platform roadmap is **100% finished, tested, and production-ready**. All 61 development commits have been committed cleanly to the repository.


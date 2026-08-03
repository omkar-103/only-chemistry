# RHG Exam Portal

A full-stack online examination and learning management platform built for educational institutes, coaching centers, and exam preparation organizations.

---

## Overview

RHG Exam Portal is a comprehensive education management system that provides a dual-interface platform — a student-facing portal for learning and exam practice, and an admin panel for complete operational control. The platform is designed to handle real-world workflows including timed examinations, automated scoring, doubt resolution, video learning, and payment processing.

---

## Features

### Student Portal

- **Dashboard** — Personalized overview with stats, recent activity, and quick actions
- **Exams** — Browse, purchase, and attempt timed mock exams with auto-evaluation
- **Results** — Detailed score breakdowns, subject-wise analysis, and performance history
- **Learning Videos** — Curated video library organized by subject and category
- **Doubts** — Submit questions and receive expert replies with image support
- **Notifications** — Real-time updates on exams, results, and announcements
- **Payments** — Secure exam purchase and transaction history via Razorpay
- **Profile** — Account management and personal settings

### Admin Portal

- **Dashboard** — Live platform metrics, revenue overview, and recent activity
- **Student Management** — View, filter, and manage all registered students
- **Exam Management** — Create, edit, publish, and schedule examinations
- **Learning Videos** — Upload and organize the video content library
- **Doubt Management** — Review and reply to student doubts with expert answers
- **Payments** — Transaction monitoring and revenue reporting
- **Notifications** — Broadcast announcements to all students or targeted segments
- **Analytics** — Enrollment trends, performance analytics, and revenue charts
- **Audit Logs** — Complete activity trail across all admin operations
- **System Monitor** — Platform health, API usage, and session tracking

---

## Technology Stack

- **Next.js** — App Router, Server Components, API Routes
- **React** — Component-based UI with hooks
- **TypeScript** — Full type safety across the codebase
- **Tailwind CSS** — Utility-first styling with custom design tokens
- **Framer Motion** — Animations and page transitions
- **MongoDB** — Primary database with Mongoose ODM
- **JWT** — Stateless authentication and session management
- **Razorpay** — Payment gateway integration
- **Axios** — HTTP client for API communication

---

## Project Purpose

RHG Exam Portal is a complete education management platform built for agencies, institutes, coaching centers, and educational organizations that need a professional, branded exam and learning management system. The platform is designed to be deployed as a white-label product for clients in the education sector.

---

## Status

The core platform is fully functional. Certain integrations require production credentials before they become fully active in a live environment:

- **Razorpay** — Payment collection requires live API keys and webhook configuration
- **Video Storage** — Learning video uploads require a connected storage provider (Cloudinary, AWS S3, or Supabase Storage)
- **File Storage** — Image attachments in the doubts module require a configured storage service
- **Communication Services** — Real-time notification delivery requires backend service configuration

All features are implemented and production-ready pending the above service connections.

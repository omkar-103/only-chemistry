import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FlaskConical, Shield, Lock, Eye, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — Only Chemistry",
  description: "Privacy policy describing how Only Chemistry collects, uses, and protects student data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FlaskConical className="h-4 w-4" />
            </div>
            <span className="font-display font-black text-base tracking-tight">Only Chemistry</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
        {/* Title Header */}
        <div className="mb-10 pb-8 border-b border-border">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            <Shield className="h-3.5 w-3.5" /> Privacy & Security
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-sm">
            Last Updated: August 2024 • Effective Date: August 2024
          </p>
        </div>

        {/* Content Sections */}
        <div className="prose dark:prose-invert max-w-none space-y-8 text-sm sm:text-base leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">
              1. Introduction
            </h2>
            <p>
              At <strong>Only Chemistry</strong>, we are committed to protecting the privacy and personal data of students, educators, and visitors who use our platform. This Privacy Policy explains what information we collect, why we collect it, how it is secured, and your rights regarding your personal information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">
              2. Information We Collect
            </h2>
            <p>
              We only collect information necessary to provide, manage, and improve our educational and assessment services:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account Information:</strong> When you register, we collect your full name, email address, 10-digit mobile number, and password (securely hashed with bcrypt).
              </li>
              <li>
                <strong>Exam & Practice Activity Data:</strong> Mock test submissions, answer choices, time spent per question, score histories, rank metrics, and topic-wise performance statistics.
              </li>
              <li>
                <strong>Doubt & Communication Data:</strong> Questions, explanations, and messages submitted through the student doubt resolution portal.
              </li>
              <li>
                <strong>Authentication & Session Data:</strong> JWT authentication tokens, browser user-agent, IP address for security audits, and login timestamps.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">
              3. How We Use Your Information
            </h2>
            <p>
              Your information is strictly used for legitimate educational operations:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide access to mock exams, learning videos, and study resources.</li>
              <li>To compute exam results, percentile ranks, and performance analytics.</li>
              <li>To verify identity, manage sessions, and protect against unauthorized account access.</li>
              <li>To respond to your chemistry doubts and customer support inquiries.</li>
              <li>To notify you of new test series, schedule updates, or system announcements.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">
              4. Cookies and Local Storage
            </h2>
            <p>
              We use secure HTTP-only cookies and local storage exclusively for session authentication (JWT access tokens, refresh tokens) and user interface preferences (such as Light/Dark mode state). We do NOT use third-party tracking or advertising cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">
              5. Data Sharing & Third Parties
            </h2>
            <p>
              <strong>We do not sell, rent, or trade your personal information to third parties.</strong> Data is shared only with trusted infrastructure providers required to operate Only Chemistry:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Database and hosting infrastructure (MongoDB Atlas, Cloud services) for secure data storage.</li>
              <li>Transactional email services for OTP and account verification delivery.</li>
              <li>Payment gateway providers when purchasing premium exam access.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">
              6. Data Security
            </h2>
            <p>
              We implement industry-standard technical and organizational security measures:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Passwords are one-way hashed using industry-standard bcrypt algorithms.</li>
              <li>Data in transit is encrypted using Transport Layer Security (HTTPS/TLS).</li>
              <li>Anti-tamper mock exam environments with state verification and secure token expiration.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">
              7. Data Retention & User Rights
            </h2>
            <p>
              We retain your account and exam history for as long as your account remains active. You have the right to review your profile data, request corrections, or request account deletion by reaching out to our support team.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">
              8. Children&apos;s Privacy
            </h2>
            <p>
              Our services are intended for high school and university students preparing for entrance and eligibility tests. We do not knowingly collect personal data from children under the age of 13 without appropriate guardian consent.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-border">
            <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" /> 9. Contact Us
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy, please contact our Data Protection representative at:
            </p>
            <p className="font-medium text-foreground">
              Email: <a href="mailto:privacy@onlychemistry.com" className="text-primary hover:underline">privacy@onlychemistry.com</a>
            </p>
          </section>
        </div>

        {/* Footer link */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Only Chemistry. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-foreground transition-colors underline">Terms of Service</Link>
            <Link href="/" className="hover:text-foreground transition-colors underline">Home</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FlaskConical, ShieldCheck, Scale, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — Only Chemistry",
  description: "Terms of Service and user agreement for Only Chemistry educational platform.",
};

export default function TermsPage() {
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
            <Scale className="h-3.5 w-3.5" /> Legal & Terms
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight mb-3">
            Terms of Service
          </h1>
          <p className="text-muted-foreground text-sm">
            Last Updated: August 2024 • Effective Date: August 2024
          </p>
        </div>

        {/* Content Sections */}
        <div className="prose dark:prose-invert max-w-none space-y-8 text-sm sm:text-base leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
              1. Introduction & Acceptance of Terms
            </h2>
            <p>
              Welcome to <strong>Only Chemistry</strong>. By accessing or using our website, applications, educational content, practice materials, and online mock examination services (collectively, the &quot;Platform&quot;), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree with any part of these Terms, you must discontinue use of the Platform immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">
              2. Eligibility
            </h2>
            <p>
              The Platform is designed for students preparing for competitive chemistry examinations (including JEE Main, JEE Advanced, GATE, MHT-CET, CSIR NET, UGC NET, and SET). By creating an account, you represent that you are at least 13 years of age, or possess legal parental/guardian consent if under the age of majority in your jurisdiction.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">
              3. Account Registration & Security
            </h2>
            <p>
              To access personalized exam sessions, score tracking, and doubt resolution, you must register for an account using accurate and complete information (including a valid name, email address, and mobile number). You are solely responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Maintaining the confidentiality of your login credentials.</li>
              <li>All activities that occur under your account.</li>
              <li>Notifying Only Chemistry immediately of any unauthorized access or security breach.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">
              4. User Responsibilities & Conduct
            </h2>
            <p>
              You agree to use Only Chemistry solely for lawful, academic, and educational preparation purposes. You agree NOT to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Share, redistribute, resell, or publicly publish questions, answers, solutions, or proprietary study materials.</li>
              <li>Engage in automated scraping, reverse engineering, or data extraction from the Platform.</li>
              <li>Circumvent or attempt to disable anti-cheating, fullscreen monitoring, or timing mechanisms during active mock exams.</li>
              <li>Upload malicious code, harmful scripts, or inappropriate content through doubt submission or profile fields.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">
              5. Educational Content & Mock Assessments
            </h2>
            <p>
              All mock exams, tests, chapter notes, video lectures, and explanations provided on Only Chemistry are created for competitive examination practice. While we strive for absolute accuracy in accordance with current exam syllabi, Only Chemistry does not guarantee admission to any institution or specific percentile in official examinations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">
              6. Intellectual Property
            </h2>
            <p>
              All trademarks, logos, chemistry diagrams, illustrations, question formats, interface designs, codebases, and textual content are the exclusive intellectual property of <strong>Only Chemistry</strong> and its creator Omkar Parelkar. No content may be reproduced or distributed without explicit prior written authorization.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">
              7. Payments & Subscriptions
            </h2>
            <p>
              Certain premium test series or specialized courses may require payment. All fees are clearly displayed prior to purchase. Access to paid material is provided for the designated duration of the examination cycle. Refund requests are subject to our verified review policies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">
              8. Account Suspension & Termination
            </h2>
            <p>
              Only Chemistry reserves the right to suspend, limit, or terminate user accounts that violate these Terms, engage in fraudulent activity, or disrupt other students&apos; learning experience without prior notice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">
              9. Disclaimer of Warranties & Limitation of Liability
            </h2>
            <p>
              The Platform is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. Only Chemistry disclaims all warranties of any kind, whether express or implied. In no event shall Only Chemistry be liable for indirect, incidental, special, or consequential damages resulting from the use or inability to use the Platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-display font-bold text-foreground">
              10. Changes to Terms
            </h2>
            <p>
              We may update these Terms from time to time. Continued use of Only Chemistry after revisions are posted constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-border">
            <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> 11. Contact Information
            </h2>
            <p>
              If you have any questions or feedback regarding these Terms of Service, please contact our support team at:
            </p>
            <p className="font-medium text-foreground">
              Email: <a href="mailto:support@onlychemistry.com" className="text-primary hover:underline">support@onlychemistry.com</a>
            </p>
          </section>
        </div>

        {/* Footer link */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Only Chemistry. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors underline">Privacy Policy</Link>
            <Link href="/" className="hover:text-foreground transition-colors underline">Home</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, BookOpen, Shield, Trophy, Users, Zap, ChevronRight, Star, Award, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXAM_CATEGORIES, ROUTES } from "@/constants";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as any } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Navbar ─────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/10">
        <div className="section-container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <FlaskConical className="h-7 w-7 text-gold-400" />
            <span className="font-display font-bold text-lg text-white">
              Only<span className="text-gold-400">Chemistry</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#categories" className="hover:text-white transition-colors">Exams</Link>
            <Link href="#about" className="hover:text-white transition-colors">About</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href={ROUTES.LOGIN}>
              <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-white/10">
                Login
              </Button>
            </Link>
            <Link href={ROUTES.REGISTER}>
              <Button variant="gold" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden pt-24 pb-20 lg:pt-32 lg:pb-32">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-navy-400/20 rounded-full blur-3xl animate-float delay-300" />
          <div className="absolute top-10 right-10 text-white/5 text-[200px] font-display font-black select-none">
            H₂O
          </div>
        </div>

        <div className="section-container relative">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/20 border border-gold-500/30 text-gold-300 text-sm font-medium mb-6">
                <Star className="h-4 w-4" />
                India&apos;s Premier Chemistry Education Platform
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-5xl lg:text-7xl font-display font-black text-white leading-tight mb-6"
            >
              Master Chemistry.{" "}
              <span className="gradient-text">Ace Every Exam.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Professional exam preparation for JEE Main, JEE Advanced, GATE, MHT-CET, CSIR NET, UGC NET & SET.
              Powered by expert chemistry faculty at Only Chemistry.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={ROUTES.REGISTER}>
                <Button variant="gold" size="xl" className="group">
                  Start Your Journey
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#categories">
                <Button
                  variant="outline"
                  size="xl"
                  className="border-white/20 text-white hover:bg-white/10 hover:text-white"
                >
                  Browse Exams
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={stagger}
              className="grid grid-cols-3 gap-6 mt-16 max-w-lg mx-auto"
            >
              {[
                { value: "10,000+", label: "Students" },
                { value: "500+", label: "Practice Exams" },
                { value: "98%", label: "Success Rate" },
              ].map((stat) => (
                <motion.div key={stat.label} variants={fadeUp} className="text-center">
                  <div className="text-2xl md:text-3xl font-display font-black text-gold-400">
                    {stat.value}
                  </div>
                  <div className="text-sm text-white/60 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Exam Categories ──────────────────────────── */}
      <section id="categories" className="py-20 bg-background">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-black text-foreground mb-4">
              Exam <span className="gradient-text-navy dark:gradient-text">Categories</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Comprehensive preparation for all major competitive chemistry examinations
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {EXAM_CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.value}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`${ROUTES.STUDENT.EXAMS}?category=${encodeURIComponent(cat.value)}`}>
                  <div className="group p-5 rounded-2xl border border-border bg-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      {cat.icon}
                    </div>
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {cat.label}
                    </h3>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground group-hover:text-primary/70 transition-colors">
                      <span>Explore</span>
                      <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-black text-foreground mb-4">
              Why Choose <span className="gradient-text-navy dark:gradient-text">Only Chemistry?</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Shield className="h-7 w-7" />,
                title: "Secure Examination",
                desc: "TCS iON-grade security with fullscreen enforcement, tab monitoring, anti-cheat systems, and auto-submission.",
                color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
              },
              {
                icon: <BookOpen className="h-7 w-7" />,
                title: "Chemistry-Focused",
                desc: "Full support for chemical formulas, molecular structures, organic chemistry diagrams, and scientific notation.",
                color: "text-green-600 bg-green-100 dark:bg-green-900/30",
              },
              {
                icon: <Trophy className="h-7 w-7" />,
                title: "Detailed Analytics",
                desc: "Track your performance with detailed score reports, question-wise analysis, time management insights.",
                color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30",
              },
              {
                icon: <Users className="h-7 w-7" />,
                title: "Expert Q&A Support",
                desc: "Private doubt resolution system — ask questions and get personalized replies from chemistry experts.",
                color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
              },
              {
                icon: <Zap className="h-7 w-7" />,
                title: "Adaptive Timing",
                desc: "Smart timer system with per-question time allocation, overall countdown, and auto-save responses.",
                color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
              },
              {
                icon: <Award className="h-7 w-7" />,
                title: "Category-Based Access",
                desc: "Access exams and videos based on your assigned course categories. Admin-controlled access ensures you always see relevant content for your preparation.",
                color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────── */}
      <section className="py-20 hero-gradient">
        <div className="section-container text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-display font-black text-white mb-6">
              Ready to Start Your{" "}
              <span className="gradient-text">Chemistry Journey?</span>
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of students preparing for their dream careers with Only Chemistry.
            </p>
            <Link href={ROUTES.REGISTER}>
              <Button variant="gold" size="xl" className="group">
                Create Free Account
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="bg-navy-950 py-10">
        <div className="section-container flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-gold-400" />
            <span className="font-display font-bold text-white">
              Only<span className="text-gold-400">Chemistry</span>
            </span>
          </div>
          <div className="text-center">
            <p className="text-white/40 text-sm">
              © {new Date().getFullYear()} Only Chemistry. All rights reserved.
            </p>
            <p className="text-white/30 text-xs mt-1">Website created by Omkar Parelkar.</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-white/40">
            <Link href="#" className="hover:text-white/70 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white/70 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white/70 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

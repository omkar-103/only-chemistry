"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Mail, Shield, FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/constants";
import { toast } from "@/hooks/useToast";

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);

  const saveSettings = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast({ title: "Settings saved", variant: "success" });
  };

  const SECTIONS = [
    {
      icon: FlaskConical,
      title: "Platform Information",
      description: "Basic platform branding and configuration",
      fields: [
        { id: "site-name", label: "Site Name", value: APP_NAME, type: "text" },
        { id: "site-tagline", label: "Tagline", value: "Premier Chemistry Education Platform", type: "text" },
        { id: "contact-email", label: "Contact Email", value: "admin@onlychemistry.com", type: "email" },
        { id: "support-mobile", label: "Support Mobile", value: "+91 9000000000", type: "tel" },
      ],
    },
    {
      icon: Mail,
      title: "Email Configuration",
      description: "SMTP settings for OTP and notification emails",
      fields: [
        { id: "smtp-host", label: "SMTP Host", value: "smtp.gmail.com", type: "text" },
        { id: "smtp-port", label: "SMTP Port", value: "587", type: "number" },
        { id: "smtp-user", label: "SMTP Username", value: "noreply@onlychemistry.com", type: "email" },
        { id: "smtp-pass", label: "SMTP Password", value: "", type: "password" },
      ],
    },
    {
      icon: Shield,
      title: "Security Settings",
      description: "Authentication and security configuration",
      fields: [
        { id: "max-tab-switches", label: "Max Tab Switches (before auto-submit)", value: "2", type: "number" },
        { id: "session-timeout", label: "Session Timeout (minutes)", value: "60", type: "number" },
        { id: "otp-expiry", label: "OTP Expiry (minutes)", value: "10", type: "number" },
      ],
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground">Platform Settings</h1>
          <p className="text-muted-foreground text-sm">Configure platform-wide settings</p>
        </div>
        <Button variant="gold" onClick={saveSettings} isLoading={saving} loadingText="Saving..." className="gap-2" id="save-settings">
          <Save className="h-4 w-4" />
          Save All Changes
        </Button>
      </div>

      {/* Environment Variables Notice */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <p className="text-sm text-amber-800 dark:text-amber-400 font-medium">
          ⚠️ Sensitive values (API keys, passwords) should be set in{" "}
          <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">.env.local</code>{" "}
          and will not be shown here.
        </p>
      </div>

      {SECTIONS.map((section) => {
        const Icon = section.icon;
        return (
          <Card key={section.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {section.fields.map((f) => (
                  <Input
                    key={f.id}
                    id={f.id}
                    label={f.label}
                    type={f.type}
                    defaultValue={f.value}
                    placeholder={f.type === "password" ? "Set in .env.local" : f.value || `Enter ${f.label.toLowerCase()}`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions — proceed with extreme caution</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: "Clear All Audit Logs", desc: "Permanently delete all security and activity logs" },
              { label: "Reset Platform Cache", desc: "Clear server-side caches (safe, no data loss)" },
            ].map((action) => (
              <div key={action.label} className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/20">
                <div>
                  <p className="text-sm font-semibold text-foreground">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                  onClick={() => toast({ title: "Action requires confirmation in production", variant: "error" })}
                >
                  Execute
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

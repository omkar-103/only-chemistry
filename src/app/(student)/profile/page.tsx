"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Shield, Save, Key, BookOpen, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import axios from "axios";

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [showPwSection, setShowPwSection] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || "",
    mobile: user?.mobile || "",
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const saveProfile = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "error" });
      return;
    }
    setSaving(true);
    try {
      const r = await axios.patch("/api/user/profile", form);
      updateUser?.({ name: form.name, mobile: form.mobile });
      toast({ title: "Profile updated successfully!", variant: "success" });
    } catch (e: any) {
      toast({ title: e.response?.data?.message || "Update failed", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) {
      toast({ title: "All password fields are required", variant: "error" });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast({ title: "New passwords do not match", variant: "error" });
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "error" });
      return;
    }
    setChangingPw(true);
    try {
      await axios.post("/api/user/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast({
        title: "Password changed!",
        description: "Other active sessions will be logged out.",
        variant: "success",
      });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPwSection(false);
    } catch (e: any) {
      toast({ title: e.response?.data?.message || "Failed to change password", variant: "error" });
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5 max-w-2xl">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-display font-black text-foreground">My Profile</h1>
        <p className="text-muted-foreground text-sm">Manage your account details and security</p>
      </motion.div>

      {/* Avatar Card */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-2xl font-black shadow-lg">
                {user?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div>
                <h2 className="font-bold text-lg text-foreground">{user?.name}</h2>
                <p className="text-muted-foreground text-sm">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold capitalize">
                  {user?.role}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                id="profile-name"
                label="Full Name"
                placeholder="Your full name"
                leftIcon={<User className="h-4 w-4" />}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />

              {/* Email — read-only */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Email Address
                </label>
                <div className="flex h-11 items-center gap-2 px-3 rounded-lg border border-input bg-muted/40 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground flex-1">{user?.email}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium shrink-0">
                    Verified
                  </span>
                </div>
              </div>

              <Input
                id="profile-mobile"
                label="Mobile Number"
                placeholder="10-digit mobile number"
                leftIcon={<Phone className="h-4 w-4" />}
                value={form.mobile}
                onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))}
                maxLength={10}
              />

              <Button
                variant="gold"
                onClick={saveProfile}
                isLoading={saving}
                loadingText="Saving..."
                id="save-profile"
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Change Password */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Change Password
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPwSection(!showPwSection)}
                className="text-xs"
                id="toggle-pw-section"
              >
                <Key className="h-3.5 w-3.5 mr-1.5" />
                {showPwSection ? "Cancel" : "Change Password"}
              </Button>
            </div>
          </CardHeader>

          {showPwSection && (
            <CardContent className="space-y-4 pt-0">
              <Input
                id="current-password"
                label="Current Password"
                type="password"
                placeholder="Your current password"
                leftIcon={<Shield className="h-4 w-4" />}
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
              />
              <Input
                id="new-password"
                label="New Password"
                type="password"
                placeholder="Min 8 chars, uppercase, number, special char"
                leftIcon={<Key className="h-4 w-4" />}
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                hint="At least 8 characters with uppercase, number, and special character"
              />
              <Input
                id="confirm-new-password"
                label="Confirm New Password"
                type="password"
                placeholder="Repeat new password"
                leftIcon={<Key className="h-4 w-4" />}
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              />
              <Button
                variant="default"
                onClick={changePassword}
                isLoading={changingPw}
                loadingText="Changing..."
                id="change-password"
                className="gap-2"
              >
                <Shield className="h-4 w-4" />
                Update Password
              </Button>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* Account Info */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {[
                ["Account ID", user?._id ? `${user._id.toString().slice(0, 8)}...` : "—"],
                ["Role", user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "—"],
                ["Account Status", user?.isActive !== false ? "✅ Active" : "⛔ Suspended"],
                ["Email Verified", user?.isVerified ? "✅ Yes" : "❌ No"],
              ].map(([key, val]) => (
                <div key={String(key)} className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{key}</span>
                  <span className="text-sm font-medium text-foreground">{String(val)}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 border-destructive/30"
                id="logout-profile"
              >
                <LogOut className="h-4 w-4" />
                Sign Out of Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

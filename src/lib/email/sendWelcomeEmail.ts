// ============================================================
// sendWelcomeEmail — Called once after a new student is created in MongoDB.
// ONLY for first-time manual registration. Never called on login.
// ============================================================
import { sendMail } from "@/lib/email/mailer";
import { welcomeEmailHtml, welcomeEmailText } from "@/lib/email/templates/welcome";

/**
 * Send the welcome/registration confirmation email.
 *
 * Must only be called AFTER User.create() has succeeded in MongoDB.
 * On email failure: logs safely and returns { success: false }.
 *                   The MongoDB account is NOT rolled back.
 */
export async function sendWelcomeEmail(
  name: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  console.log("[EMAIL DEBUG] Registration welcome email requested");
  console.log(`[EMAIL DEBUG] Recipient: ${email}`);
  console.log("[EMAIL DEBUG] Template: welcome-registration");

  try {
    const result = await sendMail({
      to: email,
      subject: "Welcome to OnlyChemistry!",
      html: welcomeEmailHtml(name, email),
      text: welcomeEmailText(name, email),
    });

    if (result.success) {
      console.log("[EMAIL DEBUG] Welcome email sent successfully");
    } else {
      console.error("[EMAIL ERROR] Welcome email failed");
      console.error(`[EMAIL ERROR] Message: ${result.error}`);
    }

    return result;
  } catch (err: any) {
    console.error("[EMAIL ERROR] Welcome email failed unexpectedly");
    console.error(`[EMAIL ERROR] Message: ${err?.message || "Unknown error"}`);
    return { success: false, error: err?.message };
  }
}

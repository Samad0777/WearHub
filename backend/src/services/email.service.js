const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// If EMAIL_HOST isn't configured (e.g. local dev without a real SMTP
// account yet), we fall back to logging the email to the console instead
// of crashing. This keeps the rest of the auth flow testable without
// needing real email credentials.
const isEmailConfigured = Boolean(process.env.EMAIL_HOST);

const transporter = isEmailConfigured
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })
  : null;

function renderTemplate(templateName, variables) {
  const filePath = path.join(__dirname, "..", "templates", templateName);
  let html = fs.readFileSync(filePath, "utf-8");
  for (const [key, value] of Object.entries(variables)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }
  return html;
}

async function sendEmail({ to, subject, html }) {
  if (!isEmailConfigured) {
    console.log(`[EMAIL - not sent, no SMTP configured] To: ${to} | Subject: ${subject}`);
    console.log(html);
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

async function sendVerificationEmail(user, rawToken) {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;
  const html = renderTemplate("verifyEmail.html", { name: user.name, verifyUrl });
  await sendEmail({ to: user.email, subject: "Verify your email", html });
}

async function sendPasswordResetEmail(user, rawToken) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
  const html = renderTemplate("resetPassword.html", { name: user.name, resetUrl });
  await sendEmail({ to: user.email, subject: "Reset your password", html });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };

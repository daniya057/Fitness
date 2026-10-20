const { sendSmtpMail, smtpConfigured } = require("./smtp");

function mailConfigured() {
  return Boolean(String(process.env.RESEND_API_KEY || "").trim()) || smtpConfigured();
}

async function sendResend({ to, from, subject, html, text }) {
  const key = String(process.env.RESEND_API_KEY || "").trim();
  if (!key) {
    return { sent: false, reason: "no_key" };
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });
  if (response.ok) {
    return { sent: true };
  }
  const body = await response.text().catch(() => "");
  console.error("письмо resend:", response.status, body.slice(0, 300));
  return { sent: false, reason: "api" };
}

async function sendCodeEmail({ to, code, kind }) {
  const from = String(process.env.MAIL_FROM || "Fitness <onboarding@resend.dev>").trim();
  const subject = kind === "reset" ? "Код для нового пароля" : "Код для почты";
  const text = `Код: ${code}\nДействует 15 минут.`;
  const html = `<p>Код: <strong style="letter-spacing:4px">${code}</strong></p><p>15 минут.</p>`;

  if (smtpConfigured()) {
    try {
      await sendSmtpMail({ from, to, subject, text });
      return { sent: true };
    } catch (error) {
      console.error("письмо smtp:", error.message);
    }
  }
  const resend = await sendResend({ to, from, subject, html, text });
  if (resend.sent) {
    return resend;
  }
  return { sent: false, reason: resend.reason || "fail" };
}

module.exports = { mailConfigured, sendCodeEmail };

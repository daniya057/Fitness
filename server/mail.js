function mailConfigured() {
  return Boolean(String(process.env.RESEND_API_KEY || "").trim());
}

async function sendCodeEmail({ to, code, kind }) {
  const key = String(process.env.RESEND_API_KEY || "").trim();
  if (!key) {
    return { sent: false, reason: "no_key" };
  }
  const from = String(process.env.MAIL_FROM || "Fitness <onboarding@resend.dev>").trim();
  const subject = kind === "reset" ? "Код для нового пароля" : "Код для почты";
  const text = `Код: ${code}\nДействует 15 минут.`;
  const html = `<p>Код: <strong style="letter-spacing:4px">${code}</strong></p><p>15 минут.</p>`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });
  if (!response.ok) {
    console.error("письмо:", response.status);
    return { sent: false, reason: "api" };
  }
  return { sent: true };
}

module.exports = { mailConfigured, sendCodeEmail };

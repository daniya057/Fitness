const tls = require("tls");

function smtpConfigured() {
  return Boolean(String(process.env.MAIL_SMTP_HOST || "").trim() && String(process.env.MAIL_SMTP_USER || "").trim() && String(process.env.MAIL_SMTP_PASS || "").trim());
}

function mailbox(raw) {
  const text = String(raw || "").trim();
  const wrapped = text.match(/<([^>]+)>/);
  return (wrapped ? wrapped[1] : text).trim();
}

function b64(value) {
  return Buffer.from(String(value), "utf8").toString("base64");
}

function sendSmtpMail({ from, to, subject, text }) {
  const host = String(process.env.MAIL_SMTP_HOST || "").trim();
  const port = Number(process.env.MAIL_SMTP_PORT) || 465;
  const user = String(process.env.MAIL_SMTP_USER || "").trim();
  const pass = String(process.env.MAIL_SMTP_PASS || "").trim();
  const sender = mailbox(from) || user;
  const target = mailbox(to);
  if (!host || !user || !pass || !sender || !target) {
    return Promise.reject(new Error("smtp"));
  }

  const envelope = [
    `From: ${from}`,
    `To: ${target}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    text,
    ".",
  ].join("\r\n");

  return new Promise((resolve, reject) => {
    let step = 0;
    let buffer = "";
    const socket = tls.connect({ host, port, servername: host }, () => {});
    const fail = (message) => {
      socket.destroy();
      reject(new Error(message));
    };
    const write = (line) => {
      socket.write(`${line}\r\n`);
    };

    socket.setEncoding("utf8");
    socket.setTimeout(15000);
    socket.on("timeout", () => fail("smtp timeout"));
    socket.on("error", (error) => fail(error.message || "smtp"));
    socket.on("data", (chunk) => {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line || line[3] === "-") {
          continue;
        }
        const code = Number(line.slice(0, 3));
        if (step === 0) {
          if (code !== 220) {
            fail(`smtp ${code}`);
            return;
          }
          write(`EHLO fitness`);
          step = 1;
        } else if (step === 1) {
          if (code !== 250) {
            fail(`ehlo ${code}`);
            return;
          }
          write("AUTH LOGIN");
          step = 2;
        } else if (step === 2) {
          if (code !== 334) {
            fail(`auth ${code}`);
            return;
          }
          write(b64(user));
          step = 3;
        } else if (step === 3) {
          if (code !== 334) {
            fail(`user ${code}`);
            return;
          }
          write(b64(pass));
          step = 4;
        } else if (step === 4) {
          if (code !== 235) {
            fail(`login ${code}`);
            return;
          }
          write(`MAIL FROM:<${sender}>`);
          step = 5;
        } else if (step === 5) {
          if (code !== 250) {
            fail(`from ${code}`);
            return;
          }
          write(`RCPT TO:<${target}>`);
          step = 6;
        } else if (step === 6) {
          if (code !== 250 && code !== 251) {
            fail(`to ${code}`);
            return;
          }
          write("DATA");
          step = 7;
        } else if (step === 7) {
          if (code !== 354) {
            fail(`data ${code}`);
            return;
          }
          write(envelope);
          step = 8;
        } else if (step === 8) {
          if (code !== 250) {
            fail(`send ${code}`);
            return;
          }
          write("QUIT");
          step = 9;
        } else if (step === 9) {
          socket.end();
          resolve();
        }
      }
    });
  });
}

module.exports = { smtpConfigured, sendSmtpMail };

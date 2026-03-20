import nodemailer from "nodemailer";

function getNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const SMTP_CONNECTION_TIMEOUT_MS = getNumberEnv("SMTP_CONNECTION_TIMEOUT_MS", 6000);
const SMTP_GREETING_TIMEOUT_MS = getNumberEnv("SMTP_GREETING_TIMEOUT_MS", 6000);
const SMTP_SOCKET_TIMEOUT_MS = getNumberEnv("SMTP_SOCKET_TIMEOUT_MS", 8000);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true,
  connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
  greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
  socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
});

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP não configurado. Ignorando envio de e-mail de verificação.");
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@incherry.com.br",
      to: email,
      subject: "Código de Verificação - InCherry Awards",
      html: `<p>Seu código de verificação é: <strong>${code}</strong></p>`
    });
    return true;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP não configurado. Ignorando envio de e-mail de boas-vindas.");
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@incherry.com.br",
      to: email,
      subject: "Bem-vindo ao InCherry Awards!",
      html: `
        <h2>Olá ${name}!</h2>
        <p>Sua conta foi criada com sucesso.</p>
        <p>Aproveite nossa plataforma!</p>
      `,
    });
    return true;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return false;
  }
}
import { VerificationChannel } from '@/core/auth/contracts/verification-channel';
import { getRequiredEnv } from '@/core/shared/env';

export class EmailWebhookAdapter implements VerificationChannel {
  async sendVerificationCode(recipient: string, code: string): Promise<void> {
    const endpoint = getRequiredEnv('EMAIL_PROVIDER_WEBHOOK_URL');
    const token = process.env.EMAIL_PROVIDER_WEBHOOK_TOKEN;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        to: recipient,
        subject: 'Seu codigo de verificacao',
        html: `<p>Seu codigo de verificacao e: <strong>${code}</strong></p>`,
        metadata: { purpose: 'auth_otp_email' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Email provider request failed: ${response.status} ${errorText}`);
    }
  }
}

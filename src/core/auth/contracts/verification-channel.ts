export interface VerificationChannel {
  sendVerificationCode(recipient: string, code: string): Promise<void>;
}
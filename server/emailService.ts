import { randomBytes } from 'crypto';

interface OneSignalEmailResponse {
  id: string;
  recipients: number;
}

class EmailService {
  private appId: string;
  private apiKey: string;
  private resetTokens: Map<string, { userId: string; expires: Date }> = new Map();

  constructor() {
    this.appId = process.env.ONESIGNAL_APP_ID || '';
    this.apiKey = process.env.ONESIGNAL_API_KEY || '';
    
    if (!this.appId || !this.apiKey) {
      console.error('OneSignal credentials not found in environment variables');
    }
  }

  generateResetToken(userId: string): string {
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Clean up expired tokens
    this.cleanupExpiredTokens();
    
    this.resetTokens.set(token, { userId, expires });
    return token;
  }

  validateResetToken(token: string): string | null {
    const tokenData = this.resetTokens.get(token);
    
    if (!tokenData) {
      return null;
    }
    
    if (tokenData.expires < new Date()) {
      this.resetTokens.delete(token);
      return null;
    }
    
    return tokenData.userId;
  }

  consumeResetToken(token: string): boolean {
    const userId = this.validateResetToken(token);
    if (userId) {
      this.resetTokens.delete(token);
      return true;
    }
    return false;
  }

  private cleanupExpiredTokens(): void {
    const now = new Date();
    const tokensToDelete: string[] = [];
    
    this.resetTokens.forEach((data, token) => {
      if (data.expires < now) {
        tokensToDelete.push(token);
      }
    });
    
    tokensToDelete.forEach(token => {
      this.resetTokens.delete(token);
    });
  }

  async sendPasswordResetEmail(email: string, username: string, resetToken: string): Promise<boolean> {
    if (!this.appId || !this.apiKey) {
      console.error('OneSignal credentials not configured');
      return false;
    }

    const resetUrl = `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
    
    const emailData = {
      app_id: this.appId,
      template_id: undefined, // We'll use custom content
      email_subject: "ANETI - Redefinir Senha",
      email_body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e40af; margin: 0;">ANETI</h1>
              <p style="color: #6b7280; margin: 5px 0 0 0;">Associação Nacional dos Especialistas em TI</p>
            </div>
            
            <h2 style="color: #374151; margin-bottom: 20px;">Redefinir Senha</h2>
            
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
              Olá <strong>${username}</strong>,
            </p>
            
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
              Você solicitou a redefinição de sua senha na plataforma ANETI. Clique no botão abaixo para criar uma nova senha:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Redefinir Senha
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 10px;">
              Se você não conseguir clicar no botão, copie e cole este link no seu navegador:
            </p>
            <p style="color: #1e40af; font-size: 14px; word-break: break-all; margin-bottom: 20px;">
              ${resetUrl}
            </p>
            
            <p style="color: #ef4444; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              <strong>Importante:</strong> Este link expira em 15 minutos por segurança.
            </p>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              Se você não solicitou esta redefinição de senha, ignore este e-mail. Sua senha permanecerá inalterada.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              ANETI - Conectando profissionais de TI
            </p>
          </div>
        </div>
      `,
      email_from_name: "ANETI",
      email_from_address: "noreply@aneti.org.br",
      include_email_tokens: [email]
    };

    try {
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.apiKey}`
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        const result: OneSignalEmailResponse = await response.json();
        console.log(`Password reset email sent successfully. ID: ${result.id}, Recipients: ${result.recipients}`);
        return true;
      } else {
        const errorText = await response.text();
        console.error('Failed to send email via OneSignal:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('Error sending email via OneSignal:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
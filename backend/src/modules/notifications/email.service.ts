import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT || '2525', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'testuser',
        pass: process.env.SMTP_PASS || 'testpass',
      },
    });
  }

  async sendEmail(to: string, subject: string, text: string, html?: string) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"SaaS UEMOA Admin" <noreply@saas-uemoa.com>',
        to,
        subject,
        text,
        html: html || text,
      });
      this.logger.log(`Email sent: ${info.messageId}`);
    } catch (error) {
      this.logger.error('Error sending email', error);
    }
  }
}

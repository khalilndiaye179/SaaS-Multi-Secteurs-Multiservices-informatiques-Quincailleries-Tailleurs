import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';
import { EmailService } from './email.service';

interface OtpStoreItem {
  hashedOtp: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

@Injectable()
export class EmailOtpService {
  // In-Memory Secure Cache avec TTL (En environnement distribué, Redis prend le relais)
  private otpCache = new Map<string, OtpStoreItem>();

  constructor(private emailService: EmailService) {}

  /**
   * Hashage cryptographique de l'OTP
   */
  private hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  /**
   * Génération et envoi d'un OTP sécurisé par email
   */
  async sendOtp(email: string): Promise<{ success: boolean; message: string }> {
    const now = Date.now();
    const existing = this.otpCache.get(email);

    // 🔒 SECURITE 1 : Anti-Resend Flooding (60 secondes d'attente minimale)
    if (existing && now - existing.lastSentAt < 60000) {
      const waitSeconds = Math.ceil((60000 - (now - existing.lastSentAt)) / 1000);
      throw new HttpException(
        `Veuillez patienter ${waitSeconds} seconde(s) avant de demander un nouveau code OTP.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 🔒 SECURITE 2 : Génération cryptographique sûre à 6 chiffres
    const randomBuffer = crypto.randomBytes(4);
    const num = randomBuffer.readUInt32BE(0) % 1000000;
    const otp = num.toString().padStart(6, '0');
    const hashedOtp = this.hashOtp(otp);

    const ttlMs = 5 * 60 * 1000; // Expiration 5 minutes
    const expiresAt = now + ttlMs;

    this.otpCache.set(email, {
      hashedOtp,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
    });

    const subject = 'Code de vérification - KPSyDesk';
    const text = `Votre code de vérification KPSyDesk est : ${otp}. Il expire dans 5 minutes. Ne le communiquez à personne.`;
    
    // Appel à l'EmailService pour envoyer l'OTP
    await this.emailService.sendEmail(email, subject, text);

    return {
      success: true,
      message: 'Un code de vérification a été envoyé à votre adresse email.',
    };
  }

  /**
   * Vérification de l'OTP avec protection contre le bruteforce et timing attacks
   */
  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const record = this.otpCache.get(email);

    if (!record) {
      throw new HttpException('Code invalide ou expiré.', HttpStatus.BAD_REQUEST);
    }

    if (Date.now() > record.expiresAt) {
      this.otpCache.delete(email);
      throw new HttpException('Code expiré. Veuillez en demander un nouveau.', HttpStatus.BAD_REQUEST);
    }

    // 🔒 SECURITE 3 : Anti-Bruteforce (Max 5 tentatives)
    if (record.attempts >= 5) {
      this.otpCache.delete(email);
      throw new HttpException('Trop de tentatives échouées. Code invalidé.', HttpStatus.FORBIDDEN);
    }

    const hashedInput = this.hashOtp(otp);

    // 🔒 SECURITE 4 : Comparaison à temps constant pour éviter les timing attacks
    const bufferDb = Buffer.from(record.hashedOtp);
    const bufferInput = Buffer.from(hashedInput);

    // Obligé de vérifier la taille avant timingSafeEqual pour éviter une exception
    let isMatch = false;
    if (bufferDb.length === bufferInput.length) {
      isMatch = crypto.timingSafeEqual(bufferDb, bufferInput);
    }

    if (!isMatch) {
      record.attempts += 1;
      this.otpCache.set(email, record);
      throw new HttpException('Code incorrect.', HttpStatus.BAD_REQUEST);
    }

    // 🔒 SECURITE 5 : Usage unique (OTP jetable)
    this.otpCache.delete(email);

    return true;
  }
}

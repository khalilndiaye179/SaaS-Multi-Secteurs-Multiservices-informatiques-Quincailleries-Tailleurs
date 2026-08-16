import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService implements OnModuleInit {
  private readonly logger = new Logger(EncryptionService.name);
  private key: Buffer;

  onModuleInit() {
    const rawKey = process.env.ENCRYPTION_KEY;
    if (!rawKey) {
      throw new Error(
        '[EncryptionService] CRITICAL: ENCRYPTION_KEY environment variable is not defined. ' +
        'The backend refuses to start without an explicit encryption key. ' +
        'Set ENCRYPTION_KEY in your docker-compose.yml or .env file.'
      );
    }
    
    // Clé dérivée avec SHA-256 pour garantir exactement 32 octets (256 bits)
    this.key = crypto.createHash('sha256').update(rawKey).digest();
    this.logger.log('EncryptionService initialized — AES-256-GCM key loaded from environment.');
  }

  /**
   * Chiffre une chaîne en AES-256-GCM
   * Format produit : v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>
   */
  encrypt(plaintext: string): string {
    if (!plaintext) return '';
    try {
      const iv = crypto.randomBytes(12); // IV de 96 bits recommandé pour AES-GCM
      const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag().toString('hex');

      return `v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new Error('Encryption operation failed');
    }
  }

  /**
   * Déchiffre une chaîne au format v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>
   */
  decrypt(ciphertextFormat: string): string {
    if (!ciphertextFormat) return '';
    
    try {
      const parts = ciphertextFormat.split(':');
      if (parts.length !== 4 || parts[0] !== 'v1') {
        throw new Error('Invalid ciphertext format');
      }

      const iv = Buffer.from(parts[1], 'hex');
      const authTag = Buffer.from(parts[2], 'hex');
      const encryptedText = parts[3];

      const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed or invalid payload', error);
      throw new Error('Decryption operation failed');
    }
  }
}

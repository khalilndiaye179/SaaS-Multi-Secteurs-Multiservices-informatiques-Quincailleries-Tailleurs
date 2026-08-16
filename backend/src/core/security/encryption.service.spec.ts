import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';

describe('EncryptionService (AES-256-GCM)', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    process.env.ENCRYPTION_KEY = 'test_secret_key_exact_32_bytes_length!';
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptionService],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
    service.onModuleInit();
  });

  it('1. Encrypt et Decrypt reussissent et restituent le plaintext original', () => {
    const originalText = 'sk_live_wave_secret_key_123456789';
    const encrypted = service.encrypt(originalText);
    expect(encrypted).not.toBe(originalText);
    expect(encrypted).toMatch(/^v1:[0-[#a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/);

    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(originalText);
  });

  it('2. Deux encryptions du meme secret produisent des ciphertexts differents (IV aleatoire)', () => {
    const originalText = 'same_secret_payload';
    const encrypted1 = service.encrypt(originalText);
    const encrypted2 = service.encrypt(originalText);

    expect(encrypted1).not.toBe(encrypted2);
    expect(service.decrypt(encrypted1)).toBe(originalText);
    expect(service.decrypt(encrypted2)).toBe(originalText);
  });

  it('3. Alteration du ciphertext provoque l\'echec du dechiffrement (Authentication Tag fail)', () => {
    const originalText = 'sensitive_api_key';
    const encrypted = service.encrypt(originalText);
    const parts = encrypted.split(':');

    // Corrompt le ciphertext
    parts[3] = parts[3].substring(0, parts[3].length - 2) + 'ff';
    const tampered = parts.join(':');

    expect(() => service.decrypt(tampered)).toThrow('Decryption operation failed');
  });

  it('4. Alteration de l\'authTag provoque l\'echec du dechiffrement', () => {
    const originalText = 'sensitive_api_key';
    const encrypted = service.encrypt(originalText);
    const parts = encrypted.split(':');

    // Corrompt l'authTag
    parts[2] = '00000000000000000000000000000000';
    const tampered = parts.join(':');

    expect(() => service.decrypt(tampered)).toThrow('Decryption operation failed');
  });

  it('5. Secret vide ou null retourne une chaine vide de maniere securisee', () => {
    expect(service.encrypt('')).toBe('');
    expect(service.decrypt('')).toBe('');
  });
});

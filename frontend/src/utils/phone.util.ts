/**
 * Utilitaire de normalisation des numéros de téléphone sénégalais vers le format E.164 (sans symbole +)
 * Exemple: "+221 77 987 65 43" -> "221779876543"
 */
export function normalizeSenegalPhone(phoneRaw?: string | null): string | null {
  if (!phoneRaw) return null;

  // 1. Suppression de tous les caractères non numériques
  let digits = phoneRaw.replace(/\D/g, '');

  // 2. Gestion des indicatifs
  if (digits.startsWith('00221')) {
    digits = digits.substring(2);
  }

  // Si le numéro a 9 chiffres et commence par un préfixe mobile/fixe sénégalais (77, 78, 76, 75, 70, 33)
  if (digits.length === 9 && /^(77|78|76|75|70|33)/.test(digits)) {
    digits = '221' + digits;
  }

  // 3. Validation finale : 12 chiffres au total (221 + 9 chiffres)
  if (digits.length === 12 && digits.startsWith('221')) {
    return digits;
  }

  return null;
}

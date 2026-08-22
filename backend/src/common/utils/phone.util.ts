import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

/**
 * Utilitaire backend de normalisation des numéros de téléphone sénégalais vers le format E.164 (sans symbole +)
 * Exemple: "+221 77 987 65 43" -> "221779876543"
 */
export function normalizeSenegalPhone(phoneRaw?: string | null): string | null {
  if (!phoneRaw) return null;

  let digits = phoneRaw.replace(/\D/g, '');

  if (digits.startsWith('00221')) {
    digits = digits.substring(2);
  }

  if (digits.length === 9 && /^(77|78|76|75|70|33)/.test(digits)) {
    digits = '221' + digits;
  }

  if (digits.length === 12 && digits.startsWith('221')) {
    return digits;
  }

  return null;
}

@ValidatorConstraint({ async: false })
export class IsSenegalPhoneConstraint implements ValidatorConstraintInterface {
  validate(phone: any, args: ValidationArguments) {
    return normalizeSenegalPhone(phone) !== null;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Numéro de téléphone invalide, format attendu : 77XXXXXXX ou +221XXXXXXXXX';
  }
}

export function IsSenegalPhone(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSenegalPhoneConstraint,
    });
  };
}

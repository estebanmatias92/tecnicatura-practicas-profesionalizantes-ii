export type Locale = 'es' | 'en';

export const DEFAULT_LOCALE: Locale = 'es';

export const SUPPORTED_LOCALES: readonly Locale[] = ['es', 'en'];

export const RESOURCE_INVALID_KEY = 'validation.resource.invalid';

const es = {
  'validation.email.invalid': 'El email no tiene un formato válido',
  'validation.email.too-long': 'El email no puede superar los {max} caracteres',
  'validation.password.too-short': 'La contraseña debe tener al menos {min} caracteres',
  'validation.password.too-long': 'La contraseña no puede superar los {max} caracteres',
  'validation.password.empty': 'La contraseña no puede ser vacía',
  'validation.password.not-string': 'La contraseña debe ser un texto',
  [RESOURCE_INVALID_KEY]: 'Recurso inválido',
} as const;

export type MessageKey = keyof typeof es;

const en: Record<MessageKey, string> = {
  'validation.email.invalid': 'The email address is not valid',
  'validation.email.too-long': 'The email cannot exceed {max} characters',
  'validation.password.too-short': 'The password must be at least {min} characters long',
  'validation.password.too-long': 'The password cannot exceed {max} characters',
  'validation.password.empty': 'The password must not be empty',
  'validation.password.not-string': 'The password must be a string',
  [RESOURCE_INVALID_KEY]: 'Invalid resource',
};

export type MessageCatalog = Readonly<Record<Locale, Readonly<Record<string, string>>>>;

export const catalog: MessageCatalog = { es, en };

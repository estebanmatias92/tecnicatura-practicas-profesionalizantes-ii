export type Locale = 'es' | 'en';

export const DEFAULT_LOCALE: Locale = 'es';

export const SUPPORTED_LOCALES: readonly Locale[] = ['es', 'en'];

export const RESOURCE_INVALID_KEY = 'validation.resource.invalid';

const es = {
  'validation.email.invalid': 'El email no tiene un formato válido',
  'validation.email.too-long': 'El email no puede superar los {max} caracteres',
  [RESOURCE_INVALID_KEY]: 'Recurso inválido',
} as const;

export type MessageKey = keyof typeof es;

const en: Record<MessageKey, string> = {
  'validation.email.invalid': 'The email address is not valid',
  'validation.email.too-long': 'The email cannot exceed {max} characters',
  [RESOURCE_INVALID_KEY]: 'Invalid resource',
};

export type MessageCatalog = Readonly<Record<Locale, Readonly<Record<string, string>>>>;

export const catalog: MessageCatalog = { es, en };

import {
  catalog,
  DEFAULT_LOCALE,
  RESOURCE_INVALID_KEY,
  SUPPORTED_LOCALES,
  type Locale,
  type MessageCatalog,
} from './catalog';

export type MessageParams = Readonly<Record<string, string | number>>;

const LAST_RESORT_MESSAGE = 'Recurso inválido';

function isSupportedLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

function interpolate(template: string, params?: MessageParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

export class LanguageManager {
  private language: Locale = DEFAULT_LOCALE;

  constructor(private readonly messages: MessageCatalog = catalog) {}

  getLanguage(): Locale {
    return this.language;
  }

  /**
   * Changes the active language. Unknown locales are ignored so a bad value
   * cannot break the process; the previous language stays active.
   */
  setLanguage(locale: string): boolean {
    if (!isSupportedLocale(locale)) return false;
    this.language = locale;
    return true;
  }

  /**
   * Resolves a key with the chain active language -> Spanish -> invalid resource.
   * Never returns undefined or an empty string.
   */
  resolve(key: string, params?: MessageParams): string {
    const activeTemplate = this.messages[this.language]?.[key];
    if (activeTemplate !== undefined) return interpolate(activeTemplate, params);

    const fallbackTemplate = this.messages[DEFAULT_LOCALE]?.[key];
    if (fallbackTemplate !== undefined) return interpolate(fallbackTemplate, params);

    const lastResort =
      this.messages[this.language]?.[RESOURCE_INVALID_KEY] ??
      this.messages[DEFAULT_LOCALE]?.[RESOURCE_INVALID_KEY] ??
      LAST_RESORT_MESSAGE;
    return interpolate(lastResort, params);
  }
}

export const languageManager = new LanguageManager();

export function getLanguage(): Locale {
  return languageManager.getLanguage();
}

export function setLanguage(locale: string): boolean {
  return languageManager.setLanguage(locale);
}

export function resolveMessage(key: string, params?: MessageParams): string {
  return languageManager.resolve(key, params);
}

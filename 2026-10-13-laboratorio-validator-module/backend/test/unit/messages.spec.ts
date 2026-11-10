import {
  catalog,
  DEFAULT_LOCALE,
  getLanguage,
  LanguageManager,
  resolveMessage,
  setLanguage,
} from '../../src/model/messages';

describe('Validation message catalog', () => {
  afterEach(() => {
    setLanguage(DEFAULT_LOCALE);
  });

  it('ships identical key sets for every supported language', () => {
    const reference = Object.keys(catalog.es).sort();
    expect(Object.keys(catalog.en).sort()).toEqual(reference);
  });

  it('starts in Spanish', () => {
    expect(getLanguage()).toBe('es');
  });

  it('switches the active language and reports it', () => {
    expect(setLanguage('en')).toBe(true);
    expect(getLanguage()).toBe('en');
  });

  it('keeps the previous language when the requested one is unsupported', () => {
    setLanguage('en');
    expect(setLanguage('fr')).toBe(false);
    expect(getLanguage()).toBe('en');
  });

  it('resolves messages in the active language', () => {
    expect(resolveMessage('validation.email.invalid')).toBe('El email no tiene un formato válido');

    setLanguage('en');

    expect(resolveMessage('validation.email.invalid')).toBe('The email address is not valid');
  });

  it('interpolates parameters without losing the key', () => {
    expect(resolveMessage('validation.email.too-long', { max: 255 })).toContain('255');
    expect(resolveMessage('validation.email.too-long')).toContain('{max}');
  });
});

describe('LanguageManager fallback chain', () => {
  const customCatalog = {
    es: {
      'validation.email.invalid': 'mensaje en español',
      'validation.resource.invalid': 'recurso inválido',
    },
    en: {
      'validation.email.invalid': 'message in English',
      'validation.resource.invalid': 'invalid resource',
    },
  };

  it('falls back to Spanish when the key is missing in the active language', () => {
    const manager = new LanguageManager({
      ...customCatalog,
      es: { ...customCatalog.es, 'validation.password.too-short': 'contraseña corta' },
    });
    manager.setLanguage('en');

    expect(manager.resolve('validation.password.too-short')).toBe('contraseña corta');
  });

  it('falls back to the invalid-resource message when the key is missing everywhere', () => {
    const manager = new LanguageManager(customCatalog);
    manager.setLanguage('en');

    expect(manager.resolve('validation.unknown.key')).toBe('invalid resource');
  });

  it('never returns undefined or an empty string', () => {
    const manager = new LanguageManager(customCatalog);

    expect(manager.resolve('validation.unknown.key')).toBeTruthy();
  });
});

import { AppLanguage, TranslationItem } from './types';
import { normalizeLanguage } from './core';
import * as locales from './locales';

export { AppLanguage, TranslationItem } from './types';
export * from './core';
// Export individual locales if needed, but typically not used directly
export { locales };

export const SUPPORTED_LANGUAGES: AppLanguage[] = ['Chinese', 'English', 'AIChinese', 'AIEnglish'];

// Combine all locales into the dictionary
const dict = locales;

// Helper type to generate keys like 'tab.jobs' | 'jobs.tabPublic'
type LocaleSchema = typeof locales;
type Join<K, P> = K extends string | number ?
    P extends string | number ?
    `${K}.${P}`
    : never : never;

export type I18nKey = {
    [K in keyof LocaleSchema]: Join<K, keyof LocaleSchema[K]>
}[keyof LocaleSchema];

function getByPath(obj: any, path: string) {
    return path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), obj);
}

/**
 * Get a localized string or object from the dictionary.
 */
export function t<T = string>(key: I18nKey, language?: AppLanguage): T {
    if (!language) {
        // Use global getApp if available
        try {
            // @ts-ignore
            const app = getApp();
            language = normalizeLanguage(app?.globalData?.language);
        } catch (e) {
            language = 'Chinese';
        }
    }
    
    // Ensure language is normalized (defaults to Chinese if invalid)
    language = normalizeLanguage(language);

    const item = getByPath(dict, key);
    const value = item?.[language];
    
    if (value !== undefined) return value as T;
    
    // Fallback logic
    let fallback: any;
    if (language === 'AIEnglish') {
        fallback = item?.['English'] || item?.['Chinese'];
    }
    else if (language === 'AIChinese') {
        fallback = item?.['Chinese'] || item?.['English'];
    }
    else {
        fallback = item?.['Chinese'] || item?.['English'];
    }
    
    return (fallback !== undefined ? fallback : key) as T;
}

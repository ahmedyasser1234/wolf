import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKey } from './translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey) => string;
    formatPrice: (amount: number | string) => string;
    dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    // Initialize from localStorage or default to Arabic
    const [language, setLanguageState] = useState<Language>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('language');
            return (saved === 'ar' || saved === 'en') ? (saved as Language) : 'ar';
        }
        return 'ar';
    });

    useEffect(() => {
        // Update HTML attributes dynamically
        const dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
        document.documentElement.dir = dir;
    }, [language]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const t = (key: TranslationKey) => {
        return (translations[language] as any)[key] || key;
    };

    const formatPrice = (amount: number | string) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        const formatted = (num || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return language === 'ar' ? `${formatted} د.إ` : `${formatted} AED`;
    };

    const dir = language === 'ar' ? 'rtl' : 'ltr';

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, formatPrice, dir }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

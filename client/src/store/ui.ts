import { create } from 'zustand';
import i18n from '../i18n';

type UiState = {
  locale: 'en' | 'ar';
  navOpen: boolean;
  cartOpen: boolean;
  setLocale: (l: 'en' | 'ar') => void;
  setNavOpen: (v: boolean) => void;
  setCartOpen: (v: boolean) => void;
};

export const useUi = create<UiState>((set) => ({
  locale: 'en',
  navOpen: false,
  cartOpen: false,
  setLocale: (locale) => {
    i18n.changeLanguage(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('savora_locale', locale);
    set({ locale });
  },
  setNavOpen: (navOpen) => set({ navOpen }),
  setCartOpen: (cartOpen) => set({ cartOpen }),
}));

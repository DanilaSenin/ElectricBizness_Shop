//Хранилище для показа всплывающего окна о файлах
import { create } from 'zustand';

interface CookieBannerStore {
  visible: boolean;
  show: () => void;
  hide: () => void;
}

export const useCookieBanner = create<CookieBannerStore>((set) => ({
  visible: false,
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
}));

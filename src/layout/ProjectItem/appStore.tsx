/* eslint-disable prettier/prettier */
/* eslint-disable import/no-extraneous-dependencies */
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  dopen: boolean;
  updataOpen: (dopen: boolean) => void;
}

// Create the store with the persist middleware
const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      dopen: true,
      updataOpen: (dopen: boolean) => set({ dopen }),
    }),
    { name: "my_app_store" }
  )
);

export { useAppStore };

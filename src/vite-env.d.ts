/// <reference types="vite/client" />
interface ImportMetaEnv {
  VITE_SOME_KEY: string; // Example of a VITE environment variable
  // Add other environment variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
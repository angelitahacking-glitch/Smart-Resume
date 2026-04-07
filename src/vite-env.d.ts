/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_*: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
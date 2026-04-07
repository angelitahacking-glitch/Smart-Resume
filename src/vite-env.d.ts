/// <reference types="vite/client" />

// 定义 import.meta.env 的类型
interface ImportMetaEnv {
  readonly VITE_*: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
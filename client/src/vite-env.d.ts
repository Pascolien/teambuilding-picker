/// <reference types="vite/client" />
interface ImportMetaEnv { readonly VITE_SOMETHING?: string }
interface ImportMeta { readonly env: ImportMetaEnv }

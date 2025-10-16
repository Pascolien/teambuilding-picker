/// <reference types="vite/client" />

// (facultatif) typage de tes variables d'env personnalisées :
interface ImportMetaEnv {
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

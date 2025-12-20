/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TICTAC_API_URL: string
  readonly VITE_TICTAC_WS_URL: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

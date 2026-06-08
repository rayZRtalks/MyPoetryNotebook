/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTHOR_PASSCODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

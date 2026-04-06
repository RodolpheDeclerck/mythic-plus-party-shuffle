// src/dotenv-safe.d.ts
declare module 'dotenv-safe' {
    interface DotenvSafeOptions {
      allowEmptyValues?: boolean;
      example?: string;
      path?: string;
    }
  
    export function config(options?: DotenvSafeOptions): void;
  }
declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    AUTH_SECRET: string;
    AUTH_URL: string;
    AUTH_GOOGLE_ID: string;
    AUTH_GOOGLE_SECRET: string;
    NEXT_PUBLIC_APP_URL: string;
    NEXT_PUBLIC_APP_NAME: string;
    NODE_ENV: "development" | "production" | "test";
  }
}

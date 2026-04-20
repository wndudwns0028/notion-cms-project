declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    NOTION_API_KEY: string;
    NOTION_DATABASE_ID: string;
  }
}

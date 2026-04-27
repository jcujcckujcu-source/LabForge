// worker-configuration.d.ts — авто-генерируется через `wrangler types`
// Пока задаём вручную для TypeScript

interface CloudflareEnv {
  DB: D1Database;
  REPORTS_BUCKET: R2Bucket;
  JWT_SECRET: string;
  FRONTEND_URL: string;
}

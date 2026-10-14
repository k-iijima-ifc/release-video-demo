import { existsSync } from "node:fs";

// ローカルでは .env を読む。Actions では Secrets / Variables が環境変数として渡される
if (existsSync(".env")) process.loadEnvFile(".env");

export function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`環境変数 ${name} が設定されていません（.env または GitHub の Secrets / Variables を確認）`);
  return value;
}

export function optionalEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}

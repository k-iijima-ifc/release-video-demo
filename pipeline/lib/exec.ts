import { spawnSync, type SpawnSyncOptions } from "node:child_process";

/** コマンドを実行して標準出力を返す。失敗したら例外にする */
export function run(command: string, args: string[], options: SpawnSyncOptions & { allowFailure?: boolean } = {}): string {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    // Windows で npx などの .cmd を実行するため
    shell: process.platform === "win32",
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(`${command} ${args.join(" ")} が失敗しました（終了コード ${result.status}）\n${result.stderr ?? ""}`);
  }
  return (result.stdout ?? "").toString();
}

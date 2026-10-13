import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
const require = createRequire(import.meta.url);
export function typescriptPath() {
  try { return require.resolve('typescript'); }
  catch {
    const root = process.env.TYPESCRIPT_ROOT || execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['root', '-g'], { encoding: 'utf8' }).trim();
    const candidate = join(root, 'typescript', 'lib', 'typescript.js');
    if (existsSync(candidate)) return candidate;
    throw new Error('TypeScript fehlt. Zuerst die Projektabhängigkeiten installieren.');
  }
}
export function typescript() { return require(typescriptPath()); }
export function compile(project, extra = []) {
  const compiler = typescriptPath().replace(/typescript\.js$/, 'tsc.js');
  execFileSync(process.execPath, [compiler, '-p', project, ...extra], { stdio: 'inherit' });
}

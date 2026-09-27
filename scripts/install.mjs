#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, renameSync, writeFileSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const allowed = new Set(['--force', '--home']);
let home = homedir();
let force = false;
try {
  for (let i = 0; i < args.length; i++) {
    if (!allowed.has(args[i])) throw new Error('Usage: node scripts/install.mjs [--force] [--home DIRECTORY]');
    if (args[i] === '--force') force = true;
    else { if (!args[i + 1]) throw new Error('--home needs a directory'); home = resolve(args[++i]); }
  }
  const skill = join(home, '.agents', 'skills', 'codex-smart-router');
  const bin = join(home, '.local', 'bin');
  const targets = [skill, join(bin, 'codex-smart'), join(bin, 'codex-smart.ps1')];
  const existing = targets.filter(existsSync);
  if (existing.length && !force) throw new Error('Installation already exists. Use --force to back up and replace it.');
  const stamp = Date.now();
  for (const path of existing) {
    const backup = path === skill ? join(home, '.local', 'share', 'codex-smart-router', 'backups', `skill-${stamp}`) : `${path}.backup-${stamp}`;
    mkdirSync(dirname(backup), { recursive: true });
    renameSync(path, backup);
    console.log(`Backup: ${backup}`);
  }
  mkdirSync(dirname(skill), { recursive: true });
  cpSync(join(root, 'skills', 'codex-smart-router'), skill, { recursive: true });
  mkdirSync(bin, { recursive: true });
  const script = join(skill, 'scripts', 'router.mjs');
  const shQuote = s => "'" + s.replaceAll("'", "'\\''") + "'";
  writeFileSync(targets[1], `#!/bin/sh\nexec node ${shQuote(script)} "$@"\n`);
  chmodSync(targets[1], 0o755);
  writeFileSync(targets[2], `& node '${script.replaceAll("'", "''")}' @args\nexit $LASTEXITCODE\n`);
  console.log(`Skill installed: ${skill}\nLaunchers installed: ${bin}\nAdd that bin directory to PATH if needed. Start a new chat or restart the app if the skill does not appear.\nUse --doctor to check CLI discovery; installation does not verify account model access.`);
} catch (e) { console.error(e.message); process.exitCode = 1; }

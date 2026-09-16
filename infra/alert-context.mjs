#!/usr/bin/env node
/**
 * Bounded, secret-redacted failure context for mobile notifications.
 *
 * The production host is a Windows WinSW service, but this remains useful on
 * development/Linux hosts: it always reports the caller's deployment/watchdog
 * log and conditionally adds Windows service state and WinSW log tails.
 *
 * Usage: node infra/alert-context.mjs <repo-root> [primary-log]
 *
 * Optional environment:
 *   TROUT_WINDOWS_SERVICE           service name (default: TroutSite)
 *   TROUT_SERVICE_LOG_DIR           explicit WinSW log directory
 *   TROUT_ALERT_LOG_LINES           primary-log lines (default: 12, max: 30)
 *   TROUT_ALERT_SERVICE_LOG_LINES   each service-log lines (default: 8, max: 20)
 *   TROUT_ALERT_MAX_CHARS           whole message bound (default: 3400, max: 3800)
 */
import { closeSync, existsSync, openSync, readSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const READ_BYTES = 64 * 1024;

function boundedInt(value, fallback, max) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

function redact(line) {
  return line
    .replace(/\b(Bearer)\s+\S+/gi, '$1 [redacted]')
    // Header values can contain whitespace (for example, HTTP Basic auth), so
    // consume their entire remainder rather than only their first word.
    .replace(/\b(?:authorization|x-watchdog-token)\b\s*[=:].*$/gi, '[redacted credential]')
    .replace(
      /\b(?:watchdog_token|trout_push_url|api[_-]?key|token|password|secret)\b\s*([=:])\s*\S+/gi,
      (_, separator) => `[redacted]${separator}[redacted]`,
    )
    .replace(/https?:\/\/(?:[^/\s]*\.)?ntfy(?:\.sh)?\/\S+/gi, '[redacted notification URL]');
}

function tailLines(file, count) {
  try {
    const size = statSync(file).size;
    const start = Math.max(0, size - READ_BYTES);
    const length = size - start;
    const buffer = Buffer.alloc(length);
    const fd = openSync(file, 'r');
    try {
      readSync(fd, buffer, 0, length, start);
    } finally {
      closeSync(fd);
    }
    const lines = buffer.toString('utf8').split(/\r?\n/);
    if (start > 0) lines.shift(); // first fragment began before our bounded read
    return lines
      .filter((line) => line.trim().length > 0)
      .slice(-count)
      .map((line) => redact(line.length > 360 ? `${line.slice(0, 359)}…` : line));
  } catch {
    return [];
  }
}

function runServiceCommand(args) {
  if (process.platform !== 'win32') return '';
  const result = spawnSync('sc.exe', args, { encoding: 'utf8', timeout: 3_000, windowsHide: true });
  return `${result.stdout ?? ''}${result.stderr ?? ''}`;
}

function serviceState(service) {
  const output = runServiceCommand(['query', service]);
  if (!output) return '';
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^(SERVICE_NAME|STATE|WIN32_EXIT_CODE|SERVICE_EXIT_CODE)\b/i.test(line))
    .join(' | ');
}

function serviceExecutableDir(service) {
  const output = runServiceCommand(['qc', service]);
  const configured = output.match(/BINARY_PATH_NAME\s*:\s*(.+)/i)?.[1]?.trim();
  if (!configured) return '';
  const executable = configured.match(/"([^"]+?\.exe)"/i)?.[1] ?? configured.match(/(.+?\.exe)\b/i)?.[1];
  return executable ? dirname(executable) : '';
}

function serviceLogFiles(root, service) {
  const dirs = new Set(
    [process.env.TROUT_SERVICE_LOG_DIR, serviceExecutableDir(service), root, dirname(root)].filter(Boolean),
  );
  const candidates = [];
  for (const dir of dirs) {
    try {
      for (const name of readdirSync(dir)) {
        const normalized = name.toLowerCase();
        const isServiceLog = normalized.startsWith(service.toLowerCase()) && /\.log$/.test(normalized);
        if (!isServiceLog) continue;
        const file = join(dir, name);
        const stats = statSync(file);
        if (stats.isFile()) candidates.push({ file, mtimeMs: stats.mtimeMs });
      }
    } catch {
      // An absent or unreadable optional service-log directory is not an alert failure.
    }
  }
  return candidates
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, 2)
    .map((candidate) => candidate.file);
}

export function renderAlertContext(rootArg, primaryLogArg) {
  const root = resolve(rootArg);
  const primaryLog = primaryLogArg ? resolve(primaryLogArg) : join(root, 'backups', 'autoupdate.log');
  const service = process.env.TROUT_WINDOWS_SERVICE || 'TroutSite';
  const primaryLineCount = boundedInt(process.env.TROUT_ALERT_LOG_LINES, 12, 30);
  const serviceLineCount = boundedInt(process.env.TROUT_ALERT_SERVICE_LOG_LINES, 8, 20);
  const maxChars = boundedInt(process.env.TROUT_ALERT_MAX_CHARS, 3400, 3800);
  const sections = [`Failure context (bounded; secrets redacted):`];

  const primaryLines = tailLines(primaryLog, primaryLineCount);
  if (primaryLines.length > 0) {
    sections.push(`Update log (${primaryLog}):\n${primaryLines.join('\n')}`);
  } else {
    sections.push(`Update log unavailable: ${primaryLog}`);
  }

  const state = serviceState(service);
  if (state) sections.push(`Windows service ${service}: ${redact(state)}`);

  for (const file of serviceLogFiles(root, service)) {
    const lines = tailLines(file, serviceLineCount);
    if (lines.length > 0) sections.push(`Service log (${file}):\n${lines.join('\n')}`);
  }

  const rendered = sections.join('\n\n');
  return rendered.length <= maxChars ? rendered : `${rendered.slice(0, maxChars - 1)}…`;
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  process.stdout.write(`${renderAlertContext(process.argv[2] ?? process.cwd(), process.argv[3])}\n`);
}

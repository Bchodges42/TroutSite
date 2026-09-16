# VERSIONED autoupdate wrapper for the Windows scheduled task (RUNBOOK section 9).
#
# The task used to run C:\ProgramData\TroutSite\Tools\update-trout.ps1 — an
# out-of-repo, unversioned script (commit 7ca9ebf) that no guard, no alert, and
# no review could reach. When it went quietly dead (~2026-09-06) the host sat on
# a stale deploy for ten days while hourly refresh-data ran NEW code against OLD
# data. This wrapper is the versioned replacement, and it is deliberately thin:
# all policy (fetch/compare/stamp-guard/deploy/rollback/alerting) lives in
# infra/autoupdate.sh + infra/deploy.sh where it is reviewed and testable.
# Git credentials, if the host needs them, belong to git's own credential
# helper configured machine-wide — not to this script.
#
# Env overrides (set by install-schedules.sh / WinSW context as needed):
#   TROUT_ROOT      repo checkout the task deploys (default C:\ProgramData\TroutSite\Current)
#   TROUT_BASH_EXE  portable bash (default C:\ProgramData\TroutSite\Tools\bash.exe)

$ErrorActionPreference = 'Stop'

$repo = if ($env:TROUT_ROOT) { $env:TROUT_ROOT } else { 'C:\ProgramData\TroutSite\Current' }
$bash = if ($env:TROUT_BASH_EXE) { $env:TROUT_BASH_EXE } else { 'C:\ProgramData\TroutSite\Tools\bash.exe' }

if (-not (Test-Path $bash)) {
  # Fall back to whatever bash is on PATH (Git for Windows, MSYS2, ...).
  $cmd = Get-Command bash.exe -ErrorAction SilentlyContinue
  if ($null -eq $cmd) {
    Write-Output "[update-trout] FAIL - no bash at $bash and none on PATH; autoupdate cannot run"
    exit 1
  }
  $bash = $cmd.Source
}

& $bash -lc "cd '$repo' && bash infra/autoupdate.sh"
exit $LASTEXITCODE

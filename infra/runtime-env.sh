#!/usr/bin/env bash
# Shared runtime-path defaults for data jobs.
#
# Package scripts may run with apps/api as their working directory, so relying
# on a root .env file or a relative data path can silently build snapshots from
# the wrong SQLite database.  The installed Windows checkout has a durable
# database under C:\\ProgramData; development checkouts keep their local data.

trout_process_path() {
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -aw "$1"
  elif case "$(uname -s 2>/dev/null || true)" in MINGW*|MSYS*|CYGWIN*) true ;; *) false ;; esac; then
    case "$1" in
      /[A-Za-z]/*)
        local drive="${1:1:1}"
        local rest="${1:3}"
        printf '%s:\\%s' "${drive^^}" "${rest//\//\\}"
        ;;
      *) printf '%s' "$1" ;;
    esac
  else
    printf '%s' "$1"
  fi
}

trout_runtime_env() {
  local root="${1:?repository root is required}"
  local root_win=""
  local db_default="$root/apps/api/data/trout.db"
  local raw_default="$root/apps/api/data/raw"

  if command -v cygpath >/dev/null 2>&1; then
    root_win="$(cygpath -aw "$root" 2>/dev/null || printf '%s' "$root")"
  else
    root_win="$root"
  fi

  if [ "$root" = "/c/ProgramData/TroutSite/Current" ] \
    || [ "$root" = "/C/ProgramData/TroutSite/Current" ] \
    || [ "$root_win" = 'C:\ProgramData\TroutSite\Current' ]; then
    db_default="/c/ProgramData/TroutSite/Data/trout.db"
    raw_default="/c/ProgramData/TroutSite/Data/raw"
  fi

  if [ -z "${TROUT_DB_PATH:-}" ]; then
    export TROUT_DB_PATH="$(trout_process_path "$db_default")"
  fi
  if [ -z "${TROUT_SNAPSHOTS_DIR:-}" ]; then
    export TROUT_SNAPSHOTS_DIR="$(trout_process_path "$root/apps/web/public")"
  fi
  if [ -z "${TROUT_CONTENT_DIR:-}" ]; then
    export TROUT_CONTENT_DIR="$(trout_process_path "$root/packages/content")"
  fi
  if [ -z "${TROUT_RAW_DIR:-}" ]; then
    export TROUT_RAW_DIR="$(trout_process_path "$raw_default")"
  fi
}

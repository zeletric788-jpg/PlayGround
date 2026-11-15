#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

: "${PORT:=3000}"
[[ "$PORT" =~ ^[0-9]+$ ]] && (( PORT >= 1 && PORT <= 65535 )) || { echo "Invalid PORT: $PORT" >&2; exit 1; }
export PORT

timed() { /usr/bin/time -p "$@"; }

timed npm install --no-audit --no-fund
timed npm run build

deployment_output="/home/runner/work/_temp/omgithub-web/deployment-output.json"
timed mkdir -p "$(dirname "$deployment_output")"
timed env PROJECT_DIR="$PROJECT_DIR" node --input-type=module -e 'import { writeFile } from "node:fs/promises"; import { resolve } from "node:path"; const project = resolve(process.env.PROJECT_DIR); await writeFile(process.argv[1], JSON.stringify({ project, directory: resolve(project, "dist") }, null, 2) + "\n");' "$deployment_output"

timed node start.mjs

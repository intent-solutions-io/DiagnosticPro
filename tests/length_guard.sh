#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATUS=0

for file in "${ROOT_DIR}"/tests/golden/*.json; do
  chars=$(wc -c < "${file}")
  if (( chars > 12000 )); then
    echo "FAIL length_guard: ${file} has ${chars} characters (limit 12000)" >&2
    STATUS=1
  fi
done

exit "${STATUS}"

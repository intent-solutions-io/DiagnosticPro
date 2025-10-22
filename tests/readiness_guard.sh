#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATUS=0

for file in "${ROOT_DIR}"/tests/golden/*.json; do
  verdict=$(jq -r '.customer_readiness_check.verdict' "${file}")
  reason=$(jq -r '.customer_readiness_check.short_reason' "${file}")
  if [[ "${verdict}" != "ready_for_customer" && "${verdict}" != "needs_revision" ]]; then
    echo "FAIL readiness_guard: ${file} has invalid verdict '${verdict}'" >&2
    STATUS=1
  fi
  if ((${#reason} > 220)); then
    echo "FAIL readiness_guard: ${file} reason length ${#reason} > 220" >&2
    STATUS=1
  fi
done

exit "${STATUS}"

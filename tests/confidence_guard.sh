#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATUS=0

for file in "${ROOT_DIR}"/tests/golden/*.json; do
  score=$(jq '.confidence.score_pct' "${file}")
  threshold=$(jq '.confidence.threshold_pct' "${file}")
  uplift_len=$(jq '.confidence_uplift_requirements | length' "${file}")
  if (( $(printf "%.0f" "${score}") < $(printf "%.0f" "${threshold}") )); then
    if (( uplift_len == 0 )); then
      echo "FAIL confidence_guard: ${file} has score ${score} < ${threshold} but no uplift requirements" >&2
      STATUS=1
    fi
  fi
done

exit "${STATUS}"

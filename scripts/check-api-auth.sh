#!/usr/bin/env bash
# S1.6 — heuristic CI check: count role-guard calls against exported handlers.
# This does not prove guard placement or map calls to individual handlers;
# manually review each handler and ensure guards run before database access.
# Whitelist (auth endpoints + farmer-facing misplaced route):
#   app/api/admin/auth/login/route.ts
#   app/api/admin/auth/logout/route.ts
#   app/api/admin/me/route.ts            (explicit session check rejects legacy sessions)
#   app/api/admin/ratings/route.ts       (farmer-facing dispute POST, misplaced — S2 will relocate)
#
# Exit 0 = guard-call counts meet the heuristic; exit 1 = a route has fewer calls than handlers.

set -u

WHITELIST_REGEX='^app/api/admin/(auth/login|auth/logout|me|ratings)/route\.ts$'

fail=0
checked=0

while IFS= read -r f; do
  # Skip whitelisted routes
  if [[ "$f" =~ $WHITELIST_REGEX ]]; then
    continue
  fi

  checked=$((checked + 1))

  handlers=$(grep -cE "export (async )?function (GET|POST|PUT|PATCH|DELETE)|export const (GET|POST|PUT|PATCH|DELETE)" "$f" || true)
  guards=$(grep -c "requireRoleAuth(" "$f" || true)

  if [ "$guards" -lt "$handlers" ]; then
    echo "FAIL: $f — $handlers exported handler(s), $guards requireRoleAuth call(s)"
    fail=1
  fi
done < <(find app/api/admin -name route.ts | sort)

echo "Checked $checked admin route file(s) (excludes whitelist)."

if [ "$fail" -eq 0 ]; then
  echo "OK: admin guard-call counts meet the heuristic (placement not verified)."
  exit 0
else
  echo "ERROR: at least one admin route is missing or has partial auth."
  exit 1
fi

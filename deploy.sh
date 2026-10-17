#!/usr/bin/env bash
# Қолданылуы: GHPAT=<token> ./deploy.sh
# main тармағына push + gh-pages (dist) форс-push. Токен файлдарға жазылмайды.
set -euo pipefail
: "${GHPAT:?GHPAT env керек}"
cd "$(dirname "$0")"
npx -y pnpm@10 build
git push -q "https://x-access-token:${GHPAT}@github.com/zhalgasbaevaaaa-create/jongarlar.git" main
rm -rf /tmp/gh-pages && mkdir /tmp/gh-pages && cp -r dist/* /tmp/gh-pages/
cd /tmp/gh-pages
git init -q -b gh-pages && git config user.name atlas-bot && git config user.email atlas-bot@users.noreply.github.com
git add -A && git commit -q -m "deploy $(date -u +%FT%TZ)"
git push -f -q "https://x-access-token:${GHPAT}@github.com/zhalgasbaevaaaa-create/jongarlar.git" gh-pages
echo "DEPLOYED"

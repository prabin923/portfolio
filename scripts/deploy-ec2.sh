#!/usr/bin/env bash
# Runs ON the EC2 server (piped over SSH by .github/workflows/deploy-ec2.yml).
# Pulls the latest main, rebuilds, reloads PM2, and rolls back if anything fails.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/portfolio}"
APP_NAME="${APP_NAME:-portfolio}"
BRANCH="${BRANCH:-main}"
PORT="${PORT:-3000}"

cd "$APP_DIR"

PREVIOUS_COMMIT="$(git rev-parse HEAD)"
echo "Current commit: $PREVIOUS_COMMIT"

rollback() {
  echo "Deploy failed. Rolling back to $PREVIOUS_COMMIT ..."
  git reset --hard "$PREVIOUS_COMMIT"
  npm ci --no-audit --no-fund
  npm run build
  pm2 reload "$APP_NAME" --update-env || pm2 start npm --name "$APP_NAME" -- start
  pm2 save
  echo "Rolled back to $PREVIOUS_COMMIT"
}
trap 'rollback; exit 1' ERR

git fetch --prune origin "$BRANCH"
git reset --hard "origin/$BRANCH"
echo "Deploying commit: $(git rev-parse HEAD)"

npm ci --no-audit --no-fund
npm run build

if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  pm2 reload "$APP_NAME" --update-env
else
  pm2 start npm --name "$APP_NAME" -- start
fi
pm2 save

# Health check: the app must answer on its port within ~30 seconds.
for i in $(seq 1 10); do
  if curl -fsS -o /dev/null "http://127.0.0.1:$PORT/"; then
    echo "Health check passed. Deployed $(git rev-parse --short HEAD)"
    trap - ERR
    exit 0
  fi
  sleep 3
done

echo "Health check failed"
false

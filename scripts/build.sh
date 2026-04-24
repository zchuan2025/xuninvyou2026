#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

if [[ "${VERCEL:-}" == "1" ]]; then
    echo "Detected Vercel build. Using the dependencies installed by Vercel."
else
    echo "Installing dependencies..."
    pnpm install --prefer-frozen-lockfile --prod=false
fi

echo "Building the Next.js project..."
pnpm next build 

if [[ "${VERCEL:-}" == "1" ]]; then
    echo "Skipping custom server bundle on Vercel."
else
    echo "Bundling server with tsup..."
    pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify
fi

echo "Build completed successfully!"

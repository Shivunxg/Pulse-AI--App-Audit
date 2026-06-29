FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Copy worker package files from subdirectory
COPY mini-services/playwright-worker/package*.json ./
COPY mini-services/playwright-worker/tsconfig.json ./

# Install dependencies (no postinstall scripts from root)
RUN npm install --ignore-scripts

# Install Playwright Chromium browser
RUN npx playwright install chromium --with-deps

# Copy worker source
COPY mini-services/playwright-worker/src/ ./src/

# Build TypeScript
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/index.js"]

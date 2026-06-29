FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Copy worker package files (root is mini-services/playwright-worker/)
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies — no postinstall scripts
RUN npm install --ignore-scripts

# Install Playwright Chromium browser
RUN npx playwright install chromium --with-deps

# Copy source and build
COPY src/ ./src/
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/index.js"]

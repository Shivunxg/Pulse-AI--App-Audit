FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Install Playwright browsers
RUN npx playwright install chromium

# Copy source and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]

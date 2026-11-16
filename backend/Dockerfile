FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm install
COPY backend ./backend
RUN npm run db:generate --workspace=backend && npm run build --workspace=backend
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh", "-c", "npm run db:deploy --workspace=backend && npm run start --workspace=backend"]

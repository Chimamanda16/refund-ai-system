FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 4000
# docker-compose overrides this with: db:init (wait, migrate, seed) then dev server.
CMD ["sh", "-c", "npm run db:init && npm start"]

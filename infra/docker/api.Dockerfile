FROM node:20-alpine AS builder
WORKDIR /app

COPY . .
RUN npm ci
RUN npm run build -w @globe/api
RUN npm prune --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app /app

EXPOSE 4000
CMD ["npm", "run", "start", "-w", "@globe/api"]

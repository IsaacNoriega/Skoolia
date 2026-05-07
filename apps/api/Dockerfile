FROM node:22-alpine AS base

WORKDIR /app
RUN npm install -g pnpm@latest

FROM base AS deps

RUN apk add --no-cache python3 make g++ git

COPY apps/api/package.json apps/api/pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile --ignore-scripts
RUN pnpm rebuild bcrypt

FROM deps AS build

COPY apps/api/ .
RUN pnpm build

FROM base AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8000

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

EXPOSE 8000

CMD ["pnpm", "start:prod"]

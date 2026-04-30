FROM node:20-alpine AS base

WORKDIR /app
RUN corepack enable

FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY . .
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

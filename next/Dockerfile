# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl git openssh-client \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable \
  && corepack prepare pnpm@10.33.2 --activate \
  && npm install -g @openai/codex

FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY next/package.json next/package.json
COPY e2e/package.json e2e/package.json

RUN pnpm install --frozen-lockfile

FROM deps AS builder

WORKDIR /app

COPY . .

RUN pnpm -F @html-anything/next build

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV CODEX_HOME=/root/.codex
ENV CODEX_BIN=/usr/local/bin/codex
ENV HTML_ANYTHING_ALLOW_ANY_HOST=1

COPY --from=builder /app ./

EXPOSE 3000

CMD ["pnpm", "-F", "@html-anything/next", "start", "-p", "3000", "-H", "0.0.0.0"]

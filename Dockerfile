FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci
COPY packages/shared/ packages/shared/
COPY apps/web/ apps/web/
COPY data/synthetic/ data/synthetic/
RUN npm run build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --omit=dev --workspace=apps/server --workspace=packages/shared --include-workspace-root=false && npm cache clean --force
COPY --from=build --chown=node:node /app/packages/shared/ packages/shared/
COPY --from=build --chown=node:node /app/apps/web/dist/ apps/web/dist/
COPY --chown=node:node apps/server/ apps/server/
COPY --chown=node:node data/synthetic/ data/synthetic/
RUN mkdir -p /data /app/var && chown node:node /data /app/var
USER node
EXPOSE 10000
CMD ["node", "--import", "tsx", "apps/server/src/index.ts"]

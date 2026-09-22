# The service. Built from the repository root, because the contract it validates every
# request against lives in spec/contract/ and is copied into the image beside it.
FROM node:22-alpine AS build
WORKDIR /srv
RUN apk add --no-cache openssl
COPY app/package.json app/package-lock.json ./
COPY app/backend/package.json backend/
COPY app/frontend/package.json frontend/
COPY app/migrations/package.json migrations/
COPY app/backend/prisma backend/prisma
# The backend's postinstall generates the Prisma client, so its runner is in place first.
COPY app/backend/scripts backend/scripts
RUN npm ci
COPY app/tsconfig.base.json ./
COPY app/backend backend
RUN npm run build --workspace backend

FROM node:22-alpine AS runtime
WORKDIR /srv
RUN apk add --no-cache openssl
ENV NODE_ENV=production
ENV PORT=3001
# The contract, so the boundary validates against the same document the acceptance suite
# and the oracle act through.
COPY spec/contract/openapi.yaml contract/openapi.yaml
ENV CONTRACT_PATH=/srv/contract/openapi.yaml
COPY --from=build /srv/node_modules node_modules
COPY --from=build /srv/backend/package.json backend/package.json
COPY --from=build /srv/backend/dist backend/dist
USER node
EXPOSE 3001
CMD ["node", "backend/dist/main.js"]

# The single-page app, and the web server in front of it that makes one origin of the app
# and the service (decision record 0001).
FROM node:22-alpine AS build
WORKDIR /srv
COPY app/package.json app/package-lock.json ./
COPY app/backend/package.json backend/
COPY app/frontend/package.json frontend/
COPY app/migrations/package.json migrations/
COPY app/backend/prisma backend/prisma
RUN npm ci --ignore-scripts
COPY app/tsconfig.base.json ./
# The validation and permission rules both sides call.
COPY app/backend/src/rules backend/src/rules
COPY app/frontend frontend
RUN npm run build --workspace frontend

FROM caddy:2-alpine AS runtime
COPY --from=build /srv/frontend/dist /srv
COPY app/frontend/Caddyfile /etc/caddy/Caddyfile
EXPOSE 3000

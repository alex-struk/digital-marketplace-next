# The schema's history. This image runs as the backend's init container, which is the only
# thing that changes the schema (decision record 0001, departure 1). The same image runs the
# sandbox seed, with tests/seed mounted into it.
FROM node:22-alpine
WORKDIR /srv
COPY app/package.json app/package-lock.json ./
COPY app/backend/package.json backend/
COPY app/frontend/package.json frontend/
COPY app/migrations/package.json migrations/
RUN npm ci --ignore-scripts --omit=dev
COPY app/migrations migrations
WORKDIR /srv/migrations
USER node
CMD ["npm", "run", "migrate"]

# The web app on Railway (or any container host): build the static site with
# Node, then serve it with Caddy. Railway picks this up through railway.json.

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build:web

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist-web /srv

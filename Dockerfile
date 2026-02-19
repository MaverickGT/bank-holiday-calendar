# ──────────────────────────────────────────────
# Bank Holiday Calendar — Production Dockerfile
# Served by nginx:alpine — zero-config for Coolify
# ──────────────────────────────────────────────
FROM nginx:alpine

# Copy static assets into nginx web root
COPY index.html style.css app.js /usr/share/nginx/html/

# Coolify + Traefik handle port mapping externally
EXPOSE 80

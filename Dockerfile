FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci --only=production && npm cache clean --force

# Install TypeScript globally
RUN npm install -g typescript ts-node

# Copy source code
COPY src/ ./src/
COPY public/ ./public/

# Create data directory
RUN mkdir -p ./data/specs

# Build the application
RUN npm run build

# Expose ports
EXPOSE 3001 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Create startup script
RUN echo '#!/bin/sh\n\
if [ "$1" = "web" ]; then\n\
  echo "Starting Web Server..."\n\
  exec node dist/web-server.js\n\
elif [ "$1" = "mcp" ]; then\n\
  echo "Starting MCP Server..."\n\
  exec ts-node src/mcp-server.ts\n\
else\n\
  echo "Starting both servers..."\n\
  node dist/web-server.js &\n\
  exec ts-node src/mcp-server.ts\n\
fi' > /app/start.sh && chmod +x /app/start.sh

# Default command
CMD ["/app/start.sh"]

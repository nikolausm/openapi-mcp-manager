#!/bin/bash

# OpenAPI MCP Server Startup Script
# Automatisch kompilieren und starten

cd "$(dirname "$0")"

# TypeScript kompilieren
echo "🔨 Kompiliere TypeScript..."
npm run build

# MCP Server starten
echo "🚀 Starte OpenAPI MCP Server..."
exec node dist/mcp-server.js

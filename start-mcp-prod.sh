#!/bin/bash

# OpenAPI MCP Server - Produktions-Script (ohne Build bei jedem Start)
# Für bessere Performance in Claude Desktop

cd "$(dirname "$0")"
exec node dist/mcp-server.js

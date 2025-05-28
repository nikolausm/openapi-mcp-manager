# OpenAPI MCP Manager - Update & Maintenance Guide

## Nach Code-Änderungen

Wenn Sie Änderungen am TypeScript Code vornehmen:

```bash
cd /Users/michaelnikolaus/openapi-mcp-manager-install
npm run build
```

Dann Claude Desktop neu starten.

## Script-Varianten

### Produktions-Script (empfohlen)
- `start-mcp-prod.sh` - Schnell, verwendet bereits kompilierten Code
- Für tägliche Nutzung mit Claude Desktop

### Development-Script
- `start-mcp.sh` - Kompiliert bei jedem Start automatisch
- Für Entwicklung und Tests neuer Features

## Claude Desktop Konfiguration

Aktuell konfiguriert für: `start-mcp-prod.sh`

## Verfügbare Befehle

```bash
# Web Server starten
npm run web

# MCP Server direkt testen
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | ./start-mcp-prod.sh

# TypeScript kompilieren
npm run build

# Dependencies aktualisieren
npm update
```

## API Specs hinzufügen

1. Über Web Interface: http://localhost:3001
2. Oder manuell in: `data/specs/`

Nach dem Hinzufügen neuer APIs: Claude Desktop neu starten.

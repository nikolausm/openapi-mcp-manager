# 🔧 OpenAPI MCP Manager

Ein vollständiger MCP (Model Context Protocol) Server mit Web-Interface zum Verwalten und Bereitstellen von OpenAPI Spezifikationen als Tools für Claude AI.

## ✨ Features

- 🌐 **Web-Interface** zum Hochladen und Verwalten von OpenAPI JSON Dateien
- 🤖 **MCP Integration** für nahtlose Claude Desktop Nutzung
- 🔄 **Multi-API Support** - Verwalte mehrere APIs gleichzeitig
- 🐳 **Docker-Ready** - Einfache Bereitstellung als Container
- 🎯 **Auto-Tool-Generation** - Automatische Erstellung von MCP Tools aus OpenAPI Specs
- 📊 **API Monitoring** - Überwache deine geladenen APIs
- 🔒 **Sichere Speicherung** - Lokale Datenhaltung

## 🚀 Schnellstart

### 1. Repository klonen

```bash
git clone https://github.com/yourusername/openapi-mcp-manager.git
cd openapi-mcp-manager
```

### 2. Abhängigkeiten installieren

```bash
# Mit Docker (empfohlen)
docker-compose build

# Oder lokal mit Node.js
npm install
npm run build
```

### 3. Services starten

```bash
# Mit Docker Compose
docker-compose up -d

# Oder einzeln
npm run web    # Web Interface (Port 3001)
npm run mcp    # MCP Server (stdio)
```

### 4. Claude Desktop Integration

Bearbeite deine `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "openapi-manager": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-v", "/pfad/zu/data:/app/data",
        "openapi-mcp-manager"
      ]
    }
  }
}
```

## 🎯 Verwendung

### Web Interface nutzen

1. **Öffne** http://localhost:3001 in deinem Browser
2. **Lade** deine OpenAPI JSON Datei hoch
3. **Konfiguriere** API Name und Base URL
4. **Verwalte** deine APIs über das Dashboard

### API zu MCP Tools hinzufügen

```javascript
// Beispiel: API Upload via Web Interface
{
  "name": "PDF Management API",
  "baseUrl": "http://localhost:1339",
  "spec": { /* deine OpenAPI Spezifikation */ }
}
```

### Claude Integration nutzen

Nach der Integration kannst du in Claude fragen:

- "Zeige mir alle geladenen APIs"
- "Liste alle PDF-Dateien auf"
- "Suche nach PDFs mit 'Rechnung' im Namen"
- "Lade die PDF mit ID 12345 herunter"

## 🔧 Konfiguration

### Umgebungsvariablen

```bash
# .env Datei
PORT=3001                    # Web Server Port
NODE_ENV=production          # Umgebung
SPECS_DIR=./data/specs      # Speicherort für APIs
```

## 📚 API Referenz

### Web API Endpoints

| Endpoint | Method | Beschreibung |
|----------|--------|--------------|
| `GET /` | GET | Hauptseite |
| `GET /api/specs` | GET | Alle API Specs auflisten |
| `POST /api/specs` | POST | Neue API Spec hinzufügen |
| `DELETE /api/specs/{id}` | DELETE | API Spec löschen |
| `GET /health` | GET | Gesundheitsstatus |

### MCP Tools

Automatisch generierte Tools basierend auf deinen OpenAPI Specs:

- `{api-id}_{operation-id}` - Für jede API Operation
- `list_apis` - Management Tool

## 🛠️ Entwicklung

### Lokale Entwicklung

```bash
# Development Server mit Hot Reload
npm run dev

# Build
npm run build

# Tests
npm test
```

## 🐳 Docker

### Container bauen

```bash
docker build -t openapi-mcp-manager .
```

### Container ausführen

```bash
# Web Server
docker run -p 3001:3001 -v $(pwd)/data:/app/data openapi-mcp-manager web

# MCP Server
docker run -i -v $(pwd)/data:/app/data openapi-mcp-manager mcp

# Beide Services
docker-compose up -d
```

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/amazing-feature`)
3. Committe deine Änderungen (`git commit -m 'Add amazing feature'`)
4. Push zum Branch (`git push origin feature/amazing-feature`)
5. Öffne eine Pull Request

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) Datei für Details.

## 🙏 Danksagungen

- [Anthropic](https://anthropic.com) für Claude und MCP
- [OpenAPI Initiative](https://openapis.org) für die Spezifikation
- Community Contributors und Feedback

---

**Viel Spaß mit deinem OpenAPI MCP Manager! 🎉**

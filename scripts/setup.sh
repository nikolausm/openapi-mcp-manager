#!/bin/bash

# setup.sh - OpenAPI MCP Manager Setup

set -e

echo "🚀 OpenAPI MCP Manager Setup"
echo "================================"

# Funktion für farbige Ausgabe
print_status() {
    echo -e "\n\033[1;34m📋 $1\033[0m"
}

print_success() {
    echo -e "\033[1;32m✅ $1\033[0m"
}

print_error() {
    echo -e "\033[1;31m❌ $1\033[0m"
}

# Überprüfe Voraussetzungen
check_requirements() {
    print_status "Überprüfe Voraussetzungen..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker ist nicht installiert. Bitte installiere Docker zuerst."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose ist nicht installiert. Bitte installiere Docker Compose zuerst."
        exit 1
    fi
    
    print_success "Voraussetzungen erfüllt"
}

# Build the project
build_project() {
    print_status "Baue das Projekt..."
    docker-compose build
    print_success "Projekt erfolgreich gebaut"
}

# Start services
start_services() {
    print_status "Starte Services..."
    docker-compose up -d
    print_success "Services gestartet"
    echo "📋 Web Interface: http://localhost:3001"
    echo "📊 API Status: http://localhost:3001/api/specs"
}

# Claude Integration
setup_claude() {
    print_status "Claude Desktop Integration Setup"
    
    CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
    BACKUP_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json.backup"
    
    # Backup existing config
    if [ -f "$CLAUDE_CONFIG" ]; then
        cp "$CLAUDE_CONFIG" "$BACKUP_CONFIG"
        echo "✅ Existing config backed up to: $BACKUP_CONFIG"
    fi
    
    # Create Claude config directory if it doesn't exist
    mkdir -p "$(dirname "$CLAUDE_CONFIG")"
    
    # Get the current directory
    CURRENT_DIR=$(pwd)
    
    echo "📋 Füge folgende Konfiguration zu deiner Claude Desktop Config hinzu:"
    echo ""
    echo '"openapi-manager": {'
    echo '  "command": "docker",'
    echo '  "args": ['
    echo '    "run", "--rm", "-i",'
    echo "    \"-v\", \"$CURRENT_DIR/data:/app/data\","
    echo '    "openapi-mcp-manager",'
    echo '    "/app/start.sh", "mcp"'
    echo '  ],'
    echo '  "env": {'
    echo '    "SPECS_DIR": "/app/data/specs"'
    echo '  }'
    echo '}'
    echo ""
    print_success "Claude Integration bereit!"
}

# Hauptausführung
main() {
    echo "Starte Setup für OpenAPI MCP Manager..."
    
    check_requirements
    build_project
    start_services
    setup_claude
    
    print_success "Setup abgeschlossen!"
    echo ""
    echo "🎉 Nächste Schritte:"
    echo "1. Öffne http://localhost:3001 in deinem Browser"
    echo "2. Lade deine OpenAPI JSON Dateien hoch"
    echo "3. Konfiguriere Claude Desktop mit dem MCP Server"
    echo "4. Nutze deine APIs als Tools in Claude!"
    echo ""
    echo "📚 Weitere Informationen findest du in der README.md"
}

# Script ausführen
main "$@"

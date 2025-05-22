# OpenAPI Specifications Directory

This directory contains your OpenAPI JSON specifications that will be loaded by the MCP server.

## Structure

- Each API specification should be saved as a JSON file
- Files are automatically loaded by the MCP server on startup
- The web interface saves uploaded APIs here

## Example

See `demo-pdf-api.example.json` for an example of how to structure your OpenAPI specifications for the MCP server.

## Usage

1. Place your OpenAPI JSON files in this directory
2. Restart the MCP server to load new specifications
3. Or use the web interface to upload APIs dynamically

## Note

JSON files in this directory are excluded from git commits by default to keep your API specifications private. Only example files are committed to the repository.

#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosRequestConfig } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface OpenApiSpec {
  id: string;
  name: string;
  baseUrl: string;
  spec: any;
  createdAt: string;
}

interface ApiOperation {
  operationId: string;
  method: string;
  path: string;
  summary?: string;
  description?: string;
  parameters?: any[];
  requestBody?: any;
  responses?: any;
}

class OpenApiMcpServer {
  private server: Server;
  private specsDir: string;
  private loadedSpecs: Map<string, OpenApiSpec> = new Map();

  constructor() {
    this.specsDir = process.env.SPECS_DIR || './data/specs';
    this.ensureSpecsDirectory();
    
    this.server = new Server(
      {
        name: 'openapi-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.loadAllSpecs();
    this.setupToolHandlers();
  }

  private ensureSpecsDirectory() {
    if (!fs.existsSync(this.specsDir)) {
      fs.mkdirSync(this.specsDir, { recursive: true });
    }
  }

  private loadAllSpecs() {
    try {
      const files = fs.readdirSync(this.specsDir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.specsDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const spec: OpenApiSpec = JSON.parse(content);
          this.loadedSpecs.set(spec.id, spec);
        }
      });
      console.error(`Loaded ${this.loadedSpecs.size} OpenAPI specifications`);
    } catch (error) {
      console.error('Error loading specs:', error);
    }
  }

  private extractOperations(spec: OpenApiSpec): ApiOperation[] {
    const operations: ApiOperation[] = [];
    const paths = spec.spec.paths || {};

    Object.entries(paths).forEach(([pathKey, pathValue]: [string, any]) => {
      const methods = ['get', 'post', 'put', 'delete', 'patch'];
      
      methods.forEach(method => {
        if (pathValue[method]) {
          const operation = pathValue[method];
          operations.push({
            operationId: operation.operationId || `${method}_${pathKey.replace(/[^a-zA-Z0-9]/g, '_')}`,
            method: method.toUpperCase(),
            path: pathKey,
            summary: operation.summary,
            description: operation.description,
            parameters: operation.parameters,
            requestBody: operation.requestBody,
            responses: operation.responses
          });
        }
      });
    });

    return operations;
  }

  private generateToolSchema(spec: OpenApiSpec, operation: ApiOperation) {
    const properties: any = {};
    const required: string[] = [];

    // Path parameters
    if (operation.parameters) {
      operation.parameters.forEach((param: any) => {
        if (param.in === 'path') {
          properties[param.name] = {
            type: param.schema?.type || 'string',
            description: param.description || `Path parameter: ${param.name}`
          };
          if (param.required) required.push(param.name);
        } else if (param.in === 'query') {
          properties[param.name] = {
            type: param.schema?.type || 'string',
            description: param.description || `Query parameter: ${param.name}`
          };
          if (param.required) required.push(param.name);
        }
      });
    }

    // Request body
    if (operation.requestBody) {
      properties.requestBody = {
        type: 'object',
        description: 'Request body data'
      };
      required.push('requestBody');
    }

    return {
      name: `${spec.id}_${operation.operationId}`,
      description: `${spec.name}: ${operation.summary || operation.description || `${operation.method} ${operation.path}`}`,
      inputSchema: {
        type: 'object',
        properties,
        required
      }
    };
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: any[] = [];

      // Management tools
      tools.push({
        name: 'list_apis',
        description: 'List all loaded OpenAPI specifications',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      });

      // Generate tools from all loaded specs
      this.loadedSpecs.forEach(spec => {
        const operations = this.extractOperations(spec);
        operations.forEach(operation => {
          tools.push(this.generateToolSchema(spec, operation));
        });
      });

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === 'list_apis') {
          return await this.handleListApis();
        }

        // Handle API operations
        const [specId, operationId] = name.split('_', 2);
        const spec = this.loadedSpecs.get(specId);
        
        if (!spec) {
          throw new Error(`API specification '${specId}' not found`);
        }

        const operations = this.extractOperations(spec);
        const operation = operations.find(op => op.operationId === operationId);
        
        if (!operation) {
          throw new Error(`Operation '${operationId}' not found in API '${specId}'`);
        }

        return await this.executeApiOperation(spec, operation, args);
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  private async handleListApis() {
    const apiList = Array.from(this.loadedSpecs.values()).map(spec => ({
      id: spec.id,
      name: spec.name,
      baseUrl: spec.baseUrl,
      createdAt: spec.createdAt,
      operationsCount: this.extractOperations(spec).length
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(apiList, null, 2),
        },
      ],
    };
  }

  private async executeApiOperation(spec: OpenApiSpec, operation: ApiOperation, args: any) {
    let url = spec.baseUrl + operation.path;
    
    // Replace path parameters
    if (operation.parameters) {
      operation.parameters.forEach((param: any) => {
        if (param.in === 'path' && args[param.name]) {
          url = url.replace(`{${param.name}}`, args[param.name]);
        }
      });
    }

    // Prepare request config
    const config: AxiosRequestConfig = {
      method: operation.method.toLowerCase() as any,
      url,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    };

    // Add query parameters
    const queryParams: any = {};
    if (operation.parameters) {
      operation.parameters.forEach((param: any) => {
        if (param.in === 'query' && args[param.name] !== undefined) {
          queryParams[param.name] = args[param.name];
        }
      });
    }
    if (Object.keys(queryParams).length > 0) {
      config.params = queryParams;
    }

    // Add request body
    if (operation.requestBody && args.requestBody) {
      config.data = args.requestBody;
    }

    const response = await axios(config);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: response.status,
            statusText: response.statusText,
            data: response.data,
            operation: {
              method: operation.method,
              path: operation.path,
              url: url
            }
          }, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`OpenAPI MCP Server running with ${this.loadedSpecs.size} APIs loaded`);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.error('Server shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Server shutting down...');
  process.exit(0);
});

// Start server
const server = new OpenApiMcpServer();
server.run().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

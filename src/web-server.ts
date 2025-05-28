import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface OpenApiSpec {
  id: string;
  name: string;
  baseUrl: string;
  spec: any;
  createdAt: string;
}

class ApiSpecManager {
  private specsDir: string;

  constructor(specsDir: string = './data/specs') {
    this.specsDir = specsDir;
    this.ensureSpecsDirectory();
  }

  private ensureSpecsDirectory() {
    if (!fs.existsSync(this.specsDir)) {
      fs.mkdirSync(this.specsDir, { recursive: true });
    }
    
    // Ensure data directory exists
    const dataDir = path.dirname(this.specsDir);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  async saveSpec(spec: OpenApiSpec): Promise<void> {
    const filePath = path.join(this.specsDir, `${spec.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(spec, null, 2));
  }

  async loadSpec(id: string): Promise<OpenApiSpec | null> {
    const filePath = path.join(this.specsDir, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  }

  async loadAllSpecs(): Promise<OpenApiSpec[]> {
    const files = fs.readdirSync(this.specsDir);
    const specs: OpenApiSpec[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(this.specsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        specs.push(JSON.parse(content));
      }
    }

    return specs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async deleteSpec(id: string): Promise<boolean> {
    const filePath = path.join(this.specsDir, `${id}.json`);
    
    if (!fs.existsSync(filePath)) {
      return false;
    }

    fs.unlinkSync(filePath);
    return true;
  }
}

class OpenApiWebServer {
  private app: express.Application;
  private specManager: ApiSpecManager;
  private port: number;

  constructor(port: number = 3001) {
    this.app = express();
    this.port = port;
    this.specManager = new ApiSpecManager();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.static(path.join(__dirname, '../public')));
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes() {
    // Serve the web interface
    this.app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>OpenAPI MCP Manager</title>
            <meta charset="UTF-8">
        </head>
        <body>
            <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                <h1>🔧 OpenAPI MCP Manager</h1>
                <p>Deine OpenAPI Spezifikationen für MCP Tools</p>
                <div style="margin: 30px 0;">
                    <a href="/manage" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 0 10px;">📋 APIs verwalten</a>
                    <a href="/api/specs" style="background: #48c774; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 0 10px;">📊 API Status</a>
                </div>
            </div>
        </body>
        </html>
      `);
    });

    // API Routes
    this.app.get('/api/specs', async (req, res) => {
      try {
        const specs = await this.specManager.loadAllSpecs();
        const summary = specs.map(spec => ({
          id: spec.id,
          name: spec.name,
          baseUrl: spec.baseUrl,
          createdAt: spec.createdAt,
          operationsCount: this.countOperations(spec.spec),
          title: spec.spec.info?.title || 'Unknown API'
        }));
        
        res.json(summary);
      } catch (error) {
        console.error('Error loading specs:', error);
        res.status(500).json({ error: 'Failed to load API specifications' });
      }
    });

    // Save new spec
    this.app.post('/api/specs', async (req, res) => {
      try {
        const { id, name, baseUrl, spec, createdAt } = req.body;

        if (!id || !name || !baseUrl || !spec) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!spec.openapi && !spec.swagger) {
          return res.status(400).json({ error: 'Invalid OpenAPI specification' });
        }

        const apiSpec: OpenApiSpec = {
          id,
          name,
          baseUrl: baseUrl.replace(/\/$/, ''),
          spec,
          createdAt: createdAt || new Date().toISOString()
        };

        await this.specManager.saveSpec(apiSpec);
        
        console.log(`Saved new API spec: ${name} (${id})`);
        res.json({ success: true, id });
      } catch (error) {
        console.error('Error saving spec:', error);
        res.status(500).json({ error: 'Failed to save API specification' });
      }
    });

    // Delete spec
    this.app.delete('/api/specs/:id', async (req, res) => {
      try {
        const deleted = await this.specManager.deleteSpec(req.params.id);
        if (!deleted) {
          return res.status(404).json({ error: 'API specification not found' });
        }
        
        console.log(`Deleted API spec: ${req.params.id}`);
        res.json({ success: true });
      } catch (error) {
        console.error('Error deleting spec:', error);
        res.status(500).json({ error: 'Failed to delete API specification' });
      }
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        specs: fs.readdirSync(this.specManager['specsDir']).filter(f => f.endsWith('.json')).length
      });
    });
  }

  private countOperations(spec: any): number {
    if (!spec.paths) return 0;
    
    let count = 0;
    Object.values(spec.paths).forEach((pathItem: any) => {
      ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].forEach(method => {
        if (pathItem[method]) count++;
      });
    });
    
    return count;
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`🚀 OpenAPI MCP Web Server running on http://localhost:${this.port}`);
      console.log(`📋 Management Interface: http://localhost:${this.port}/manage`);
      console.log(`📊 API Status: http://localhost:${this.port}/api/specs`);
    });
  }
}

// Start the server
const port = parseInt(process.env.PORT || '3001');
const server = new OpenApiWebServer(port);
server.start();

export { OpenApiWebServer, ApiSpecManager };

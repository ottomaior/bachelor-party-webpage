const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;
const ROOT_DIR = __dirname;

// MIME types for static file serving
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.webp': 'image/webp',
    '.map': 'application/json'
};

// Security headers
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://www.gstatic.com https://cdn.jsdelivr.net https://unpkg.com",
        "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com https://unpkg.com",
        "img-src 'self' data: https: blob:",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com https://firestore.googleapis.com https://*.openstreetmap.org",
        "frame-src 'self' https://*.firebaseapp.com"
    ].join('; ')
};

/**
 * Sanitize and validate file path to prevent directory traversal attacks
 * @param {string} requestPath - The requested URL path
 * @returns {string|null} - Safe absolute file path or null if invalid
 */
function sanitizePath(requestPath) {
    // Parse URL to remove query strings and fragments
    const parsedUrl = url.parse(requestPath);
    let pathname = parsedUrl.pathname || '/';
    
    // Decode URI components
    try {
        pathname = decodeURIComponent(pathname);
    } catch (e) {
        return null; // Invalid encoding
    }
    
    // Normalize path (resolve .. and .)
    const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    
    // Build absolute path
    const absolutePath = path.join(ROOT_DIR, safePath);
    
    // Ensure the resolved path is within the root directory
    if (!absolutePath.startsWith(ROOT_DIR)) {
        console.warn(`⚠️ Path traversal attempt blocked: ${requestPath}`);
        return null;
    }
    
    return absolutePath;
}

/**
 * Apply security headers to response
 * @param {http.ServerResponse} res
 */
function applySecurityHeaders(res) {
    Object.entries(securityHeaders).forEach(([header, value]) => {
        res.setHeader(header, value);
    });
}

/**
 * Handle health check endpoint
 * @param {http.ServerResponse} res
 */
function handleHealthCheck(res) {
    const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            unit: 'MB'
        },
        node: process.version
    };
    
    res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify(healthStatus, null, 2));
}

/**
 * Send error response
 * @param {http.ServerResponse} res
 * @param {number} statusCode
 * @param {string} message
 */
function sendError(res, statusCode, message) {
    res.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
        <!DOCTYPE html>
        <html lang="hu">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${statusCode} - ${message}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    color: white;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0;
                    text-align: center;
                }
                .error-container {
                    padding: 40px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 20px;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                h1 { font-size: 72px; margin: 0; color: #ff006e; }
                p { color: rgba(255,255,255,0.7); margin: 20px 0; }
                a { 
                    color: #00d4ff; 
                    text-decoration: none;
                    padding: 12px 24px;
                    background: rgba(0,212,255,0.1);
                    border-radius: 10px;
                    display: inline-block;
                    margin-top: 20px;
                }
                a:hover { background: rgba(0,212,255,0.2); }
            </style>
        </head>
        <body>
            <div class="error-container">
                <h1>${statusCode}</h1>
                <p>${message}</p>
                <a href="/">← Vissza a főoldalra</a>
            </div>
        </body>
        </html>
    `);
}

// Create the HTTP server
const server = http.createServer((req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.url}`);
    
    // Apply security headers to all responses
    applySecurityHeaders(res);
    
    // Only allow GET and HEAD methods
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return sendError(res, 405, 'Method Not Allowed');
    }
    
    // Handle health check endpoint
    if (req.url === '/health' || req.url === '/healthz') {
        return handleHealthCheck(res);
    }
    
    // Handle robots.txt
    if (req.url === '/robots.txt') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        return res.end('User-agent: *\nAllow: /');
    }
    
    // Sanitize the path
    let filePath = sanitizePath(req.url);
    
    if (!filePath) {
        console.warn(`⚠️ Invalid path: ${req.url}`);
        return sendError(res, 400, 'Invalid Request');
    }
    
    // Default to index.html for root
    if (filePath === ROOT_DIR || filePath === path.join(ROOT_DIR, '/')) {
        filePath = path.join(ROOT_DIR, 'index.html');
    }
    
    // Handle directory requests
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }
    
    // Get file extension and content type
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    // Read and serve the file
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                console.log(`404 Not Found: ${filePath}`);
                return sendError(res, 404, 'Page Not Found');
            } else if (error.code === 'EACCES') {
                console.log(`403 Forbidden: ${filePath}`);
                return sendError(res, 403, 'Access Denied');
            } else {
                console.error(`500 Server Error: ${error.code}`, error);
                return sendError(res, 500, 'Internal Server Error');
            }
        }
        
        // Set caching headers based on file type
        let cacheControl = 'public, max-age=0';
        if (extname === '.html') {
            cacheControl = 'no-cache';
        } else if (['.css', '.js'].includes(extname)) {
            cacheControl = 'public, max-age=86400'; // 1 day
        } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'].includes(extname)) {
            cacheControl = 'public, max-age=604800'; // 1 week
        } else if (['.woff', '.woff2'].includes(extname)) {
            cacheControl = 'public, max-age=31536000'; // 1 year
        }
        
        console.log(`200 OK: ${filePath}`);
        
        res.writeHead(200, { 
            'Content-Type': contentType,
            'Cache-Control': cacheControl,
            'Content-Length': content.length
        });
        
        // For HEAD requests, don't send body
        if (req.method === 'HEAD') {
            res.end();
        } else {
            res.end(content);
        }
    });
});

// Graceful shutdown
const shutdown = (signal) => {
    console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
        console.error('⚠️ Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
server.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════');
    console.log('🍻 Bachelor Party Website Server');
    console.log('═══════════════════════════════════════════════');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 Serving files from ${ROOT_DIR}`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
    console.log('═══════════════════════════════════════════════');
});

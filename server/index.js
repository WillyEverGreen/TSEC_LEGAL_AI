const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Rate Limiting: 100 requests per 15 minutes
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, 
	max: 100, 
	standardHeaders: true, 
	legacyHeaders: false, 
    message: { status: 'error', message: 'Too many requests, please try again later.' }
});

app.use(cors());
app.use(limiter); 

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'API Gateway' });
});

// Proxy Configuration for RAG Service
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';

// API Routes Proxy
app.use('/api/v1', createProxyMiddleware({ 
    target: RAG_SERVICE_URL, 
    changeOrigin: true,
    pathRewrite: {
        '^/api/v1': '', // Remove /api/v1 prefix when forwarding to RAG service
    },
    onProxyReq: (proxyReq, req, res) => {
        // Optional: Add logging or auth headers here
        console.log(`[Gateway] Forwarding ${req.method} request to: ${proxyReq.path}`);
    },
    proxyTimeout: 300000,
    timeout: 300000
}));

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Proxying /api/v1 -> ${RAG_SERVICE_URL}`);
});

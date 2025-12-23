import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database';
import authRoutes from './routes/auth';
import quizRoutes from './routes/quiz';
import ratingsRoutes from './routes/ratings';
import adminRoutes from './routes/admin';
import questionTypesRoutes from './routes/questionTypes';

// Load environment variables
dotenv.config();

// Create Express application
const app: Application = express();

// Configuration
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// CORS configuration with support for multiple origins
const allowedOrigins = [
  'http://localhost:5173',           // Local development
  'http://localhost:3000',            // Local production build
  'https://sidney-frontend-504880375460.us-central1.run.app',  // Production
  FRONTEND_URL                        // Environment variable override
].filter(Boolean);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log the rejected origin for debugging but don't throw
      console.log(`CORS request from unauthorized origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/question-types', questionTypesRoutes);

// Health check route
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const dbStatus = await testConnection();
    
    res.status(200).json({
      status: 'OK',
      message: 'Sydney Learning Platform API is running',
      timestamp: new Date().toISOString(),
      database: dbStatus ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// Basic API info route
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'Sydney Learning Platform API',
    version: '1.0.0',
    description: 'Backend API for adaptive learning platform',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      quiz: '/api/quiz',
      ratings: '/api/ratings',
      admin: '/api/admin',
      questionTypes: '/api/question-types',
      docs: '/api/docs (coming soon)'
    }
  });
});

// 404 handler for unmatched routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'NOT_FOUND',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Error:', err);
  
  res.status(err.status || 500).json({
    status: 'ERROR',
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection on startup
    console.log('🔄 Testing database connection...');
    await testConnection();
    
    // Start listening
    app.listen(PORT, () => {
      console.log('🚀 Sidney Learning Platform API started');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
      console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
      console.log(`🧠 Quiz endpoints: http://localhost:${PORT}/api/quiz`);
      console.log(`📊 Ratings endpoints: http://localhost:${PORT}/api/ratings`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/docs/swagger');
const { generalLimiter } = require('./src/middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const { testConnection } = require('./src/config/database');

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const bookRoutes = require('./src/routes/book.routes');
const authorRoutes = require('./src/routes/author.routes');
const categoryRoutes = require('./src/routes/category.routes');
const memberRoutes = require('./src/routes/member.routes');
const loanRoutes = require('./src/routes/loan.routes');
const reservationRoutes = require('./src/routes/reservation.routes');
const fineRoutes = require('./src/routes/fine.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting
app.use('/api', generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Bibliothèque API Documentation'
}));

// API spec in JSON format
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/books', bookRoutes);
app.use('/api/v1/authors', authorRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/loans', loanRoutes);
app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/fines', fineRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   📚 Bibliothèque Universitaire Centrale API              ║
║                                                            ║
║   Server running on http://localhost:${PORT}                 ║
║   API Documentation: http://localhost:${PORT}/api-docs        ║
║                                                            ║
║   Environment: ${process.env.NODE_ENV || 'development'}                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

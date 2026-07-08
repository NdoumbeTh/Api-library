const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bibliothèque Universitaire Centrale API',
      version: '1.0.0',
      description: `
API de gestion de la Bibliothèque Universitaire Centrale

## Contexte métier
La Bibliothèque Universitaire Centrale souhaite moderniser son système de gestion.
Elle gère des livres, des adhérents, des emprunts et des réservations.

## Règles métier
- Un livre peut avoir plusieurs exemplaires
- Un adhérent peut emprunter jusqu'à 5 livres simultanément
- La durée d'emprunt est de 21 jours, renouvelable une fois
- Un adhérent peut réserver un livre non disponible
- Des amendes sont appliquées en cas de retard (0.50€/jour)

## Authentification
L'API utilise JWT pour l'authentification.
Incluez le token dans l'en-tête: \`Authorization: Bearer <token>\`
      `,
      
    },
    servers: [
      {
        url: '/',
        description: 'API Version 1'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Book: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            title: {
              type: 'string'
            },
            isbn: {
              type: 'string'
            },
            publication_year: {
              type: 'integer'
            },
            publisher: {
              type: 'string'
            },
            language: {
              type: 'string'
            },
            page_count: {
              type: 'integer'
            },
            description: {
              type: 'string'
            },
            author_id: {
              type: 'string',
              format: 'uuid'
            },
            category_id: {
              type: 'string',
              format: 'uuid'
            },
            total_copies: {
              type: 'integer'
            },
            available_copies: {
              type: 'integer'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Copy: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            book_id: {
              type: 'string',
              format: 'uuid'
            },
            inventory_number: {
              type: 'string'
            },
            status: {
              type: 'string',
              enum: ['available', 'borrowed', 'reserved', 'maintenance', 'lost']
            },
            condition: {
              type: 'string',
              enum: ['new', 'good', 'fair', 'poor']
            },
            location: {
              type: 'string'
            }
          }
        },
        Author: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            biography: {
              type: 'string'
            },
            nationality: {
              type: 'string'
            },
            birth_date: {
              type: 'string',
              format: 'date'
            }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            description: {
              type: 'string'
            }
          }
        },
        Member: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            first_name: {
              type: 'string'
            },
            last_name: {
              type: 'string'
            },
            phone: {
              type: 'string'
            },
            address: {
              type: 'string'
            },
            membership_number: {
              type: 'string'
            },
            membership_date: {
              type: 'string',
              format: 'date'
            },
            status: {
              type: 'string',
              enum: ['active', 'suspended', 'expired']
            },
            role: {
              type: 'string',
              enum: ['member', 'librarian', 'admin']
            },
            max_loans: {
              type: 'integer'
            },
            current_loans: {
              type: 'integer'
            }
          }
        },
        Loan: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            copy_id: {
              type: 'string',
              format: 'uuid'
            },
            member_id: {
              type: 'string',
              format: 'uuid'
            },
            loan_date: {
              type: 'string',
              format: 'date'
            },
            due_date: {
              type: 'string',
              format: 'date'
            },
            return_date: {
              type: 'string',
              format: 'date',
              nullable: true
            },
            renewal_count: {
              type: 'integer'
            },
            status: {
              type: 'string',
              enum: ['active', 'returned', 'overdue']
            },
            notes: {
              type: 'string'
            }
          }
        },
        Reservation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            book_id: {
              type: 'string',
              format: 'uuid'
            },
            member_id: {
              type: 'string',
              format: 'uuid'
            },
            reservation_date: {
              type: 'string',
              format: 'date'
            },
            expiry_date: {
              type: 'string',
              format: 'date'
            },
            status: {
              type: 'string',
              enum: ['pending', 'fulfilled', 'cancelled', 'expired']
            },
            priority: {
              type: 'integer'
            }
          }
        },
        Fine: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            loan_id: {
              type: 'string',
              format: 'uuid'
            },
            member_id: {
              type: 'string',
              format: 'uuid'
            },
            amount: {
              type: 'number'
            },
            reason: {
              type: 'string'
            },
            issue_date: {
              type: 'string',
              format: 'date'
            },
            paid_date: {
              type: 'string',
              format: 'date'
            },
            status: {
              type: 'string',
              enum: ['pending', 'paid', 'waived']
            },
            days_overdue: {
              type: 'integer'
            },
            daily_rate: {
              type: 'number'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string'
            },
            code: {
              type: 'string'
            },
            message: {
              type: 'string'
            }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Books', description: 'Book management' },
      { name: 'Copies', description: 'Book copy management' },
      { name: 'Authors', description: 'Author management' },
      { name: 'Categories', description: 'Category management' },
      { name: 'Members', description: 'Member management' },
      { name: 'Loans', description: 'Loan operations' },
      { name: 'Reservations', description: 'Reservation operations' },
      { name: 'Fines', description: 'Fine management' }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

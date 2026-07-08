const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Book = sequelize.define('Book', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 500]
    }
  },
  isbn: {
    type: DataTypes.TEXT,
    unique: true,
    validate: {
      isValidIsbn(value) {
        if (value && !/^(?:\d{10}|\d{13}|[\d-]{13,17})$/.test(value.replace(/-/g, ''))) {
          throw new Error('Format ISBN invalide');
        }
      }
    }
  },
  publication_year: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1000,
      max: new Date().getFullYear() + 1
    }
  },
  publisher: {
    type: DataTypes.TEXT
  },
  language: {
    type: DataTypes.TEXT,
    defaultValue: 'Français'
  },
  page_count: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  author_id: {
    type: DataTypes.UUID,
    references: {
      model: 'authors',
      key: 'id'
    }
  },
  category_id: {
    type: DataTypes.UUID,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  total_copies: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  available_copies: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'books',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['author_id'] },
    { fields: ['category_id'] },
    { fields: ['title'] }
  ]
});

module.exports = Book;

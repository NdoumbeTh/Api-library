const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Copy = sequelize.define('Copy', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  book_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'books',
      key: 'id'
    }
  },
  inventory_number: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  status: {
    type: DataTypes.ENUM('available', 'borrowed', 'reserved', 'maintenance', 'lost'),
    defaultValue: 'available'
  },
  condition: {
    type: DataTypes.ENUM('new', 'good', 'fair', 'poor'),
    defaultValue: 'good'
  },
  acquisition_date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  location: {
    type: DataTypes.TEXT
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'copies',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['book_id'] },
    { fields: ['status'] },
    { fields: ['inventory_number'] }
  ]
});

module.exports = Copy;

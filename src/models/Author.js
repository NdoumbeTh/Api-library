const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Author = sequelize.define('Author', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 255]
    }
  },
  biography: {
    type: DataTypes.TEXT
  },
  nationality: {
    type: DataTypes.TEXT
  },
  birth_date: {
    type: DataTypes.DATEONLY
  }
}, {
  tableName: 'authors',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Author;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Member = sequelize.define('Member', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password_hash: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  first_name: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  last_name: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  phone: {
    type: DataTypes.TEXT,
    validate: {
      is: /^[\d\s\-\+\(\)]{6,20}$/
    }
  },
  address: {
    type: DataTypes.TEXT
  },
  membership_number: {
    type: DataTypes.TEXT,
    unique: true
  },
  membership_date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('active', 'suspended', 'expired'),
    defaultValue: 'active'
  },
  role: {
    type: DataTypes.ENUM('member', 'librarian', 'admin'),
    defaultValue: 'member'
  },
  max_loans: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    validate: {
      min: 1,
      max: 20
    }
  },
  current_loans: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'members',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['membership_number'], unique: true },
    { fields: ['status'] }
  ]
});

module.exports = Member;

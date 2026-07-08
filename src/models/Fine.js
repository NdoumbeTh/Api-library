const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Fine = sequelize.define('Fine', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  loan_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'loans',
      key: 'id'
    }
  },
  member_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'members',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  reason: {
    type: DataTypes.TEXT
  },
  issue_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  paid_date: {
    type: DataTypes.DATEONLY
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'waived'),
    defaultValue: 'pending'
  },
  days_overdue: {
    type: DataTypes.INTEGER
  },
  daily_rate: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.50
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'fines',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['member_id'] },
    { fields: ['loan_id'] },
    { fields: ['status'] }
  ]
});

Fine.prototype.markAsPaid = function() {
  this.status = 'paid';
  this.paid_date = new Date();
  return this.save();
};

module.exports = Fine;

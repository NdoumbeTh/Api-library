const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Loan = sequelize.define('Loan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  copy_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'copies',
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
  loan_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  return_date: {
    type: DataTypes.DATEONLY
  },
  renewal_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      max: 1
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'returned', 'overdue'),
    defaultValue: 'active'
  },
  renewed_from: {
    type: DataTypes.UUID,
    references: {
      model: 'loans',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'loans',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['member_id'] },
    { fields: ['copy_id'] },
    { fields: ['status'] },
    { fields: ['due_date'] }
  ]
});

Loan.prototype.isOverdue = function() {
  if (!this.return_date && this.status === 'active') {
    return new Date() > new Date(this.due_date);
  }
  return false;
};

Loan.prototype.getDaysOverdue = function() {
  if (this.isOverdue()) {
    const today = new Date();
    const dueDate = new Date(this.due_date);
    const diffTime = today - dueDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
};

module.exports = Loan;

const Author = require('./Author');
const Category = require('./Category');
const Book = require('./Book');
const Copy = require('./Copy');
const Member = require('./Member');
const Loan = require('./Loan');
const Reservation = require('./Reservation');
const Fine = require('./Fine');
const { sequelize } = require('../config/database');

// Define associations
// Author has many Books
Author.hasMany(Book, { foreignKey: 'author_id', as: 'books' });
Book.belongsTo(Author, { foreignKey: 'author_id', as: 'author' });

// Category has many Books
Category.hasMany(Book, { foreignKey: 'category_id', as: 'books' });
Book.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Book has many Copies
Book.hasMany(Copy, { foreignKey: 'book_id', as: 'copies' });
Copy.belongsTo(Book, { foreignKey: 'book_id', as: 'book' });

// Member has many Loans
Member.hasMany(Loan, { foreignKey: 'member_id', as: 'loans' });
Loan.belongsTo(Member, { foreignKey: 'member_id', as: 'member' });

// Copy has many Loans
Copy.hasMany(Loan, { foreignKey: 'copy_id', as: 'loans' });
Loan.belongsTo(Copy, { foreignKey: 'copy_id', as: 'copy' });

// Loan self-reference for renewals
Loan.belongsTo(Loan, { foreignKey: 'renewed_from', as: 'original_loan' });
Loan.hasMany(Loan, { foreignKey: 'renewed_from', as: 'renewals' });

// Member has many Reservations
Member.hasMany(Reservation, { foreignKey: 'member_id', as: 'reservations' });
Reservation.belongsTo(Member, { foreignKey: 'member_id', as: 'member' });

// Book has many Reservations
Book.hasMany(Reservation, { foreignKey: 'book_id', as: 'reservations' });
Reservation.belongsTo(Book, { foreignKey: 'book_id', as: 'book' });

// Member has many Fines
Member.hasMany(Fine, { foreignKey: 'member_id', as: 'fines' });
Fine.belongsTo(Member, { foreignKey: 'member_id', as: 'member' });

// Loan has many Fines
Loan.hasMany(Fine, { foreignKey: 'loan_id', as: 'fines' });
Fine.belongsTo(Loan, { foreignKey: 'loan_id', as: 'loan' });

module.exports = {
  sequelize,
  Author,
  Category,
  Book,
  Copy,
  Member,
  Loan,
  Reservation,
  Fine
};

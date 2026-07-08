const bcrypt = require('bcryptjs');
const { sequelize, Author, Category, Book, Copy, Member, Loan, Reservation, Fine } = require('../models');

const seedDatabase = async () => {
  try {
    console.log('🌱 Début du seeding de la base de données...\n');

    await sequelize.sync({ alter: true });
    console.log('🗄️  Schéma synchronisé avec les modèles Sequelize\n');

    // Create Authors
    console.log('📚 Création des auteurs...');
    const authors = await Author.bulkCreate([
      { name: 'Victor Hugo', biography: 'Écrivain, poète et dramaturge français', nationality: 'Français', birth_date: '1802-02-26' },
      { name: 'Marcel Proust', biography: 'Écrivain français', nationality: 'Français', birth_date: '1871-07-10' },
      { name: 'Albert Camus', biography: 'Écrivain et philosophe français', nationality: 'Français', birth_date: '1913-11-07' },
      { name: 'Chinua Achebe', biography: 'Écrivain nigérian', nationality: 'Nigérian', birth_date: '1930-11-16' },
      { name: 'Léopold Sédar Senghor', biography: 'Poète et homme d\'État sénégalais', nationality: 'Sénégalais', birth_date: '1906-10-09' },
      { name: 'Mongo Beti', biography: 'Écrivain camerounais', nationality: 'Camerounais', birth_date: '1932-06-30' }
    ], { returning: true });
    console.log(`   ✅ ${authors.length} auteurs créés\n`);

    // Create Categories
    console.log('📁 Création des catégories...');
    const categories = await Category.bulkCreate([
      { name: 'Roman', description: 'Romans et fictions littéraires' },
      { name: 'Poésie', description: 'Recueils de poèmes' },
      { name: 'Théâtre', description: 'Pièces de théâtre' },
      { name: 'Littérature africaine', description: 'Œuvres d\'écrivains africains' },
      { name: 'Philosophie', description: 'Essais philosophiques' },
      { name: 'Science', description: 'Ouvrages scientifiques' }
    ], { returning: true });
    console.log(`   ✅ ${categories.length} catégories créées\n`);

    // Create Books
    console.log('📖 Création des livres...');
    const books = await Book.bulkCreate([
      {
        title: 'Les Misérables',
        isbn: '978-2-07-040850-4',
        publication_year: 1862,
        publisher: 'Gallimard',
        language: 'Français',
        page_count: 1632,
        description: 'Roman historique racontant la vie de Jean Valjean',
        author_id: authors[0].id,
        category_id: categories[0].id,
        total_copies: 3,
        available_copies: 3
      },
      {
        title: 'Notre-Dame de Paris',
        isbn: '978-2-07-040851-1',
        publication_year: 1831,
        publisher: 'Gallimard',
        language: 'Français',
        page_count: 768,
        description: 'Roman gothique se déroulant à Paris',
        author_id: authors[0].id,
        category_id: categories[0].id,
        total_copies: 2,
        available_copies: 2
      },
      {
        title: 'À la recherche du temps perdu',
        isbn: '978-2-07-030793-6',
        publication_year: 1913,
        publisher: 'Gallimard',
        language: 'Français',
        page_count: 2400,
        description: 'Chef-d\'œuvre de la littérature moderne',
        author_id: authors[1].id,
        category_id: categories[0].id,
        total_copies: 2,
        available_copies: 2
      },
      {
        title: 'L\'Étranger',
        isbn: '978-2-07-036024-8',
        publication_year: 1942,
        publisher: 'Gallimard',
        language: 'Français',
        page_count: 192,
        description: 'Roman philosophique sur l\'absurde',
        author_id: authors[2].id,
        category_id: categories[0].id,
        total_copies: 4,
        available_copies: 4
      },
      {
        title: 'La Peste',
        isbn: '978-2-07-036025-5',
        publication_year: 1947,
        publisher: 'Gallimard',
        language: 'Français',
        page_count: 336,
        description: 'Roman allégorique sur une épidémie',
        author_id: authors[2].id,
        category_id: categories[4].id,
        total_copies: 3,
        available_copies: 3
      },
      {
        title: 'Things Fall Apart',
        isbn: '978-0-385-47454-2',
        publication_year: 1958,
        publisher: 'Heinemann',
        language: 'Anglais',
        page_count: 176,
        description: 'Roman sur la colonisation au Nigeria',
        author_id: authors[3].id,
        category_id: categories[3].id,
        total_copies: 2,
        available_copies: 2
      },
      {
        title: 'Chants d\'ombre',
        isbn: '978-2-02-000052-0',
        publication_year: 1945,
        publisher: 'Seuil',
        language: 'Français',
        page_count: 96,
        description: 'Recueil de poèmes célébrant l\'Afrique',
        author_id: authors[4].id,
        category_id: categories[1].id,
        total_copies: 2,
        available_copies: 2
      },
      {
        title: 'Ville cruelle',
        isbn: '978-2-07-023412-3',
        publication_year: 1954,
        publisher: 'Présence Africaine',
        language: 'Français',
        page_count: 256,
        description: 'Roman dénonçant le colonialisme',
        author_id: authors[5].id,
        category_id: categories[3].id,
        total_copies: 2,
        available_copies: 2
      }
    ], { returning: true });
    console.log(`   ✅ ${books.length} livres créés\n`);

    // Create Copies for each book
    console.log('📋 Création des exemplaires...');
    let copyCounter = 1;
    const copies = [];

    for (const book of books) {
      for (let i = 0; i < book.total_copies; i++) {
        const copy = await Copy.create({
          book_id: book.id,
          inventory_number: `COPY-${String(copyCounter).padStart(5, '0')}`,
          status: 'available',
          condition: 'good',
          location: 'Rayon A',
          acquisition_date: new Date()
        });
        copies.push(copy);
        copyCounter++;
      }
    }
    console.log(`   ✅ ${copies.length} exemplaires créés\n`);

    // Create Members
    console.log('👥 Création des adhérents...');
    const passwordHash = await bcrypt.hash('password123', 10);

    const members = await Member.bulkCreate([
      {
        email: 'admin@library.epf',
        password_hash: passwordHash,
        first_name: 'Admin',
        last_name: 'System',
        phone: '+221 77 123 45 67',
        address: 'EPF Africa, Dakar',
        status: 'active',
        role: 'admin',
        max_loans: 20,
        current_loans: 0
      },
      {
        email: 'librarian@library.epf',
        password_hash: passwordHash,
        first_name: 'Fatou',
        last_name: 'Diop',
        phone: '+221 77 234 56 78',
        address: 'Dakar, Sénégal',
        status: 'active',
        role: 'librarian',
        max_loans: 10,
        current_loans: 0
      },
      {
        email: 'amadou.student@epf.fr',
        password_hash: passwordHash,
        first_name: 'Amadou',
        last_name: 'Ba',
        phone: '+221 77 345 67 89',
        address: 'Thiès, Sénégal',
        status: 'active',
        role: 'member',
        max_loans: 5,
        current_loans: 0
      },
      {
        email: 'marie.student@epf.fr',
        password_hash: passwordHash,
        first_name: 'Marie',
        last_name: 'Ndiaye',
        phone: '+221 77 456 78 90',
        address: 'Saint-Louis, Sénégal',
        status: 'active',
        role: 'member',
        max_loans: 5,
        current_loans: 0
      },
      {
        email: 'ousseynou.student@epf.fr',
        password_hash: passwordHash,
        first_name: 'Ousseynou',
        last_name: 'Fall',
        phone: '+221 77 567 89 01',
        address: 'Kaolack, Sénégal',
        status: 'active',
        role: 'member',
        max_loans: 5,
        current_loans: 0
      }
    ], { returning: true });
    console.log(`   ✅ ${members.length} adhérents créés\n`);
    console.log('   ℹ️  Mot de passe pour tous les comptes: password123\n');

    console.log('✅ Seeding terminé avec succès !\n');
    console.log('═══════════════════════════════════════════');
    console.log('Comptes de test créés:');
    console.log('═══════════════════════════════════════════');
    console.log('Admin: admin@library.epf / password123');
    console.log('Bibliothécaire: librarian@library.epf / password123');
    console.log('Membre: amadou.student@epf.fr / password123');
    console.log('═══════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
  }
};

// Run seed if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

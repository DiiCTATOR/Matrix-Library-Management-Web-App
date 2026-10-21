const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database');
const booksFile = path.join(dbPath, 'books.json');

async function seedBooks() {
    console.log('Fetching books from Open Library API...');
    try {
        const response = await fetch('https://openlibrary.org/search.json?q=classic+fiction&limit=50&language=eng');
        const data = await response.json();

        if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath);

        const books = data.docs.filter(doc => doc.title && doc.author_name && doc.first_publish_year).map((doc, index) => {
            const copies = Math.floor(Math.random() * 5) + 2; // 2 to 6 copies
            return {
                id: index + 1,
                title: doc.title,
                author: doc.author_name[0],
                genre: doc.subject ? doc.subject[0] : 'Fiction',
                year: doc.first_publish_year,
                total_copies: copies,
                available_copies: copies,
                coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null
            };
        });

        fs.writeFileSync(booksFile, JSON.stringify(books, null, 2));
        console.log(`Successfully seeded ${books.length} books into database/books.json`);
    } catch (err) {
        console.error('Error seeding database:', err);
    }
}

seedBooks(); 

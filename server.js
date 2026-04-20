const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database paths
const dbPath = path.join(__dirname, 'database');
const booksFile = path.join(dbPath, 'books.json');
const membersFile = path.join(dbPath, 'members.json');
const txnsFile = path.join(dbPath, 'transactions.json');

// Helper to ensure database files exist
function ensureDb() {
    if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath);
    if (!fs.existsSync(booksFile)) fs.writeFileSync(booksFile, JSON.stringify([]));
    if (!fs.existsSync(membersFile)) fs.writeFileSync(membersFile, JSON.stringify([]));
    if (!fs.existsSync(txnsFile)) fs.writeFileSync(txnsFile, JSON.stringify([]));
}
ensureDb();

// Helper to read/write JSON
const readData = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeData = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// =======================
// AUTH API
// =======================
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // Hardcoded admin credentials
    if (username === 'admin' && password === 'admin123') {
        res.json({ success: true, token: 'admin-auth-token' });
    } else {
        res.status(401).json({ error: 'Invalid Admin ID or Password' });
    }
});

// =======================
// BOOKS API
// =======================
app.get('/api/books', (req, res) => {
    res.json(readData(booksFile));
});

app.post('/api/books', (req, res) => {
    const books = readData(booksFile);
    const newBook = {
        id: books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1,
        title: req.body.title || 'Unknown Title',
        author: req.body.author || 'Unknown Author',
        genre: req.body.genre || 'General',
        year: parseInt(req.body.year) || new Date().getFullYear(),
        total_copies: parseInt(req.body.total_copies) || 1,
        available_copies: parseInt(req.body.total_copies) || 1,
        coverUrl: req.body.coverUrl || ''
    };
    books.push(newBook);
    writeData(booksFile, books);
    res.status(201).json(newBook);
});

// =======================
// MEMBERS API
// =======================
app.get('/api/members', (req, res) => {
    res.json(readData(membersFile));
});

app.post('/api/members', (req, res) => {
    const members = readData(membersFile);
    const newMember = {
        id: members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1,
        name: req.body.name || 'Unknown',
        email: req.body.email || '',
        phone: req.body.phone || '',
        borrowed_count: 0
    };
    members.push(newMember);
    writeData(membersFile, members);
    res.status(201).json(newMember);
});

// =======================
// TRANSACTIONS API
// =======================
app.get('/api/transactions', (req, res) => {
    res.json(readData(txnsFile));
});

app.post('/api/transactions/issue', (req, res) => {
    const { book_id, member_id } = req.body;
    const books = readData(booksFile);
    const members = readData(membersFile);
    const txns = readData(txnsFile);

    const bIdx = books.findIndex(b => b.id === parseInt(book_id));
    const mIdx = members.findIndex(m => m.id === parseInt(member_id));

    if (bIdx === -1) return res.status(404).json({ error: 'Book not found' });
    if (mIdx === -1) return res.status(404).json({ error: 'Member not found' });
    if (books[bIdx].available_copies <= 0) return res.status(400).json({ error: 'No copies available' });
    if (members[mIdx].borrowed_count >= 3) return res.status(400).json({ error: 'Borrow limit reached' });

    // Check if member already has this book
    const existingTxn = txns.find(t => t.book_id === parseInt(book_id) && t.member_id === parseInt(member_id) && !t.returned);
    if (existingTxn) return res.status(400).json({ error: 'Member already has this book' });

    books[bIdx].available_copies -= 1;
    members[mIdx].borrowed_count += 1;

    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;

    const newTxn = {
        trans_id: txns.length > 0 ? Math.max(...txns.map(t => t.trans_id)) + 1 : 1,
        book_id: parseInt(book_id),
        member_id: parseInt(member_id),
        issue_date: formattedDate,
        return_date: 'PENDING',
        returned: 0
    };

    txns.push(newTxn);

    writeData(booksFile, books);
    writeData(membersFile, members);
    writeData(txnsFile, txns);

    res.status(201).json(newTxn);
});

app.post('/api/transactions/return', (req, res) => {
    const { trans_id } = req.body;
    const books = readData(booksFile);
    const members = readData(membersFile);
    const txns = readData(txnsFile);

    const tIdx = txns.findIndex(t => t.trans_id === parseInt(trans_id));
    if (tIdx === -1) return res.status(404).json({ error: 'Transaction not found' });
    if (txns[tIdx].returned === 1) return res.status(400).json({ error: 'Already returned' });

    const bIdx = books.findIndex(b => b.id === txns[tIdx].book_id);
    const mIdx = members.findIndex(m => m.id === txns[tIdx].member_id);

    if (bIdx !== -1) books[bIdx].available_copies += 1;
    if (mIdx !== -1 && members[mIdx].borrowed_count > 0) members[mIdx].borrowed_count -= 1;

    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;

    txns[tIdx].return_date = formattedDate;
    txns[tIdx].returned = 1;

    writeData(booksFile, books);
    writeData(membersFile, members);
    writeData(txnsFile, txns);

    res.json(txns[tIdx]);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

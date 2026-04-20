// Global State
let state = {
    books: [],
    members: [],
    transactions: []
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (token) {
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('appContainer').style.display = 'flex';
        fetchData();
        setupNavigation();
        setupForms();
    } else {
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('appContainer').style.display = 'none';
        setupLoginForm();
    }
}

function logout() {
    localStorage.removeItem('adminToken');
    checkAuth();
}

function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const u = document.getElementById('loginUsername').value;
        const p = document.getElementById('loginPassword').value;
        const errDiv = document.getElementById('loginError');

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: u, password: p })
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('adminToken', data.token);
                errDiv.style.display = 'none';
                loginForm.reset();
                checkAuth();
            } else {
                errDiv.style.display = 'block';
            }
        } catch (err) {
            errDiv.textContent = 'Server error.';
            errDiv.style.display = 'block';
        }
    };
}

// Navigation Logic
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active nav
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Show corresponding view
            const targetView = item.getAttribute('data-tab');
            views.forEach(view => {
                if(view.id === targetView) {
                    view.classList.add('active-view');
                } else {
                    view.classList.remove('active-view');
                }
            });
        });
    });
}

// Data Fetching
async function fetchData() {
    try {
        const [booksRes, membersRes, txnsRes] = await Promise.all([
            fetch('/api/books'),
            fetch('/api/members'),
            fetch('/api/transactions')
        ]);

        state.books = await booksRes.json();
        state.members = await membersRes.json();
        state.transactions = await txnsRes.json();

        updateDashboard();
        renderBooks();
        renderMembers();
        renderTransactions();
        populateSelects();
    } catch (err) {
        console.error('Failed to fetch data:', err);
    }
}

// Rendering
function updateDashboard() {
    document.getElementById('totalBooks').textContent = state.books.length;
    document.getElementById('totalMembers').textContent = state.members.length;
    document.getElementById('totalTxns').textContent = state.transactions.filter(t => t.returned === 0).length;

    // Render 4 recent books
    const recentBooks = [...state.books].reverse().slice(0, 4);
    const grid = document.getElementById('recentBooksGrid');
    grid.innerHTML = recentBooks.map(book => createBookCard(book)).join('');
}

function renderBooks() {
    const grid = document.getElementById('booksGrid');
    grid.innerHTML = state.books.map(book => createBookCard(book)).join('');
}

function createBookCard(book) {
    const coverHtml = book.coverUrl 
        ? `<img src="${book.coverUrl}" alt="Cover">`
        : `<div class="placeholder">📚</div>`;

    return `
        <div class="book-card">
            <div class="book-cover ${!book.coverUrl ? 'placeholder' : ''}">
                ${coverHtml}
            </div>
            <div class="book-info">
                <div class="book-title" title="${book.title}">${book.title}</div>
                <div class="book-author">${book.author}</div>
                <div class="book-meta">
                    <span>ID: ${book.id}</span>
                    <span>${book.available_copies}/${book.total_copies} Avail</span>
                </div>
            </div>
        </div>
    `;
}

function renderMembers() {
    const tbody = document.getElementById('membersTableBody');
    tbody.innerHTML = state.members.map(member => `
        <tr>
            <td>${member.id}</td>
            <td>${member.name}</td>
            <td>${member.email}</td>
            <td>${member.borrowed_count}</td>
        </tr>
    `).join('');
}

function renderTransactions() {
    const tbody = document.getElementById('transactionsTableBody');
    tbody.innerHTML = state.transactions.map(txn => {
        const statusClass = txn.returned === 1 ? 'returned' : 'pending';
        const statusText = txn.returned === 1 ? 'Returned' : 'Pending';
        return `
        <tr>
            <td>${txn.trans_id}</td>
            <td>${txn.book_id}</td>
            <td>${txn.member_id}</td>
            <td>${txn.issue_date}</td>
            <td>${txn.return_date}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        </tr>
    `}).reverse().join('');
}

// Populate Select Dropdowns for Forms
function populateSelects() {
    const bookSelect = document.getElementById('iBookId');
    if (bookSelect) {
        bookSelect.innerHTML = '<option value="">-- Choose a book --</option>' + 
            state.books.filter(b => b.available_copies > 0).map(b => `<option value="${b.id}">${b.title} (ID: ${b.id})</option>`).join('');
    }

    const memberSelect = document.getElementById('iMemberId');
    if (memberSelect) {
        memberSelect.innerHTML = '<option value="">-- Choose a member --</option>' + 
            state.members.map(m => `<option value="${m.id}">${m.name} (ID: ${m.id})</option>`).join('');
    }

    const transSelect = document.getElementById('rTransId');
    if (transSelect) {
        transSelect.innerHTML = '<option value="">-- Choose a pending transaction --</option>' + 
            state.transactions.filter(t => t.returned === 0).map(t => {
                const b = state.books.find(book => book.id === t.book_id);
                const m = state.members.find(member => member.id === t.member_id);
                const bTitle = b ? b.title : 'Unknown Book';
                const mName = m ? m.name : 'Unknown Member';
                return `<option value="${t.trans_id}">TID: ${t.trans_id} - ${bTitle} (${mName})</option>`;
            }).join('');
    }
}

// Modal Logic
function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// Form Handling
function setupForms() {
    // Add Member
    document.getElementById('addMemberForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('mName').value,
            email: document.getElementById('mEmail').value,
            phone: document.getElementById('mPhone').value
        };
        const res = await fetch('/api/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if(res.ok) {
            closeModal('addMemberModal');
            e.target.reset();
            fetchData();
        }
    });

    // Issue Book
    document.getElementById('issueBookForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            book_id: document.getElementById('iBookId').value,
            member_id: document.getElementById('iMemberId').value
        };
        const res = await fetch('/api/transactions/issue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if(res.ok) {
            closeModal('issueBookModal');
            e.target.reset();
            fetchData();
        } else {
            const err = await res.json();
            alert(err.error);
        }
    });

    // Return Book
    document.getElementById('returnBookForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            trans_id: document.getElementById('rTransId').value
        };
        const res = await fetch('/api/transactions/return', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if(res.ok) {
            closeModal('returnBookModal');
            e.target.reset();
            fetchData();
        } else {
            const err = await res.json();
            alert(err.error);
        }
    });
}

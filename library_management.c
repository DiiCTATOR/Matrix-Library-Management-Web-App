#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_BOOKS 1000
#define MAX_MEMBERS 500
#define BOOKS_FILE "books.dat"
#define MEMBERS_FILE "members.dat"
#define TRANSACTIONS_FILE "transactions.dat"

// ─────────────────────────────────────────────
//  Data Structures
// ─────────────────────────────────────────────

typedef struct {
    int     id;
    char    title[100];
    char    author[60];
    char    genre[30];
    int     year;
    int     total_copies;
    int     available_copies;
} Book;

typedef struct {
    int     id;
    char    name[60];
    char    email[80];
    char    phone[15];
    int     borrowed_count;   // currently borrowed
} Member;

typedef struct {
    int     trans_id;
    int     book_id;
    int     member_id;
    char    issue_date[12];   // "DD-MM-YYYY"
    char    return_date[12];  // "DD-MM-YYYY" or "PENDING"
    int     returned;         // 0 = not returned, 1 = returned
} Transaction;

// ─────────────────────────────────────────────
//  Utility helpers
// ─────────────────────────────────────────────

#include <ctype.h>
char *strcasestr(const char *haystack, const char *needle) {
    if (!*needle) return (char *)haystack;
    for (const char *p = haystack; *p; p++) {
        if (tolower((unsigned char)*p) == tolower((unsigned char)*needle)) {
            const char *h = p, *n = needle;
            while (*h && *n && tolower((unsigned char)*h) == tolower((unsigned char)*n)) {
                h++; n++;
            }
            if (!*n) return (char *)p;
        }
    }
    return NULL;
}

void clear_input_buffer(void) {
    int c;
    while ((c = getchar()) != '\n' && c != EOF);
}

void print_divider(void) {
    printf("\n%s\n", "============================================================");
}

// ─────────────────────────────────────────────
//  File I/O helpers
// ─────────────────────────────────────────────

int load_books(Book books[], int *count) {
    FILE *fp = fopen(BOOKS_FILE, "rb");
    if (!fp) { *count = 0; return 0; }
    *count = fread(books, sizeof(Book), MAX_BOOKS, fp);
    fclose(fp);
    return 1;
}

int save_books(Book books[], int count) {
    FILE *fp = fopen(BOOKS_FILE, "wb");
    if (!fp) return 0;
    fwrite(books, sizeof(Book), count, fp);
    fclose(fp);
    return 1;
}

int load_members(Member members[], int *count) {
    FILE *fp = fopen(MEMBERS_FILE, "rb");
    if (!fp) { *count = 0; return 0; }
    *count = fread(members, sizeof(Member), MAX_MEMBERS, fp);
    fclose(fp);
    return 1;
}

int save_members(Member members[], int count) {
    FILE *fp = fopen(MEMBERS_FILE, "wb");
    if (!fp) return 0;
    fwrite(members, sizeof(Member), count, fp);
    fclose(fp);
    return 1;
}

int load_transactions(Transaction txns[], int *count) {
    FILE *fp = fopen(TRANSACTIONS_FILE, "rb");
    if (!fp) { *count = 0; return 0; }
    *count = fread(txns, sizeof(Transaction), MAX_BOOKS * 2, fp);
    fclose(fp);
    return 1;
}

int save_transactions(Transaction txns[], int count) {
    FILE *fp = fopen(TRANSACTIONS_FILE, "wb");
    if (!fp) return 0;
    fwrite(txns, sizeof(Transaction), count, fp);
    fclose(fp);
    return 1;
}

// ─────────────────────────────────────────────
//  Book Management
// ─────────────────────────────────────────────

void add_book(Book books[], int *count) {
    if (*count >= MAX_BOOKS) {
        printf("Library is full. Cannot add more books.\n");
        return;
    }
    Book b;
    b.id = (*count == 0) ? 1 : books[*count - 1].id + 1;

    printf("\n--- Add New Book ---\n");
    printf("Title  : "); fgets(b.title,  sizeof(b.title),  stdin); b.title[strcspn(b.title,  "\n")] = 0;
    printf("Author : "); fgets(b.author, sizeof(b.author), stdin); b.author[strcspn(b.author, "\n")] = 0;
    printf("Genre  : "); fgets(b.genre,  sizeof(b.genre),  stdin); b.genre[strcspn(b.genre,  "\n")] = 0;
    printf("Year   : "); scanf("%d", &b.year);  clear_input_buffer();
    printf("Copies : "); scanf("%d", &b.total_copies); clear_input_buffer();
    b.available_copies = b.total_copies;

    books[*count] = b;
    (*count)++;
    save_books(books, *count);
    printf("Book added with ID: %d\n", b.id);
}

void list_books(Book books[], int count) {
    if (count == 0) { printf("No books in the library.\n"); return; }
    print_divider();
    printf("%-5s %-35s %-25s %-6s %-5s %-5s\n",
           "ID", "Title", "Author", "Year", "Total", "Avail");
    print_divider();
    for (int i = 0; i < count; i++) {
        printf("%-5d %-35s %-25s %-6d %-5d %-5d\n",
               books[i].id, books[i].title, books[i].author,
               books[i].year, books[i].total_copies, books[i].available_copies);
    }
    print_divider();
}

int find_book_index(Book books[], int count, int id) {
    for (int i = 0; i < count; i++)
        if (books[i].id == id) return i;
    return -1;
}

void search_book(Book books[], int count) {
    char keyword[60];
    printf("Enter title or author to search: ");
    fgets(keyword, sizeof(keyword), stdin);
    keyword[strcspn(keyword, "\n")] = 0;

    int found = 0;
    print_divider();
    for (int i = 0; i < count; i++) {
        if (strcasestr(books[i].title, keyword) ||
            strcasestr(books[i].author, keyword)) {
            printf("[%d] %s by %s (%d) — Available: %d/%d\n",
                   books[i].id, books[i].title, books[i].author,
                   books[i].year, books[i].available_copies, books[i].total_copies);
            found++;
        }
    }
    if (!found) printf("No matching books found.\n");
    print_divider();
}

void delete_book(Book books[], int *count) {
    int id;
    printf("Enter Book ID to delete: ");
    scanf("%d", &id); clear_input_buffer();
    int idx = find_book_index(books, *count, id);
    if (idx == -1) { printf("Book not found.\n"); return; }
    if (books[idx].available_copies != books[idx].total_copies) {
        printf("Cannot delete: some copies are currently borrowed.\n");
        return;
    }
    for (int i = idx; i < *count - 1; i++) books[i] = books[i + 1];
    (*count)--;
    save_books(books, *count);
    printf("Book deleted successfully.\n");
}

// ─────────────────────────────────────────────
//  Member Management
// ─────────────────────────────────────────────

void add_member(Member members[], int *count) {
    if (*count >= MAX_MEMBERS) { printf("Member limit reached.\n"); return; }
    Member m;
    m.id = (*count == 0) ? 1 : members[*count - 1].id + 1;
    m.borrowed_count = 0;

    printf("\n--- Register New Member ---\n");
    printf("Name  : "); fgets(m.name,  sizeof(m.name),  stdin); m.name[strcspn(m.name,  "\n")] = 0;
    printf("Email : "); fgets(m.email, sizeof(m.email), stdin); m.email[strcspn(m.email, "\n")] = 0;
    printf("Phone : "); fgets(m.phone, sizeof(m.phone), stdin); m.phone[strcspn(m.phone, "\n")] = 0;

    members[*count] = m;
    (*count)++;
    save_members(members, *count);
    printf("Member registered with ID: %d\n", m.id);
}

void list_members(Member members[], int count) {
    if (count == 0) { printf("No members registered.\n"); return; }
    print_divider();
    printf("%-5s %-25s %-30s %-15s %-8s\n", "ID", "Name", "Email", "Phone", "Borrowed");
    print_divider();
    for (int i = 0; i < count; i++) {
        printf("%-5d %-25s %-30s %-15s %-8d\n",
               members[i].id, members[i].name, members[i].email,
               members[i].phone, members[i].borrowed_count);
    }
    print_divider();
}

int find_member_index(Member members[], int count, int id) {
    for (int i = 0; i < count; i++)
        if (members[i].id == id) return i;
    return -1;
}

// ─────────────────────────────────────────────
//  Transactions (Issue / Return)
// ─────────────────────────────────────────────

void issue_book(Book books[], int bcount,
                Member members[], int mcount,
                Transaction txns[], int *tcount) {
    int bid, mid;
    printf("Enter Book ID   : "); scanf("%d", &bid); clear_input_buffer();
    printf("Enter Member ID : "); scanf("%d", &mid); clear_input_buffer();

    int bi = find_book_index(books, bcount, bid);
    int mi = find_member_index(members, mcount, mid);

    if (bi == -1) { printf("Book not found.\n");   return; }
    if (mi == -1) { printf("Member not found.\n"); return; }
    if (books[bi].available_copies <= 0) { printf("No copies available.\n"); return; }
    if (members[mi].borrowed_count >= 3) { printf("Member has reached borrow limit (3).\n"); return; }

    // Check if member already has this book
    for (int i = 0; i < *tcount; i++) {
        if (txns[i].book_id == bid && txns[i].member_id == mid && !txns[i].returned) {
            printf("Member already has this book.\n");
            return;
        }
    }

    Transaction t;
    t.trans_id  = (*tcount == 0) ? 1 : txns[*tcount - 1].trans_id + 1;
    t.book_id   = bid;
    t.member_id = mid;
    t.returned  = 0;
    printf("Issue date (DD-MM-YYYY): "); fgets(t.issue_date, sizeof(t.issue_date), stdin);
    t.issue_date[strcspn(t.issue_date, "\n")] = 0;
    strcpy(t.return_date, "PENDING");

    books[bi].available_copies--;
    members[mi].borrowed_count++;

    txns[*tcount] = t;
    (*tcount)++;

    save_books(books, bcount);
    save_members(members, mcount);
    save_transactions(txns, *tcount);
    printf("Book issued. Transaction ID: %d\n", t.trans_id);
}

void return_book(Book books[], int bcount,
                 Member members[], int mcount,
                 Transaction txns[], int tcount) {
    int tid;
    printf("Enter Transaction ID: "); scanf("%d", &tid); clear_input_buffer();

    for (int i = 0; i < tcount; i++) {
        if (txns[i].trans_id == tid) {
            if (txns[i].returned) { printf("Book already returned.\n"); return; }

            printf("Return date (DD-MM-YYYY): ");
            fgets(txns[i].return_date, sizeof(txns[i].return_date), stdin);
            txns[i].return_date[strcspn(txns[i].return_date, "\n")] = 0;
            txns[i].returned = 1;

            int bi = find_book_index(books, bcount, txns[i].book_id);
            int mi = find_member_index(members, mcount, txns[i].member_id);
            if (bi != -1) books[bi].available_copies++;
            if (mi != -1 && members[mi].borrowed_count > 0) members[mi].borrowed_count--;

            save_books(books, bcount);
            save_members(members, mcount);
            save_transactions(txns, tcount);
            printf("Book returned successfully.\n");
            return;
        }
    }
    printf("Transaction not found.\n");
}

void view_transactions(Transaction txns[], int count,
                       Book books[], int bcount,
                       Member members[], int mcount) {
    if (count == 0) { printf("No transactions recorded.\n"); return; }
    print_divider();
    printf("%-6s %-35s %-20s %-12s %-12s %-8s\n",
           "TID", "Book", "Member", "Issue", "Return", "Status");
    print_divider();
    for (int i = 0; i < count; i++) {
        int bi = find_book_index(books, bcount, txns[i].book_id);
        int mi = find_member_index(members, mcount, txns[i].member_id);
        char *btitle  = (bi != -1) ? books[bi].title   : "Unknown";
        char *mname   = (mi != -1) ? members[mi].name  : "Unknown";
        printf("%-6d %-35s %-20s %-12s %-12s %-8s\n",
               txns[i].trans_id, btitle, mname,
               txns[i].issue_date, txns[i].return_date,
               txns[i].returned ? "Returned" : "Pending");
    }
    print_divider();
}

// ─────────────────────────────────────────────
//  Menus
// ─────────────────────────────────────────────

void book_menu(Book books[], int *bcount) {
    int choice;
    do {
        printf("\n=== Book Management ===\n");
        printf("1. Add Book\n2. List All Books\n3. Search Book\n4. Delete Book\n0. Back\n");
        printf("Choice: "); scanf("%d", &choice); clear_input_buffer();
        switch (choice) {
            case 1: add_book(books, bcount);          break;
            case 2: list_books(books, *bcount);        break;
            case 3: search_book(books, *bcount);       break;
            case 4: delete_book(books, bcount);        break;
        }
    } while (choice != 0);
}

void member_menu(Member members[], int *mcount) {
    int choice;
    do {
        printf("\n=== Member Management ===\n");
        printf("1. Register Member\n2. List Members\n0. Back\n");
        printf("Choice: "); scanf("%d", &choice); clear_input_buffer();
        switch (choice) {
            case 1: add_member(members, mcount);       break;
            case 2: list_members(members, *mcount);    break;
        }
    } while (choice != 0);
}

void transaction_menu(Book books[], int bcount,
                      Member members[], int mcount,
                      Transaction txns[], int *tcount) {
    int choice;
    do {
        printf("\n=== Transactions ===\n");
        printf("1. Issue Book\n2. Return Book\n3. View All Transactions\n0. Back\n");
        printf("Choice: "); scanf("%d", &choice); clear_input_buffer();
        switch (choice) {
            case 1: issue_book(books, bcount, members, mcount, txns, tcount);           break;
            case 2: return_book(books, bcount, members, mcount, txns, *tcount);         break;
            case 3: view_transactions(txns, *tcount, books, bcount, members, mcount);   break;
        }
    } while (choice != 0);
}

// ─────────────────────────────────────────────
//  Entry Point
// ─────────────────────────────────────────────

int main(void) {
    setvbuf(stdout, NULL, _IONBF, 0);
    Book        books[MAX_BOOKS];
    Member      members[MAX_MEMBERS];
    Transaction txns[MAX_BOOKS * 2];
    int bcount = 0, mcount = 0, tcount = 0;

    load_books(books, &bcount);
    load_members(members, &mcount);
    load_transactions(txns, &tcount);

    printf("\n╔══════════════════════════════════╗");
    printf("\n║   LIBRARY MANAGEMENT SYSTEM      ║");
    printf("\n╚══════════════════════════════════╝\n");

    int choice;
    do {
        printf("\n=== Main Menu ===\n");
        printf("1. Book Management\n");
        printf("2. Member Management\n");
        printf("3. Transactions (Issue / Return)\n");
        printf("0. Exit\n");
        printf("Choice: "); scanf("%d", &choice); clear_input_buffer();

        switch (choice) {
            case 1: book_menu(books, &bcount);                                           break;
            case 2: member_menu(members, &mcount);                                       break;
            case 3: transaction_menu(books, bcount, members, mcount, txns, &tcount);     break;
            case 0: printf("Goodbye!\n");                                                break;
            default: printf("Invalid choice.\n");
        }
    } while (choice != 0);

    return 0;
}

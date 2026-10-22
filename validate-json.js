const fs = require("fs");

const files = [
    "database/books.json",
    "database/members.json",
    "database/transactions.json"
];

let failed = false;

for (const file of files) {
    try {
        JSON.parse(fs.readFileSync(file, "utf8"));
        console.log(`✓ Valid JSON: ${file}`);
    } catch (error) {
        console.error(`✗ Invalid JSON: ${file}`);
        console.error(error.message);
        failed = true;
    }
}

if (failed) {
    process.exit(1);
}

console.log("All JSON database files are valid.");

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../loan_calculator.db');
let db;

function getDatabase() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

function initDatabase() {
  const database = getDatabase();
  database.exec(`
    CREATE TABLE IF NOT EXISTS loan_history (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      principal      REAL    NOT NULL,
      interest_rate  REAL    NOT NULL,
      period         INTEGER NOT NULL,
      monthly_payment REAL   NOT NULL,
      total_interest REAL    NOT NULL,
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('데이터베이스 초기화 완료');
}

module.exports = { getDatabase, initDatabase };

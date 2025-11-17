import Database from "better-sqlite3";

const db: Database.Database = new Database("database.db");

export default db;
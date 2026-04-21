// src/database/schema.ts

import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export function getDatabase(): SQLite.SQLiteDatabase {
    if (!db) {
        db = SQLite.openDatabaseSync('minicollector.db');
    }
    return db;
}

export async function initDatabase(): Promise<void> {
    const database = getDatabase();

    await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS cars (
      id                  TEXT PRIMARY KEY NOT NULL,
      name                TEXT NOT NULL,
      brand               TEXT NOT NULL DEFAULT '',
      manufacture         TEXT NOT NULL DEFAULT 'Hot Wheels',
      year                INTEGER NOT NULL DEFAULT 0,
      scale               TEXT NOT NULL DEFAULT '1:64',
      condition           TEXT NOT NULL DEFAULT 'good',
      purchase_price      REAL,
      current_value       REAL,
      purchase_date       TEXT,
      notes               TEXT,
      image_uri           TEXT,
      thumbnail_uri       TEXT,
      last_update         TEXT,
      color               TEXT,
      base_color          TEXT,
      serie               TEXT,
      country             TEXT,
      base_code           TEXT,
      card_series_number  TEXT,
      card_collection_number TEXT,
      card_series_name    TEXT,
      created_at          TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
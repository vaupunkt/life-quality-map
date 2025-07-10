import Database from 'better-sqlite3'
import path from 'path'

// Returns a singleton DB connection
let db: Database.Database | null = null
export function getDb() {
  if (!db) {
    db = new Database(path.resolve(process.cwd(), 'geocode_cache.sqlite'))
    db.pragma('journal_mode = WAL')
  }
  return db
}

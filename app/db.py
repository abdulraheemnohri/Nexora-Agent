import json
import sqlite3
from pathlib import Path
from app.config import get_settings

def connect():
    path = Path(get_settings().database_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path)
    db.row_factory = sqlite3.Row
    db.executescript("""
    CREATE TABLE IF NOT EXISTS memories(id INTEGER PRIMARY KEY, content TEXT NOT NULL, kind TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS skills(id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, instructions TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'proposed', version INTEGER NOT NULL DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY, event TEXT NOT NULL, details TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS tasks(id INTEGER PRIMARY KEY, prompt TEXT NOT NULL, status TEXT NOT NULL, result TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    """)
    return db

def audit(event, details=""):
    with connect() as db:
        db.execute("INSERT INTO audit(event,details) VALUES(?,?)",(event,details))

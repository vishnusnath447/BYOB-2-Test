import sqlite3
from pathlib import Path

DB_PATH = Path("data/payments.db")


def get_connection():
    if not DB_PATH.exists():
        raise FileNotFoundError("payments.db not found")

    return sqlite3.connect(DB_PATH)
import sqlite3
from datetime import datetime

DB_PATH = "data/payments.db"

SUCCESSFUL_TRANSACTIONS = [
    ("PTX-1001", "CR-9001"),
    ("PTX-1002", "CR-9002"),
    ("PTX-1003", "CR-9003"),
    ("PTX-1004", "CR-9004"),
    ("PTX-1005", "CR-9005"),
    # PTX-1006 failed → skip
    ("PTX-1007", "CR-9007"),
    ("PTX-1008", "CR-9008"),
    ("PTX-1009", "CR-9009"),
    ("PTX-1010", "CR-9010"),
    ("PTX-1011", "CR-9011"),
    ("PTX-1012", "CR-9012"),
    ("PTX-1013", "CR-9013"),
    # PTX-1014 failed → skip
    ("PTX-1015", "CR-9015"),
    ("PTX-1016", "CR-9016"),
    ("PTX-1017", "CR-9017"),
    ("PTX-1018", "CR-9018"),
    ("PTX-1019", "CR-9019"),
    ("PTX-1020", "CR-9020"),
]

def seed():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            paymentTrackingId TEXT UNIQUE NOT NULL,
            callRefId TEXT NOT NULL,
            status TEXT NOT NULL,
            createdAt TEXT NOT NULL
        )
    """)

    # Clear existing data (safe for hackathon demo)
    cursor.execute("DELETE FROM payments")

    # Insert successful transactions
    for payment_id, call_ref in SUCCESSFUL_TRANSACTIONS:
        cursor.execute("""
            INSERT INTO payments (paymentTrackingId, callRefId, status, createdAt)
            VALUES (?, ?, ?, ?)
        """, (
            payment_id,
            call_ref,
            "SUCCESS",
            datetime.utcnow().isoformat()
        ))

    conn.commit()
    conn.close()

    print("Database seeded successfully with 18 successful transactions.")


if __name__ == "__main__":
    seed()
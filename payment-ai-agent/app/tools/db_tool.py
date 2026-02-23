from services.db import get_connection


def check_transaction(payment_tracking_id: str) -> dict:
    """
    Check if transaction exists in database.
    """

    try:
        conn = get_connection()
    except FileNotFoundError as e:
        return {"error": str(e)}

    cursor = conn.cursor()

    cursor.execute("""
        SELECT paymentTrackingId, callRefId, status, createdAt
        FROM payments
        WHERE paymentTrackingId = ?
    """, (payment_tracking_id,))

    row = cursor.fetchone()
    conn.close()

    if not row:
        return {
            "paymentTrackingId": payment_tracking_id,
            "existsInDB": False,
            "message": "Transaction not found in database"
        }

    return {
        "paymentTrackingId": row[0],
        "callRefId": row[1],
        "status": row[2],
        "createdAt": row[3],
        "existsInDB": True
    }
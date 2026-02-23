from app.tools.db_tool import check_transaction

print(check_transaction("PTX-1001"))  # should exist
print(check_transaction("PTX-1006"))  # failed → should NOT exist
print(check_transaction("PTX-1014"))  # failed → should NOT exist
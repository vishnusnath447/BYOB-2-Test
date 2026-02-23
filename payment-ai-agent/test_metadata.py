from app.tools.metadata_tool import get_call_ref

print(get_call_ref("PTX-1001"))  # should work
print(get_call_ref("PTX-1006"))  # should work (even though failed later)
print(get_call_ref("PTX-9999"))  # should not exist
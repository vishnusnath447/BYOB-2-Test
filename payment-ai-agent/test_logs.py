from app.tools.logs_tool import analyze_logs

print(analyze_logs("CR-9001"))  # success
print(analyze_logs("CR-9006"))  # failure
print(analyze_logs("CR-9014"))  # failure
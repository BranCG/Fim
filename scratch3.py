import json

log_path = r'C:\Users\acer\.gemini\antigravity\brain\5a143b35-769e-4915-90da-4f7f66764c81\.system_generated\logs\transcript.jsonl'
found_calls = []

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if 'tool_calls' in data:
                for tc in data['tool_calls']:
                    name = tc.get('function', {}).get('name', '')
                    if 'replace_file_content' in name:
                        found_calls.append(tc)
        except Exception as e:
            pass

if found_calls:
    tc = found_calls[-1]
    with open('last_edits.json', 'w', encoding='utf-8') as out:
        json.dump(tc, out, indent=2)
    print("Extracted the latest replace_file_content call!")
else:
    print("Could not find any replace_file_content calls.")

import json
import sys

log_path = r'C:\Users\acer\.gemini\antigravity\brain\5a143b35-769e-4915-90da-4f7f66764c81\.system_generated\logs\transcript.jsonl'

calls = []
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'CODE_ACTION':
                calls.append(data)
        except Exception as e:
            pass

if not calls:
    print('No CODE_ACTION found')
else:
    for c in reversed(calls):
        if 'multi_replace' in str(c):
            with open('last_edits.json', 'w', encoding='utf-8') as out:
                json.dump(c, out, indent=2)
            print("Found multi_replace in CODE_ACTION")
            sys.exit(0)
    print("No multi_replace found in CODE_ACTIONs")

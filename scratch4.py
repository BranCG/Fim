import json
import re

log_path = r'C:\Users\acer\.gemini\antigravity\brain\5a143b35-769e-4915-90da-4f7f66764c81\.system_generated\logs\transcript.jsonl'
found = []

pattern = re.compile(r'call:default_api:multi_replace_file_content(\{.*?\})', re.DOTALL)

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if data.get('source') == 'MODEL' and 'multi_replace_file_content' in data.get('content', ''):
            matches = pattern.findall(data['content'])
            for match in matches:
                found.append(match)

if found:
    last = found[-1]
    with open('last_edits.json', 'w', encoding='utf-8') as out:
        out.write(last)
    print("Extracted the latest edit JSON string!")
else:
    print("Could not find any.")

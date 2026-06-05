import json

with open('last_edits.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Find the tool calls. Depending on the format, they might be in a different field.
# Sometimes 'data' is the whole step object.
# Actually, the user message was "Found multi_replace in CODE_ACTION". This means 'multi_replace' string was in data.
content = str(data)
with open('debug_out.txt', 'w', encoding='utf-8') as out:
    out.write(json.dumps(data, indent=2))

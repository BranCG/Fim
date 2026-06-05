import json

with open('debug_out.txt', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 'data' is the CODE_ACTION step. Its 'tool_calls' holds the arguments.
if 'tool_calls' in data:
    for call in data['tool_calls']:
        if 'multi_replace_file_content' in call.get('function', {}).get('name', ''):
            args_str = call['function']['arguments']
            args = json.loads(args_str)
            target_file = args['TargetFile']
            chunks = args['ReplacementChunks']
            
            with open(target_file, 'r', encoding='utf-8') as f2:
                content = f2.read()
            
            # Simple replacement
            for chunk in chunks:
                target_str = chunk['TargetContent']
                replacement_str = chunk['ReplacementContent']
                if target_str in content:
                    content = content.replace(target_str, replacement_str)
                    print(f"Replaced a chunk between lines {chunk['StartLine']} and {chunk['EndLine']}")
                else:
                    print(f"Failed to find target content for chunk lines {chunk['StartLine']} to {chunk['EndLine']}")
            
            with open(target_file, 'w', encoding='utf-8') as f2:
                f2.write(content)
            print("Successfully updated target file.")
            break

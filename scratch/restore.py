import json
import os

transcript_path = r"C:\Users\Sushant\.gemini\antigravity-ide\brain\ff03a8c0-b900-430c-ae47-8e3cf44d3135\.system_generated\logs\transcript_full.jsonl"
workspace_dir = r"d:\campus_media"

print(f"Reading transcript from: {transcript_path}")
print(f"Restoring files to workspace: {workspace_dir}")

restored_count = 0

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            step = json.loads(line)
            tool_calls = step.get('tool_calls', [])
            if not tool_calls:
                # Some logs might have it in planner response content or other fields,
                # but standard execution logs represent tool calls under tool_calls
                continue
                
            for tool in tool_calls:
                if tool.get('name') == 'write_to_file':
                    args = tool.get('args', {})
                    target_file = args.get('TargetFile')
                    code_content = args.get('CodeContent')
                    
                    if not target_file or not code_content:
                        continue
                    
                    # Normalize target file path for checking
                    norm_path = target_file.lower().replace('/', '\\')
                    norm_workspace = workspace_dir.lower().replace('/', '\\')
                    
                    if norm_path.startswith(norm_workspace):
                        # Ensure directories exist
                        dir_name = os.path.dirname(target_file)
                        if dir_name:
                            os.makedirs(dir_name, exist_ok=True)
                            
                        # Write the file content
                        with open(target_file, 'w', encoding='utf-8') as out_f:
                            out_f.write(code_content)
                            
                        print(f"Successfully restored: {target_file}")
                        restored_count += 1
        except Exception as e:
            # Skip invalid lines
            continue

print(f"\nRestoration completed. Total files restored: {restored_count}")

import os

ai_files = [
    'lib/ai/gemini.ts',
    'lib/ai/nvidia.ts', # Might not exist, but let's check
    'lib/ai/ensemble.ts', # Might not exist
    'lib/ai/prediction-service.ts',
    'lib/ai/chat-service.ts',
    'lib/ai/context-builder.ts'
]

print("=== AI SERVICE FILES ===\n")

for filepath in ai_files:
    if os.path.exists(filepath):
        print(f"--- FILE: {filepath} ---\n")
        with open(filepath, 'r', encoding='utf-8') as f:
            print(f.read())
        print("\n--- END OF FILE ---\n")
    else:
        print(f"❌ FILE NOT FOUND: {filepath}\n")


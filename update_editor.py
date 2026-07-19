import re

with open('C:\\Users\\Admin\\Desktop\\peakclip-workspace\\peakclip-app\\app\\editor\\editor.css', 'r') as f:
    content = f.read()

content = re.sub(r'--cream-tl-border: #e5e7eb;', '--cream-tl-border: #ff1f1f;', content)

with open('C:\\Users\\Admin\\Desktop\\peakclip-workspace\\peakclip-app\\app\\editor\\editor.css', 'w') as f:
    f.write(content)

print("Updated editor.css: tl-border changed to red")
with open('C:\\Users\\Admin\\Desktop\\peakclip-workspace\\peakclip-app\\app\\editor\\editor.css', 'r') as f:
    print("Last 10 lines:")
    print(''.join(f.readlines()[-10:]))
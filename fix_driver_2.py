import sys

with open(r'apps\web\src\app\driver\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target2 = '''const [passengerConfirmed, setPassengerConfirmed] = useState(false);
  const [showMpTutorial, setShowMpTutorial] = useState(false);'''
replacement2 = '''const [passengerConfirmed, setPassengerConfirmed] = useState(false);'''

content = content.replace(target2, replacement2)

with open(r'apps\web\src\app\driver\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed duplicate definition")

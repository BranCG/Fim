import sys

def replace_in_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    target = """                      const length = layer._path.getTotalLength();
                      layer._path.style.strokeDasharray = length;
                      layer._path.style.strokeDashoffset = length;
                      layer._path.getBoundingClientRect();
                      layer._path.style.transition = 'stroke-dashoffset 1.8s ease-out';
                      layer._path.style.strokeDashoffset = '0';"""

    replacement = """                      const length = layer._path.getTotalLength();
                      layer._path.style.strokeDasharray = `${length} ${length}`;
                      layer._path.style.strokeDashoffset = `${length}`;
                      layer._path.getBoundingClientRect();
                      layer._path.style.transition = 'stroke-dashoffset 1.8s ease-out';
                      layer._path.style.strokeDashoffset = '0';"""

    if target in content:
        content = content.replace(target, replacement)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")
    else:
        print(f"Target not found in {file_path}")

replace_in_file(r'C:\dev\Fim\apps\web\src\components\map\PassengerMap.tsx')
replace_in_file(r'C:\dev\Fim\apps\web\src\components\map\DriverMap.tsx')

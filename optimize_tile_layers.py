import sys

def optimize_tile_layers(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    target1 = """      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 20,
        subdomains: 'abcd',
      }).addTo(map);"""

    replacement1 = """      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 20,
        subdomains: 'abcd',
        keepBuffer: 4,
        updateWhenZooming: false,
        updateWhenIdle: true
      }).addTo(map);"""

    target2 = """      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        subdomains: 'abcd',
        className: 'map-labels-layer',
      }).addTo(map);"""

    replacement2 = """      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        subdomains: 'abcd',
        className: 'map-labels-layer',
        keepBuffer: 4,
        updateWhenZooming: false,
        updateWhenIdle: true
      }).addTo(map);"""

    updated = False
    if target1 in content:
        content = content.replace(target1, replacement1)
        updated = True
    if target2 in content:
        content = content.replace(target2, replacement2)
        updated = True

    if updated:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")
    else:
        print(f"Targets not found in {file_path}")

optimize_tile_layers(r'C:\dev\Fim\apps\web\src\components\map\PassengerMap.tsx')
optimize_tile_layers(r'C:\dev\Fim\apps\web\src\components\map\DriverMap.tsx')

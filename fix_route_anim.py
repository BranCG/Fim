import sys

def replace_in_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    target = """                L.geoJSON(data.routes[0].geometry, {
                  style: { color: color, weight: 5, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }
                }).addTo(routeGroup);"""

    replacement = """                const line = L.geoJSON(data.routes[0].geometry, {
                  style: { className: 'animated-route-line', color: color, weight: 5, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }
                }).addTo(routeGroup);
                
                setTimeout(() => {
                  line.eachLayer((layer: any) => {
                    if (layer._path && layer._path.getTotalLength) {
                      const length = layer._path.getTotalLength();
                      layer._path.style.strokeDasharray = length;
                      layer._path.style.strokeDashoffset = length;
                      layer._path.getBoundingClientRect();
                      layer._path.style.transition = 'stroke-dashoffset 1.8s ease-out';
                      layer._path.style.strokeDashoffset = '0';
                    }
                  });
                }, 50);"""

    if target in content:
        content = content.replace(target, replacement)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")
    else:
        print(f"Target not found in {file_path}")

replace_in_file(r'C:\dev\Fim\apps\web\src\components\map\PassengerMap.tsx')
replace_in_file(r'C:\dev\Fim\apps\web\src\components\map\DriverMap.tsx')

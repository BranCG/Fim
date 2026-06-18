import prisma from './prisma';
import { calculateDistance } from './pricing';

export interface ZoneDefinition {
  id: string;
  name: string;
  displayName: string;
  type: 'macrozone' | 'region';
  // Bounding box para regiones
  minLat?: number;
  maxLat?: number;
  minLng?: number;
  maxLng?: number;
  // Centro y radio para macro-zonas (RM)
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
}

export const ZONES: ZoneDefinition[] = [
  // RM Macro-zonas (Centro y radio)
  {
    id: 'rm_centro_oriente',
    name: 'RM Centro-Oriente',
    displayName: 'Santiago Centro y Oriente',
    type: 'macrozone',
    centerLat: -33.4372,
    centerLng: -70.6345,
    radiusKm: 12,
  },
  {
    id: 'rm_sur',
    name: 'RM Sur',
    displayName: 'Santiago Sur',
    type: 'macrozone',
    centerLat: -33.5412,
    centerLng: -70.6672,
    radiusKm: 10,
  },
  {
    id: 'rm_poniente',
    name: 'RM Poniente',
    displayName: 'Santiago Poniente',
    type: 'macrozone',
    centerLat: -33.5105,
    centerLng: -70.7572,
    radiusKm: 10,
  },
  {
    id: 'rm_norte',
    name: 'RM Norte',
    displayName: 'Santiago Norte',
    type: 'macrozone',
    centerLat: -33.375,
    centerLng: -70.68,
    radiusKm: 10,
  },

  // Regiones de Chile (Cajas delimitadoras)
  {
    id: 'valparaiso',
    name: 'Valparaíso',
    displayName: 'Región de Valparaíso',
    type: 'region',
    minLat: -33.9,
    maxLat: -32.0,
    minLng: -72.3,
    maxLng: -70.0,
  },
  {
    id: 'biobio',
    name: 'Biobío',
    displayName: 'Región del Biobío',
    type: 'region',
    minLat: -38.1,
    maxLat: -36.4,
    minLng: -74.0,
    maxLng: -71.0,
  },
  {
    id: 'coquimbo',
    name: 'Coquimbo',
    displayName: 'Región de Coquimbo',
    type: 'region',
    minLat: -32.3,
    maxLat: -29.0,
    minLng: -71.7,
    maxLng: -69.8,
  },
  {
    id: 'arica_y_parinacota',
    name: 'Arica y Parinacota',
    displayName: 'Región de Arica y Parinacota',
    type: 'region',
    minLat: -19.35,
    maxLat: -17.5,
    minLng: -70.5,
    maxLng: -68.9,
  },
  {
    id: 'tarapaca',
    name: 'Tarapacá',
    displayName: 'Región de Tarapacá',
    type: 'region',
    minLat: -21.6,
    maxLat: -18.9,
    minLng: -70.3,
    maxLng: -68.5,
  },
  {
    id: 'antofagasta',
    name: 'Antofagasta',
    displayName: 'Región de Antofagasta',
    type: 'region',
    minLat: -26.1,
    maxLat: -20.9,
    minLng: -71.0,
    maxLng: -67.0,
  },
  {
    id: 'atacama',
    name: 'Atacama',
    displayName: 'Región de Atacama',
    type: 'region',
    minLat: -29.5,
    maxLat: -25.3,
    minLng: -71.6,
    maxLng: -68.3,
  },
  {
    id: 'ohiggins',
    name: "O'Higgins",
    displayName: "Región de O'Higgins",
    type: 'region',
    minLat: -34.9,
    maxLat: -33.8,
    minLng: -72.1,
    maxLng: -70.2,
  },
  {
    id: 'maule',
    name: 'Maule',
    displayName: 'Región del Maule',
    type: 'region',
    minLat: -36.5,
    maxLat: -34.7,
    minLng: -72.8,
    maxLng: -70.3,
  },
  {
    id: 'nuble',
    name: 'Ñuble',
    displayName: 'Región de Ñuble',
    type: 'region',
    minLat: -37.2,
    maxLat: -36.1,
    minLng: -73.0,
    maxLng: -71.1,
  },
  {
    id: 'araucania',
    name: 'Araucanía',
    displayName: 'Región de La Araucanía',
    type: 'region',
    minLat: -39.6,
    maxLat: -37.6,
    minLng: -73.5,
    maxLng: -70.8,
  },
  {
    id: 'los_rios',
    name: 'Los Ríos',
    displayName: 'Región de Los Ríos',
    type: 'region',
    minLat: -40.7,
    maxLat: -39.3,
    minLng: -73.8,
    maxLng: -71.5,
  },
  {
    id: 'los_lagos',
    name: 'Los Lagos',
    displayName: 'Región de Los Lagos',
    type: 'region',
    minLat: -44.2,
    maxLat: -40.2,
    minLng: -74.9,
    maxLng: -71.3,
  },
  {
    id: 'aysen',
    name: 'Aysén',
    displayName: 'Región de Aysén',
    type: 'region',
    minLat: -49.3,
    maxLat: -43.7,
    minLng: -75.7,
    maxLng: -71.5,
  },
  {
    id: 'magallanes',
    name: 'Magallanes',
    displayName: 'Región de Magallanes',
    type: 'region',
    minLat: -56.0,
    maxLat: -48.6,
    minLng: -75.8,
    maxLng: -66.8,
  },
];

/**
 * Verifica si una coordenada dada está permitida bajo la configuración actual de zonas.
 */
export async function checkCoordinateInAllowedRegion(
  lat: number,
  lng: number
): Promise<{ allowed: boolean; activeZonesText: string }> {
  try {
    // 1. Obtener todas las configuraciones del sistema
    const configRows = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['zone_enabled_all_chile', ...ZONES.map(z => `zone_enabled_${z.id}`)],
        },
      },
    });

    const configMap = configRows.reduce((acc: Record<string, string>, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    // 2. Si Todo Chile está habilitado, permitir siempre
    if (configMap['zone_enabled_all_chile'] === 'true') {
      return { allowed: true, activeZonesText: 'Todo Chile' };
    }

    // 3. Obtener qué zonas están habilitadas según configuración (o por defecto habilitamos rm_centro_oriente si no hay registros)
    const activeZones = ZONES.filter(zone => {
      const dbKey = `zone_enabled_${zone.id}`;
      // Si la clave no está en la base de datos, por defecto rm_centro_oriente es true y el resto false
      if (configMap[dbKey] === undefined) {
        return zone.id === 'rm_centro_oriente';
      }
      return configMap[dbKey] === 'true';
    });

    if (activeZones.length === 0) {
      return { allowed: false, activeZonesText: 'Ninguna zona activa' };
    }

    // 4. Verificar si la coordenada cae en alguna de las zonas activas
    for (const zone of activeZones) {
      if (zone.type === 'macrozone') {
        // Validación por radio de kilómetros
        if (
          zone.centerLat !== undefined &&
          zone.centerLng !== undefined &&
          zone.radiusKm !== undefined
        ) {
          const dist = calculateDistance(lat, lng, zone.centerLat, zone.centerLng);
          if (dist <= zone.radiusKm) {
            return { allowed: true, activeZonesText: '' };
          }
        }
      } else {
        // Validación por bounding box (región completa)
        if (
          zone.minLat !== undefined &&
          zone.maxLat !== undefined &&
          zone.minLng !== undefined &&
          zone.maxLng !== undefined
        ) {
          if (
            lat >= zone.minLat &&
            lat <= zone.maxLat &&
            lng >= zone.minLng &&
            lng <= zone.maxLng
          ) {
            return { allowed: true, activeZonesText: '' };
          }
        }
      }
    }

    // Si no cayó en ninguna zona permitida, construir texto explicativo de las zonas activas
    const activeNames = activeZones.map(z => z.displayName).join(', ');
    return { allowed: false, activeZonesText: activeNames };
  } catch (err) {
    console.error('Error checking coordinate coverage:', err);
    // En caso de error de base de datos o inesperado, por seguridad permitimos el viaje
    return { allowed: true, activeZonesText: '' };
  }
}

/**
 * Retorna el bounding box combinado de todas las zonas activas.
 * Si Todo Chile está activo o hay un error, retorna null.
 */
export async function getActiveZonesBoundingBox(): Promise<{
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} | null> {
  try {
    const configRows = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['zone_enabled_all_chile', ...ZONES.map(z => `zone_enabled_${z.id}`)],
        },
      },
    });

    const configMap = configRows.reduce((acc: Record<string, string>, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    if (configMap['zone_enabled_all_chile'] === 'true') {
      return null;
    }

    const activeZones = ZONES.filter(zone => {
      const dbKey = `zone_enabled_${zone.id}`;
      if (configMap[dbKey] === undefined) {
        return zone.id === 'rm_centro_oriente';
      }
      return configMap[dbKey] === 'true';
    });

    if (activeZones.length === 0) {
      return null;
    }

    let minLat = 90;
    let maxLat = -90;
    let minLng = 180;
    let maxLng = -180;

    activeZones.forEach(zone => {
      if (zone.type === 'macrozone') {
        const rmMinLat = -34.2;
        const rmMaxLat = -32.9;
        const rmMinLng = -71.7;
        const rmMaxLng = -69.8;
        minLat = Math.min(minLat, rmMinLat);
        maxLat = Math.max(maxLat, rmMaxLat);
        minLng = Math.min(minLng, rmMinLng);
        maxLng = Math.max(maxLng, rmMaxLng);
      } else {
        if (
          zone.minLat !== undefined &&
          zone.maxLat !== undefined &&
          zone.minLng !== undefined &&
          zone.maxLng !== undefined
        ) {
          minLat = Math.min(minLat, zone.minLat);
          maxLat = Math.max(maxLat, zone.maxLat);
          minLng = Math.min(minLng, zone.minLng);
          maxLng = Math.max(maxLng, zone.maxLng);
        }
      }
    });

    return { minLat, maxLat, minLng, maxLng };
  } catch (err) {
    console.error('Error getting active zones bounding box:', err);
    return null;
  }
}


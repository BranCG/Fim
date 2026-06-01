export interface SavedLocation {
  lat: number;
  lng: number;
  address: string;
}

const FAVORITES_KEY = 'fim_favorite_locations';
const RECENTS_KEY = 'fim_recent_locations';

export function getFavoriteLocations(): { home: SavedLocation | null; work: SavedLocation | null } {
  if (typeof window === 'undefined') return { home: null, work: null };
  const raw = localStorage.getItem(FAVORITES_KEY);
  if (!raw) return { home: null, work: null };
  try {
    return JSON.parse(raw);
  } catch {
    return { home: null, work: null };
  }
}

export function saveFavoriteLocation(type: 'home' | 'work', loc: SavedLocation | null) {
  if (typeof window === 'undefined') return;
  const current = getFavoriteLocations();
  current[type] = loc;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(current));
}

export function getRecentLocations(): SavedLocation[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(RECENTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addRecentLocation(loc: SavedLocation) {
  if (typeof window === 'undefined') return;
  if (!loc || !loc.address || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') return;
  
  let recents = getRecentLocations();
  
  // Filter out any existing item with the same address to prevent duplicates
  recents = recents.filter(item => item.address !== loc.address);
  
  // Add to the beginning of the array
  recents.unshift(loc);
  
  // Limit to 5 items
  if (recents.length > 5) {
    recents = recents.slice(0, 5);
  }
  
  localStorage.setItem(RECENTS_KEY, JSON.stringify(recents));
}

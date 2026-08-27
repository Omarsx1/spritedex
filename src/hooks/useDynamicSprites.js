import { useState, useEffect, useCallback } from 'react';
import { ALL_SPRITES, SPANISH_NAME_OVERRIDES } from '../data/spritesData';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

const DYNAMIC_SPRITES_CACHE_KEY = 'spritedex_dynamic_sprites_cache';

function sanitizeDynamicItem(item) {
  if (!item) return item;
  const id = item.id;
  const isStormScout = id?.startsWith('stormscout') || item.family_id === 'stormscout' || item.familyId === 'stormscout';
  
  const rawName = item.name || '';
  const rawFullName = item.full_name || item.fullName || item.name || '';
  const rawFamilyName = item.family_name || item.familyName || '';

  const cleanName = SPANISH_NAME_OVERRIDES[id] || (isStormScout ? rawName.replace(/Storm\s*Scout/gi, 'Explorador de Tormentas') : rawName);
  const cleanFullName = SPANISH_NAME_OVERRIDES[id] || (isStormScout ? rawFullName.replace(/Storm\s*Scout/gi, 'Explorador de Tormentas') : rawFullName);
  const cleanFamilyName = isStormScout ? 'Explorador de Tormentas' : (rawFamilyName.replace(/Storm\s*Scout/gi, 'Explorador de Tormentas') || rawFamilyName);

  return {
    ...item,
    name: cleanName,
    fullName: cleanFullName,
    familyName: cleanFamilyName,
    family_name: cleanFamilyName
  };
}

// Evaluates whether a scheduled sprite has reached its automatic release time
export function evaluateReleaseStatus(sprite) {
  if (!sprite) return sprite;

  if (sprite.release_date) {
    const releaseTime = new Date(sprite.release_date).getTime();
    const now = Date.now();
    const isNowActive = now >= releaseTime;

    return {
      ...sprite,
      unreleased: !isNowActive,
      isAutoScheduled: true,
      timeUntilRelease: isNowActive ? 0 : Math.max(0, releaseTime - now)
    };
  }

  return sprite;
}

export function useDynamicSprites() {
  const [sprites, setSprites] = useState(() => {
    // Initial hybrid startup: static base + cached dynamic items
    try {
      const cached = localStorage.getItem(DYNAMIC_SPRITES_CACHE_KEY);
      if (cached) {
        const dynamicList = JSON.parse(cached);
        const map = new Map(ALL_SPRITES.map(s => [s.id, s]));
        dynamicList.forEach(item => {
          map.set(item.id, evaluateReleaseStatus(sanitizeDynamicItem(item)));
        });
        return Array.from(map.values());
      }
    } catch {}
    return ALL_SPRITES.map(evaluateReleaseStatus);
  });

  const [isLoading, setIsLoading] = useState(false);
  const [customSpiritsCount, setCustomSpiritsCount] = useState(0);

  // Fetch dynamic catalog from Supabase
  const refreshDynamicSprites = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('sprites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setCustomSpiritsCount(data.length);
        localStorage.setItem(DYNAMIC_SPRITES_CACHE_KEY, JSON.stringify(data));

        setSprites(() => {
          const map = new Map(ALL_SPRITES.map(s => [s.id, s]));
          data.forEach(dbItem => {
            const sanitized = sanitizeDynamicItem(dbItem);
            const formatted = {
              id: sanitized.id,
              name: sanitized.name,
              fullName: sanitized.fullName || sanitized.name,
              familyId: sanitized.family_id,
              familyName: sanitized.familyName || sanitized.family_name,
              rarity: sanitized.rarity,
              variant: sanitized.variant,
              variantDisplay: sanitized.variant_display || sanitized.variant,
              gen: sanitized.gen || 2,
              image: sanitized.image,
              ability: sanitized.ability || 'Concede bonificaciones pasivas.',
              specialPerk: sanitized.special_perk || '',
              location: sanitized.location || 'Zonas de Extracción',
              summonCost: sanitized.summon_cost || '2,000 Polvo Estelar',
              dropChance: sanitized.drop_chance || '1.50%',
              dropChanceDisplay: sanitized.drop_chance || '1.50%',
              dropChanceNum: parseFloat(sanitized.drop_chance || '1.5'),
              unreleased: sanitized.unreleased,
              release_date: sanitized.release_date
            };
            map.set(formatted.id, evaluateReleaseStatus(formatted));
          });
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.warn('Syncing dynamic spirits notice:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDynamicSprites();

    // Setup Supabase Realtime subscription
    let subscription = null;
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel('sprites_catalog_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sprites' },
          () => {
            refreshDynamicSprites();
          }
        )
        .subscribe();

      subscription = channel;
    }

    // Interval to check automatic scheduled releases every 30 seconds
    const interval = setInterval(() => {
      setSprites(prev => prev.map(evaluateReleaseStatus));
    }, 30000);

    return () => {
      clearInterval(interval);
      if (subscription && supabase) {
        supabase.removeChannel(subscription);
      }
    };
  }, [refreshDynamicSprites]);

  return {
    sprites,
    isLoading,
    customSpiritsCount,
    refreshDynamicSprites
  };
}

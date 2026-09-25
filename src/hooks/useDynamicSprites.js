import { useState, useEffect, useCallback } from 'react';
import { ALL_SPRITES, SPANISH_NAME_OVERRIDES, SPIRIT_DATA_OVERRIDES, SUMMON_COST_OVERRIDES, WEBP_MAP } from '../data/spritesData';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

export const DYNAMIC_SPRITES_CACHE_KEY = 'spritedex_dynamic_sprites_cache_v2';

function sanitizeDynamicItem(item) {
  if (!item) return item;
  
  // Dynamic edits saved by the user in Supabase always take top priority
  const rawFullName = item.full_name || item.fullName || '';
  const rawName = item.name || rawFullName || '';
  const rawFamilyName = item.family_name || item.familyName || '';
  const rawSummonCost = item.summon_cost || item.summonCost || '';

  // Clean English placeholders only if no name exists or fallback is needed
  const cleanName = rawName
    ? rawName.replace(/Storm\s*Scout/gi, 'Exploratormentas')
    : (SPANISH_NAME_OVERRIDES[item.id] || '');

  const cleanFullName = rawFullName
    ? rawFullName.replace(/Storm\s*Scout/gi, 'Exploratormentas')
    : (cleanName || SPANISH_NAME_OVERRIDES[item.id] || '');

  const cleanFamilyName = rawFamilyName
    ? rawFamilyName.replace(/Storm\s*Scout/gi, 'Exploratormentas')
    : (cleanName || 'Espíritu');

  return {
    ...item,
    name: cleanName,
    fullName: cleanFullName,
    familyName: cleanFamilyName,
    family_name: cleanFamilyName,
    summonCost: rawSummonCost,
    summon_cost: rawSummonCost,
    specialPerk: item.special_perk || item.specialPerk || '',
    special_perk: item.special_perk || item.specialPerk || ''
  };
}

// Evaluates whether a scheduled sprite has reached its automatic release time
export function evaluateReleaseStatus(sprite) {
  if (!sprite) return sprite;

  const rawRelDate = sprite.release_date || sprite.releaseDate;
  const releaseTime = rawRelDate ? new Date(rawRelDate).getTime() : 0;
  const now = Date.now();
  const isScheduled = releaseTime > now;
  const unreleased = sprite.unreleased === true || isScheduled;
  const isAutoScheduled = isScheduled;
  const timeUntilRelease = isScheduled ? releaseTime - now : 0;
  const daysSince = (!unreleased && releaseTime > 0) ? (now - releaseTime) / (1000 * 60 * 60 * 24) : 999;
  const isNew = unreleased ? false : (daysSince <= 7 ? true : Boolean(sprite.is_new ?? sprite.isNew ?? false));

  return {
    ...sprite,
    unreleased,
    isAutoScheduled,
    timeUntilRelease,
    daysSince,
    releaseTime,
    isNew
  };
}

// Industry-Standard Novelty Rule (Fortnite / Steam standard):
// 1. If spirits exist within 7-day window -> highlight them.
// 2. If NO spirits exist within 7 days (content drought) -> fallback to the latest drop batch so "Nuevos" is never empty!
export function applyBatchNoveltyRules(spritesList) {
  if (!Array.isArray(spritesList) || spritesList.length === 0) return spritesList;

  const now = Date.now();

  // 1. Evaluate release timing for each sprite
  const withTiming = spritesList.map(sprite => {
    const rawRelDate = sprite.release_date || sprite.releaseDate;
    const releaseTime = rawRelDate ? new Date(rawRelDate).getTime() : 0;
    const isScheduled = releaseTime > now;
    const unreleased = sprite.unreleased === true || isScheduled;
    const isAutoScheduled = isScheduled;
    const timeUntilRelease = isScheduled ? releaseTime - now : 0;
    const daysSince = (!unreleased && releaseTime > 0) ? (now - releaseTime) / (1000 * 60 * 60 * 24) : 999;

    return {
      ...sprite,
      unreleased,
      isAutoScheduled,
      timeUntilRelease,
      daysSince,
      releaseTime
    };
  });

  // 2. Identify active Gen 2 released spirits with valid dates
  const releasedGen2 = withTiming.filter(s => !s.unreleased && s.releaseTime > 0 && s.gen === 2);
  const activeRecent = releasedGen2.filter(s => s.daysSince >= 0 && s.daysSince <= 7);

  // 3. Fallback: If no spirits released in the last 7 days, find the latest drop batch date
  let latestBatchTime = 0;
  if (activeRecent.length === 0 && releasedGen2.length > 0) {
    latestBatchTime = Math.max(...releasedGen2.map(s => s.releaseTime));
  }

  // 4. Map novelty status
  return withTiming.map(s => {
    if (s.unreleased) {
      return {
        ...s,
        isNew: false,
        noveltyReason: 'unreleased'
      };
    }

    // Normal case: We have spirits released in the last 7 days
    if (activeRecent.length > 0) {
      const isWithin7 = s.daysSince >= 0 && s.daysSince <= 7;
      return {
        ...s,
        isNew: isWithin7,
        noveltyReason: isWithin7 ? 'recent' : 'expired'
      };
    }

    // Drought case: Fallback to the latest drop batch (within 36h of the latest drop)
    if (latestBatchTime > 0) {
      const isLatestDrop = Math.abs(s.releaseTime - latestBatchTime) <= (36 * 60 * 60 * 1000);
      return {
        ...s,
        isNew: isLatestDrop,
        noveltyReason: isLatestDrop ? 'latest_drop' : 'older_drop'
      };
    }

    return {
      ...s,
      isNew: Boolean(s.is_new ?? s.isNew ?? false),
      noveltyReason: 'manual'
    };
  });
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
          const sanitized = sanitizeDynamicItem(item);
          const baseStatic = map.get(sanitized.id);
          const hasRealCustomAbility = sanitized.ability && 
            sanitized.ability !== 'Concede bonificaciones pasivas.' && 
            sanitized.ability !== 'Concede bonificaciones pasivas de combate, velocidad y recolección de botín.';
          
          const rawCost = sanitized.summon_cost || sanitized.summonCost || SUMMON_COST_OVERRIDES[sanitized.id] || baseStatic?.summonCost || '2,000 Polvo Estelar';
          const cleanCost = rawCost && !rawCost.toLowerCase().includes('polvo') ? `${rawCost} Polvo Estelar` : rawCost;

          const override = SPIRIT_DATA_OVERRIDES[sanitized.id];
          const merged = {
            ...(baseStatic || {}),
            ...sanitized,
            fullName: sanitized.fullName || baseStatic?.fullName || sanitized.name,
            name: sanitized.name || baseStatic?.name,
            summonCost: cleanCost,
            summon_cost: cleanCost,
            rarity: sanitized.rarity || override?.rarity || baseStatic?.rarity,
            image: WEBP_MAP[sanitized.id] || sanitized.image || baseStatic?.image,
            unreleased: (baseStatic && baseStatic.unreleased === false)
              ? false
              : (sanitized.unreleased !== undefined ? Boolean(sanitized.unreleased) : (baseStatic?.unreleased || false)),
            isNew: sanitized.is_new !== undefined ? Boolean(sanitized.is_new) : (sanitized.isNew !== undefined ? Boolean(sanitized.isNew) : (baseStatic?.isNew || false)),
            releaseDate: sanitized.releaseDate || sanitized.release_date || baseStatic?.releaseDate || null,
            ability: (hasRealCustomAbility ? sanitized.ability : null) || override?.ability || baseStatic?.ability || sanitized.ability || 'Concede bonificaciones pasivas.',
            specialPerk: (sanitized.variant === 'Basic' || sanitized.variant === 'Base')
              ? ''
              : (sanitized.special_perk || sanitized.specialPerk || override?.specialPerk || baseStatic?.specialPerk || '')
          };
          map.set(item.id, evaluateReleaseStatus(merged));
        });
        return applyBatchNoveltyRules(Array.from(map.values()));
      }
    } catch {}
    return applyBatchNoveltyRules(ALL_SPRITES.map(evaluateReleaseStatus));
  });

  const [isLoading, setIsLoading] = useState(false);
  const [customSpiritsCount, setCustomSpiritsCount] = useState(0);

  // Fetch dynamic catalog from Supabase
  const refreshDynamicSprites = useCallback(async () => {
    // 1. Recarga inmediata desde caché local para reflejo instantáneo en UI
    try {
      const cached = localStorage.getItem(DYNAMIC_SPRITES_CACHE_KEY);
      if (cached) {
        const dynamicList = JSON.parse(cached);
        setSprites(() => {
          const map = new Map(ALL_SPRITES.map(s => [s.id, s]));
          dynamicList.forEach(item => {
            const sanitized = sanitizeDynamicItem(item);
            const baseStatic = map.get(sanitized.id);
            const hasRealCustomAbility = sanitized.ability && 
              sanitized.ability !== 'Concede bonificaciones pasivas.' && 
              sanitized.ability !== 'Concede bonificaciones pasivas de combate, velocidad y recolección de botín.';
            
            const rawCost = sanitized.summon_cost || sanitized.summonCost || SUMMON_COST_OVERRIDES[sanitized.id] || baseStatic?.summonCost || '2,000 Polvo Estelar';
            const cleanCost = rawCost && !rawCost.toLowerCase().includes('polvo') ? `${rawCost} Polvo Estelar` : rawCost;

            const override = SPIRIT_DATA_OVERRIDES[sanitized.id];
            const merged = {
              ...(baseStatic || {}),
              ...sanitized,
              fullName: sanitized.fullName || baseStatic?.fullName || sanitized.name,
              name: sanitized.name || baseStatic?.name,
              summonCost: cleanCost,
              summon_cost: cleanCost,
              rarity: sanitized.rarity || override?.rarity || baseStatic?.rarity,
              isNew: sanitized.is_new !== undefined ? Boolean(sanitized.is_new) : (sanitized.isNew !== undefined ? Boolean(sanitized.isNew) : (baseStatic?.isNew || false)),
              releaseDate: sanitized.releaseDate || sanitized.release_date || baseStatic?.releaseDate || null,
              ability: (hasRealCustomAbility ? sanitized.ability : null) || override?.ability || baseStatic?.ability || sanitized.ability || 'Concede bonificaciones pasivas.',
              specialPerk: (sanitized.variant === 'Basic' || sanitized.variant === 'Base')
                ? ''
                : (sanitized.special_perk || sanitized.specialPerk || override?.specialPerk || baseStatic?.specialPerk || '')
            };
            map.set(item.id, evaluateReleaseStatus(merged));
          });
          return applyBatchNoveltyRules(Array.from(map.values()));
        });
      }
    } catch {}

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
            const baseStatic = map.get(sanitized.id);
            const hasRealCustomAbility = sanitized.ability && 
              sanitized.ability !== 'Concede bonificaciones pasivas.' && 
              sanitized.ability !== 'Concede bonificaciones pasivas de combate, velocidad y recolección de botín.';

            const rawCost = sanitized.summon_cost || sanitized.summonCost || SUMMON_COST_OVERRIDES[sanitized.id] || baseStatic?.summonCost || '2,000 Polvo Estelar';
            const cleanCost = rawCost && !rawCost.toLowerCase().includes('polvo') ? `${rawCost} Polvo Estelar` : rawCost;

            const formatted = {
              id: sanitized.id,
              name: sanitized.name,
              fullName: sanitized.fullName || sanitized.name,
              familyId: sanitized.family_id || baseStatic?.familyId,
              familyName: sanitized.familyName || sanitized.family_name || baseStatic?.familyName,
              rarity: sanitized.rarity || SPIRIT_DATA_OVERRIDES[sanitized.id]?.rarity || baseStatic?.rarity,
              variant: sanitized.variant || baseStatic?.variant,
              variantDisplay: sanitized.variant_display || sanitized.variant || baseStatic?.variantDisplay,
              gen: sanitized.gen || baseStatic?.gen || 2,
              image: WEBP_MAP[sanitized.id] || sanitized.image || baseStatic?.image,
              ability: (hasRealCustomAbility ? sanitized.ability : null) || SPIRIT_DATA_OVERRIDES[sanitized.id]?.ability || baseStatic?.ability || sanitized.ability || 'Concede bonificaciones pasivas.',
              specialPerk: (sanitized.variant === 'Basic' || sanitized.variant === 'Base') 
                ? '' 
                : (sanitized.special_perk || SPIRIT_DATA_OVERRIDES[sanitized.id]?.specialPerk || baseStatic?.specialPerk || ''),
              location: sanitized.location || baseStatic?.location || 'Zonas de Extracción',
              summonCost: cleanCost,
              summon_cost: cleanCost,
              dropChance: sanitized.drop_chance || baseStatic?.dropChance || '1.50%',
              dropChanceDisplay: sanitized.drop_chance || baseStatic?.dropChanceDisplay || '1.50%',
              dropChanceNum: parseFloat(sanitized.drop_chance || baseStatic?.dropChanceNum || '1.5'),
              unreleased: (baseStatic && baseStatic.unreleased === false)
                ? false
                : (sanitized.unreleased !== undefined ? Boolean(sanitized.unreleased) : (baseStatic?.unreleased || false)),
              release_date: sanitized.release_date || baseStatic?.release_date || baseStatic?.releaseDate,
              releaseDate: sanitized.releaseDate || sanitized.release_date || baseStatic?.releaseDate,
              isNew: sanitized.is_new !== undefined ? Boolean(sanitized.is_new) : (sanitized.isNew !== undefined ? Boolean(sanitized.isNew) : (baseStatic?.isNew || false)),
              is_new: sanitized.is_new !== undefined ? Boolean(sanitized.is_new) : (sanitized.isNew !== undefined ? Boolean(sanitized.isNew) : (baseStatic?.isNew || false))
            };
            map.set(formatted.id, evaluateReleaseStatus(formatted));
          });
          return applyBatchNoveltyRules(Array.from(map.values()));
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
      setSprites(prev => applyBatchNoveltyRules(prev.map(evaluateReleaseStatus)));
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

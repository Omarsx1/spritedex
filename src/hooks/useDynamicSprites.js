import { useState, useEffect, useCallback } from 'react';
import { ALL_SPRITES, SPANISH_NAME_OVERRIDES, SPIRIT_DATA_OVERRIDES, SUMMON_COST_OVERRIDES } from '../data/spritesData';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

const DYNAMIC_SPRITES_CACHE_KEY = 'spritedex_dynamic_sprites_cache';

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
  const hasExplicitIsNew = sprite.is_new !== undefined || sprite.isNew !== undefined;
  let isNew = sprite.is_new !== undefined ? Boolean(sprite.is_new) : (sprite.isNew !== undefined ? Boolean(sprite.isNew) : false);

  if (rawRelDate) {
    const releaseTime = new Date(rawRelDate).getTime();
    const now = Date.now();
    const isNowActive = now >= releaseTime;
    const daysSince = (now - releaseTime) / (1000 * 60 * 60 * 24);

    if (!hasExplicitIsNew) {
      if (daysSince >= 0 && daysSince <= 14) {
        isNew = true;
      }
    }

    return {
      ...sprite,
      unreleased: !isNowActive,
      isAutoScheduled: true,
      timeUntilRelease: isNowActive ? 0 : Math.max(0, releaseTime - now),
      isNew: isNew
    };
  }

  return {
    ...sprite,
    isNew: isNew
  };
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
          
          const rawCost = SUMMON_COST_OVERRIDES[sanitized.id] || sanitized.summon_cost || sanitized.summonCost || baseStatic?.summonCost || '2,000 Polvo Estelar';
          const cleanCost = rawCost && !rawCost.toLowerCase().includes('polvo') ? `${rawCost} Polvo Estelar` : rawCost;

          const override = SPIRIT_DATA_OVERRIDES[sanitized.id];
          const merged = {
            ...(baseStatic || {}),
            ...sanitized,
            fullName: sanitized.fullName || baseStatic?.fullName || sanitized.name,
            name: sanitized.name || baseStatic?.name,
            summonCost: cleanCost,
            summon_cost: cleanCost,
            rarity: override?.rarity || baseStatic?.rarity || sanitized.rarity,
            isNew: sanitized.isNew !== undefined ? sanitized.isNew : (baseStatic?.isNew || false),
            releaseDate: sanitized.releaseDate || sanitized.release_date || baseStatic?.releaseDate || null,
            ability: override?.ability || (hasRealCustomAbility ? sanitized.ability : (baseStatic?.ability || sanitized.ability || 'Concede bonificaciones pasivas.')),
            specialPerk: (sanitized.variant === 'Basic' || sanitized.variant === 'Base')
              ? ''
              : (override?.specialPerk !== undefined ? override.specialPerk : (sanitized.special_perk || sanitized.specialPerk || baseStatic?.specialPerk || ''))
          };
          map.set(item.id, evaluateReleaseStatus(merged));
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
            const baseStatic = map.get(sanitized.id);
            const hasRealCustomAbility = sanitized.ability && 
              sanitized.ability !== 'Concede bonificaciones pasivas.' && 
              sanitized.ability !== 'Concede bonificaciones pasivas de combate, velocidad y recolección de botín.';

            const rawCost = SUMMON_COST_OVERRIDES[sanitized.id] || sanitized.summon_cost || sanitized.summonCost || baseStatic?.summonCost || '2,000 Polvo Estelar';
            const cleanCost = rawCost && !rawCost.toLowerCase().includes('polvo') ? `${rawCost} Polvo Estelar` : rawCost;

            const formatted = {
              id: sanitized.id,
              name: sanitized.name,
              fullName: sanitized.fullName || sanitized.name,
              familyId: sanitized.family_id || baseStatic?.familyId,
              familyName: sanitized.familyName || sanitized.family_name || baseStatic?.familyName,
              rarity: SPIRIT_DATA_OVERRIDES[sanitized.id]?.rarity || baseStatic?.rarity || sanitized.rarity,
              variant: sanitized.variant || baseStatic?.variant,
              variantDisplay: sanitized.variant_display || sanitized.variant || baseStatic?.variantDisplay,
              gen: sanitized.gen || baseStatic?.gen || 2,
              image: sanitized.image || baseStatic?.image,
              ability: SPIRIT_DATA_OVERRIDES[sanitized.id]?.ability || (hasRealCustomAbility ? sanitized.ability : (baseStatic?.ability || sanitized.ability || 'Concede bonificaciones pasivas.')),
              specialPerk: (sanitized.variant === 'Basic' || sanitized.variant === 'Base') 
                ? '' 
                : (SPIRIT_DATA_OVERRIDES[sanitized.id]?.specialPerk !== undefined ? SPIRIT_DATA_OVERRIDES[sanitized.id].specialPerk : (sanitized.special_perk || baseStatic?.specialPerk || '')),
              location: sanitized.location || baseStatic?.location || 'Zonas de Extracción',
              summonCost: cleanCost,
              summon_cost: cleanCost,
              dropChance: sanitized.drop_chance || baseStatic?.dropChance || '1.50%',
              dropChanceDisplay: sanitized.drop_chance || baseStatic?.dropChanceDisplay || '1.50%',
              dropChanceNum: parseFloat(sanitized.drop_chance || baseStatic?.dropChanceNum || '1.5'),
              unreleased: sanitized.unreleased !== undefined ? sanitized.unreleased : (baseStatic?.unreleased || false),
              release_date: sanitized.release_date || baseStatic?.release_date || baseStatic?.releaseDate,
              releaseDate: sanitized.releaseDate || sanitized.release_date || baseStatic?.releaseDate,
              isNew: sanitized.is_new !== undefined ? Boolean(sanitized.is_new) : (sanitized.isNew !== undefined ? Boolean(sanitized.isNew) : (baseStatic?.isNew || false)),
              is_new: sanitized.is_new !== undefined ? Boolean(sanitized.is_new) : (sanitized.isNew !== undefined ? Boolean(sanitized.isNew) : (baseStatic?.isNew || false))
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

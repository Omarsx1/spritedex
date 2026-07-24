import React, { useState, useEffect, useMemo } from 'react';
import { ALL_SPRITES, SPRITE_FAMILIES_LIST } from './data/spritesData';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { SpriteCard } from './components/SpriteCard';
import { SpriteDetailModal } from './components/SpriteDetailModal';
import { ShareImageModal } from './components/ShareImageModal';
import { BackupModal } from './components/BackupModal';

const LOCAL_STORAGE_KEY = 'fortnite_sprites_pokedex_v3';

export function App() {
  const [userState, setUserState] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Filters matching fortnite.gg
  const [searchQuery, setSearchQuery] = useState('');
  const [baseFilter, setBaseFilter] = useState('all');      // BASE = variant/theme
  const [spriteFilter, setSpriteFilter] = useState('all');  // SPRITE = family
  const [sortBy, setSortBy] = useState('default');          // SORT BY
  const [showUnreleased, setShowUnreleased] = useState(false);
  const [viewMode, setViewMode] = useState('grid');         // 'grid' or 'list'

  // Modals
  const [selectedSprite, setSelectedSprite] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userState));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [userState]);

  const handleToggleOwned = (spriteId) => {
    setUserState((prev) => {
      const current = prev[spriteId] || { owned: false, level: 1 };
      const nextOwned = !current.owned;
      return {
        ...prev,
        [spriteId]: {
          owned: nextOwned,
          level: nextOwned ? (current.level || 1) : 1
        }
      };
    });
  };

  const handleSetLevel = (spriteId, level) => {
    setUserState((prev) => ({
      ...prev,
      [spriteId]: {
        owned: true,
        level: Math.min(Math.max(level, 1), 5)
      }
    }));
  };

  const filteredSprites = useMemo(() => {
    let result = ALL_SPRITES.filter((sprite) => {
      if (!showUnreleased && sprite.unreleased) return false;

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        if (!sprite.fullName.toLowerCase().includes(query)) return false;
      }

      // BASE filter (variant/theme)
      if (baseFilter !== 'all' && sprite.variant !== baseFilter) return false;

      // SPRITE filter (family)
      if (spriteFilter !== 'all' && sprite.familyName.toLowerCase() !== spriteFilter.toLowerCase()) return false;

      return true;
    });

    // Sort
    switch (sortBy) {
      case 'name-asc':
        result = [...result].sort((a, b) => a.fullName.localeCompare(b.fullName));
        break;
      case 'name-desc':
        result = [...result].sort((a, b) => b.fullName.localeCompare(a.fullName));
        break;
      case 'rarity':
        const rarityOrder = { Mythic: 0, Legendary: 1, Epic: 2, Special: 3, Rare: 4 };
        result = [...result].sort((a, b) => (rarityOrder[a.rarity] || 5) - (rarityOrder[b.rarity] || 5));
        break;
      case 'drop-asc':
        result = [...result].sort((a, b) => a.dropChanceNum - b.dropChanceNum);
        break;
      case 'drop-desc':
        result = [...result].sort((a, b) => b.dropChanceNum - a.dropChanceNum);
        break;
      case 'owned':
        result = [...result].sort((a, b) => {
          const aOwned = userState[a.id]?.owned ? 1 : 0;
          const bOwned = userState[b.id]?.owned ? 1 : 0;
          return bOwned - aOwned;
        });
        break;
      case 'missing':
        result = [...result].sort((a, b) => {
          const aOwned = userState[a.id]?.owned ? 1 : 0;
          const bOwned = userState[b.id]?.owned ? 1 : 0;
          return aOwned - bOwned;
        });
        break;
      default:
        break;
    }

    return result;
  }, [searchQuery, baseFilter, spriteFilter, sortBy, showUnreleased, userState]);

  const totalCount = ALL_SPRITES.filter(s => showUnreleased || !s.unreleased).length;
  const ownedCount = ALL_SPRITES.filter(s => (showUnreleased || !s.unreleased) && userState[s.id]?.owned).length;
  const masteredCount = ALL_SPRITES.filter(s => (showUnreleased || !s.unreleased) && userState[s.id]?.owned && userState[s.id]?.level === 5).length;

  return (
    <div className="pokedex-app-root">
      {/* Header */}
      <Header
        totalCount={totalCount}
        ownedCount={ownedCount}
        masteredCount={masteredCount}
        onOpenShareModal={() => setShowShareModal(true)}
        onOpenBackupModal={() => setShowBackupModal(true)}
      />

      {/* Filter Bar (fortnite.gg style) */}
      <div className="controls-container">
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          baseFilter={baseFilter}
          setBaseFilter={setBaseFilter}
          spriteFilter={spriteFilter}
          setSpriteFilter={setSpriteFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          showUnreleased={showUnreleased}
          setShowUnreleased={setShowUnreleased}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </div>

      {/* Main Grid */}
      <main className="grid-container">
        {filteredSprites.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', gridColumn: '1 / -1' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>No se encontraron Sprites</h2>
            <p>Prueba ajustando la búsqueda o los filtros.</p>
          </div>
        ) : (
          <div className={`sprites-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
            {filteredSprites.map((sprite) => (
              <SpriteCard
                key={sprite.id}
                sprite={sprite}
                userState={userState}
                viewMode={viewMode}
                onToggleOwned={handleToggleOwned}
                onSetLevel={handleSetLevel}
                onOpenDetail={(s) => setSelectedSprite(s)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedSprite && (
        <SpriteDetailModal
          sprite={selectedSprite}
          userState={userState}
          onToggleOwned={handleToggleOwned}
          onSetLevel={handleSetLevel}
          onClose={() => setSelectedSprite(null)}
        />
      )}

      {showShareModal && (
        <ShareImageModal
          filteredSprites={filteredSprites}
          allSprites={ALL_SPRITES.filter(s => showUnreleased || !s.unreleased)}
          userState={userState}
          activeFiltersLabel={
            [
              baseFilter !== 'all' ? `Base: ${baseFilter}` : '',
              spriteFilter !== 'all' ? `Sprite: ${spriteFilter}` : '',
              searchQuery ? `Search: "${searchQuery}"` : ''
            ].filter(Boolean).join(' · ') || 'Ningún filtro activo'
          }
          onClose={() => setShowShareModal(false)}
        />
      )}

      {showBackupModal && (
        <BackupModal
          userState={userState}
          setUserState={setUserState}
          onClose={() => setShowBackupModal(false)}
        />
      )}
    </div>
  );
}

export default App;

import React, { useState, useEffect, useMemo } from 'react';
import { ALL_SPRITES } from './data/spritesData';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { SpriteCard } from './components/SpriteCard';
import { SpriteDetailModal } from './components/SpriteDetailModal';
import { ShareImageModal } from './components/ShareImageModal';
import { BackupModal } from './components/BackupModal';
import { FriendCompareModal } from './components/FriendCompareModal';
import { decodeCollectionState } from './utils/shareLink';

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

  const [friendState, setFriendState] = useState(() => {
    const friendParam = new URLSearchParams(window.location.search).get('friend');
    return friendParam ? decodeCollectionState(friendParam) : null;
  });

  const [activeProfile, setActiveProfile] = useState(() => {
    return new URLSearchParams(window.location.search).has('friend') ? 'friend' : 'mine';
  });

  // Filters matching fortnite.gg
  const [searchQuery, setSearchQuery] = useState('');
  const [baseFilter, setBaseFilter] = useState('all');      // BASE = variant/theme
  const [spriteFilter, setSpriteFilter] = useState('all');  // SPRITE = family
  const [sortBy, setSortBy] = useState('default');          // SORT BY
  const [showUnreleased, setShowUnreleased] = useState(true);
  const [viewMode, setViewMode] = useState('grid');         // 'grid' or 'list'

  // Modals
  const [selectedSprite, setSelectedSprite] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

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
          const aOwned = (activeProfile === 'friend' && friendState ? friendState : userState)[a.id]?.owned ? 1 : 0;
          const bOwned = (activeProfile === 'friend' && friendState ? friendState : userState)[b.id]?.owned ? 1 : 0;
          return aOwned - bOwned;
        });
        break;
      default:
        break;
    }

    return result;
  }, [searchQuery, baseFilter, spriteFilter, sortBy, showUnreleased, userState, friendState, activeProfile]);

  const activeState = activeProfile === 'friend' && friendState ? friendState : userState;

  const totalCount = ALL_SPRITES.filter(s => showUnreleased || !s.unreleased).length;
  const ownedCount = ALL_SPRITES.filter(s => (showUnreleased || !s.unreleased) && activeState[s.id]?.owned).length;
  const masteredCount = ALL_SPRITES.filter(s => (showUnreleased || !s.unreleased) && activeState[s.id]?.owned && activeState[s.id]?.level === 5).length;

  const friendLendableCount = friendState
    ? ALL_SPRITES.filter(s => friendState[s.id]?.owned && !userState[s.id]?.owned).length
    : 0;

  return (
    <div className="pokedex-app-root">
      {/* Header */}
      <Header
        totalCount={totalCount}
        ownedCount={ownedCount}
        masteredCount={masteredCount}
        onOpenShareModal={() => setShowShareModal(true)}
        onOpenBackupModal={() => setShowBackupModal(true)}
        onOpenCompareModal={() => setShowCompareModal(true)}
      />

      {/* Profile View Banner (when friend profile is available) */}
      {friendState && (
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto 16px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: activeProfile === 'friend' ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(59, 130, 246, 0.25))' : 'rgba(15, 23, 42, 0.6)',
          border: `1px solid ${activeProfile === 'friend' ? '#a855f7' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '14px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>{activeProfile === 'friend' ? '👥' : '👤'}</span>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff' }}>
                {activeProfile === 'friend' ? 'Estás explorando la Colección Completa de tu Amigo' : 'Viendo Tu Colección Personal'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                {activeProfile === 'friend'
                  ? `🎁 Tu amigo tiene ${friendLendableCount} Sprites que te puede prestar en Fortnite (puedes hacer clic en ellos para registrarlos).`
                  : 'Colección propia guardada localmente.'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveProfile('mine')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: activeProfile === 'mine' ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                color: '#fff',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              👤 Mi Colección
            </button>
            <button
              onClick={() => setActiveProfile('friend')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: activeProfile === 'friend' ? '#8b5cf6' : 'rgba(255,255,255,0.08)',
                color: '#fff',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              👥 Colección de mi Amigo
            </button>
            <button
              onClick={() => setShowCompareModal(true)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🔄 Resumen de Intercambio
            </button>
          </div>
        </div>
      )}

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
                friendState={friendState}
                isFriendView={activeProfile === 'friend'}
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

      {showCompareModal && (
        <FriendCompareModal
          userState={userState}
          onLoadFriendState={(state) => {
            setFriendState(state);
            setActiveProfile('friend');
          }}
          onToggleOwned={handleToggleOwned}
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </div>
  );
}

export default App;

import React, { useState, useEffect, useMemo } from 'react';
import { ALL_SPRITES } from './data/spritesData';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { SpriteCard } from './components/SpriteCard';
import { SpriteDetailModal } from './components/SpriteDetailModal';
import { ShareImageModal } from './components/ShareImageModal';
import { BackupModal } from './components/BackupModal';
import { FriendCompareModal } from './components/FriendCompareModal';
import { AuthModal } from './components/AuthModal';
import { PrivacyNotice } from './components/PrivacyNotice';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { Footer } from './components/Footer';
import { MobileSpriteSwiper } from './components/MobileSpriteSwiper';
import { useIsMobile } from './hooks/useIsMobile';
import { decodeCollectionState } from './utils/shareLink';
import { supabase, isSupabaseConfigured } from './utils/supabase';
import {
  getMyFriendCode,
  fetchCollectionByFriendCode,
  subscribeToFriendCollection,
  saveLastConnectedFriendCode,
  getLastConnectedFriendCode
} from './utils/friendCode';

const LOCAL_STORAGE_KEY = 'fortnite_sprites_pokedex_v3';

export function App() {
  const isMobile = useIsMobile(600);
  const [userState, setUserState] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Friend State & Realtime Connection
  const [myFriendCode, setMyFriendCode] = useState(() => getMyFriendCode());
  const [connectedFriendCode, setConnectedFriendCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('code') || getLastConnectedFriendCode() || '';
  });
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const [friendState, setFriendState] = useState(() => {
    const friendParam = new URLSearchParams(window.location.search).get('friend');
    return friendParam ? decodeCollectionState(friendParam) : null;
  });

  const [activeProfile, setActiveProfile] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has('friend') || params.has('code') ? 'friend' : 'mine';
  });

  // Supabase Auth & Cloud Sync State
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Filters matching fortnite.gg
  const [activeGen, setActiveGen] = useState(2); // 2 = 2ª Generación (GLITCH) by default!
  const [searchQuery, setSearchQuery] = useState('');
  const [baseFilter, setBaseFilter] = useState('all'); // BASE = variant/theme
  const [spriteFilter, setSpriteFilter] = useState('all'); // SPRITE = family
  const [statusFilter, setStatusFilter] = useState('all'); // STATUS = all/owned/missing
  const [sortBy, setSortBy] = useState('default'); // SORT BY
  const [showUnreleased, setShowUnreleased] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Modals
  const [selectedSprite, setSelectedSprite] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showFooterPrivacyModal, setShowFooterPrivacyModal] = useState(false);

  // Update myFriendCode when user logs in
  useEffect(() => {
    if (user?.id) {
      const code = getMyFriendCode(user.id);
      setMyFriendCode(code);
    }
  }, [user]);

  // Real-time Friend Code Connection & Subscriptions
  useEffect(() => {
    if (!connectedFriendCode) {
      setIsLiveConnected(false);
      return;
    }

    let unsubscribe = null;
    let isCancelled = false;

    fetchCollectionByFriendCode(connectedFriendCode).then((data) => {
      if (isCancelled) return;
      if (data && data.userState) {
        setFriendState(data.userState);
        setIsLiveConnected(true);
        saveLastConnectedFriendCode(connectedFriendCode);

        // Start realtime WebSocket subscription
        unsubscribe = subscribeToFriendCollection(data.userId, (liveState) => {
          if (!isCancelled) {
            setFriendState(liveState);
          }
        });
      }
    });

    return () => {
      isCancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [connectedFriendCode]);

  // Listen to Supabase Auth State & Sync Cloud Data
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setShowAuthModal(false);
        loadUserCollectionFromCloud(currentUser.id);
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setShowAuthModal(false);
        loadUserCollectionFromCloud(currentUser.id);
      } else if (_event === 'SIGNED_OUT') {
        handleSignOutCleanup();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserCollectionFromCloud = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_collections')
        .select('user_state, friend_code')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching cloud collection:', error);
        return;
      }

      if (data?.friend_code) {
        setMyFriendCode(data.friend_code);
      }

      if (data?.user_state && Object.keys(data.user_state).length > 0) {
        setUserState((currentLocal) => {
          const merged = { ...currentLocal, ...data.user_state };
          supabase.from('user_collections').upsert(
            {
              user_id: userId,
              friend_code: data.friend_code || myFriendCode,
              user_state: merged,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'user_id' }
          );
          return merged;
        });
      } else {
        setUserState((currentLocal) => {
          if (Object.keys(currentLocal).length > 0) {
            supabase.from('user_collections').upsert(
              {
                user_id: userId,
                friend_code: myFriendCode,
                user_state: currentLocal,
                updated_at: new Date().toISOString()
              },
              { onConflict: 'user_id' }
            );
          }
          return currentLocal;
        });
      }
    } catch (err) {
      console.error('Failed to load collection from cloud:', err);
    }
  };

  const handleSignOutCleanup = () => {
    setUserState({});
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear localStorage on sign out:', e);
    }
  };

  // Sync to localStorage & Supabase Cloud
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userState));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }

    if (isSupabaseConfigured && supabase && user) {
      const timer = setTimeout(async () => {
        try {
          await supabase.from('user_collections').upsert(
            {
              user_id: user.id,
              friend_code: myFriendCode,
              user_state: userState,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'user_id' }
          );
        } catch (err) {
          console.error('Failed to sync to Supabase:', err);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [userState, user, myFriendCode]);

  const handleToggleOwned = (spriteId) => {
    setUserState((prev) => {
      const current = prev[spriteId] || { owned: false, level: 1 };
      const nextOwned = !current.owned;
      return {
        ...prev,
        [spriteId]: {
          owned: nextOwned,
          level: current.level || 1
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

  const handleConnectFriendCode = async (code) => {
    const data = await fetchCollectionByFriendCode(code);
    if (data && data.userState) {
      setFriendState(data.userState);
      setConnectedFriendCode(data.friendCode || code);
      setIsLiveConnected(true);
      setActiveProfile('friend');
      saveLastConnectedFriendCode(data.friendCode || code);
      return true;
    }
    return false;
  };

  const handleDisconnectFriend = () => {
    setFriendState(null);
    setConnectedFriendCode('');
    setIsLiveConnected(false);
    setActiveProfile('mine');
    saveLastConnectedFriendCode(null);
  };

  const filteredSprites = useMemo(() => {
    let result = ALL_SPRITES.filter((sprite) => {
      if (!showUnreleased && sprite.unreleased) return false;

      // Filter by Generation (activeGen: 2 = Gen 2, 1 = Gen 1, 0 = All)
      if (activeGen !== 0 && sprite.gen !== activeGen) return false;

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const nameMatch = sprite.fullName.toLowerCase().includes(query);
        const idMatch = sprite.id.toLowerCase().includes(query);
        const familyMatch = (sprite.familyName || '').toLowerCase().includes(query);
        const variantMatch = (sprite.variant || '').toLowerCase().includes(query);
        const variantDisplayMatch = (sprite.variantDisplay || '').toLowerCase().includes(query);
        const quackMatch = (query.includes('quack') || query.includes('patito')) && sprite.variant === 'Quack';
        const holofoilMatch = (query.includes('holofoil') || query.includes('holografico') || query.includes('holográfico')) && sprite.variant === 'Holofoil';

        if (!nameMatch && !idMatch && !familyMatch && !variantMatch && !variantDisplayMatch && !quackMatch && !holofoilMatch) return false;
      }

      // BASE filter (variant/theme)
      if (baseFilter !== 'all' && sprite.variant !== baseFilter) return false;

      // SPRITE filter (family)
      if (spriteFilter !== 'all' && sprite.familyName.toLowerCase() !== spriteFilter.toLowerCase()) return false;

      // STATUS filter (all / owned / missing / new)
      if (statusFilter === 'owned') {
        const isOwned = (activeProfile === 'friend' && friendState ? friendState : userState)[sprite.id]?.owned;
        if (!isOwned) return false;
      } else if (statusFilter === 'missing') {
        const isOwned = (activeProfile === 'friend' && friendState ? friendState : userState)[sprite.id]?.owned;
        if (isOwned) return false;
      } else if (statusFilter === 'new') {
        if (sprite.gen !== 2 && !sprite.unreleased && !sprite.isNew) return false;
      }

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
  }, [activeGen, searchQuery, baseFilter, spriteFilter, statusFilter, sortBy, showUnreleased, userState, friendState, activeProfile]);

  const scopedSprites = useMemo(() => {
    return ALL_SPRITES.filter((s) => {
      if (!showUnreleased && s.unreleased) return false;
      if (activeGen !== 0 && s.gen !== activeGen) return false;
      return true;
    });
  }, [activeGen, showUnreleased]);

  const activeState = activeProfile === 'friend' && friendState ? friendState : userState;
  const totalCount = scopedSprites.length;
  const ownedCount = scopedSprites.filter((s) => activeState[s.id]?.owned).length;
  const masteredCount = scopedSprites.filter((s) => activeState[s.id]?.owned && activeState[s.id]?.level === 5).length;

  const friendLendableCount = friendState ? scopedSprites.filter((s) => friendState[s.id]?.owned && !userState[s.id]?.owned).length : 0;

  return (
    <div className="app-container">
      <PrivacyNotice />

      <Navbar
        user={user}
        activeGen={activeGen}
        onGenChange={(newGen) => {
          setActiveGen(newGen);
          setBaseFilter('all');
          setSpriteFilter('all');
        }}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onOpenBackupModal={() => setShowBackupModal(true)}
        onSignOut={handleSignOutCleanup}
      />

      <Header
        spritesPool={scopedSprites}
        ownedCount={ownedCount}
        totalCount={totalCount}
        masteredCount={masteredCount}
        user={user}
        onOpenShareModal={() => setShowShareModal(true)}
        onOpenBackupModal={() => setShowBackupModal(true)}
        onOpenCompareModal={() => setShowCompareModal(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      {/* Profile View Banner (when friend profile is available) */}
      {friendState && (
        <div
          style={{
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
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>{activeProfile === 'friend' ? '👥' : '👤'}</span>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{activeProfile === 'friend' ? 'Explorando Colección de tu Amigo' : 'Viendo Tu Colección Personal'}</span>
                {isLiveConnected && (
                  <span style={{ fontSize: '0.72rem', background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                    🟢 En Vivo ({connectedFriendCode})
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                {activeProfile === 'friend'
                  ? `🎁 Tu amigo tiene ${friendLendableCount} Sprites que te puede prestar en Fortnite (puedes hacer clic en ellos para registrarlos).`
                  : 'Colección propia guardada.'}
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
              👥 Colección de Amigo
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
              🔄 Planear Préstamos
            </button>
          </div>
        </div>
      )}

      {/* Main Content with Fortnite.gg matching filters */}
      <main className="main-content">
        <FilterBar
          isMobile={isMobile}
          activeGen={activeGen}
          setActiveGen={setActiveGen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          baseFilter={baseFilter}
          setBaseFilter={setBaseFilter}
          spriteFilter={spriteFilter}
          setSpriteFilter={setSpriteFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          showUnreleased={showUnreleased}
          setShowUnreleased={setShowUnreleased}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {filteredSprites.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', gridColumn: '1 / -1' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>No se encontraron Sprites</h2>
            <p>Prueba ajustando la búsqueda o los filtros.</p>
          </div>
        ) : isMobile ? (
          <MobileSpriteSwiper
            sprites={filteredSprites}
            userState={userState}
            friendState={friendState}
            isFriendView={activeProfile === 'friend'}
            onToggleOwned={handleToggleOwned}
            onSetLevel={handleSetLevel}
            onOpenDetail={(s) => setSelectedSprite(s)}
          />
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
          allSprites={ALL_SPRITES.filter((s) => (activeGen === 0 || s.gen === activeGen) && (showUnreleased || !s.unreleased))}
          userState={userState}
          activeGen={activeGen}
          activeFiltersLabel={
            [
              baseFilter !== 'all' ? `Base: ${baseFilter}` : '',
              spriteFilter !== 'all' ? `Sprite: ${spriteFilter}` : '',
              searchQuery ? `Búsqueda: "${searchQuery}"` : ''
            ]
              .filter(Boolean)
              .join(' · ') || 'Ningún filtro activo'
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
          friendState={friendState}
          isLiveConnected={isLiveConnected}
          connectedFriendCode={connectedFriendCode}
          myFriendCode={myFriendCode}
          onConnectFriendCode={handleConnectFriendCode}
          onDisconnectFriend={handleDisconnectFriend}
          onLoadFriendState={(state, sourceLabel) => {
            setFriendState(state);
            setActiveProfile('friend');
            if (sourceLabel) setConnectedFriendCode(sourceLabel);
          }}
          onToggleOwned={handleToggleOwned}
          onClose={() => setShowCompareModal(false)}
        />
      )}

      {showAuthModal && !user && (
        <AuthModal
          user={user}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={() => {
            setShowAuthModal(false);
          }}
          onSignOut={handleSignOutCleanup}
        />
      )}

      <Footer
        totalSprites={totalCount}
        onOpenPrivacy={() => setShowFooterPrivacyModal(true)}
      />

      {showFooterPrivacyModal && (
        <PrivacyPolicyModal onClose={() => setShowFooterPrivacyModal(false)} />
      )}
    </div>
  );
}

export default App;

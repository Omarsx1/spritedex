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
import { InstallPrompt } from './components/InstallPrompt';
import { Footer } from './components/Footer';
import { MobileSpriteSwiper } from './components/MobileSpriteSwiper';
import { useIsMobile } from './hooks/useIsMobile';
import { useDynamicSprites } from './hooks/useDynamicSprites';
import { trackEvent } from './utils/telemetry';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminAuthGate, isUserAdminAuthenticated } from './components/admin/AdminAuthGate';
import { decodeCollectionState } from './utils/shareLink';
import { supabase, isSupabaseConfigured } from './utils/supabase';
import { preloadCanvasAssets } from './utils/canvasExporter';
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
  const { sprites: dynamicSprites, refreshDynamicSprites } = useDynamicSprites();

  // Detección de ruta secreta /portal-override /studio-override o ?studio=true
  const [isAdminPortal, setIsAdminPortal] = useState(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    return path.startsWith('/studio-override') ||
           path.startsWith('/nexus-core') ||
           path.startsWith('/portal-override') ||
           params.has('studio') ||
           params.get('portal') === 'studio';
  });

  const [isAdminAuth, setIsAdminAuth] = useState(() => isUserAdminAuthenticated());

  // Registro de telemetría de visita al cargar la web (solo usuarios públicos reales)
  useEffect(() => {
    if (!isAdminPortal && !isAdminAuth && !isUserAdminAuthenticated()) {
      trackEvent('pageview');
    }
  }, [isAdminPortal, isAdminAuth]);

  // Precarga asíncrona de sprites en segundo plano
  useEffect(() => {
    preloadCanvasAssets(dynamicSprites);
  }, [dynamicSprites]);
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
        try {
          localStorage.setItem('spritedex_my_friend_code', data.friend_code);
        } catch {}
      }

      if (data?.user_state && Object.keys(data.user_state).length > 0) {
        const { _profile, ...pureState } = data.user_state;
        setUserState((currentLocal) => {
          const merged = { ...currentLocal, ...pureState };
          return merged;
        });
      } else {
        setUserState((currentLocal) => {
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
          const profileMeta = {
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Entrenador',
            email: user.email || '',
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
          };

          await supabase.from('user_collections').upsert(
            {
              user_id: user.id,
              friend_code: myFriendCode,
              user_state: {
                ...userState,
                _profile: profileMeta
              },
              updated_at: new Date().toISOString()
            },
            { onConflict: 'user_id' }
          );
        } catch (err) {
          console.error('Failed to sync to Supabase:', err);
        }
      }, 600);
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
    let result = dynamicSprites.filter((sprite) => {
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
  }, [
    dynamicSprites,
    showUnreleased,
    activeGen,
    searchQuery,
    baseFilter,
    spriteFilter,
    statusFilter,
    sortBy,
    userState,
    friendState,
    activeProfile
  ]);

  // Counts scoped to current generation (excluding unreleased unless enabled)
  const scopedSprites = useMemo(() => {
    return dynamicSprites.filter((s) => {
      if (!showUnreleased && s.unreleased) return false;
      if (activeGen !== 0 && s.gen !== activeGen) return false;
      return true;
    });
  }, [dynamicSprites, activeGen, showUnreleased]);

  const activeState = activeProfile === 'friend' && friendState ? friendState : userState;
  const totalCount = scopedSprites.length;
  const ownedCount = scopedSprites.filter((s) => activeState[s.id]?.owned).length;
  const masteredCount = scopedSprites.filter((s) => activeState[s.id]?.owned && activeState[s.id]?.level === 5).length;

  const friendLendableCount = friendState ? scopedSprites.filter((s) => friendState[s.id]?.owned && !userState[s.id]?.owned).length : 0;

  // Render Admin Portal if secret path or query parameter is active
  if (isAdminPortal) {
    if (!isAdminAuth) {
      return (
        <AdminAuthGate
          onAuthenticated={() => setIsAdminAuth(true)}
          onExit={() => {
            setIsAdminPortal(false);
            const url = new URL(window.location.href);
            url.searchParams.delete('studio');
            url.searchParams.delete('portal');
            const targetPath = url.pathname.includes('override') || url.pathname.includes('nexus') ? '/' : url.toString();
            window.history.pushState({}, '', targetPath);
          }}
        />
      );
    }

    return (
      <AdminLayout
        sprites={dynamicSprites}
        onRefreshSprites={refreshDynamicSprites}
        onExitAdmin={() => {
          setIsAdminPortal(false);
          const url = new URL(window.location.href);
          url.searchParams.delete('studio');
          url.searchParams.delete('portal');
          const targetPath = url.pathname.includes('override') || url.pathname.includes('nexus') ? '/' : url.toString();
          window.history.pushState({}, '', targetPath);
        }}
      />
    );
  }

  return (
    <div className="app-container">
      <PrivacyNotice />
      <InstallPrompt />

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
        isLiveConnected={isLiveConnected}
        connectedFriendCode={connectedFriendCode}
        onOpenShareModal={() => setShowShareModal(true)}
        onOpenBackupModal={() => setShowBackupModal(true)}
        onOpenCompareModal={() => setShowCompareModal(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      {/* Barra flotante sutil (Únicamente cuando se está explorando activamente la colección de un amigo) */}
      {activeProfile === 'friend' && (
        <div className="sdm-friend-pill">
          <div className="sdm-friend-pill__info">
            <span className="sdm-friend-pill__tag">👥 MODO AMIGO</span>
            <span className="sdm-friend-pill__desc">
              Explorando colección de <strong>{connectedFriendCode || 'Amigo'}</strong>
            </span>
          </div>
          <button
            onClick={() => setActiveProfile('mine')}
            className="sdm-friend-pill__exit"
            title="Volver a mi colección"
          >
            ✕ Salir a mi colección
          </button>
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
          allSprites={dynamicSprites.filter((s) => (activeGen === 0 || s.gen === activeGen) && (showUnreleased || !s.unreleased))}
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
          activeProfile={activeProfile}
          onSetActiveProfile={setActiveProfile}
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

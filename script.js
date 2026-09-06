const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealEls.forEach((el) => revealObserver.observe(el));

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Ticker: repeat the set enough times to fill the screen so it never
   runs out of content and gaps before looping, on any viewport width */

let tickerTemplateNode = null;

function buildTicker() {
  const ticker = document.getElementById('ticker');
  const track = document.getElementById('ticker-track');
  if (!ticker || !track) return;

  if (!tickerTemplateNode) {
    const original = document.getElementById('ticker-set-template');
    if (!original) return;
    tickerTemplateNode = original.cloneNode(true);
    tickerTemplateNode.removeAttribute('id');
  }

  if (!track.firstElementChild) {
    track.appendChild(tickerTemplateNode.cloneNode(true));
  }

  const setWidth = track.firstElementChild.getBoundingClientRect().width;
  const containerWidth = ticker.getBoundingClientRect().width;
  if (setWidth === 0) return;

  const minSets = Math.ceil((containerWidth * 2) / setWidth) + 1;
  const setCount = minSets % 2 === 0 ? minSets : minSets + 1;

  track.innerHTML = '';
  for (let i = 0; i < setCount; i++) {
    track.appendChild(tickerTemplateNode.cloneNode(true));
  }

  const totalWidth = setWidth * setCount;
  const pixelsPerSecond = 60;
  track.style.animationDuration = `${totalWidth / pixelsPerSecond}s`;
}

buildTicker();
window.addEventListener('resize', () => {
  clearTimeout(window._tickerResizeTimer);
  window._tickerResizeTimer = setTimeout(buildTicker, 200);
});

/* Carousel */

const track = document.getElementById('carousel-track');
const slides = track.querySelectorAll('.carousel-slide');
const dotsWrap = document.getElementById('carousel-dots');
const prevBtn = document.getElementById('carousel-prev');
const nextBtn = document.getElementById('carousel-next');
let slideIndex = 0;
let autoplayTimer = null;

slides.forEach((_, i) => {
  const dot = document.createElement('button');
  dot.type = 'button';
  dot.setAttribute('role', 'tab');
  dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
  dot.addEventListener('click', () => goToSlide(i));
  dotsWrap.appendChild(dot);
});

const dots = dotsWrap.querySelectorAll('button');

function goToSlide(i) {
  slideIndex = (i + slides.length) % slides.length;
  track.style.transform = `translateX(-${slideIndex * 100}%)`;
  dots.forEach((d, di) => d.classList.toggle('active', di === slideIndex));
}

function startAutoplay() {
  if (prefersReducedMotion) return;
  stopAutoplay();
  autoplayTimer = setInterval(() => goToSlide(slideIndex + 1), 4000);
}

function stopAutoplay() {
  if (autoplayTimer) clearInterval(autoplayTimer);
}

prevBtn.addEventListener('click', () => { goToSlide(slideIndex - 1); startAutoplay(); });
nextBtn.addEventListener('click', () => { goToSlide(slideIndex + 1); startAutoplay(); });

const carousel = document.getElementById('carousel');
carousel.addEventListener('mouseenter', stopAutoplay);
carousel.addEventListener('mouseleave', startAutoplay);
carousel.addEventListener('focusin', stopAutoplay);
carousel.addEventListener('focusout', startAutoplay);

goToSlide(0);
startAutoplay();

/* Quick-view drawer + checkout */

const shopCards = [...document.querySelectorAll('.shop-card')];

const boardCountEl = document.getElementById('board-count');
if (boardCountEl) {
  boardCountEl.textContent = `${shopCards.length} designs`;
}
const drawer = document.getElementById('drawer');
const drawerOverlay = document.getElementById('drawer-overlay');
const drawerClose = document.getElementById('drawer-close');
const drawerBuyBtn = document.getElementById('drawer-buy');
const drawerMock = document.getElementById('drawer-mock');
const drawerTitle = document.getElementById('drawer-title');
const drawerPrice = document.getElementById('drawer-price');
const drawerBoardDesc = document.getElementById('drawer-board-desc');
const drawerNote = document.getElementById('drawer-note');

let lastFocused = null;
let activeCard = null;

function findCardByBoard(board) {
  return shopCards.find((c) => c.dataset.board === board);
}

function openDrawer(card) {
  lastFocused = document.activeElement;
  activeCard = card;

  drawerMock.className = 'deck-mock drawer-mock ' + card.dataset.deckClass;
  drawerTitle.textContent = card.dataset.board;
  drawerPrice.textContent = card.dataset.price;
  drawerBoardDesc.textContent = card.dataset.description || '';
  drawerNote.textContent = '';
  checkoutPending = false;
  drawerBuyBtn.disabled = false;

  drawer.classList.add('open');
  drawerOverlay.classList.add('open');
  drawerClose.focus();
  document.addEventListener('keydown', onDrawerKeydown);

  recordRecent(card.dataset.board);
}

function closeDrawer() {
  drawer.classList.remove('open');
  drawerOverlay.classList.remove('open');
  document.removeEventListener('keydown', onDrawerKeydown);
  if (lastFocused) lastFocused.focus();
}

function onDrawerKeydown(e) {
  if (e.key === 'Escape') closeDrawer();
}

function burstConfetti(originEl) {
  if (prefersReducedMotion) return;
  const rect = originEl.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;
  const colors = ['#2f8a4e', '#c9a227', '#1f4d2e', '#a11c1c'];

  for (let i = 0; i < 16; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const angle = Math.random() * Math.PI * 2;
    const distance = 60 + Math.random() * 80;
    piece.style.setProperty('--start-x', `${originX}px`);
    piece.style.setProperty('--start-y', `${originY}px`);
    piece.style.setProperty('--end-x', `${originX + Math.cos(angle) * distance}px`);
    piece.style.setProperty('--end-y', `${originY + Math.sin(angle) * distance - 30}px`);
    piece.style.setProperty('--spin', `${Math.random() * 360}deg`);
    piece.style.background = colors[i % colors.length];
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 750);
  }
}

shopCards.forEach((card) => {
  card.addEventListener('click', (e) => {
    if (e.target.closest('.heart-btn')) return;
    openDrawer(card);
  });
  card.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target === card) {
      e.preventDefault();
      openDrawer(card);
    }
  });
});

drawerClose.addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);

function isSafeCheckoutUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

let checkoutPending = false;

drawerBuyBtn.addEventListener('click', () => {
  if (!activeCard || checkoutPending) return;
  const url = activeCard.dataset.checkoutUrl;

  if (url && isSafeCheckoutUrl(url)) {
    checkoutPending = true;
    drawerBuyBtn.disabled = true;
    burstConfetti(drawerBuyBtn);
    setTimeout(() => { window.location.href = url; }, prefersReducedMotion ? 0 : 450);
  } else if (url) {
    drawerNote.textContent = 'This board’s checkout link looks invalid — check the URL.';
    drawerNote.style.color = '#a11c1c';
  } else {
    drawerNote.textContent = 'Checkout link coming soon for this board.';
    drawerNote.style.color = 'var(--muted)';
  }
});

/* Zoom lightbox */

const lightboxOverlay = document.getElementById('lightbox-overlay');
const lightboxMock = document.getElementById('lightbox-mock');
const lightboxClose = document.getElementById('lightbox-close');

function openLightbox() {
  if (!activeCard) return;
  lightboxMock.className = 'deck-mock lightbox-mock ' + activeCard.dataset.deckClass;
  lightboxOverlay.classList.add('open');
  lightboxClose.focus();
  document.addEventListener('keydown', onLightboxKeydown);
}

function closeLightbox() {
  lightboxOverlay.classList.remove('open');
  document.removeEventListener('keydown', onLightboxKeydown);
  drawerMock.focus();
}

function onLightboxKeydown(e) {
  if (e.key === 'Escape') closeLightbox();
}

drawerMock.addEventListener('click', openLightbox);
lightboxClose.addEventListener('click', closeLightbox);
lightboxOverlay.addEventListener('click', (e) => {
  if (e.target === lightboxOverlay) closeLightbox();
});

/* Favorites */

const FAVORITES_KEY = 'hometurf_favorites';

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFavorites(list) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
  } catch {
    /* localStorage unavailable — favorites just won't persist */
  }
}

let favorites = loadFavorites();
const favoritesCountEl = document.getElementById('favorites-count');

function isFavorite(board) {
  return favorites.includes(board);
}

function updateFavoritesUI() {
  shopCards.forEach((card) => {
    const heart = card.querySelector('.heart-btn');
    heart.setAttribute('aria-pressed', String(isFavorite(card.dataset.board)));
  });
  favoritesCountEl.textContent = String(favorites.length);
  favoritesCountEl.hidden = favorites.length === 0;
}

const toastEl = document.getElementById('toast');
let toastTimer = null;

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2500);
}

function toggleFavorite(board, heartEl) {
  const nowFavorite = !isFavorite(board);
  favorites = nowFavorite ? [...favorites, board] : favorites.filter((b) => b !== board);
  saveFavorites(favorites);
  updateFavoritesUI();
  applyFilters();

  if (nowFavorite) {
    heartEl.classList.remove('pop');
    void heartEl.offsetWidth;
    heartEl.classList.add('pop');
    showToast(`Added "${board}" to favorites`);
  }
}

shopCards.forEach((card) => {
  const heart = card.querySelector('.heart-btn');
  heart.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite(card.dataset.board, heart);
  });
});

document.getElementById('nav-favorites').addEventListener('click', () => {
  document.getElementById('shop').scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  if (!favoritesOnly) {
    favoritesOnly = true;
    favoritesToggleBtn.setAttribute('aria-pressed', 'true');
    applyFilters();
  }
});

updateFavoritesUI();

/* Search + filter */

const searchInput = document.getElementById('shop-search');
const leagueFilterBtns = [...document.querySelectorAll('.filter-btn[data-league-filter]')];
const favoritesToggleBtn = document.getElementById('favorites-toggle');
const shopEmpty = document.getElementById('shop-empty');

let currentLeague = 'all';
let favoritesOnly = false;

leagueFilterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    currentLeague = btn.dataset.leagueFilter;
    leagueFilterBtns.forEach((b) => b.classList.toggle('active', b === btn));
    applyFilters();
  });
});

favoritesToggleBtn.addEventListener('click', () => {
  favoritesOnly = !favoritesOnly;
  favoritesToggleBtn.setAttribute('aria-pressed', String(favoritesOnly));
  applyFilters();
});

searchInput.addEventListener('input', () => applyFilters());

function setCardVisible(card, visible) {
  const isHidden = card.classList.contains('filtered-hidden');
  if (visible && isHidden) {
    card.classList.remove('filtered-hidden');
    if (prefersReducedMotion) {
      card.classList.remove('filtering-out');
    } else {
      card.classList.add('filtering-out');
      requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove('filtering-out')));
    }
  } else if (!visible && !isHidden) {
    if (prefersReducedMotion) {
      card.classList.add('filtered-hidden');
    } else {
      card.classList.add('filtering-out');
      setTimeout(() => card.classList.add('filtered-hidden'), 200);
    }
  }
}

function applyFilters() {
  const term = searchInput.value.trim().toLowerCase();
  let anyVisible = false;

  shopCards.forEach((card) => {
    const matchesSearch = !term || card.dataset.board.toLowerCase().includes(term);
    const matchesLeague = currentLeague === 'all' || card.dataset.league === currentLeague;
    const matchesFavorites = !favoritesOnly || isFavorite(card.dataset.board);
    const shouldShow = matchesSearch && matchesLeague && matchesFavorites;
    setCardVisible(card, shouldShow);
    if (shouldShow) anyVisible = true;
  });

  shopEmpty.hidden = anyVisible;
}

/* Recently viewed tray */

const RECENT_KEY = 'hometurf_recent';
const MAX_RECENT = 6;

function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRecent(list) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    /* localStorage unavailable — recents just won't persist */
  }
}

let recentBoards = loadRecent();
const recentTray = document.getElementById('recent-tray');
const recentTrayItems = document.getElementById('recent-tray-items');

function renderRecentTray() {
  recentTrayItems.innerHTML = '';
  const validBoards = recentBoards.filter((b) => findCardByBoard(b));

  if (validBoards.length === 0) {
    recentTray.hidden = true;
    document.body.classList.remove('has-recent-tray');
    return;
  }

  validBoards.forEach((board) => {
    const card = findCardByBoard(board);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'recent-tray-item ' + card.dataset.deckClass;
    btn.setAttribute('aria-label', 'View ' + board);
    btn.addEventListener('click', () => openDrawer(card));
    recentTrayItems.appendChild(btn);
  });

  recentTray.hidden = false;
  document.body.classList.add('has-recent-tray');
}

function recordRecent(board) {
  recentBoards = [board, ...recentBoards.filter((b) => b !== board)].slice(0, MAX_RECENT);
  saveRecent(recentBoards);
  renderRecentTray();
}

renderRecentTray();

/* 3D tilt on hover (desktop, motion allowed) */

const supportsHoverTilt = !prefersReducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if (supportsHoverTilt) {
  shopCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-4px) rotateX(${(-y * 10).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* Scroll progress bar */

const scrollProgressEl = document.getElementById('scroll-progress');

function updateScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  scrollProgressEl.style.width = pct + '%';
}

let progressTicking = false;
window.addEventListener('scroll', () => {
  if (progressTicking) return;
  progressTicking = true;
  requestAnimationFrame(() => {
    updateScrollProgress();
    progressTicking = false;
  });
}, { passive: true });

updateScrollProgress();

/* Active nav section highlight */

const navSectionLinks = [...document.querySelectorAll('#nav-links a[data-nav-section], .nav-cta[data-nav-section]')];
const navSectionEls = navSectionLinks
  .map((a) => document.getElementById(a.dataset.navSection))
  .filter(Boolean);

const activeSectionRatios = new Map();

const navSectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      activeSectionRatios.set(entry.target.id, entry.intersectionRatio);
    } else {
      activeSectionRatios.delete(entry.target.id);
    }
  });

  if (activeSectionRatios.size === 0) return;
  const [bestId] = [...activeSectionRatios.entries()].sort((a, b) => b[1] - a[1])[0];
  const link = navSectionLinks.find((a) => a.dataset.navSection === bestId);
  if (!link) return;
  navSectionLinks.forEach((a) => a.classList.remove('active'));
  link.classList.add('active');
}, { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });

navSectionEls.forEach((el) => navSectionObserver.observe(el));

/* Scroll parallax in hero */

if (!prefersReducedMotion) {
  const heroLogo = document.querySelector('.hero-logo');
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const offset = Math.min(window.scrollY, 400);
      heroLogo.style.transform = `translateY(${(offset * 0.15).toFixed(1)}px)`;
      ticking = false;
    });
  }, { passive: true });
}

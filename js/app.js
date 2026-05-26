/**
 * js/app.js
 * DJ Alessandro — Application Logic
 * Handles: navbar, scroll animations, carousel, discography grid, modal, game
 */

"use strict";

/* ============================================
   UTILITY
   ============================================ */

/**
 * Query selector helpers
 */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/**
 * Debounce a function
 */
function debounce(fn, delay = 100) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

/* ============================================
   NAVBAR
   ============================================ */
function initNavbar() {
  const navbar = $('.navbar');
  if (!navbar) return;

  // Scroll: add scrolled class
  const handleScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // run once on load

  // Active link highlight
  const navLinks = $$('.navbar-nav a, .navbar-mobile a');
  const current = window.location.pathname.split('/').pop() || 'index.html';
  navLinks.forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href === current || (current === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Mobile toggle
  const toggle = $('.nav-toggle');
  const mobileNav = $('.navbar-mobile');
  if (!toggle || !mobileNav) return;

  toggle.addEventListener('click', () => {
    const isOpen = toggle.classList.toggle('open');
    mobileNav.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close mobile nav on link click
  $$('.navbar-mobile a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* ============================================
   SCROLL FADE ANIMATIONS
   ============================================ */
function initScrollAnimations() {
  const targets = $$('.fade-in, .fade-in-left, .timeline-item');
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach(el => observer.observe(el));
}

/* ============================================
   CAROUSEL (homepage featured releases)
   ============================================ */
function initCarousel() {
  const track = $('.carousel-track');
  if (!track || typeof DISCOGRAPHY === 'undefined') return;

  // Pick 8 releases for the carousel
  const featured = DISCOGRAPHY.slice(0, 8);

  // Build cards — we duplicate for infinite loop
  const buildCard = (release) => {
    const card = document.createElement('div');
    card.className = 'release-card';
    card.dataset.id = release.id;

    card.innerHTML = `
      <div class="release-card-img-placeholder ${release.coverClass}">
        <div class="cover-glow" data-initial="${release.initial}"></div>
      </div>
      <div class="release-card-info">
        <div class="release-card-title">${release.title}</div>
        <div class="release-card-meta">
          <span class="release-card-type">${release.type}</span>
          <span>${release.year}</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => openModal(release));
    return card;
  };

  // Render original + duplicate for infinite scroll
  [...featured, ...featured].forEach(r => track.appendChild(buildCard(r)));
}

/* ============================================
   DISCOGRAPHY GRID
   ============================================ */
function initDiscography() {
  const grid = $('#discographyGrid');
  if (!grid || typeof DISCOGRAPHY === 'undefined') return;

  let currentFilter = 'all';

  const renderGrid = (filter) => {
    const filtered = filter === 'all'
      ? DISCOGRAPHY
      : DISCOGRAPHY.filter(r => r.type === filter);

    grid.innerHTML = '';

    filtered.forEach((release, i) => {
      const card = document.createElement('div');
      card.className = 'disc-card fade-in';
      card.style.transitionDelay = `${(i % 6) * 0.07}s`;
      card.dataset.id = release.id;

      card.innerHTML = `
        <div class="disc-card-img-placeholder ${release.coverClass}">
          <div class="cover-glow" data-initial="${release.initial}"></div>
        </div>
        <div class="disc-card-info">
          <div class="disc-card-title">${release.title}</div>
          <div class="disc-card-meta">
            <span class="disc-card-year">${release.year}</span>
            <span class="disc-card-type">${release.type}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => openModal(release));
      grid.appendChild(card);
    });

    // Re-trigger scroll animations for new cards
    setTimeout(() => initScrollAnimations(), 50);
  };

  // Filter buttons
  $$('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderGrid(currentFilter);
    });
  });

  renderGrid('all');
}

/* ============================================
   MODAL
   ============================================ */
function initModal() {
  const overlay = $('#modalOverlay');
  if (!overlay) return;

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Close button
  const closeBtn = overlay.querySelector('.modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function openModal(release) {
  const overlay = $('#modalOverlay');
  if (!overlay) return;

  // Populate modal content
  overlay.querySelector('.modal-img-placeholder').className = `modal-img-placeholder ${release.coverClass}`;
  overlay.querySelector('.modal-img-placeholder .cover-glow').setAttribute('data-initial', release.initial);
  overlay.querySelector('.modal-title').textContent = release.title;
  overlay.querySelector('.modal-tag-type').textContent = release.type;
  overlay.querySelector('.modal-tag-year').textContent = release.year;
  overlay.querySelector('.modal-desc').textContent = release.description;

  const spotifyBtn = overlay.querySelector('.btn-spotify');
  const youtubeBtn = overlay.querySelector('.btn-youtube');
  if (spotifyBtn) spotifyBtn.href = release.spotify;
  if (youtubeBtn) youtubeBtn.href = release.youtube;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = $('#modalOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

/* ============================================
   MINI GAME — Chicken DJ
   Canvas pixel-art runner
   ============================================ */
function initGame() {
  const canvas = $('#gameCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const scoreEl = $('#gameScore');

  // Responsive canvas sizing
  const resize = () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  };
  resize();
  window.addEventListener('resize', debounce(resize, 200));

  // Colors from CSS vars (read from root)
  const blue  = '#4cc9f0';
  const green = '#00ff9f';
  const dim   = 'rgba(245,245,245,0.15)';
  const muted = 'rgba(245,245,245,0.06)';

  // Game state
  let state = 'idle'; // idle | running | dead
  let score = 0;
  let hiScore = 0;
  let frame = 0;
  let speed = 3.5;
  let obstacles = [];
  let animId;

  // Player (chicken)
  const player = {
    x: 60,
    get y() { return canvas.height - this.h - groundH; },
    w: 36,
    h: 36,
    vy: 0,
    jumping: false,
    dead: false,
  };

  const groundH = 28;
  const gravity = 0.55;
  const jumpForce = -11;

  // ---- Obstacle pool ----
  function spawnObstacle() {
    const h = 20 + Math.random() * 22;
    const w = 18 + Math.random() * 12;
    obstacles.push({
      x: canvas.width + 20,
      y: canvas.height - h - groundH,
      w, h,
    });
  }

  // ---- Draw helpers ----

  // Pixel-style rounded rect
  function pixelRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  // Draw ground
  function drawGround() {
    // Ground line
    ctx.fillStyle = 'rgba(76,201,240,0.12)';
    ctx.fillRect(0, canvas.height - groundH, canvas.width, 1);

    // Scrolling dots
    ctx.fillStyle = 'rgba(76,201,240,0.06)';
    for (let x = (frame * -speed * 0.5) % 40; x < canvas.width; x += 40) {
      ctx.fillRect(Math.round(x), canvas.height - groundH + 8, 20, 1);
    }
  }

  // Draw chicken (pixel art)
  function drawChicken(px, py, isDead) {
    const s = 1; // scale factor (1px = 1px)
    const ox = Math.round(px);
    const oy = Math.round(py);

    // Body
    pixelRect(ox + 6, oy + 10, 22, 18, '#f5f5f5');
    // Head
    pixelRect(ox + 10, oy + 2, 16, 14, '#f5f5f5');
    // Beak
    pixelRect(ox + 24, oy + 8, 8, 4, '#ffcc44');
    // Eye (blue or X if dead)
    if (!isDead) {
      pixelRect(ox + 20, oy + 5, 4, 4, blue);
      pixelRect(ox + 21, oy + 6, 2, 2, '#000');
    } else {
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('✕', ox + 19, oy + 10);
    }
    // Headphones
    pixelRect(ox + 8, oy, 20, 4, '#222');
    pixelRect(ox + 8, oy, 4, 8, '#333');
    pixelRect(ox + 24, oy, 4, 8, '#333');
    // Headphone pads
    pixelRect(ox + 7, oy + 3, 6, 8, blue);
    pixelRect(ox + 23, oy + 3, 6, 8, blue);
    // Wing bob
    const wingOff = (state === 'running' && !isDead) ? Math.sin(frame * 0.3) * 2 : 0;
    pixelRect(ox, oy + 14 + wingOff, 8, 10, '#e8e8e8');
    // Legs
    if (state === 'running' && !isDead) {
      const legPhase = Math.sin(frame * 0.4) * 4;
      pixelRect(ox + 10, oy + 26, 4, 6 + legPhase, '#ffcc44');
      pixelRect(ox + 18, oy + 26, 4, 6 - legPhase, '#ffcc44');
    } else {
      pixelRect(ox + 10, oy + 26, 4, 6, '#ffcc44');
      pixelRect(ox + 18, oy + 26, 4, 6, '#ffcc44');
    }
  }

  // Draw musical note obstacle
  function drawNote(obs) {
    const x = Math.round(obs.x);
    const y = Math.round(obs.y);
    const w = Math.round(obs.w);
    const h = Math.round(obs.h);

    // Note head (ellipse approximated)
    ctx.fillStyle = green;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.4, y + h - 6, w * 0.35, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Stem
    ctx.fillStyle = green;
    ctx.fillRect(x + w * 0.4 + Math.round(w * 0.35) - 2, y, 2, h - 4);

    // Flag
    ctx.strokeStyle = green;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.4 + Math.round(w * 0.35), y);
    ctx.bezierCurveTo(
      x + w * 0.4 + Math.round(w * 0.35) + 12, y + 6,
      x + w * 0.4 + Math.round(w * 0.35) + 10, y + 14,
      x + w * 0.4 + Math.round(w * 0.35), y + 14
    );
    ctx.stroke();

    // Subtle glow
    ctx.fillStyle = 'rgba(0,255,159,0.08)';
    ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  }

  // Draw HUD
  function drawHUD() {
    ctx.fillStyle = 'rgba(76,201,240,0.6)';
    ctx.font = '600 11px "IBM Plex Mono"';
    ctx.textAlign = 'right';
    ctx.fillText(`${String(score).padStart(5, '0')}`, canvas.width - 12, 20);

    ctx.fillStyle = 'rgba(245,245,245,0.2)';
    ctx.textAlign = 'right';
    ctx.fillText(`HI ${String(hiScore).padStart(5, '0')}`, canvas.width - 12, 34);

    ctx.textAlign = 'left';
  }

  // Draw idle / game-over screen
  function drawOverlay(text, sub) {
    ctx.fillStyle = 'rgba(76,201,240,0.85)';
    ctx.font = 'bold 13px "IBM Plex Mono"';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 - 10);

    ctx.fillStyle = 'rgba(245,245,245,0.35)';
    ctx.font = '10px "IBM Plex Mono"';
    ctx.fillText(sub, canvas.width / 2, canvas.height / 2 + 8);
    ctx.textAlign = 'left';
  }

  // ---- Collision detection ----
  function checkCollisions() {
    const px = player.x + 8;
    const py = player.y + 6;
    const pw = player.w - 14;
    const ph = player.h - 8;

    for (const obs of obstacles) {
      if (
        px < obs.x + obs.w - 4 &&
        px + pw > obs.x + 4 &&
        py < obs.y + obs.h &&
        py + ph > obs.y
      ) {
        return true;
      }
    }
    return false;
  }

  // ---- Game loop ----
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background grid lines
    ctx.fillStyle = muted;
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.fillRect(0, y, canvas.width, 1);
    }

    drawGround();

    if (state === 'running') {
      frame++;

      // Move player
      player.vy += gravity;
      const rawY = player.y + player.vy;
      const floorY = canvas.height - player.h - groundH;
      if (rawY >= floorY) {
        player.vy = 0;
        player.jumping = false;
      }
      // (We derive player.y from canvas so just track vy indirectly)
      // Use offset hack: store separate jump offset
      player._jumpOffset = Math.max(0, (player._jumpOffset || 0) - player.vy);
      if (player._jumpOffset < 0) player._jumpOffset = 0;
      // Actually let's just track absolute playerY:
    }

    // Draw chicken
    const playerRenderY = (state === 'running' || state === 'dead')
      ? playerAbsY
      : canvas.height - player.h - groundH;
    drawChicken(player.x, playerRenderY, state === 'dead');

    // Spawn obstacles
    if (state === 'running') {
      const spawnInterval = Math.max(60, 120 - score * 0.4);
      if (frame % Math.round(spawnInterval) === 0) spawnObstacle();

      // Move + draw obstacles
      obstacles = obstacles.filter(obs => obs.x + obs.w > 0);
      obstacles.forEach(obs => {
        obs.x -= speed;
        drawNote(obs);
      });

      // Score
      score++;
      if (score > hiScore) hiScore = score;
      if (scoreEl) scoreEl.textContent = String(score).padStart(5, '0');

      // Speed ramp
      speed = 3.5 + score * 0.003;

      // Collision
      if (checkCollisions()) {
        state = 'dead';
      }
    } else if (state === 'dead') {
      drawChicken(player.x, playerAbsY, true);
      obstacles.forEach(obs => drawNote(obs));
      drawOverlay('SIGNAL LOST', 'PRESS SPACE / TAP TO RESTART');
    } else {
      drawOverlay('CHICKEN DJ', 'PRESS SPACE / TAP TO START');
    }

    drawHUD();
    animId = requestAnimationFrame(loop);
  }

  // Separate absolute Y tracker (avoids canvas.height dependency in player getter)
  let playerAbsY = 0;
  let playerVY = 0;

  function updatePlayer() {
    if (state !== 'running') return;
    const floorY = canvas.height - player.h - groundH;
    playerVY += gravity;
    playerAbsY = Math.min(playerAbsY + playerVY, floorY);
    if (playerAbsY >= floorY) {
      playerAbsY = floorY;
      playerVY = 0;
      player.jumping = false;
    }
  }

  // Override loop to use update
  cancelAnimationFrame(animId);

  function gameLoop() {
    updatePlayer();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Scan lines bg
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.fillStyle = muted;
      ctx.fillRect(0, y, canvas.width, 1);
    }

    drawGround();

    if (state === 'running') {
      frame++;
      const spawnInterval = Math.max(55, 110 - score * 0.35);
      if (frame % Math.round(spawnInterval) === 0) spawnObstacle();

      obstacles = obstacles.filter(obs => obs.x + obs.w > -10);
      obstacles.forEach(obs => { obs.x -= speed; drawNote(obs); });

      score++;
      if (score > hiScore) hiScore = score;
      speed = 3.5 + score * 0.003;
      if (scoreEl) scoreEl.textContent = String(score).padStart(5, '0');

      if (checkCollisions()) state = 'dead';

      drawChicken(player.x, playerAbsY, false);
    } else if (state === 'dead') {
      obstacles.forEach(obs => drawNote(obs));
      drawChicken(player.x, playerAbsY, true);
      drawOverlay('SIGNAL LOST', 'PRESS SPACE / TAP TO RESTART');
    } else {
      // idle
      const floorY = canvas.height - player.h - groundH;
      playerAbsY = floorY;
      drawChicken(player.x, playerAbsY, false);
      drawOverlay('CHICKEN DJ', 'PRESS SPACE / TAP TO START');
    }

    drawHUD();
    animId = requestAnimationFrame(gameLoop);
  }

  function jump() {
    const floorY = canvas.height - player.h - groundH;
    if (state === 'idle') {
      state = 'running';
      frame = 0;
      return;
    }
    if (state === 'dead') {
      // restart
      score = 0;
      speed = 3.5;
      obstacles = [];
      frame = 0;
      playerAbsY = floorY;
      playerVY = 0;
      state = 'running';
      return;
    }
    if (!player.jumping && playerAbsY >= floorY - 2) {
      player.jumping = true;
      playerVY = jumpForce;
    }
  }

  // Controls
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      jump();
    }
  });
  canvas.addEventListener('click', jump);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); jump(); }, { passive: false });

  // Init player position
  playerAbsY = canvas.height - player.h - groundH;
  gameLoop();
}

/* ============================================
   BOOT SEQUENCE — run when DOM ready
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollAnimations();

  // Page-specific inits
  if ($('.carousel-track')) initCarousel();
  if ($('#discographyGrid')) initDiscography();
  if ($('#modalOverlay')) initModal();
  if ($('#gameCanvas')) initGame();

  // Make initial elements visible with slight delay
  setTimeout(() => {
    $$('.fade-in, .fade-in-left').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) el.classList.add('visible');
    });
  }, 100);
});

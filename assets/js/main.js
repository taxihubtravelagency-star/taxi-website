'use strict';

// This file contains interactions only. Edit visible copy, links, fares and images in index.html.
const phoneLink = document.querySelector('.site-header a[href^="tel:"]')?.getAttribute('href') || '';
const phone = phoneLink.replace('tel:', '').replace(/\D/g, '');
const mapLink = document.querySelector('#contact a[href*="google.com/maps"]')?.href || 'https://www.google.com/maps';
const makeWhatsAppUrl = message => `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

// Hero carousel
const hero = document.querySelector('.hero');
if (hero) {
  const slides = [...hero.querySelectorAll('.hero-slide')];
  const dots = hero.querySelector('.hero-dots');
  let active = 0;
  let timer;
  const selectSlide = index => {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === active));
    dots.querySelectorAll('button').forEach((dot, i) => {
      dot.classList.toggle('active', i === active);
      dot.setAttribute('aria-current', String(i === active));
    });
    const count = hero.querySelector('.hero-caption span');
    if (count) count.textContent = `${String(active + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  };
  dots.innerHTML = slides.map((_, i) => `<button class="hero-dot${i === 0 ? ' active' : ''}" type="button" aria-label="Go to slide ${i + 1}" aria-current="${i === 0}"></button>`).join('');
  const start = () => {
    clearInterval(timer);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(() => selectSlide(active + 1), 6500);
  };
  hero.querySelector('.hero-next')?.addEventListener('click', () => { selectSlide(active + 1); start(); });
  hero.querySelector('.hero-prev')?.addEventListener('click', () => { selectSlide(active - 1); start(); });
  dots.addEventListener('click', event => {
    const dot = event.target.closest('button');
    if (dot) { selectSlide([...dots.children].indexOf(dot)); start(); }
  });
  let touchStart = null;
  hero.addEventListener('touchstart', event => { touchStart = event.changedTouches[0].clientX; }, { passive: true });
  hero.addEventListener('touchend', event => {
    if (touchStart === null) return;
    const delta = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(delta) > 45) { selectSlide(active + (delta < 0 ? 1 : -1)); start(); }
    touchStart = null;
  }, { passive: true });
  hero.addEventListener('pointerdown', () => { clearInterval(timer); setTimeout(start, 9000); }, { passive: true });
  start();
}

// Static HTML templates provide all destination and package modal content.
const detailDialog = document.querySelector('#detailDialog');
const dialogContent = document.querySelector('#dialogContent');
document.addEventListener('click', event => {
  const opener = event.target.closest('[data-detail]');
  if (opener && detailDialog && dialogContent) {
    const template = document.getElementById(opener.dataset.detail);
    if (template) {
      dialogContent.replaceChildren(...[...template.children].map(node => node.cloneNode(true)));
      detailDialog.showModal();
      document.body.classList.add('dialog-open');
      detailDialog.querySelector('.dialog-close')?.focus();
    }
  }
  const galleryButton = event.target.closest('.gallery-item');
  if (galleryButton) {
    const lightbox = document.querySelector('#lightbox');
    lightbox.querySelector('img').src = galleryButton.querySelector('img')?.currentSrc || galleryButton.querySelector('img')?.src || galleryButton.dataset.full || '';
    lightbox.querySelector('img').alt = galleryButton.dataset.caption || '';
    lightbox.querySelector('p').textContent = galleryButton.dataset.caption || '';
    lightbox.showModal();
  }
});
[detailDialog, document.querySelector('#lightbox')].filter(Boolean).forEach(dialog => {
  dialog.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { if (dialog === detailDialog) document.body.classList.remove('dialog-open'); });
});

// Reviews are rendered only from verified HTML seed data or the optional reviews endpoint.
const reviewContainer = document.querySelector('#reviewCarousel');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
let reviews = [];
try { reviews = JSON.parse(document.querySelector('#googleReviewsData')?.textContent || '[]'); } catch (_) { reviews = []; }
function renderReviews() {
  if (!reviewContainer) return;
  const valid = reviews.filter(review => review?.author && review?.text && Number(review.rating) >= 1 && Number(review.rating) <= 5).slice(0, 12);
  if (!valid.length) {
    reviewContainer.innerHTML = `<article class="review-card review-fallback"><div class="review-card-head"><span class="review-avatar" style="background:#fff;color:#4285f4;font-size:19px">G</span><span><b>Uttarakhand Taxi Service</b><small>Google Business Profile</small></span></div><p class="review-empty">Read the latest verified customer reviews and ratings on our Google listing.</p><a href="${mapLink}" target="_blank" rel="noopener"><span>G</span> View reviews on Google</a></article>`;
    document.querySelector('.review-controls')?.setAttribute('hidden', '');
    return;
  }
  reviewContainer.classList.add('is-live');
  reviewContainer.innerHTML = valid.map(review => `<article class="review-card"><div class="review-card-head"><span class="review-avatar">${escapeHtml(review.author.slice(0, 1))}</span><span><b>${escapeHtml(review.author)}</b><small>${escapeHtml(review.relativeDate || 'Google review')}</small></span></div><div class="review-stars" aria-label="${Number(review.rating)} out of 5 stars">${'★'.repeat(Number(review.rating))}</div><p>${escapeHtml(review.text)}</p><a href="${mapLink}" target="_blank" rel="noopener"><span>G</span> View on Google</a></article>`).join('');
  const controls = document.querySelector('.review-controls');
  if (controls) controls.hidden = valid.length < 2;
}
renderReviews();
document.querySelectorAll('.review-controls button').forEach((button, index) => button.addEventListener('click', () => reviewContainer?.scrollBy({ left: (index ? 1 : -1) * 300, behavior: 'smooth' })));

// YouTube Shorts load only after a visitor activates a card.
const videoGrid = document.querySelector('#videoGrid');
let youtubeApiPromise;
let activeShortPlayer = null;
function loadYouTubePlayerApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;
  youtubeApiPromise = new Promise((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => reject(new Error('YouTube player could not be loaded.'));
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error('YouTube player is unavailable.'));
    };
    document.head.append(script);
    setTimeout(() => reject(new Error('YouTube player took too long to load.')), 12000);
  });
  return youtubeApiPromise;
}
function showShortFallback(media, card) {
  const fallback = document.createElement('div');
  fallback.className = 'video-fallback';
  const message = document.createElement('p');
  message.textContent = 'This video is unavailable in the embedded player.';
  const link = card.querySelector('.short-foot a')?.cloneNode(true);
  if (link) link.textContent = 'Watch on YouTube';
  fallback.append(message);
  if (link) fallback.append(link);
  media.replaceChildren(fallback);
}
videoGrid?.addEventListener('click', async event => {
  const button = event.target.closest('.pc-video-play');
  if (!button) return;
  const card = button.closest('.pc-video-card');
  const media = button.closest('.pc-video-media');
  if (!card || !media) return;

  // Keep one player active and preserve every card's original poster and controls.
  if (activeShortPlayer) activeShortPlayer.destroy();
  activeShortPlayer = null;
  videoGrid.querySelectorAll('.pc-video-media').forEach(otherMedia => {
    if (otherMedia === media) return;
    otherMedia.dataset.playerContainer = '';
    if (otherMedia.dataset.original) otherMedia.innerHTML = otherMedia.dataset.original;
  });
  if (!media.dataset.original) media.dataset.original = media.innerHTML;

  const playerFrame = document.createElement('iframe');
  const videoId = card.dataset.id;
  const origin = encodeURIComponent(window.location.origin);
  playerFrame.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?enablejsapi=1&origin=${origin}&autoplay=1&mute=1&playsinline=1`;
  playerFrame.title = card.dataset.title || 'YouTube Short';
  playerFrame.loading = 'eager';
  playerFrame.referrerPolicy = 'strict-origin-when-cross-origin';
  playerFrame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  playerFrame.allowFullscreen = true;
  media.replaceChildren(playerFrame);
  media.dataset.playerContainer = 'true';

  try {
    const YT = await loadYouTubePlayerApi();
    activeShortPlayer = new YT.Player(playerFrame, {
      events: {
        onReady: playerEvent => {
          playerEvent.target.mute();
          playerEvent.target.playVideo();
        },
        onError: () => {
          activeShortPlayer = null;
          showShortFallback(media, card);
          media.dataset.playerContainer = '';
        }
      }
    });
  } catch (_) {
    activeShortPlayer = null;
    showShortFallback(media, card);
    media.dataset.playerContainer = '';
  }
});
document.querySelectorAll('[data-short-dir]').forEach(button => button.addEventListener('click', () => videoGrid?.scrollBy({ left: Number(button.dataset.shortDir) * 320, behavior: 'smooth' })));

// WhatsApp enquiry forms compose messages from fields already defined in the HTML.
function submitEnquiry(form, quick = false) {
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const fields = quick
    ? [['Pickup', data.get('pickup')], ['Destination', data.get('destination')], ['Date', data.get('date') || 'Not specified'], ['Vehicle', data.get('vehicle')], ['Passengers', data.get('passengers')]]
    : [['Name', data.get('name')], ['Phone', data.get('phone')], ['Email', data.get('email') || 'Not provided'], ['Pickup', data.get('pickup')], ['Destination', data.get('destination')], ['Travel date', data.get('date') || 'Not specified'], ['Return date', data.get('returnDate') || 'Not specified'], ['Vehicle', data.get('vehicle')], ['Passengers', data.get('passengers')], ['Trip type', data.get('tripType')], ['Additional requirements', data.get('message') || 'None']];
  const message = `Hello Uttarakhand Taxi Cab,\n\nI would like to enquire about a taxi.\n\n${fields.map(([label, value]) => `${label}: ${value ?? ''}`).join('\n')}`;
  const status = form.querySelector('.form-status') || document.querySelector('#formStatus');
  if (status) status.textContent = 'Opening WhatsApp with your enquiry. Please review and send the pre-filled message.';
  window.open(makeWhatsAppUrl(message), '_blank', 'noopener,noreferrer');
}
document.querySelector('#quickForm')?.addEventListener('submit', event => { event.preventDefault(); submitEnquiry(event.currentTarget, true); });
document.querySelector('#contactForm')?.addEventListener('submit', event => { event.preventDefault(); submitEnquiry(event.currentTarget); });
document.querySelector('#year')?.replaceChildren(String(new Date().getFullYear()));

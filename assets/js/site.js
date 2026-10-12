'use strict';

/* Shared header, footer, mobile quick-contact bar and contact form (used on every page). */
const brandHtml = `<span class="brand-mark" aria-hidden="true">U</span><span>UTTARAKHAND <b>TAXI CAB</b><small>Haldwani · Uttarakhand</small></span>`;

const sharedHeader = `<header class="site-header" id="siteHeader" data-business-name="Uttarakhand Taxi Cab"><a class="brand" href="index.html" aria-label="Uttarakhand Taxi Cab home">${brandHtml}</a><button class="menu-toggle" aria-label="Open navigation" aria-expanded="false" aria-controls="primaryNav"><span></span><span></span><span></span></button><nav id="primaryNav" class="primary-nav" aria-label="Main navigation"><a href="index.html#home">Home</a><a href="about.html">About</a><a href="index.html#services">Services</a><a href="blogs.html">Blogs</a><a href="contact.html">Contact</a></nav><div class="header-actions"><a class="button button-small button-outline" href="tel:+917078338881">Call now</a><a class="button button-small button-whatsapp" href="https://wa.me/917078338881" target="_blank" rel="noopener">WhatsApp</a></div></header>`;

const sharedFooter = `<footer class="site-footer"><div class="footer-main"><div class="footer-brand"><a class="brand" href="index.html" aria-label="Uttarakhand Taxi Cab home">${brandHtml}</a><p>Taxi and travel enquiries for Uttarakhand journeys from Haldwani.</p></div><div><h3>Explore</h3><a href="index.html#destinations">Destinations</a><a href="index.html#packages">Tour packages</a><a href="index.html#routes">Taxi routes</a><a href="index.html#fleet">Our fleet</a><a href="index.html#fares">Fares</a></div><div><h3>Get in touch</h3><a href="tel:+917078338881">07078 338881</a><a href="https://wa.me/917078338881">WhatsApp</a><a href="about.html">About us</a><a href="blogs.html">Travel blog</a><a href="contact.html">Contact us</a></div><div><h3>Information</h3><a href="privacy-policy.html">Privacy policy</a><a href="terms-and-conditions.html">Terms &amp; conditions</a><a href="cancellation-refund-policy.html">Cancellation &amp; refund</a><a href="disclaimer.html">Disclaimer</a></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Uttarakhand Taxi Cab</span><span>Haldwani · Uttarakhand</span><a href="index.html#home">Back to top</a></div></footer>`;

document.querySelectorAll('[data-shared-header]').forEach(el => el.outerHTML = sharedHeader);
document.querySelectorAll('[data-shared-footer]').forEach(el => el.outerHTML = sharedFooter);

// Keep phone and WhatsApp actions visible on small screens across every page.
const phoneNumber = document.querySelector('.site-header a[href^="tel:"]')?.getAttribute('href') || 'tel:+917078338881';
const whatsappNumber = phoneNumber.replace('tel:', '').replace(/\D/g, '');
const mobileCta = document.createElement('nav');
mobileCta.className = 'mobile-sticky-cta';
mobileCta.setAttribute('aria-label', 'Quick contact');
mobileCta.innerHTML = `<a href="${phoneNumber}">Call</a><a href="https://wa.me/${whatsappNumber}" target="_blank" rel="noopener">WhatsApp</a>` + (document.querySelector('#quick-enquiry') ? '<a href="#quick-enquiry">Get quote</a>' : '');
document.body.appendChild(mobileCta);

// Header turns solid after scrolling (and always on pages without a hero image).
const siteHeader = document.querySelector('#siteHeader');
if (siteHeader) {
  const hasHero = !!document.querySelector('.hero, .page-hero');
  const syncHeader = () => siteHeader.classList.toggle('scrolled', window.scrollY > 24 || !hasHero || document.body.classList.contains('inner-page'));
  window.addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();
}

// Mobile navigation
const menu = document.querySelector('.menu-toggle'), nav = document.querySelector('.primary-nav');
if (menu && nav) {
  const setOpen = open => {
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    nav.classList.toggle('open', open);
  };
  menu.addEventListener('click', () => setOpen(menu.getAttribute('aria-expanded') !== 'true'));
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setOpen(false); });
}

// Contact page form: composes a WhatsApp message.
const form = document.querySelector('#pageContactForm');
if (form) form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const d = new FormData(form);
  const businessName = document.querySelector('.site-header')?.dataset.businessName || 'Uttarakhand Taxi Cab';
  const phone = document.querySelector('.site-header a[href^="tel:"]')?.getAttribute('href').replace('tel:', '').replace(/\D/g, '') || '917078338881';
  const msg = `Hello ${businessName},\n\nI would like to enquire about a taxi.\n\nName: ${d.get('name')}\nPhone: ${d.get('phone')}\nEmail: ${d.get('email') || 'Not provided'}\nPickup: ${d.get('pickup')}\nDestination: ${d.get('destination')}\nTravel date: ${d.get('date') || 'Not specified'}\nReturn date: ${d.get('returnDate') || 'Not specified'}\nVehicle: ${d.get('vehicle')}\nPassengers: ${d.get('passengers')}\nTrip type: ${d.get('tripType')}\nMessage: ${d.get('message') || 'None'}`;
  form.querySelector('.form-status').textContent = 'Opening WhatsApp with your enquiry. Please review and send the message.';
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
});

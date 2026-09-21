/* ============================================================
   LANGUAGE · HE / EN
   Hebrew is what the HTML ships with. English is applied here, before any
   other script runs, by swapping the content of the elements listed below
   and flipping the document to LTR. It runs as a classic script at the end
   of <body>, so it lands ahead of main.js (a module) and before the hero
   splits its letters and words.

   The choice comes from ?lang=en / ?lang=he first, then the last choice
   remembered in localStorage, then Hebrew. Switching reloads the page: the
   hero timeline and the letter splits are built once, from the text on the
   page at boot.

   Scripts ask for their own strings through window.t(key, hebrew).
   ============================================================ */

(function () {
  var html = document.documentElement;

  function readLang() {
    var fromUrl = new URLSearchParams(location.search).get("lang");
    if (fromUrl === "en" || fromUrl === "he") return fromUrl;
    try {
      var stored = localStorage.getItem("lang");
      if (stored === "en" || stored === "he") return stored;
    } catch (e) {
      /* storage blocked, fall back to Hebrew */
    }
    return "he";
  }

  var LANG = readLang();
  window.SITE_LANG = LANG;

  var SERVICES = '<span class="nobr">Business Websites</span>, <span class="nobr">Landing Pages</span>, <span class="nobr">App Development</span>, <span class="nobr">AI Automation</span>, <span class="nobr">E-commerce &amp; Dropshipping Stores</span>';

  /* --------------------------------------------------------- home page */
  var INDEX = {
    title: "Elyotam | Business Websites, Landing Pages, App Development, AI Automation, E-commerce & Dropshipping Stores",
    attrs: [
      ['meta[name="description"]', "content", "Elyotam builds business websites, landing pages, apps, AI automation and E-commerce & Dropshipping stores. One unit, one command, full accountability for the result."],
      ['meta[property="og:title"]', "content", "Elyotam | One unit. One command."],
      ['meta[property="og:description"]', "content", "Business websites, landing pages, app development, AI automation and E-commerce & Dropshipping stores. One unit, one command."],
      ["#hero", "aria-label", "Elyotam, one digital unit for websites, apps, automation and stores"],
      ["#hero-canvas", "aria-label", "One continuous operation: a high-altitude jump, helicopters, tanks, a sniper, drones and a launch, through websites, landing pages, AI automation, dropshipping stores and apps"],
      ["#finale", "aria-label", "Closing"],
      [".ops-index", "aria-label", "Objective index"],
      [".ops-step", "aria-label", "Move between objectives"],
      [".ops-prev", "aria-label", "Previous objective"],
      [".ops-next", "aria-label", "Next objective"],
      [".tb-nav", "aria-label", "Main navigation"],
      ["#wa-float", "aria-label", "WhatsApp"],
    ],
    text: [
      ["#loader .loader-row > span:first-child", "Deploying the unit"],
      ["#rail-label", "Zero hour"],

      // the command bar
      ['.tb-nav a[href="#whoweserve"]', "Services"],
      ['.tb-nav a[href="#operations"]', "Work"],
      ['.tb-nav a[href="#approach"]', "The process"],
      ['.tb-nav a[href="#whoweare"]', "About"],
      [".tb-cta", "Intro call"],

      // the offer
      [".offer-kicker", '<i aria-hidden="true"></i>All of your digital presence'],
      [".offer-title", '<span class="ot-line">This isn\u2019t just another website.</span><span class="ot-line ot-line--signal">It\u2019s an operation.</span>'],
      [".offer-sub", 'A business needs more than a website. <span class="nobr">Here we build everything it needs.</span>'],
      [".hero-offer .btn-signal", "Book an intro call"],
      [".hero-offer .btn-ghost", "See our work"],
      [".offer-scroll", "The film starts as you scroll<i></i>"],

      // the film
      ["#zone-name .brand-sub", SERVICES],
      ["#zone-closing .closing-line", "Your mission <em>starts with one call.</em>"],

      // the five services, each on its own scene of the film
      ["#cap-drop .cap-kicker", "Dropshipping Stores"],
      ["#cap-drop .cap-word", "Precision Drop"],
      ["#cap-drop .cap-note", "Straight from the supplier to the customer. No warehouse, no inventory."],
      ["#cap-web .cap-kicker", "Business Websites"],
      ["#cap-web .cap-word", "Breaking Through"],
      ["#cap-web .cap-note", "A website that puts your business on the front line."],
      ["#cap-landing .cap-kicker", "Landing Pages"],
      ["#cap-landing .cap-word", "Precision Shot"],
      ["#cap-landing .cap-note", "One page, one target."],
      ["#cap-ai .cap-kicker", "AI Automation"],
      ["#cap-ai .cap-word", "The Squad That Never Sleeps"],
      ["#cap-ai .cap-note", 'AI agents handling every enquiry, <span class="nobr">around the clock.</span>'],
      ["#cap-apps .cap-kicker", "App Development"],
      ["#cap-apps .cap-word", "Air Superiority"],
      ["#cap-apps .cap-note", '<span class="nobr">When your app is in the air,</span> <span class="nobr">your competitors have no sky.</span>'],

      // 01 · order of battle
      ["#whoweserve .section-index", "Services"],
      ["#whoweserve .h-mega", "Everything your business needs."],
      ["#whoweserve .house-head-note", "Presence, conversion, sales, retention and automation, with nothing left uncovered."],
      ["#serve-grid .house-card:nth-child(1) .house-title", "Business Website"],
      ["#serve-grid .house-card:nth-child(1) .house-desc", "Taking the digital ground: a custom-designed website that presents your brand, a clear message for the customer and a contact form that sends every lead straight to HQ."],
      ["#serve-grid .house-card:nth-child(1) .house-arrow", "Holding the ground"],
      ["#serve-grid .house-card:nth-child(2) .house-title", "Landing Pages"],
      ["#serve-grid .house-card:nth-child(2) .house-desc", "Precision targeting of your audience: no distractions, no noise, just a sharp message that leads straight to leaving contact details."],
      ["#serve-grid .house-card:nth-child(2) .house-arrow", "Sniper unit"],
      ["#serve-grid .house-card:nth-child(3) .house-title", "App Development"],
      ["#serve-grid .house-card:nth-child(3) .house-desc", "A full development operation: specification, design, development and launch to the App Store and Google Play, with control at every stage."],
      ["#serve-grid .house-card:nth-child(3) .house-arrow", "Air superiority"],
      ["#serve-grid .house-card:nth-child(4) .house-title", "AI Automation"],
      ["#serve-grid .house-card:nth-child(4) .house-desc", "AI agents on permanent standby: answering customers, sending reminders, following up on leads and updating systems, with no manual work."],
      ["#serve-grid .house-card:nth-child(4) .house-arrow", "The squad that never sleeps"],
      ["#serve-grid .house-card:nth-child(5) .house-title", "E-commerce &amp; Dropshipping Stores"],
      ["#serve-grid .house-card:nth-child(5) .house-desc", "End-to-end store setup, run like a logistics operation: design, product upload, secure checkout and shipping management."],
      ["#serve-grid .house-card:nth-child(5) .house-arrow", "Precision drop"],

      // 02 · operations file
      ["#operations .section-index", "Portfolio"],
      ["#operations .h-mega", "Work that went live."],
      ["#operations .house-head-note", "Real projects for real clients. Pick an objective on the map, the file opens and the link goes straight to the site."],
      ["#operations .op-card[data-i=\"1\"] .op-card-head", "<span>OBJ 01</span><span>Completed</span>"],
      ["#operations .op-card[data-i=\"1\"] .op-type", "Business Website"],
      ["#operations .op-card[data-i=\"1\"] .op-client", "Moshe Stern, CPA"],
      ["#operations .op-card[data-i=\"1\"] .op-desc", "A website for an accounting office that specialises in e-commerce: a live chart that draws the business\u2019s money, a 2026 tax calculator and credit-points calculator, and dark and light modes."],
      ["#operations .op-card[data-i=\"1\"] .op-cta", "View the site"],
      ["#operations .ops-tab:nth-of-type(1) .ops-tab-name", "Moshe Stern"],
      ["#operations .ops-pin:nth-of-type(1) span", "OBJ 01"],
      ["#operations .op-card[data-i=\"2\"] .op-card-head", "<span>OBJ 02</span><span>Completed</span>"],
      ["#operations .op-card[data-i=\"2\"] .op-type", "Business Website"],
      ["#operations .op-card[data-i=\"2\"] .op-client", "Ahuvit Mor, Boutique Cakes"],
      ["#operations .op-card[data-i=\"2\"] .op-desc", "A website for a studio of handmade designer boutique cakes: a cake gallery, a three-step ordering process, a cake order form and direct contact on WhatsApp."],
      ["#operations .op-card[data-i=\"2\"] .op-cta", "View the site"],
      ["#operations .ops-tab:nth-of-type(2) .ops-tab-name", "Ahuvit Mor"],
      ["#operations .ops-pin:nth-of-type(2) span", "OBJ 02"],
      ["#operations .ops-index-title", "Objective Index"],
      ["#operations .ops-stamp", "<b>02/02</b><i>objectives</i>"],
      ["#operations .hud-tr", "<span id=\"ops-count\">OBJ 01 / 02</span><span id=\"ops-status\">Status: secured</span>"],

      // 03 · how we work
      ["#approach .section-index", "The process"],
      ["#approach .h-mega", "Scope. Build. Launch."],
      ["#approach .house-head-note", "We start only when it’s clear what’s being built."],
      ["#approach-steps .step:nth-child(1) .step-title", "Scope"],
      ["#approach-steps .step:nth-child(1) .step-desc", "What the business needs, who the customers are and what the goal is."],
      ["#approach-steps .step:nth-child(2) .step-title", "Build"],
      ["#approach-steps .step:nth-child(2) .step-desc", "We work in live versions, so you watch the product grow instead of waiting for the end."],
      ["#approach-steps .step:nth-child(3) .step-title", "Launch"],
      ["#approach-steps .step:nth-child(3) .step-desc", "Go live, measure what works and improve. Support continues afterwards."],

      // 04 · command and control
      ["#whoweare .section-index", "Command &amp; Control"],
      ["#whoweare .h-mega", "One Unit. One Command."],
      ["#whoweare .unit-copy .body-dim", "Whoever controls the digital ground controls the market. Instead of a site vendor, an app vendor, a store vendor and an automation vendor, the whole sector is run from one place, and one person answers for the result."],
      ["#vendor-run .vr-list > li:nth-child(1) .vr-text", '<span class="vr-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M16 4 L8 12 L16 20" /></svg></span>A site vendor.'],
      ["#vendor-run .vr-list > li:nth-child(2) .vr-text", '<span class="vr-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M16 4 L8 12 L16 20" /></svg></span>An app vendor.'],
      ["#vendor-run .vr-list > li:nth-child(3) .vr-text", '<span class="vr-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M16 4 L8 12 L16 20" /></svg></span>A store vendor.'],
      ["#vendor-run .vr-list > li:nth-child(4) .vr-text", '<span class="vr-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M16 4 L8 12 L16 20" /></svg></span>An AI vendor.'],

      // 05 · the close
      ["#finale .finale-eyebrow", "Intro Call"],
      ["#finale .finale-tagline",
        '<span class="reveal-line"><span>The idea won\u2019t wait at base forever.</span></span>' +
        '<span class="reveal-line"><span>Let\u2019s take it into the field.</span></span>'],
      ["#finale .close-note", "A half-hour intro call, with no slide deck and no sales pitch. Tell us what\u2019s stuck and get a plan: what to build, in what order, and when to go live. If it\u2019s not a fit, we\u2019ll say so."],
      ["#finale .btn-signal", "Book an intro call"],
      ["#finale .btn-ghost", "Message us on WhatsApp"],

      // footer
      ["#footer .footer-links a:nth-child(1)", "Services"],
      ["#footer .footer-links a:nth-child(2)", "Portfolio"],
      ["#footer .footer-links a:nth-child(3)", "The process"],
      ["#footer .footer-links a:nth-child(4)", "Command &amp; Control"],
      ["#footer .footer-links a:nth-child(5)", "HQ"],
      ["#footer .footer-fine span:nth-child(1)", "© 2026 ELYOTAM. All rights reserved."],
      ["#footer .footer-fine span:nth-child(2)", SERVICES],
    ],
  };

  /* ------------------------------------------------------- contact page */
  var CONTACT = {
    title: "HQ | Contact Elyotam",
    attrs: [
      ['meta[name="description"]', "content", "Contact Elyotam HQ: business websites, landing pages, app development, AI automation and E-commerce & Dropshipping stores. Fill in your details and book a free half-hour intro call."],
      ["#f-name", "placeholder", "How should we address you?"],
      ["#f-business", "placeholder", "Optional"],
      ["#f-message", "placeholder", "Optional. What does the business do today, and what needs to happen?"],
      ["#f-services .chip:nth-of-type(1) input", "value", "Business Website"],
      ["#f-services .chip:nth-of-type(2) input", "value", "Landing Pages"],
      ["#f-services .chip:nth-of-type(3) input", "value", "App Development"],
      ["#f-services .chip:nth-of-type(4) input", "value", "AI Automation"],
      ["#f-services .chip:nth-of-type(5) input", "value", "E-commerce & Dropshipping Stores"],
      ["#f-services .chip:nth-of-type(6) input", "value", "Not sure yet"],
    ],
    text: [
      [".field-back", "Back to base"],
      [".field-head .section-index", "Open channel"],
      [".field-head .h-mega", "Contact HQ"],
      [".field-head .body-dim", "Fill in a few details and your enquiry comes straight to us. We get back to you to schedule a half-hour intro call: what to build, in what order, and when to go live."],
      ["#form-title", "Mission Details"],
      ['label[for="f-name"]', 'Full name <span class="req">*</span>'],
      ['label[for="f-phone"]', 'Phone <span class="req">*</span>'],
      ['label[for="f-email"]', 'Email <span class="req">*</span>'],
      ['label[for="f-business"]', "Business name"],
      ["#f-services legend", 'Which force do you need? <span class="req">*</span>'],
      ["#f-services .chip:nth-of-type(1) span", "Business Website"],
      ["#f-services .chip:nth-of-type(2) span", "Landing Pages"],
      ["#f-services .chip:nth-of-type(3) span", "App Development"],
      ["#f-services .chip:nth-of-type(4) span", "AI Automation"],
      ["#f-services .chip:nth-of-type(5) span", "E-commerce &amp; Dropshipping Stores"],
      ["#f-services .chip:nth-of-type(6) span", "Not sure yet"],
      ['label[for="f-message"]', "What needs to happen"],
      ['label[for="f-honey"]', "Leave empty"],
      ["#send-btn", "Send to HQ"],
      ["#wa-btn", "Send via WhatsApp"],
      [".field-note", "Fields marked * are required"],
      ["#next-title", "What happens after you send"],
      [".side-steps li:nth-child(1) strong", "Details received at HQ"],
      [".side-steps li:nth-child(1) div > span", "Your enquiry comes straight to us, no middlemen."],
      [".side-steps li:nth-child(2) strong", "We get back to schedule"],
      [".side-steps li:nth-child(2) div > span", "We set a time for the call that suits you."],
      [".side-steps li:nth-child(3) strong", "A half-hour intro call"],
      [".side-steps li:nth-child(3) div > span", "You leave with a plan: what to build, in what order, and when to go live."],
      ["#wa-direct", "Direct line on WhatsApp"],
      [".side-meta", "30 minutes, video or phone, free"],
      [".field-foot", "© 2026 ELYOTAM. All rights reserved."],
    ],
  };

  /* ------------------------------------------------- strings for scripts */
  var JS = {
    "rail.zero": "Zero hour",
    "rail.done": "Complete",
    "skip.film": "Skip the film",
    "skip.unused": "Skip the map",
    "map.count": "OBJ %N / 02",
    "map.enroute": "Status: en route",
    "map.secured": "Status: secured",
    "map.done": "Status: all objectives secured",
    "form.name": "Name is missing",
    "form.phone": "Invalid phone number",
    "form.emailMissing": "Email is missing",
    "form.emailInvalid": "Invalid email address",
    "form.services": "No service selected",
    "form.sending": "Transmitting to HQ...",
    "form.ok": "Order received at HQ. We'll get back to you shortly to schedule the intro call.",
    "form.error": "The transmission didn't go through. You can send the same details via WhatsApp with the button next to it.",
    "form.waOpened": "WhatsApp opened with all your details. Just hit send.",
    "wa.hello": "Hi, I came from your website and would like an intro call.",
    "wa.name": "Name",
    "wa.phone": "Phone",
    "wa.email": "Email",
    "wa.business": "Business",
    "wa.services": "Service",
    "mail.subject": "New website enquiry",
  };

  window.t = function (key, hebrew) {
    return LANG === "en" && Object.prototype.hasOwnProperty.call(JS, key) ? JS[key] : hebrew;
  };

  /* ------------------------------------------------------------- apply */
  if (LANG === "en") {
    var page = document.body.classList.contains("field-page") ? CONTACT : INDEX;
    html.lang = "en";
    html.dir = "ltr";
    document.title = page.title;
    page.attrs.forEach(function (row) {
      var el = document.querySelector(row[0]);
      if (el) el.setAttribute(row[1], row[2]);
    });
    page.text.forEach(function (row) {
      var el = document.querySelector(row[0]);
      if (el) el.innerHTML = row[1];
    });
  }
  html.classList.remove("i18n-pending");

  /* ------------------------------------------------------------ switch */
  document.querySelectorAll("[data-set-lang]").forEach(function (btn) {
    var target = btn.getAttribute("data-set-lang");
    btn.setAttribute("aria-pressed", String(target === LANG));
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      if (target === LANG) return;
      try {
        localStorage.setItem("lang", target);
      } catch (err) {
        /* not remembered, the URL still carries it */
      }
      var url = new URL(location.href);
      url.searchParams.set("lang", target);
      url.hash = "";
      location.replace(url.toString());
    });
  });
})();

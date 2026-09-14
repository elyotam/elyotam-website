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

  var SERVICES = "Business Websites · Landing Pages · App Development · AI Automation · E-commerce &amp; Dropshipping Stores";

  /* --------------------------------------------------------- home page */
  var INDEX = {
    title: "Elyotam · Business Websites, Landing Pages, App Development, AI Automation, E-commerce & Dropshipping Stores",
    attrs: [
      ['meta[name="description"]', "content", "Elyotam builds business websites, landing pages, apps, AI automation and E-commerce & Dropshipping stores. One unit, one command, full accountability for the result."],
      ['meta[property="og:title"]', "content", "Elyotam · One unit. One command."],
      ['meta[property="og:description"]', "content", "Business websites, landing pages, app development, AI automation and E-commerce & Dropshipping stores. One unit, one command."],
      ["#hero", "aria-label", "A digital operation to build a flawless business with Elyotam"],
      ["#hero-canvas", "aria-label", "One continuous operation: a high-altitude jump, helicopters, tanks, a sniper, drones and a launch, through websites, landing pages, AI automation, dropshipping stores and apps"],
      ["#finale", "aria-label", "Closing"],
    ],
    text: [
      ["#loader .loader-row > span:first-child", "Deploying the unit"],
      ["#rail-label", "Zero hour"],
      ["#scroll-hint > span", "Scroll to discover"],
      [".mobile-scroll-cue", "Scroll to discover"],

      // the film
      ["#zone-eyebrow .eyebrow", "Thirty&nbsp;thousand&nbsp;feet above&nbsp;the&nbsp;competition."],
      ["#zone-name .brand-sub", SERVICES],
      ["#chapter-drop .chapter-index", "Dropshipping Stores"],
      ["#chapter-drop .chapter-word", "Precision Drop"],
      ["#chapter-drop .chapter-caption", "Straight from the supplier to the customer. No warehouse, no inventory."],
      ["#chapter-web .chapter-index", "Business Websites"],
      ["#chapter-web .chapter-word", "Breaking Through"],
      ["#chapter-web .chapter-caption", "A website that puts your business on the front line."],
      ["#chapter-landing .chapter-index", "Landing Pages"],
      ["#chapter-landing .chapter-word", "Direct Hit"],
      ["#chapter-landing .chapter-caption", "One page, one target:"],
      ["#zone-target .km-word", "Client"],
      ["#zone-target .km-stamp", "Target acquired"],
      ["#chapter-ai .chapter-index", "AI Automation"],
      ["#chapter-ai .chapter-word", "The Squad That Never Sleeps"],
      ["#chapter-ai .chapter-caption", "AI agents handling every enquiry, around the clock."],
      ["#chapter-apps .chapter-index", "App Development"],
      ["#chapter-apps .chapter-word", "Air Superiority"],
      ["#chapter-apps .chapter-caption", "When your app is in the air, your competitors have no sky."],
      ["#zone-closing .closing-line", "Your mission <em>starts with one call.</em>"],

      // 01 · command and control
      ["#whoweare .section-index", "01 · Command &amp; Control"],
      ["#whoweare .h-mega", "One Unit. One Command."],
      ["#whoweare .lead",
        '<span class="reveal-line"><span>A site vendor. An app vendor.</span></span>' +
        '<span class="reveal-line"><span>A store vendor. An AI vendor.</span></span>' +
        '<span class="reveal-line"><span>Something goes down in the field,</span></span>' +
        '<span class="reveal-line"><span>and everyone blames everyone else.</span></span>'],
      ["#whoweare .who-copy .body-dim", "Here there is one chain of command. Whoever builds your business website and landing pages is the one who connects the automation, the store and the app to them. Full accountability, from briefing to launch."],
      ["#whoweare .stat-row > div:nth-child(1) .stat-label", "Operational readiness, no breaks"],
      ["#whoweare .stat-row > div:nth-child(2) .stat-label", "Forces under one command"],
      ["#whoweare .stat-row > div:nth-child(3) .stat-label", "Single point of contact for the whole operation"],

      // 02 · order of battle
      ["#whoweserve .section-index", "02 · Order of Battle"],
      ["#whoweserve .h-mega", "Five Forces. One Operation."],
      ["#whoweserve .house-head-note", "Each force can operate on its own. Together they cover the entire sector, from the first click to the sale."],
      ["#serve-grid .house-card:nth-child(1) .house-title", "Business Website"],
      ["#serve-grid .house-card:nth-child(1) .house-desc", "Your business's base online. Built from scratch around what you sell, not a template with the photos swapped."],
      ["#serve-grid .house-card:nth-child(1) .house-arrow", "Holding the ground"],
      ["#serve-grid .house-card:nth-child(2) .house-title", "Landing Pages"],
      ["#serve-grid .house-card:nth-child(2) .house-desc", "One page, one objective: turn every visit from a campaign into an enquiry."],
      ["#serve-grid .house-card:nth-child(2) .house-arrow", "Target locked"],
      ["#serve-grid .house-card:nth-child(3) .house-title", "App Development"],
      ["#serve-grid .house-card:nth-child(3) .house-desc", "Apps for iPhone, Android and the Web that pass Apple and Google review and don't crash under load."],
      ["#serve-grid .house-card:nth-child(3) .house-arrow", "Cleared for launch"],
      ["#serve-grid .house-card:nth-child(4) .house-title", "AI Automation"],
      ["#serve-grid .house-card:nth-child(4) .house-desc", "An agent that takes the enquiry, replies, books the meeting and updates the CRM. No human hands."],
      ["#serve-grid .house-card:nth-child(4) .house-arrow", "On call 24/7"],
      ["#serve-grid .house-card:nth-child(5) .house-title", "E-commerce &amp; Dropshipping Stores"],
      ["#serve-grid .house-card:nth-child(5) .house-desc", "A store that sells around the clock: payments, inventory and shipping. With dropshipping, the order ships straight from the supplier to the customer, no warehouse."],
      ["#serve-grid .house-card:nth-child(5) .house-arrow", "Supply line open"],

      // 03 · operation order
      ["#approach .section-index", "03 · Operation Order"],
      ["#approach .h-mega", "Brief. Execute. Launch."],
      ["#approach .house-head-note", "Three phases. Each one ends with something live in the field, not a slide deck."],
      ["#approach-grid .house-card:nth-child(1) .house-title", "Brief"],
      ["#approach-grid .house-card:nth-child(1) .house-desc", "Intelligence gathering: where the money comes from today, who the competitors are, and what the objective is. Before a single line of code."],
      ["#approach-grid .house-card:nth-child(1) .house-arrow", "Intel &amp; planning"],
      ["#approach-grid .house-card:nth-child(2) .house-title", "Execute"],
      ["#approach-grid .house-card:nth-child(2) .house-desc", "The force goes into action. A live version ships every week, so you see progress in the field, not reports."],
      ["#approach-grid .house-card:nth-child(2) .house-arrow", "Development, design &amp; AI"],
      ["#approach-grid .house-card:nth-child(3) .house-title", "Launch"],
      ["#approach-grid .house-card:nth-child(3) .house-desc", "Go live, measure the hits and correct course. Support doesn't end on launch day."],
      ["#approach-grid .house-card:nth-child(3) .house-arrow", "Launch &amp; control"],

      // 04 · opening briefing
      ["#consultation .section-index", "04 · Opening Briefing"],
      ["#consultation .h-mega", "A Half-Hour Briefing"],
      ["#consultation .who-copy .body-dim", "No slide deck and no sales pitch. Tell us the situation on the ground and what's stuck, and get an operation order: what to build, in what order, and when to go live. If it's not a fit, we'll say so."],
      ["#consultation .consult-cta", 'Book a briefing <span aria-hidden="true">→</span>'],
      ["#consultation .consult-meta", "30 minutes · Video or phone · Free"],

      // finale and footer
      ["#finale .finale-eyebrow", "Your next operation"],
      ["#finale .finale-tagline",
        '<span class="reveal-line"><span>The idea won’t wait at base forever.</span></span>' +
        '<span class="reveal-line"><span>Let’s take it into the field.</span></span>'],
      ["#finale .finale-cta-label", "Contact HQ"],
      ["#footer .footer-links a:nth-child(1)", "Command &amp; Control"],
      ["#footer .footer-links a:nth-child(2)", "Order of Battle"],
      ["#footer .footer-links a:nth-child(3)", "Operation Order"],
      ["#footer .footer-links a:nth-child(4)", "Opening Briefing"],
      ["#footer .footer-links a:nth-child(5)", "HQ"],
      ["#footer .footer-fine span:nth-child(1)", "© 2026 ELYOTAM. All rights reserved."],
      ["#footer .footer-fine span:nth-child(2)", SERVICES],
    ],
  };

  /* ------------------------------------------------------- contact page */
  var CONTACT = {
    title: "HQ · Contact Elyotam",
    attrs: [
      ['meta[name="description"]', "content", "Contact Elyotam HQ: business websites, landing pages, app development, AI automation and E-commerce & Dropshipping stores. Fill in your details and book a free half-hour briefing."],
      ["#f-name", "placeholder", "How should we address you?"],
      ["#f-business", "placeholder", "Optional"],
      ["#f-message", "placeholder", "What does the business do today, and what needs to happen?"],
      ["#f-services .chip:nth-of-type(1) input", "value", "Business Website"],
      ["#f-services .chip:nth-of-type(2) input", "value", "Landing Pages"],
      ["#f-services .chip:nth-of-type(3) input", "value", "App Development"],
      ["#f-services .chip:nth-of-type(4) input", "value", "AI Automation"],
      ["#f-services .chip:nth-of-type(5) input", "value", "E-commerce & Dropshipping Stores"],
      ["#f-services .chip:nth-of-type(6) input", "value", "Not sure yet"],
    ],
    text: [
      [".field-back", "← Back to base"],
      [".field-head .section-index", "HQ · Open channel"],
      [".field-head .h-mega", "Contact HQ"],
      [".field-head .body-dim", "Fill in a few details and your briefing comes straight to us. We get back to you to schedule a half-hour briefing: what to build, in what order, and when to go live."],
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
      ['label[for="f-message"]', 'The briefing <span class="req">*</span>'],
      ['label[for="f-honey"]', "Leave empty"],
      ["#send-btn", 'Send to HQ <span aria-hidden="true">→</span>'],
      ["#wa-btn", "Send via WhatsApp"],
      [".field-note", "Fields marked * are required"],
      ["#next-title", "What happens after you send"],
      [".side-steps li:nth-child(1) strong", "Details received at HQ"],
      [".side-steps li:nth-child(1) div > span", "Your enquiry comes straight to us, no middlemen."],
      [".side-steps li:nth-child(2) strong", "We get back to schedule"],
      [".side-steps li:nth-child(2) div > span", "We set a time for the briefing that suits you."],
      [".side-steps li:nth-child(3) strong", "A half-hour briefing"],
      [".side-steps li:nth-child(3) div > span", "You leave with a plan: what to build, in what order, and when to go live."],
      ["#wa-direct", "Direct line on WhatsApp"],
      [".side-meta", "30 minutes · Video or phone · Free"],
      [".field-foot", "© 2026 ELYOTAM. All rights reserved."],
    ],
  };

  /* ------------------------------------------------- strings for scripts */
  var JS = {
    "rail.zero": "Zero hour",
    "rail.drop": "Dropshipping Stores",
    "rail.web": "Business Websites",
    "rail.landing": "Landing Pages",
    "rail.ai": "AI Automation",
    "rail.apps": "App Development",
    "rail.done": "Mission complete",
    "form.name": "Name is missing",
    "form.phone": "Invalid phone number",
    "form.emailMissing": "Email is missing",
    "form.emailInvalid": "Invalid email address",
    "form.services": "No service selected",
    "form.message": "The briefing is missing",
    "form.sending": "Transmitting to HQ...",
    "form.ok": "Order received at HQ. We'll get back to you shortly to schedule the briefing.",
    "form.error": "The transmission didn't go through. You can send the same details via WhatsApp with the button next to it.",
    "form.waOpened": "WhatsApp opened with all your details. Just hit send.",
    "wa.hello": "Hi, I came from your website and would like a briefing.",
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

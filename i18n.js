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

  var SERVICES = '<span class="nobr">Business Websites</span> · <span class="nobr">Landing Pages</span> · <span class="nobr">App Development</span> · <span class="nobr">AI Automation</span> · <span class="nobr">E-commerce &amp; Dropshipping Stores</span>';

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
      ["#reveal-canvas", "aria-label", "The hangar doors open and an F-35 is revealed in the light"],
    ],
    text: [
      ["#loader .loader-row > span:first-child", "Deploying the unit"],
      ["#rail-label", "Zero hour"],
      ["#scroll-hint > span", "Scroll to discover"],
      [".mobile-scroll-cue", "Scroll to discover"],

      // the film
      ["#zone-eyebrow .credit-kicker", "Zero Hour"],
      ["#zone-eyebrow .eyebrow", "This isn't just another&nbsp;website.<br />It's&nbsp;an&nbsp;operation."],
      ["#zone-name .brand-sub", SERVICES],
      ["#chapter-drop .chapter-index", "Dropshipping Stores"],
      ["#chapter-drop .chapter-word", "Precision Drop"],
      ["#chapter-drop .chapter-caption", "Straight from the supplier to the customer.<br />No warehouse, no inventory!"],
      ["#chapter-web .chapter-index", "Business Websites"],
      ["#chapter-web .chapter-word", "Breaking Through"],
      ["#chapter-web .chapter-caption", "A website that puts your business on the front line."],
      ["#chapter-landing .chapter-index", "Landing Pages"],
      ["#chapter-landing .chapter-word", "Direct Hit"],
      ["#chapter-landing .chapter-caption", "One page, one target."],
      ["#zone-target .km-word", "Client"],
      ["#zone-target .km-stamp", "Target acquired"],
      ["#chapter-ai .chapter-index", "AI Automation"],
      ["#chapter-ai .chapter-word", "The Squad That Never Sleeps"],
      ["#chapter-ai .chapter-caption", 'AI agents handling every enquiry, <span class="nobr">around the clock.</span>'],
      ["#chapter-apps .chapter-index", "App Development"],
      ["#chapter-apps .chapter-word", "Air Superiority"],
      ["#chapter-apps .chapter-caption", '<span class="nobr">When your app is in the air,</span> <span class="nobr">your competitors have no sky.</span>'],
      ["#zone-closing .closing-line", "Your mission <em>starts with one call.</em>"],

      // 01 · command and control
      ["#whoweare .section-index", "01 · Command &amp; Control"],
      ["#whoweare .h-mega", "One Unit. One Command."],
      ["#vendor-run .vr-list > li:nth-child(1) .vr-text", '<span class="vr-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M16 4 L8 12 L16 20" /></svg></span>A site vendor.'],
      ["#vendor-run .vr-list > li:nth-child(2) .vr-text", '<span class="vr-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M16 4 L8 12 L16 20" /></svg></span>An app vendor.'],
      ["#vendor-run .vr-list > li:nth-child(3) .vr-text", '<span class="vr-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M16 4 L8 12 L16 20" /></svg></span>A store vendor.'],
      ["#vendor-run .vr-list > li:nth-child(4) .vr-text", '<span class="vr-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M16 4 L8 12 L16 20" /></svg></span>An AI vendor.'],
      ["#whoweare .who-copy .body-dim", "Whoever controls the digital ground controls the market. We lead the entire sector: a website that attracts, landing pages that convert, an app that brings customers back, a store that sells and AI automation that works around the clock."],
      ["#whoweare .stat-row > div:nth-child(1) .stat-label", "Operational readiness"],
      ["#whoweare .stat-row > div:nth-child(2) .stat-label", "Special forces"],
      ["#whoweare .stat-row > div:nth-child(3) .stat-label", "Command"],

      // 02 · order of battle
      ["#whoweserve .section-index", "02 · Order of Battle"],
      ["#whoweserve .h-mega", "Your Forces in the Field."],
      ["#whoweserve .house-head-note", "No sector left open: presence, conversion, sales, retention and automation."],
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

      // 04 · operations file
      ["#operations .section-index", "04 · Operations File"],
      ["#operations .h-mega", "Completed Operations."],
      ["#operations .house-head-note", "Real projects, live in the field. Every file opens straight to the live site."],
      ["#operations .ops-list > .op-file .op-code", "Operation 01"],
      ["#operations .ops-list > .op-file .op-stamp", "Completed"],
      ["#operations .ops-list > .op-file .op-type", "Business Website"],
      ["#operations .ops-list > .op-file .op-client", "Moshe Stern, CPA"],
      ["#operations .ops-list > .op-file .op-desc", "A website for an accounting office that specialises in e-commerce: a live chart that draws the business's money, a 2026 tax calculator and credit-points calculator, and dark and light modes."],
      ["#operations .ops-list > .op-file .op-facts", "<li>10 pages in Hebrew</li><li>Tax and credit-points calculators</li><li>Fully adapted for phones</li>"],
      ["#operations .ops-list > .op-file .op-cta", "View the operation <span aria-hidden=\"true\">→</span>"],
      ["#operations .ops-grid .op-file:nth-child(1) .op-code", "Operation 02"],
      ["#operations .ops-grid .op-file:nth-child(1) .op-stamp", "Completed"],
      ["#operations .ops-grid .op-file:nth-child(1) .op-type", "Business Website"],
      ["#operations .ops-grid .op-file:nth-child(1) .op-client", "Ahuvit Mor, Boutique Cakes"],
      ["#operations .ops-grid .op-file:nth-child(1) .op-desc", "A website for a studio of handmade designer boutique cakes: a cake gallery, a three-step ordering process, a cake order form and direct contact on WhatsApp."],
      ["#operations .ops-grid .op-file:nth-child(1) .op-facts", "<li>A gallery of designer cakes</li><li>An order form and WhatsApp contact</li><li>Fully adapted for phones</li>"],
      ["#operations .ops-grid .op-file:nth-child(1) .op-cta", "View the operation <span aria-hidden=\"true\">→</span>"],
      ["#operations .ops-grid .op-file:nth-child(2) .op-code", "Operation 03"],
      ["#operations .ops-grid .op-file:nth-child(2) .op-stamp", "Completed"],
      ["#operations .ops-grid .op-file:nth-child(2) .op-type", "Business Website"],
      ["#operations .ops-grid .op-file:nth-child(2) .op-client", "Code92"],
      ["#operations .ops-grid .op-file:nth-child(2) .op-desc", "A website for an agency that builds sites, apps and AI automation: a short questionnaire that points every visitor to the right solution, and a full accessibility toolbar."],
      ["#operations .ops-grid .op-file:nth-child(2) .op-facts", "<li>An interactive matching questionnaire</li><li>An accessibility toolbar and statement</li><li>Fully adapted for phones</li>"],
      ["#operations .ops-grid .op-file:nth-child(2) .op-cta", "View the operation <span aria-hidden=\"true\">→</span>"],
      ["#operations .ops-grid .op-file:nth-child(3) .op-code", "Operation 04"],
      ["#operations .ops-grid .op-file:nth-child(3) .op-stamp", "Completed"],
      ["#operations .ops-grid .op-file:nth-child(3) .op-type", "Landing Page"],
      ["#operations .ops-grid .op-file:nth-child(3) .op-client", "Army Website, a Scroll Film"],
      ["#operations .ops-grid .op-file:nth-child(3) .op-desc", "A cinematic landing page: a seven-scene war film that plays as you scroll, with a headline landing on every scene."],
      ["#operations .ops-grid .op-file:nth-child(3) .op-facts", "<li>A seven-scene scroll film</li><li>A separate phone version</li><li>Fully in Hebrew</li>"],
      ["#operations .ops-grid .op-file:nth-child(3) .op-cta", "View the operation <span aria-hidden=\"true\">→</span>"],
      ["#operations .ops-grid .op-file:nth-child(4) .op-code", "Operation 05"],
      ["#operations .ops-grid .op-file:nth-child(4) .op-stamp", "Completed"],
      ["#operations .ops-grid .op-file:nth-child(4) .op-type", "Business Website"],
      ["#operations .ops-grid .op-file:nth-child(4) .op-client", "Elyotam Cohen, Portfolio"],
      ["#operations .ops-grid .op-file:nth-child(4) .op-desc", "A personal portfolio site in English: a bento-grid home page, a projects page linking to each one, and contact straight to WhatsApp."],
      ["#operations .ops-grid .op-file:nth-child(4) .op-facts", "<li>Four pages in English</li><li>A full projects page</li><li>Fully adapted for phones</li>"],
      ["#operations .ops-grid .op-file:nth-child(4) .op-cta", "View the operation <span aria-hidden=\"true\">→</span>"],

      // 05 · opening briefing
      ["#consultation .section-index", "05 · Opening Briefing"],
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
      ["#footer .footer-links a:nth-child(4)", "Operations File"],
      ["#footer .footer-links a:nth-child(5)", "Opening Briefing"],
      ["#footer .footer-links a:nth-child(6)", "HQ"],
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

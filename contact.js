/* ============================================================
   החמ״ל: the contact form
   Sends the brief to email through FormSubmit's AJAX endpoint, and can
   hand the same brief to WhatsApp instead. No build step, no library.

   FormSubmit needs one confirmation the first time: the first real
   submission sends an activation email to the inbox below, and nothing
   is delivered until that link is clicked. After activating, FormSubmit
   also offers a random alias for the address; swapping it in here keeps
   the plain address out of the page source.
   ============================================================ */

(() => {
  const t = window.t || ((key, hebrew) => hebrew);
  const ENDPOINT = "https://formsubmit.co/ajax/elyotam.finance@gmail.com";
  const WHATSAPP = "972522057074";

  const form = document.getElementById("brief-form");
  if (!form) return;
  const status = document.getElementById("form-status");
  const sendBtn = document.getElementById("send-btn");
  const waBtn = document.getElementById("wa-btn");
  const waDirect = document.getElementById("wa-direct");

  const field = (name) => form.elements.namedItem(name);
  const value = (name) => (field(name)?.value ?? "").trim();
  const services = () =>
    Array.from(form.querySelectorAll('input[name="services"]:checked')).map((i) => i.value);

  function show(kind, text) {
    status.className = `field-status is-shown is-${kind}`;
    status.textContent = text;
  }

  function clearInvalid() {
    form.querySelectorAll('[aria-invalid="true"]').forEach((el) => el.removeAttribute("aria-invalid"));
  }

  const servicesBox = document.getElementById("f-services");

  /** what is needed to call someone back: a name, a plausible phone, a valid
      email and a service. The business name and the message are optional. */
  function validate() {
    clearInvalid();
    const problems = [];
    if (value("name").length < 2) problems.push(["name", t("form.name", "חסר שם")]);
    const digits = value("phone").replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 13) problems.push(["phone", t("form.phone", "מספר טלפון לא תקין")]);
    const email = value("email");
    if (!email) problems.push(["email", t("form.emailMissing", "חסר מייל")]);
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problems.push(["email", t("form.emailInvalid", "כתובת מייל לא תקינה")]);
    if (!services().length) problems.push(["services", t("form.services", "לא נבחר תחום")]);

    problems.forEach(([name]) =>
      (name === "services" ? servicesBox : field(name))?.setAttribute("aria-invalid", "true")
    );
    if (problems.length) {
      show("error", problems.map(([, msg]) => msg).join(" · "));
      const first = problems[0][0];
      (first === "services" ? servicesBox?.querySelector("input") : field(first))?.focus();
      return false;
    }
    return true;
  }

  /* a field stops being flagged as soon as it is fixed */
  form.addEventListener("input", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.name === "services") servicesBox?.removeAttribute("aria-invalid");
    else target.removeAttribute("aria-invalid");
  });

  function briefText() {
    const lines = [
      t("wa.hello", "היי, הגעתי מהאתר ואשמח לשיחת היכרות."),
      `${t("wa.name", "שם")}: ${value("name")}`,
      `${t("wa.phone", "טלפון")}: ${value("phone")}`,
    ];
    if (value("email")) lines.push(`${t("wa.email", "מייל")}: ${value("email")}`);
    if (value("business")) lines.push(`${t("wa.business", "עסק")}: ${value("business")}`);
    if (services().length) lines.push(`${t("wa.services", "תחום")}: ${services().join(", ")}`);
    if (value("message")) lines.push("", value("message"));
    return lines.join("\n");
  }

  function openWhatsApp(text) {
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (value("_honey")) return; // a bot filled the hidden field
    if (!validate()) return;

    sendBtn.disabled = true;
    show("ok", t("form.sending", "משדרים לחמ״ל..."));

    const payload = {
      name: value("name"),
      phone: value("phone"),
      email: value("email"),
      business: value("business"),
      services: services().join(", "),
      message: value("message"),
      _subject: `${t("mail.subject", "פנייה חדשה מהאתר")}: ${value("name")}`,
      _template: "table",
      _captcha: "false",
    };

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      const message = String(data.message || "");
      /* FormSubmit answers the very first submission to an address with
         success "false" and an activation notice. That is not a failed
         transmission: the brief is held and delivered once the owner clicks
         the link in the activation email, so the visitor sees a normal
         confirmation and the notice goes to the console. */
      if (/activat/i.test(message)) {
        console.info("FormSubmit:", message);
        form.reset();
        show("ok", t("form.ok", "הפקודה התקבלה בחמ״ל. חוזרים בהקדם לתיאום שיחת היכרות."));
        return;
      }
      if (!res.ok || String(data.success) === "false") throw new Error(message || res.statusText);
      form.reset();
      show("ok", t("form.ok", "הפקודה התקבלה בחמ״ל. חוזרים בהקדם לתיאום שיחת היכרות."));
    } catch (err) {
      console.warn("brief form:", err);
      show("error", t("form.error", "השידור לא עבר. אפשר לשלוח את אותם פרטים בוואטסאפ, בכפתור שליד."));
    } finally {
      sendBtn.disabled = false;
    }
  });

  waBtn?.addEventListener("click", () => {
    if (!validate()) return;
    openWhatsApp(briefText());
    show("ok", t("form.waOpened", "וואטסאפ נפתח עם כל הפרטים. נשאר רק ללחוץ שליחה."));
  });

  if (waDirect) {
    waDirect.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(t("wa.hello", "היי, הגעתי מהאתר ואשמח לשיחת היכרות."))}`;
  }
})();

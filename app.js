(() => {
  const C = window.HOMMY;
  const $ = (selector) => document.querySelector(selector);

  const form = $("#order-form");
  const screens = [...document.querySelectorAll(".screen")];
  const SCREENS = screens.map((s) => s.dataset.screen);
  const STEPS = ["build", "blessing", "offer", "ship", "you"]; // the numbered part of the journey
  const doll = $("#doll");
  const dollFloat = $("#doll-float");
  const sealButton = $("#seal-button");
  const formError = $("#form-error");

  const isPreview = !C.orderEmail || C.orderEmail.endsWith("@example.com");
  const state = { face: null, stage: null, guardian: null, plan: null };
  let current = "intro";
  let orderId = null;
  let sending = false;

  const money = (n) => `CA$${n}`;
  const find = (list, id) => list.find((item) => item.id === id);
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const faceSrc = (id) => `images/face-${id}.png`;
  const faceLabel = (id) => `Baby face no. ${Number(id)}`;
  const screenEl = (name) => screens.find((s) => s.dataset.screen === name);
  const setSrc = (img, src) => {
    if (img.getAttribute("src") !== src) img.src = src;
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function radio(name, value) {
    const input = el("input");
    input.type = "radio";
    input.name = name;
    input.value = value;
    input.required = true;
    return input;
  }

  function faceImage(src) {
    const img = el("img");
    img.src = src;
    img.alt = "";
    img.width = 320;
    img.height = 400;
    return img;
  }

  // ---- Choices -------------------------------------------------------------

  function renderChoices() {
    $("#face-choices").append(
      ...C.faces.map((face) => {
        const label = el("label", "face-option");
        label.append(radio("face", face.id), faceImage(faceSrc(face.id)), el("span", "visually-hidden", faceLabel(face.id)));
        return label;
      })
    );

    const tile = (name, value, title, price, detail, badge) => {
      const label = el("label", "tile-option");
      label.append(radio(name, value));
      if (badge) label.append(el("span", "tile-badge", badge));
      const head = el("span", "tile-title");
      head.append(el("span", null, title), price);
      label.append(head, el("span", "tile-detail", detail));
      return label;
    };

    $("#stage-choices").append(
      // No prices here: the wish comes first, the offer screen shows what it costs.
      ...C.stages.map((stage) => tile("stage", stage.id, stage.label, "", stage.contents))
    );

    const offer = C.offerEnds ? `Card free, ${C.offerEnds.toLowerCase()}` : "Card free, limited time";
    $("#plan-choices").append(
      ...C.plans.map((plan) => tile("plan", plan.id, plan.short, el("span", "tile-price choice-aside"), plan.detail,
        plan.card ? offer : null))
    );

    $("#guardian-choices").append(
      ...C.guardians.map((g) => {
        const label = el("label", "swatch-option");
        label.style.setProperty("--choice-glow", g.glow);
        label.title = g.name;
        label.append(radio("guardian", g.id), el("span", "swatch"), el("span", "visually-hidden", label.title));
        return label;
      })
    );
  }

  // ---- The baby and everything that reflects the choices --------------------

  function selected() {
    return {
      face: find(C.faces, state.face),
      stage: find(C.stages, state.stage),
      guardian: find(C.guardians, state.guardian),
      plan: find(C.plans, state.plan),
    };
  }

  function update() {
    const { face, stage, guardian } = selected();

    doll.dataset.stage = stage?.id ?? "";
    doll.dataset.trim = face?.trim ?? "";
    doll.dataset.face = face ? "chosen" : "";
    doll.dataset.body = face?.body ?? "";
    doll.dataset.hands = face?.body === "pink" ? "on" : "";
    setSrc($("#doll-baby"), `images/body-${face?.body ?? "pink"}.jpg`);
    if (face) {
      setSrc($("#doll-face"), faceSrc(face.id));
      doll.style.setProperty("--chin", face.chin);
    }
    if (face?.body === "pink") setSrc($("#doll-hands"), `images/hands-${face.id}.png`);
    if (guardian) doll.style.setProperty("--piece", guardian.glow);
    else doll.style.removeProperty("--piece");

    // The blessing screen: its picture-book scene, name and words follow the chosen colour.
    screenEl("blessing").classList.toggle("has-blessing", Boolean(guardian));
    for (const scene of document.querySelectorAll(".scene")) {
      scene.classList.toggle("is-on", scene.dataset.scene === guardian?.id);
    }
    $("#blessing-name").textContent = guardian?.name ?? "";
    $("#blessing-words").textContent = guardian
      ? `“${guardian.blessing}”`
      : "Every colour carries a wish. Tap one to see it.";

    for (const aside of document.querySelectorAll("#plan-choices .choice-aside")) {
      aside.textContent = stage ? money(stage.price) : "";
    }

    renderGiftThumbs();

    const { plan } = selected();
    $("#includes-list").replaceChildren(...[
      stage?.contents,
      guardian ? `The ${guardian.name} blessing card` : "A blessing card",
      plan?.card ? "Your words, hand-written on a card" : null,
      "A note from the mother who made it",
      "Gift box, and shipping anywhere in Canada",
    ].filter(Boolean).map((text) => el("li", null, text)));
  }

  // The baby lives outside the screens and glides into each screen's slot. Before a face is chosen
  // it shows the illustration's own baby.
  function placeDoll({ animate = true } = {}) {
    const slot = screenEl(current).querySelector("[data-doll-slot]");
    if (!slot) {
      dollFloat.classList.remove("is-visible");
      return;
    }
    const r = slot.getBoundingClientRect();
    const size = Math.min(r.width, r.height);
    const wasHidden = !dollFloat.classList.contains("is-visible");
    dollFloat.classList.toggle("no-motion", !animate || wasHidden);
    dollFloat.style.left = `${r.left + (r.width - size) / 2}px`;
    dollFloat.style.top = `${r.top + (r.height - size) / 2}px`;
    dollFloat.style.width = `${size}px`;
    void dollFloat.offsetWidth; // apply a jump before fading in
    dollFloat.classList.remove("no-motion");
    dollFloat.classList.add("is-visible");
  }

  // ---- Validation ----------------------------------------------------------

  const GROUP_NAMES = { face: "a face", stage: "a stage", guardian: "a blessing", plan: "a gift" };

  function messageFor(control) {
    const v = control.validity;
    if (v.valueMissing) return "Fill this in to continue.";
    if (v.typeMismatch && control.type === "email") return "Enter an email address, like name@example.com.";
    if (v.patternMismatch && control.name === "postalCode") return "Enter a Canadian postal code, like V6B 1A1.";
    if (v.rangeUnderflow) return "Choose a date from today onward.";
    return control.validationMessage;
  }

  function clearError(field) {
    field.classList.remove("is-invalid");
    field.querySelector(":scope > .field-error")?.remove();
  }

  function validate(screen) {
    let firstInvalid = null;

    const groups = [...new Set([...screen.querySelectorAll("input[type=radio]")].map((r) => r.name))];
    const missing = groups.filter((name) => !form.querySelector(`input[name="${name}"]:checked`));
    const groupError = screen.querySelector("[data-error]");
    if (groupError) {
      const names = missing.map((n) => GROUP_NAMES[n]);
      const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0];
      groupError.hidden = missing.length === 0;
      groupError.textContent = missing.length ? `Choose ${list} to continue.` : "";
    }
    if (missing.length) firstInvalid = screen.querySelector(`input[name="${missing[0]}"]`);

    for (const control of screen.querySelectorAll(".field input, .field select")) {
      const field = control.closest(".field");
      clearError(field);
      if (control.checkValidity()) continue;
      field.classList.add("is-invalid");
      field.append(el("span", "field-error", messageFor(control)));
      firstInvalid ??= control;
    }

    firstInvalid?.focus();
    return !firstInvalid;
  }

  // ---- Screens -------------------------------------------------------------

  function show(name, { focus = true } = {}) {
    current = name;
    document.body.dataset.current = name;
    for (const screen of screens) {
      const active = screen.dataset.screen === name;
      screen.classList.toggle("is-active", active);
      screen.inert = !active;
    }

    $("#back-button").hidden = name === "intro" || name === "done";
    const step = STEPS.indexOf(name);
    $("#bar-progress").textContent = step >= 0 ? `Step ${step + 1} of ${STEPS.length}` : "";

    if (name === "you") renderSummary();
    if (name === "build") preloadScenes();
    toggleThanks(name === "done");
    screenEl(name).scrollTop = 0;
    placeDoll();
    if (focus) screenEl(name).querySelector("h1, h2")?.focus({ preventScroll: true });
  }

  // ---- Real Hommy gifts, shown like Instagram stories -----------------------------------------

  const STORY_MS = 4500;
  let stories = [];
  let storyIndex = 0;
  let storyTimer = null;

  // Photos of the chosen stage come first.
  function giftsInOrder() {
    const stage = state.stage;
    return [...C.gifts].sort((a, b) => (b.stage === stage) - (a.stage === stage));
  }

  function renderGiftThumbs() {
    $("#gifts-thumbs").replaceChildren(...giftsInOrder().slice(0, 3).map((g) => {
      const img = el("img");
      img.src = g.src;
      img.alt = "";
      return img;
    }));
  }

  function showStory(index) {
    clearTimeout(storyTimer);
    if (index < 0) index = 0;
    if (index >= stories.length) {
      $("#stories").close();
      return;
    }
    storyIndex = index;
    const gift = stories[index];
    const isCape = gift.stage === "kindergarten";
    const photo = $("#stories-photo");
    photo.src = gift.src;
    photo.alt = isCape ? "A Hommy cape made for a little one" : "A Hommy bib and headband set made for a newborn";
    $("#stories-caption").textContent = isCape
      ? "A kindergarten cape, made once and sent with love"
      : "A newborn set, made once and sent with love";
    [...$("#stories-bars").children].forEach((bar, i) => {
      bar.classList.toggle("is-done", i < index);
      bar.classList.remove("is-current");
      if (i === index) {
        void bar.offsetWidth; // restart the fill animation
        bar.classList.add("is-current");
      }
    });
    storyTimer = setTimeout(() => showStory(storyIndex + 1), STORY_MS);
  }

  function openStories() {
    stories = giftsInOrder();
    $("#stories-bars").replaceChildren(...stories.map(() => {
      const bar = el("span", "stories-bar");
      bar.style.setProperty("--story-ms", `${STORY_MS}ms`);
      bar.append(el("span"));
      return bar;
    }));
    $("#stories").showModal();
    showStory(0);
  }

  // Fetch the painted scenes while the visitor picks a face, so the blessing screen opens painted.
  let scenesLoaded = false;
  function preloadScenes() {
    if (scenesLoaded) return;
    scenesLoaded = true;
    for (const g of C.guardians) new Image().src = `images/scene-${g.id}.jpg`;
  }

  // On the thank-you screen the card floats up a moment after "received", then steps aside for payment.
  let thanksTimer = null;
  function toggleThanks(on) {
    clearTimeout(thanksTimer);
    setThanks(false);
    if (on) thanksTimer = setTimeout(() => setThanks(true), 2400);
  }

  // The floating baby sits above every screen, so it steps back while the card is up.
  function setThanks(shown) {
    $("#thanks").classList.toggle("is-shown", shown);
    dollFloat.classList.toggle("is-behind", shown);
  }

  function go(name) {
    history.pushState({ screen: name }, "", `#${name}`);
    show(name);
  }

  function next() {
    if (!validate(screenEl(current))) return;
    go(SCREENS[SCREENS.indexOf(current) + 1]);
  }

  // ---- Order ---------------------------------------------------------------

  function makeOrderId() {
    const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    const bytes = crypto.getRandomValues(new Uint8Array(4));
    const now = new Date();
    const date = `${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    return `HB-${date}-${[...bytes].map((b) => alphabet[b % alphabet.length]).join("")}`;
  }

  function readOrder() {
    const data = Object.fromEntries(new FormData(form));
    const { face, stage, guardian, plan } = selected();
    const address = [data.address1, data.address2, `${data.city}, ${data.province} ${data.postalCode}`]
      .filter(Boolean)
      .join("\n");

    return {
      id: orderId,
      total: money(stage.price),
      data,
      plan,
      rows: [
        ["Looks like", faceLabel(face.id)],
        ["Set", `${stage.label}: ${stage.contents}`],
        ["Blessing", guardian.name],
        ["Gift", plan.label],
        ["Send to", `${data.recipientName}\n${address}`],
        ["Arrives by", data.arriveBy],
      ].filter(([, value]) => value),
    };
  }

  function renderSummary() {
    const order = readOrder();
    $("#summary").replaceChildren(
      ...order.rows.slice(1).map(([term, value]) => {
        const row = el("div");
        row.append(el("dt", null, term), el("dd", null, value));
        return row;
      })
    );
    $("#summary-total").textContent = order.total;
  }

  function paymentSteps(order) {
    return (
      `To finish, send an Interac e-Transfer of ${order.total} to ${C.etransferEmail} ` +
      `with the message ${order.id} within ${C.paymentWindowHours} hours.`
    );
  }

  function summaryText(order) {
    const { data } = order;
    return [
      `Order ${order.id}`,
      `Total ${order.total}`,
      ...order.rows.map(([k, v]) => `${k}: ${v}`),
      `From: ${[data.buyerName, data.email, data.phone].filter(Boolean).join(", ")}`,
    ].join("\n");
  }

  async function sendOrder(order) {
    const { data } = order;
    const cardNote = order.plan.card
      ? " We'll also email you shortly to confirm the words for your hand-written card."
      : "";
    const payload = {
      _subject: `${C.testMode ? "[TEST] " : ""}New blessing ${order.id}`,
      _template: "table",
      _honey: data._honey,
      _autoresponse:
        (C.testMode ? "This was a test order. Please don't send any money. " : "") +
        `Thank you for your blessing. Your order number is ${order.id}. ${paymentSteps(order)}` +
        `${cardNote} Your gift ships within about ${C.shipsWithinDays} days of your order.`,
      Order: order.id,
      Total: order.total,
      ...Object.fromEntries(order.rows),
      "Fabric colour": selected().guardian.colour,
      "Card message": order.plan.card ? "Confirm the words with the buyer by email" : "No hand-written card",
      "Buyer name": data.buyerName,
      email: data.email,
      Phone: data.phone || "",
    };

    const res = await fetch(`https://formsubmit.co/ajax/${C.orderEmail}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || String(body.success) !== "true") {
      throw new Error(body.message || `Order service answered ${res.status}`);
    }
  }

  function fillDone(order) {
    $("#done-email").textContent = order.data.email;
    $("#done-days").textContent = C.shipsWithinDays;
    $("#done-order").textContent = order.id;
    $("#pay-amount").textContent = order.total;
    $("#pay-email").textContent = C.etransferEmail;
    $("#pay-memo").textContent = order.id;
    $("#pay-window").textContent = `${C.paymentWindowHours} hours`;
  }

  function showSendFailure(order) {
    const mail = `mailto:${C.orderEmail}?subject=${encodeURIComponent(`Blessing order ${order.id}`)}` +
      `&body=${encodeURIComponent(summaryText(order))}`;
    const link = el("a", null, "email your order to us");
    link.href = mail;
    formError.replaceChildren(
      "Your order didn't reach us. Check your connection and press Send my blessing again, or ",
      link,
      "."
    );
    formError.hidden = false;
  }

  async function seal() {
    if (sending || !validate(screenEl("you"))) return;
    sending = true;
    orderId ??= makeOrderId();
    const order = readOrder();
    formError.hidden = true;
    sealButton.disabled = true;
    sealButton.textContent = "Sending…";
    dollFloat.classList.add("is-sealing");

    try {
      await Promise.all([isPreview ? Promise.resolve() : sendOrder(order), wait(1100)]);
      fillDone(order);
      // The order is in; replace this history entry so Back can't land on the sent form.
      history.replaceState({ screen: "done" }, "", "#done");
      show("done");
    } catch (err) {
      console.error(err);
      showSendFailure(order);
    } finally {
      sending = false;
      sealButton.disabled = false;
      sealButton.textContent = "Send my blessing";
      dollFloat.classList.remove("is-sealing");
    }
  }

  function startOver() {
    form.reset();
    Object.keys(state).forEach((key) => (state[key] = null));
    orderId = null;
    form.querySelectorAll(".is-invalid").forEach(clearError);
    form.querySelectorAll("[data-error]").forEach((e) => (e.hidden = true));
    update();
    go("build");
  }

  // ---- Wiring --------------------------------------------------------------

  function init() {
    renderChoices();
    // Browsers can restore checked radios on reload without firing change events; start from what's checked.
    for (const input of form.querySelectorAll("input[type=radio]:checked")) state[input.name] = input.value;

    const today = new Date();
    $("#arrive-by").min = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

    const shipping = `We ship within about ${C.shipsWithinDays} days of your order. ${C.deliveryNote}`;
    $("#delivery-hint").textContent = shipping;
    $("#promise-shipping").textContent = shipping;
    $("#contact-link").href = `mailto:${C.orderEmail}`;
    $("#contact-text").textContent = C.orderEmail;
    $("#preview-banner").hidden = !isPreview;
    if (C.testMode) $("#pay-title").textContent = "Test order: no payment needed";

    form.addEventListener("change", (e) => {
      const { name, value } = e.target;
      if (!(name in state)) return;
      state[name] = value;
      update();
      placeDoll();
      const groupError = screenEl(current).querySelector("[data-error]");
      if (groupError && !groupError.hidden) validate(screenEl(current));
    });

    form.addEventListener("input", (e) => {
      const field = e.target.closest(".field");
      if (field?.classList.contains("is-invalid") && e.target.checkValidity()) clearError(field);
    });

    form.postalCode.addEventListener("blur", (e) => {
      const raw = e.target.value.replace(/[\s-]/g, "").toUpperCase();
      e.target.value = raw.length === 6 ? `${raw.slice(0, 3)} ${raw.slice(3)}` : raw;
    });

    for (const button of document.querySelectorAll("[data-go]")) {
      button.addEventListener("click", () => go(button.dataset.go));
    }
    for (const button of document.querySelectorAll("[data-next]")) button.addEventListener("click", next);
    $("#back-button").addEventListener("click", () => history.back());
    $("#again-button").addEventListener("click", startOver);
    $("#thanks-close").addEventListener("click", () => setThanks(false));

    const storiesDialog = $("#stories");
    $("#stories-open").addEventListener("click", openStories);
    $("#stories-close").addEventListener("click", () => storiesDialog.close());
    $("#stories-prev").addEventListener("click", () => showStory(storyIndex - 1));
    $("#stories-next").addEventListener("click", () => showStory(storyIndex + 1));
    storiesDialog.addEventListener("close", () => clearTimeout(storyTimer));
    let swipeX = null;
    storiesDialog.addEventListener("pointerdown", (e) => (swipeX = e.clientX));
    storiesDialog.addEventListener("pointerup", (e) => {
      if (swipeX == null) return;
      const dx = e.clientX - swipeX;
      swipeX = null;
      if (Math.abs(dx) > 40) showStory(storyIndex + (dx < 0 ? 1 : -1));
    });
    $("#thanks").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) setThanks(false);
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (current === "you") seal();
      else next();
    });

    const help = $("#help");
    $("#help-button").addEventListener("click", () => help.showModal());
    $("#help-close").addEventListener("click", () => help.close());
    help.addEventListener("click", (e) => {
      if (e.target === help) help.close(); // a click on the backdrop
    });

    for (const button of document.querySelectorAll(".copy")) {
      button.addEventListener("click", async () => {
        const target = document.getElementById(button.dataset.copy);
        const label = button.querySelector(".copy-label");
        try {
          await navigator.clipboard.writeText(target.textContent);
          label.textContent = "Copied";
        } catch {
          getSelection().selectAllChildren(target);
          label.textContent = "Selected";
        }
        setTimeout(() => (label.textContent = "Copy"), 2000);
      });
    }

    window.addEventListener("popstate", (e) => {
      const name = e.state?.screen;
      // After an order is sent, stay on the thank-you screen instead of stepping back into the form.
      if (current === "done" && name !== "done") {
        history.pushState({ screen: "done" }, "", "#done");
        return;
      }
      show(SCREENS.includes(name) ? name : "intro");
    });
    window.addEventListener("resize", () => placeDoll({ animate: false }));
    // On very short screens a screen may scroll; keep the baby on its slot.
    for (const screen of screens) {
      screen.addEventListener("scroll", () => {
        if (screen.dataset.screen === current) placeDoll({ animate: false });
      }, { passive: true });
    }

    history.replaceState({ screen: "intro" }, "", location.pathname);
    update();
    show("intro", { focus: false });
  }

  init();
})();

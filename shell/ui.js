// Small pieces every webpage page shares (.scratch/html-menus/): making
// elements, the loading sign for parts that wait for the game or the server,
// times in the player's time zone, "Are you sure?", the Report flag and the
// − / + fold buttons, as the game's own (ReportButton, FoldButton).

// An element: h("div", {class: "x", text: "hi", onclick: fn, title: "…"}, child, …).
// Children may be strings, elements, arrays or null (skipped).
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key === "class") el.className = value;
    else if (key === "text") el.textContent = value;
    else if (key === "dataset") Object.assign(el.dataset, value);
    else if (key.startsWith("on") && typeof value === "function") el.addEventListener(key.slice(2), value);
    else if (key in el && typeof value !== "string") el[key] = value;
    else el.setAttribute(key, value === true ? "" : String(value));
  }
  add(el, children);
  return el;
}

function add(el, children) {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (Array.isArray(child)) add(el, child);
    else el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

// Empty `el` and fill it with `children`.
export function fill(el, ...children) {
  el.replaceChildren();
  add(el, children);
  return el;
}

// The loading sign: a turning wheel and what's being waited for.
export function loading(text = "Loading…") {
  return h("span", { class: "loading", role: "status" }, h("i", { class: "spin", "aria-hidden": "true" }), h("span", { text }));
}

// A greyed line for an empty list or a note ("Nothing here yet.").
export function note(text) {
  return h("p", { class: "muted note-line", text });
}

// Settings > Time zone (minutes from UTC), from the game's bar state; null:
// the browser's own.
let zone = null;
export function setTimeZone(minutes) {
  zone = typeof minutes === "number" && Number.isFinite(minutes) ? minutes : null;
}

// "2026-11-19 14:05" for a moment in milliseconds, as GameSettings.local_time().
export function localTime(ms) {
  const offset = zone === null ? -new Date(ms).getTimezoneOffset() : zone;
  const d = new Date(Number(ms) + offset * 60000);
  const two = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${two(d.getUTCMonth() + 1)}-${two(d.getUTCDate())} ${two(d.getUTCHours())}:${two(d.getUTCMinutes())}`;
}

// A pop-up window over the page: resolves with what `build(close)` closes it with.
export function popup(title, build) {
  return new Promise((resolve) => {
    const back = h("div", { class: "pop-back" });
    const box = h("div", { class: "pop box", role: "dialog", "aria-modal": "true", "aria-label": title });
    const close = (value) => {
      back.remove();
      document.removeEventListener("keydown", onKey, true);
      resolve(value);
    };
    const onKey = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); close(undefined); }
    };
    box.append(h("h3", { text: title }), build(close));
    back.append(box);
    back.addEventListener("click", (e) => { if (e.target === back) close(undefined); });
    document.addEventListener("keydown", onKey, true);
    document.body.append(back);
    const first = box.querySelector("input, textarea, button.yes");
    if (first) first.focus();
  });
}

// "Are you sure?" with `question`: resolves true for Yes.
export function confirmBox(question) {
  return popup("Are you sure?", (close) => h("div", { class: "pop-body" },
    h("p", { text: question }),
    h("div", { class: "pop-buttons" },
      h("button", { class: "wbtn yes", type: "button", text: "Yes", onclick: () => close(true) }),
      h("button", { class: "wbtn", type: "button", text: "Cancel", onclick: () => close(false) })))).then(Boolean);
}

// The Report flag (ReportButton): asks why, then `send(reason)` resolves with
// "" (sent) or why not; `done(why)` hears it.
export function reportFlag(about, send, done) {
  const flag = h("button", { class: "flag", type: "button", title: `Report ${about} to the staff`, "aria-label": `Report ${about}` },
    flagIcon());
  flag.addEventListener("click", async () => {
    const reason = await popup("Report", (close) => {
      const input = h("input", { type: "text", maxlength: "500", placeholder: "What's wrong? (only the staff see this)" });
      const sendButton = h("button", { class: "wbtn yes", type: "button", text: "Send report", disabled: true,
        onclick: () => close(input.value.trim()) });
      input.addEventListener("input", () => { sendButton.disabled = input.value.trim() === ""; });
      input.addEventListener("keydown", (e) => { if (e.key === "Enter" && input.value.trim()) close(input.value.trim()); });
      return h("div", { class: "pop-body" }, h("p", { text: `Report ${about} to the staff?` }), input,
        h("div", { class: "pop-buttons" }, sendButton, h("button", { class: "wbtn", type: "button", text: "Cancel", onclick: () => close(undefined) })));
    });
    if (!reason) return;
    done(await send(reason));
  });
  return flag;
}

// UiArt.flag_icon(): a small pixel flag on a pole.
function flagIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 10 12");
  svg.setAttribute("shape-rendering", "crispEdges");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = '<rect x="1" y="1" width="1" height="11"/><rect x="2" y="1" width="6" height="1"/><rect x="2" y="2" width="7" height="3"/><rect x="2" y="5" width="5" height="1"/>';
  return svg;
}

// A − / + button folding `target` away (FoldButton), remembered in this browser
// under `key` (the game keeps its own in Settings' "folded").
const FOLDS = "ck.folds";
function folds() {
  try { return JSON.parse(localStorage.getItem(FOLDS) || "{}") || {}; } catch { return {}; }
}
export function foldButton(key, target) {
  const button = h("button", { class: "fold", type: "button" });
  const show = (folded) => {
    target.hidden = folded;
    button.textContent = folded ? "+" : "−";
    button.title = folded ? "Show this row" : "Fold this row away";
    button.setAttribute("aria-expanded", String(!folded));
  };
  show(!!folds()[key]);
  button.addEventListener("click", () => {
    const all = folds();
    const folded = !all[key];
    if (folded) all[key] = true;
    else delete all[key];
    try { localStorage.setItem(FOLDS, JSON.stringify(all)); } catch { /* fine */ }
    show(folded);
  });
  return button;
}

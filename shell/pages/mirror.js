// Play (and the lobby) and Admin as webpages (.scratch/html-menus/): the game
// runs hosting, joining, Find a Game, the server list, Play Local, the lobby
// and Admin, so the page draws the game's own Play page and lobby as HTML from
// its description (game/web_mirror.gd, game/web_play.gd) and sends back what
// the player does, which the game applies to its own controls. While the game
// is still loading, the page shows what it showed last time (kept in this
// browser) with its controls asleep, and a line saying they wake once the game
// has loaded; the very first time, a loading sign (Zac's answer: lobby, no
// wait screen, only the parts that need the game load in).

import { game } from "../game.js";
import { h, fill, loading, note } from "../ui.js";

const KEPT = "ck.mirror.";
const kept = {
  get(view) { try { return JSON.parse(localStorage.getItem(KEPT + view) || "null"); } catch { return null; } },
  set(view, d) { try { localStorage.setItem(KEPT + view, JSON.stringify(d)); } catch { /* fine */ } },
};

// Admin's tabs that stay in the game (Zac's answer: admin_dev_tabs). Scenarios
// are made in the Map Maker now (.scratch/story-scenes-explore/).
export const GAME_TABS = ["CPU Training"];

// Draw the description `d` ({tree, overlays}) into `into`; `act(id, ev,
// value)` sends what the player does (null: asleep, while the game loads).
export function draw(into, d, act, { gameTab } = {}) {
  const focused = document.activeElement && into.contains(document.activeElement) ? document.activeElement.dataset.id : "";
  const caret = focused && "selectionStart" in document.activeElement ? document.activeElement.selectionStart : null;
  // What's being typed stays as typed: the game may not have heard it yet.
  const typing = focused && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName) && document.activeElement.type !== "checkbox"
    ? document.activeElement.value : null;
  fill(into, d.tree ? node(d.tree) : null);
  for (const o of d.overlays || []) into.append(h("div", { class: "m-overlay" }, h("div", { class: "m-dialog box" }, node(o))));
  if (focused) {
    const again = into.querySelector(`[data-id="${focused}"]`);
    if (again) {
      if (typing !== null && "value" in again) again.value = typing;
      again.focus();
      if (caret !== null && again.setSelectionRange) try { again.setSelectionRange(caret, caret); } catch { /* fine */ }
    }
  }

  function send(id, ev, value) {
    if (act) act(id, ev, value);
  }

  function node(n) {
    const id = String(n.id);
    const common = { "data-id": id, title: n.tip || undefined };
    const asleep = !act;
    switch (n.t) {
      case "col": case "row": case "flow": case "box": case "panel":
        return h("div", { ...common, class: `m-${n.t}${n.t === "panel" ? " box" : ""}` }, (n.kids || []).map(node));
      case "grid":
        return h("div", { ...common, class: "m-grid", style: `--cols:${Math.max(1, Number(n.cols) || 1)}` }, (n.kids || []).map(node));
      case "sep":
        return h("hr", { class: "m-sep" });
      case "label":
        return h("span", { ...common, class: `m-label${n.muted ? " muted" : ""}`, text: n.text,
          style: [n.size ? `font-size:${Math.min(Number(n.size), 40)}px` : "", n.color ? `color:${n.color}` : ""].join(";") || undefined });
      case "rich":
        return h("p", { ...common, class: "m-rich", text: n.text });
      case "img":
        return h("img", { ...common, class: "px m-img", src: n.src, alt: "", width: n.w || undefined, height: n.h || undefined });
      case "check": {
        const box = h("input", { type: "checkbox", checked: !!n.on, disabled: asleep || !!n.off, "data-id": id });
        box.addEventListener("change", () => send(n.id, "toggle", box.checked));
        return h("label", { class: "check m-check", title: n.tip || undefined }, box, ` ${n.text}`);
      }
      case "select": {
        const select = h("select", { ...common, disabled: asleep || !!n.off, "aria-label": n.tip || "Choose" },
          n.items.map((it, i) => h("option", { value: String(i), text: it.sep ? "──────" : it.text, disabled: !!it.off || !!it.sep,
            title: it.tip || undefined, selected: i === n.selected })));
        select.addEventListener("change", () => send(n.id, "pick", Number(select.value)));
        return select;
      }
      case "menu": {
        const select = h("select", { ...common, class: "m-menu", disabled: asleep || !!n.off, "aria-label": n.text || n.tip || "More" },
          h("option", { value: "", text: n.text || "…" }), n.items.map((it) => h("option", { value: String(it.id), text: it.text, disabled: !!it.off })));
        select.addEventListener("change", () => { if (select.value !== "") send(n.id, "pick", Number(select.value)); select.value = ""; });
        return select;
      }
      case "link":
        return h("button", { ...common, class: "m-link", type: "button", text: n.text, disabled: asleep || !!n.off, onclick: () => send(n.id, "press") });
      case "button": {
        const b = h("button", { ...common, class: `wbtn m-button${n.toggle && n.on ? " on" : ""}`, type: "button", disabled: asleep || !!n.off,
          "aria-pressed": n.toggle ? String(!!n.on) : undefined },
        n.icon ? h("img", { class: "px", src: n.icon, alt: "", height: 20 }) : null, n.text || null);
        if (!n.text && n.tip) b.setAttribute("aria-label", n.tip);
        b.addEventListener("click", () => send(n.id, n.toggle ? "toggle" : "press", n.toggle ? !n.on : undefined));
        return b;
      }
      case "number": {
        const input = h("input", { ...common, type: "number", value: String(n.value), min: String(n.min), max: String(n.max), step: String(n.step || 1),
          disabled: asleep || !!n.off, class: "m-number" });
        input.addEventListener("change", () => send(n.id, "set", Number(input.value)));
        return h("span", { class: "m-number-row" }, input, n.suffix ? h("span", { class: "muted", text: ` ${n.suffix}` }) : null);
      }
      case "input": {
        const input = h("input", { ...common, type: n.secret ? "password" : "text", value: n.text, placeholder: n.placeholder || "",
          disabled: asleep || !!n.off, maxlength: n.max > 0 ? String(n.max) : undefined });
        let timer = 0;
        const flush = () => { clearTimeout(timer); timer = 0; send(n.id, "text", input.value); };
        input.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(flush, 300); });
        input.addEventListener("keydown", (e) => { if (e.key === "Enter") { flush(); send(n.id, "submit"); } });
        input.addEventListener("blur", () => { if (timer && input.isConnected) flush(); });
        return input;
      }
      case "textarea": {
        const area = h("textarea", { ...common, placeholder: n.placeholder || "", disabled: asleep || !!n.off });
        area.value = n.text;
        let timer = 0;
        area.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => send(n.id, "text", area.value), 300); });
        return area;
      }
      case "card":
        return h("button", { ...common, class: `card m-card${n.picked ? " picked" : ""}`, type: "button", disabled: asleep, onclick: () => send(n.id, "press") },
          h("span", { class: "pic" }, n.src ? h("img", { class: "px", src: n.src, alt: "" }) : null),
          h("span", { class: "name", text: n.name }), h("span", { class: "line muted", text: n.line }),
          n.votes ? h("span", { class: "votes", text: n.votes }) : null);
      case "tabs":
        return h("div", { ...common, class: "m-tabs" },
          h("div", { class: "tab-buttons", role: "tablist" }, n.titles.map((t) => h("button", {
            class: `wbtn tab-btn${t.i === n.current ? " on" : ""}`, type: "button", role: "tab", "aria-selected": String(t.i === n.current),
            text: t.title, disabled: asleep, onclick: () => (gameTab && GAME_TABS.includes(t.title) ? gameTab(t.title) : send(n.id, "tab", t.i)) }))),
          h("div", { class: "m-tab-body" }, (n.kids || []).map(node)));
      case "dialog":
        return h("div", { class: "m-dialog-body" }, n.title ? h("h3", { text: n.title }) : null, n.text ? h("p", { class: "pre", text: n.text }) : null,
          (n.kids || []).map(node),
          h("div", { class: "pop-buttons" },
            n.ok ? h("button", { class: "wbtn yes", type: "button", text: n.ok, disabled: asleep, onclick: () => send(n.id, "ok") }) : null,
            n.cancel ? h("button", { class: "wbtn", type: "button", text: n.cancel, disabled: asleep, onclick: () => send(n.id, "cancel") }) : null));
      default:
        return null;
    }
  }
}

// A page drawn from the game: `view` "play" or "admin". `app`: inGame, say.
export function mirrorPage(app, view, { title }) {
  const status = h("p", { class: "status", role: "status" });
  const asleepNote = h("p", { class: "muted mirror-note", hidden: true }, loading(`${title} wakes up as soon as the game has loaded…`));
  const body = h("div", { class: "mirror" });
  const el = h("div", { class: `pad mirror-page mirror-${view}` }, asleepNote, body, status);
  let shown = false, asks = 0;

  async function load() {
    if (!shown) return;
    const asked = ++asks;
    const d = await game.ask("mirror.get", { view });
    if (asked !== asks || !shown) return;
    if (d.error) { fill(body, note(d.error)); return; }
    asleepNote.hidden = true;
    kept.set(view, { tree: d.tree, overlays: [] });
    render(d);
  }

  function render(d) {
    draw(body, d, act, view === "admin" ? { gameTab } : {});
  }

  async function act(id, ev, value) {
    status.textContent = "";
    const d = await game.ask("mirror.act", { view, id, ev, value });
    if (d.gone || !shown) return; // a match, the Map Maker or a replay opened: the game shows (ckShell.game)
    if (d.why) status.textContent = d.why;
    if (!d.error) render(d);
  }

  function gameTab(tab) {
    app.inGame("Admin", () => game.ask("admin.open_tab", { tab })).then((r) => { if (r && r.error) status.textContent = r.error; });
  }

  game.onChanged("mirror", () => { if (shown) load(); });

  return {
    el,
    show() {
      shown = true;
      if (game.isReady()) {
        game.ask("mirror.watch", { view });
        load();
        return;
      }
      // Asleep until the game has loaded: what it showed last time, or a loading sign.
      const last = kept.get(view);
      asleepNote.hidden = false;
      if (last && last.tree) draw(body, last, null);
      else fill(body, loading(`${title} loads in with the game…`));
      game.onReady(() => { if (shown) { game.ask("mirror.watch", { view }); load(); } });
    },
    hide() {
      if (!shown) return;
      shown = false;
      if (game.isReady()) game.ask("mirror.watch", { view: "" });
    },
    address: () => "",
  };
}

// "You're in a lobby": a strip on the other pages to get back to it (MainMenu's lobby strip).
export function lobbyStrip(goPlay) {
  const el = h("div", { class: "lobby-strip", hidden: true }, h("span", { text: "You're in a lobby." }),
    h("button", { class: "wbtn tiny", type: "button", text: "Back to the lobby", onclick: goPlay }));
  let inLobby = false;
  async function check() {
    const r = await game.ask("play.state");
    const was = inLobby;
    inLobby = !!r.in_lobby;
    // Into a lobby (your party's leader joined one, say): there, as the game does.
    if (inLobby && !was) goPlay();
    el.dataset.inLobby = String(inLobby);
    sync();
  }
  function sync() { el.hidden = !inLobby || document.body.dataset.page === "play"; }
  game.onChanged("lobby", check);
  game.onReady(check);
  return { el, sync };
}

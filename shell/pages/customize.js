// The Customize page as a webpage (/customize, .scratch/shop-gems-challenges/),
// as the game's CustomizePage (game/customize_page.gd), from the profile
// page's Customize button: your Piece style and Tileset (Classic for now),
// your Victory effect, and your Piece colours in order of preference. The
// picks live in the game (Customize), so they come in once it has loaded,
// behind a loading sign (customize.get), with the cards' pictures, drawn by
// the game as on Windows (shop.pictures); every change goes to the game.
// Colours: drag a row's ≡ (mouse or finger) or use its arrows; × takes a
// colour off the list (never picked for you). Every colour has a card too,
// saying its place; pressing one makes it your first choice.

import { game } from "../game.js";
import { h, fill, loading, note } from "../ui.js";
import { card } from "../library.js";
import { KIND_NAMES, ofKind, item, itemPicture, gamePictures, gems } from "../shop_items.js";

const ABOUT = {
  pieces: "How your Pieces look, to everyone. More styles are coming.",
  tiles: "How the board looks, to you. More Tilesets are coming.",
  effect: "What plays over the screen when you win, for everyone.",
};

export function customizePage(app) {
  let data = null;
  const status = h("p", { class: "status", role: "status" });
  const balance = h("span", { class: "balance" });
  const rows = {};
  for (const kind of ["pieces", "tiles", "effect", "color"]) rows[kind] = h("div", { class: "cards wrap", dataset: { kind } });
  const list = h("ol", { class: "color-list", "aria-label": "Your colours, first choice first" });
  const el = h("div", { class: "pad customize-page" },
    h("div", { class: "head" },
      h("button", { class: "wbtn", type: "button", text: "← Profile", onclick: () => app.go("profile") }),
      h("h1", { text: "Customize" }), balance,
      h("button", { class: "wbtn", type: "button", text: "Shop", onclick: () => app.go("shop") })),
    status,
    ["pieces", "tiles", "effect"].map((kind) => [h("h2", { text: KIND_NAMES[kind] }), h("p", { class: "muted", text: ABOUT[kind] }), rows[kind]]),
    h("h2", { text: "Piece colours" }),
    h("p", { class: "muted", text: "Your colour when you join a lobby, Find a Game, or play Player 1 in Play Local: the first one on your list that nobody has. Drag ≡ to reorder. A colour you take off the list is never picked for you; if none of yours is free you get a random free one." }),
    list, rows.color);

  function draw() {
    if (!data) return;
    fill(balance, data.signed_in ? gems(data.gems) : null);
    const states = Object.fromEntries((data.items || []).map((i) => [i.id, i.state]));
    const colors = data.colors || [];
    for (const kind of Object.keys(rows)) {
      fill(rows[kind], ofKind(kind).map((it) => {
        let state = states[it.id] || "locked";
        let line = state === "selected" ? "✓ Selected" : state === "owned" ? "Owned" : "";
        if (kind === "color" && state !== "locked") {
          const place = colors.findIndex((x) => x.id === it.id);
          state = place === 0 ? "selected" : "owned";
          line = place === 0 ? "✓ First choice" : place > 0 ? `Choice ${place + 1}` : "Not on your list";
        }
        const c = card({ name: it.name, art: itemPicture(it.id), line,
          open: () => pick(it.id, state) });
        c.dataset.item = it.id;
        c.classList.toggle("selected", state === "selected");
        c.classList.toggle("locked", state === "locked");
        if (state === "locked") c.querySelector(".line").replaceWith(h("span", { class: "line price" }, gems(it.price)));
        return c;
      }));
    }
    fill(list, colors.map((c, i) => colorRow(c, i, colors.length)));
  }

  function colorRow(c, i, count) {
    const grip = h("span", { class: "grip", title: "Drag to reorder", "aria-hidden": "true", text: "≡" });
    const row = h("li", { class: "color-row box", dataset: { color: c.index } }, grip,
      h("span", { class: "place", text: `${i + 1}.` }), itemPicture(c.id, { row: true }), h("span", { class: "cname", text: c.name }),
      h("button", { class: "wbtn tiny", type: "button", text: "▲", "aria-label": `${c.name} higher`, disabled: i === 0, onclick: () => move(i, i - 1) }),
      h("button", { class: "wbtn tiny", type: "button", text: "▼", "aria-label": `${c.name} lower`, disabled: i === count - 1, onclick: () => move(i, i + 1) }),
      h("button", { class: "wbtn tiny", type: "button", text: "×", "aria-label": `Take ${c.name} off your list`, disabled: count <= 1,
        onclick: () => setOrder(data.colors.filter((x) => x.index !== c.index).map((x) => x.index)) }));
    grip.addEventListener("pointerdown", (e) => startDrag(e, row));
    return row;
  }

  // Dragging a row by its grip, with a mouse or a finger: it follows the
  // pointer along the list and lands where it's let go. The other rows move
  // round it: a row moved in the page itself would lose the pointer.
  function startDrag(e, row) {
    e.preventDefault();
    const from = [...list.children].indexOf(row);
    row.classList.add("dragging");
    const follow = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      const middle = (r) => r.getBoundingClientRect().top + r.offsetHeight / 2;
      while (row.nextElementSibling && ev.clientY > middle(row.nextElementSibling)) list.insertBefore(row.nextElementSibling, row);
      while (row.previousElementSibling && ev.clientY < middle(row.previousElementSibling)) row.after(row.previousElementSibling);
    };
    const drop = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      window.removeEventListener("pointermove", follow);
      window.removeEventListener("pointerup", drop);
      window.removeEventListener("pointercancel", drop);
      row.classList.remove("dragging");
      const to = [...list.children].indexOf(row);
      if (to !== from) move(from, to);
    };
    window.addEventListener("pointermove", follow);
    window.addEventListener("pointerup", drop);
    window.addEventListener("pointercancel", drop);
  }

  function move(from, to) {
    const order = data.colors.map((x) => x.index);
    if (to < 0 || to >= order.length) return;
    const [c] = order.splice(from, 1);
    order.splice(to, 0, c);
    setOrder(order);
  }

  async function setOrder(order) {
    const r = await game.ask("customize.colors", { order });
    if (r.error) status.textContent = r.error; else { data = r; draw(); }
  }

  async function pick(id, state) {
    const it = item(id);
    if (state === "locked") { status.textContent = `${it.name} is in the Shop for ${it.price} Gems.`; app.go("shop"); return; }
    status.textContent = "";
    let r;
    if (it.kind === "color") {
      const index = [...data.colors, ...(data.left_out || [])].find((x) => x.id === id).index;
      r = await game.ask("customize.colors", { order: [index, ...data.colors.map((x) => x.index).filter((x) => x !== index)] });
    } else r = await game.ask("customize.choose", { id });
    if (r.error) status.textContent = r.error; else { data = r; draw(); }
  }

  async function load() {
    if (!data) for (const kind of Object.keys(rows)) fill(rows[kind], loading("Your picks load in with the game…"));
    // The cards' pictures come with the picks, so they all show at once.
    const [r] = await Promise.all([game.ask("customize.get"), gamePictures()]);
    if (r.error) { fill(list, note(r.error)); return; }
    data = r;
    draw();
  }

  game.onChanged("customize", () => load());
  return { el, show() { status.textContent = ""; load(); }, address: () => "" };
}

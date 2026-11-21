// What the Maps and Replays webpages share, as the game's pages share
// LibraryCard, MapView and their detail panels' likes (.scratch/html-menus/):
// cards in rows and grids, a picture to pan and zoom, and a shared item's
// likes, dislikes, favourite and Report flag.

import { call, why } from "./api.js";
import { account } from "./account.js";
import { h, fill, note, reportFlag } from "./ui.js";

const SIGN_IN_FIRST = "Sign in on your Profile page first.";

// A card (LibraryCard: 176 x 228): a picture, the name, a line under it, and
// likes for shared ones (`likes` < 0 hides them); `warning`: a badge in the
// corner saying why (old replays). It's a link to `href`, so it opens in a new
// tab too; a plain click calls `open`.
export function card({ name, picture, line, likes = -1, dislikes = 0, href, open, warning = "" }) {
  const img = h("img", { class: "px", alt: "", loading: "lazy" });
  if (picture) img.src = picture;
  const a = h("a", { class: "card", href: href || "#", title: name },
    h("span", { class: "pic" }, picture ? img : h("span", { class: "no-pic" }),
      warning ? h("span", { class: "warn", title: warning, "aria-label": warning, text: "⚠" }) : null),
    h("span", { class: "name", text: name }),
    h("span", { class: "line muted", text: line }),
    h("span", { class: "votes muted", hidden: likes < 0, text: votesText(likes, dislikes) }));
  a.addEventListener("click", (e) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return; // a new tab: let it go
    e.preventDefault();
    open();
  });
  return a;
}

export function votesText(likes, dislikes) {
  return `▲ ${Number(likes) || 0}   ▼ ${Number(dislikes) || 0}`;
}

// The card at the end of a row that opens the whole list ("See all").
export function seeAllCard(open) {
  return h("button", { class: "card see-all", type: "button", onclick: open }, h("span", { text: "See all" }));
}

// Fill a row or grid with `cards`, or the `none` note when there are none.
export function fillRow(row, cards, none) {
  fill(row, cards.length ? cards : none ? note(none) : null);
  row.classList.toggle("empty", !cards.length);
}

// A shared item's small picture (base64 PNG from the server) as an address.
export function thumb(item) {
  return item && item.thumb ? `data:image/png;base64,${item.thumb}` : "";
}

// Likes, dislikes, favourite and the Report flag of a shared map or replay
// (`kind`: "maps" or "replays"; `about`: "this map"). show(item) draws them for
// it; a change goes to the server and then `changed(item)`; what to tell the
// player goes to `say`.
export function votesRow(kind, about, { say, changed }) {
  let item = {};
  const like = h("button", { class: "wbtn toggle", type: "button", "aria-pressed": "false" });
  const dislike = h("button", { class: "wbtn toggle", type: "button", "aria-pressed": "false" });
  const favorite = h("button", { class: "wbtn toggle", type: "button", "aria-pressed": "false", text: "★ Favourite" });
  const flagSlot = h("span");
  const el = h("div", { class: "votes-row" }, like, dislike, favorite, flagSlot);

  like.addEventListener("click", () => vote(Number(item.my_vote) === 1 ? 0 : 1));
  dislike.addEventListener("click", () => vote(Number(item.my_vote) === -1 ? 0 : -1));
  favorite.addEventListener("click", async () => {
    const on = !item.favorite;
    const r = await call("POST", `/${kind}/${item.id}/favorite`, { on });
    say(why(r));
    if (r.status === 200) item.favorite = on;
    changed(item);
  });

  async function vote(value) {
    const r = await call("POST", `/${kind}/${item.id}/vote`, { vote: value });
    if (r.status !== 200) say(why(r));
    else Object.assign(item, { likes: r.likes, dislikes: r.dislikes, my_vote: r.my_vote });
    changed(item);
  }

  function show(shown) {
    item = shown || {};
    el.hidden = !item.id;
    like.textContent = `▲ ${Number(item.likes) || 0}`;
    dislike.textContent = `▼ ${Number(item.dislikes) || 0}`;
    for (const [b, on] of [[like, Number(item.my_vote) === 1], [dislike, Number(item.my_vote) === -1], [favorite, !!item.favorite]]) {
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", String(on));
      b.disabled = !account.signedIn();
      b.title = account.signedIn() ? "" : SIGN_IN_FIRST;
    }
    const creator = item.creator || {};
    fill(flagSlot, item.id && account.signedIn() && String(creator.username || "") !== account.username()
      ? reportFlag(about, async (reason) => why(await call("POST", `/${kind}/${item.id}/report`, { reason })),
        (w) => say(w || "Thanks: the staff will take a look."))
      : null);
  }

  return { el, show };
}

// A map picture to pan (drag) and zoom (wheel, pinch, or + and -), as the
// game's MapView: pixels stay sharp; a double click puts it back.
export function panZoom() {
  const img = h("img", { class: "px", alt: "", draggable: "false" });
  const frame = h("div", { class: "pan-zoom", tabindex: "0", "aria-label": "The map's picture: drag to look round, scroll to zoom" }, img);
  let scale = 1, x = 0, y = 0;
  const pointers = new Map();
  let pinch = 0;
  const apply = () => { img.style.transform = `translate(${x}px, ${y}px) scale(${scale})`; };
  const reset = () => { scale = 1; x = 0; y = 0; apply(); };
  function clamp() {
    const w = frame.clientWidth, ht = frame.clientHeight;
    x = Math.min(0, Math.max(w - w * scale, x));
    y = Math.min(0, Math.max(ht - ht * scale, y));
  }
  const zoom = (factor, cx = frame.clientWidth / 2, cy = frame.clientHeight / 2) => {
    const next = Math.min(8, Math.max(1, scale * factor));
    const f = next / scale;
    x = cx - (cx - x) * f;
    y = cy - (cy - y) * f;
    scale = next;
    clamp();
    apply();
  };
  frame.addEventListener("wheel", (e) => {
    e.preventDefault();
    const r = frame.getBoundingClientRect();
    zoom(e.deltaY < 0 ? 1.25 : 0.8, e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
  frame.addEventListener("pointerdown", (e) => {
    frame.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = Math.hypot(a.x - b.x, a.y - b.y);
    }
  });
  frame.addEventListener("pointermove", (e) => {
    const before = pointers.get(e.pointerId);
    if (!before) return;
    const now = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, now);
    if (pointers.size === 1) {
      x += now.x - before.x;
      y += now.y - before.y;
      clamp();
      apply();
    } else if (pointers.size === 2 && pinch > 0) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const r = frame.getBoundingClientRect();
      zoom(d / pinch, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
      pinch = d;
    }
  });
  const up = (e) => { pointers.delete(e.pointerId); if (pointers.size < 2) pinch = 0; };
  frame.addEventListener("pointerup", up);
  frame.addEventListener("pointercancel", up);
  frame.addEventListener("dblclick", reset);
  frame.addEventListener("keydown", (e) => {
    if (e.key === "+" || e.key === "=") zoom(1.25);
    else if (e.key === "-") zoom(0.8);
    else if (e.key === "0") reset();
  });
  return {
    el: frame,
    set(src) {
      if (img.getAttribute("src") !== src) {
        reset();
        if (src) img.src = src; else img.removeAttribute("src");
      }
      img.hidden = !src;
    },
  };
}

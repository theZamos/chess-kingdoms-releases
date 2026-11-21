// The Ranked Leaderboard as a window on the webpage (/leaderboard,
// .scratch/html-menus/), as the game's LeaderboardWindow
// (game/leaderboard_window.gd): everyone who's played Ranked, best Elo first,
// 50 at a time; opened from a player's Elo it starts around them. It opens
// over the page you were on (Zac's answer, .scratch/web-links/: leaderboard_url).

import { call, why } from "../api.js";
import { h, fill, loading } from "../ui.js";
import { pictureImg } from "../pictures.js";
import { pathOf } from "../routes.js";

export const PAGE = 50;

// `app`: go(page, id), closed() once the window is closed.
export function leaderboardWindow(app) {
  let back = null;
  let offset = 0, total = 0, around = "";
  const list = h("div", { class: "leaderboard-list" });
  const status = h("p", { class: "muted" });
  const higher = h("button", { class: "wbtn", type: "button", text: "Higher", onclick: () => load(Math.max(offset - PAGE, 0)) });
  const top = h("button", { class: "wbtn", type: "button", text: "Top", onclick: () => load(0) });
  const lower = h("button", { class: "wbtn", type: "button", text: "Lower", onclick: () => load(offset + PAGE) });
  const box = h("div", { class: "pop box leaderboard", role: "dialog", "aria-modal": "true", "aria-label": "Ranked Leaderboard" },
    h("h3", { text: "Ranked Leaderboard" }), list, status, h("div", { class: "pop-buttons center" }, higher, top, lower),
    h("div", { class: "pop-buttons" }, h("button", { class: "wbtn yes", type: "button", text: "Close", onclick: () => close() })));
  const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };

  async function load(from, aroundName = "") {
    fill(list, loading("Loading…"));
    status.textContent = "";
    const r = await call("GET", `/leaderboard?offset=${from}${aroundName ? `&around=${encodeURIComponent(aroundName)}` : ""}`);
    if (r.status !== 200) { fill(list); status.textContent = why(r, "Couldn't load the Leaderboard."); return; }
    offset = Number(r.offset ?? from) || 0;
    total = Number(r.total) || 0;
    const rows = r.players || [];
    status.textContent = rows.length ? `${total} players have played Ranked.` : "Nobody has played Ranked yet.";
    fill(list, rows.map((p) => h("div", { class: `leader-row${p.username === around ? " you" : ""}` },
      h("span", { class: "rank", text: `#${Number(p.rank) || 0}` }), pictureImg(p.picture || {}, { size: 28 }),
      h("a", { href: pathOf("player", p.username), text: String(p.username), onclick: (e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        close(false);
        app.go("player", String(p.username));
      } }),
      h("span", { class: "muted", text: `${Number(p.wins) || 0}–${Number(p.losses) || 0}` }),
      h("span", { class: "elo", text: String(Number(p.elo) || 0) }))));
    higher.disabled = offset <= 0;
    lower.disabled = offset + PAGE >= total;
  }

  // Close it; `tell`: let the page put its address back.
  function close(tell = true) {
    if (!back) return;
    back.remove();
    back = null;
    document.removeEventListener("keydown", onKey, true);
    if (tell) app.closed();
  }

  return {
    isOpen: () => !!back,
    open(aroundName = "") {
      around = String(aroundName || "");
      if (!back) {
        back = h("div", { class: "pop-back" }, box);
        back.addEventListener("click", (e) => { if (e.target === back) close(); });
        document.addEventListener("keydown", onKey, true);
        document.body.append(back);
      }
      load(0, around);
    },
    close,
  };
}

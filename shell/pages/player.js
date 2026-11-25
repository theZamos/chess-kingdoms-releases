// Another player's full profile as a webpage (/player/<name>,
// .scratch/html-menus/), as the game's PlayerProfilePage
// (game/player_profile_page.gd): their picture, status, name and tags, clan,
// Elo, when they joined, their stats, what you can do with them (friend,
// follow, invite; Ban for staff; Assign Tags for Developers), a Report flag,
// and their shared maps and replays. All from the accounts server.

import { browse } from "../api.js";
import { call, why } from "../api.js";
import { account } from "../account.js";
import { h, fill, localTime, popup } from "../ui.js";
import { pictureImg } from "../pictures.js";
import { statusDot, tagRow, clanBadge, bannedLink, hasRanked, eloLink, statLines, socialButtons, banButton, profileFlag, tagsWindow } from "../people.js";
import { card, fillRow, thumb } from "../library.js";
import { factsLine } from "./replays.js";
import { pathOf } from "../routes.js";

// A player's shared maps or replays as cards, newest first (UploadsList).
export function uploadsList(kind, limit, go) {
  let asked = 0;
  const status = h("p", { class: "muted" });
  const cards = h("div", { class: "cards grid" });
  const el = h("section", { class: "uploads" }, h("h2", { text: kind === "maps" ? "Shared maps" : "Shared replays" }), status, cards);
  return {
    el,
    async showFor(username) {
      const mine = ++asked;
      fill(cards);
      if (!username) { status.textContent = ""; return; }
      status.textContent = "Loading…";
      const r = await browse(kind, { section: "new", sort: "newest", creator: username, limit });
      if (mine !== asked) return;
      const items = r.items || [];
      status.textContent = r.error ? String(r.error) : items.length ? "" : "None yet.";
      fillRow(cards, items.map((item) => card({ name: String(item.name || ""), picture: thumb(item), href: pathOf(kind, item.id),
        line: kind === "maps" ? `by ${(item.creator && item.creator.username) || "?"} · ${Number(item.players) || 0} Players` : factsLine(item.meta || {}),
        likes: Number(item.likes) || 0, dislikes: Number(item.dislikes) || 0, open: () => go(kind, String(item.id)) })), "");
    },
  };
}

export function playerPage(app) {
  let username = "";
  let player = {};
  let asked = 0;
  const top = h("div", { class: "player-top" });
  const status = h("p", { class: "status", role: "status" });
  const maps = uploadsList("maps", 24, app.go);
  const replays = uploadsList("replays", 24, app.go);
  const el = h("div", { class: "pad player-page" },
    h("div", { class: "head" }, h("button", { class: "wbtn", type: "button", text: "← Back", onclick: () => app.back() })),
    top, status, maps.el, replays.el);

  function build() {
    const nameRow = h("div", { class: "name-row big" }, player.presence ? statusDot(String(player.presence.status || "offline")) : null,
      h("h1", { class: "map-name", text: player.username }), tagRow(player.tags, 24));
    const flag = profileFlag(player, (w) => { status.textContent = w || "Thanks: the staff will take a look."; });
    if (flag) nameRow.append(flag);
    const info = h("div", { class: "player-info" }, nameRow);
    // No clan tag before the name: the clan's badge is right under it (Zac, 2026-11-18).
    const badge = clanBadge(player.clan);
    if (badge) info.append(badge);
    const banned = bannedLink(player.banned);
    if (banned) info.append(banned);
    if ("elo" in player && hasRanked(player)) {
      const r = player.ranked || {};
      info.append(eloLink(player.elo, player.username, `   ·   Ranked ${Number(r.wins) || 0} won, ${Number(r.losses) || 0} lost`));
    }
    if ("created" in player) info.append(h("p", { class: "muted", text: `Joined ${localTime(player.created).slice(0, 10)}` }));
    for (const line of statLines(player.stats)) info.append(h("p", { class: "muted line", text: line }));
    const buttons = socialButtons(player, (text, work, title) => h("button", { class: "wbtn", type: "button", text, title, onclick: async (e) => {
      const b = e.currentTarget;
      b.disabled = true;
      const w = await work();
      if (w) b.disabled = false;
      refresh(w);
    } }));
    if (account.isDeveloper() && "created" in player) {
      buttons.push(h("button", { class: "wbtn", type: "button", text: "Assign Tags", title: "Developers: give or take away their profile tags.",
        onclick: async () => {
          const w = await tagsWindow(username);
          if (w !== undefined) refresh(w || `Saved ${username}'s tags.`);
        } }));
      buttons.push(h("button", { class: "wbtn", type: "button", text: "Give Gems",
        title: "Developers: give them Gems, for testing or a prize (a minus takes some away).",
        onclick: async () => {
          const amount = await gemsWindow(username);
          if (amount === null) return;
          const r = await call("POST", "/admin/gems", { username, amount });
          refresh(r.status === 200 ? `${r.username} has ${r.gems} Gems now.` : why(r, "Couldn't give the Gems."));
        } }));
    }
    if (buttons.length) info.append(h("div", { class: "row-line" }, buttons));
    const ban = banButton(player, (w) => refresh(w));
    if (ban) info.append(ban);
    fill(top, h("div", { class: "player-head" }, "picture" in player ? pictureImg(player.picture, { size: 128 }) : h("span", { class: "pic-blank big" }), info));
  }

  // Ask the server for their card again (after a button), showing `message`.
  async function refresh(message = "") {
    const name = username;
    status.textContent = message;
    const r = await call("GET", `/users/${encodeURIComponent(name)}`);
    if (username === name && r.status === 200 && r.player) { player = r.player; build(); }
  }

  async function showPlayer(name) {
    const mine = ++asked;
    username = name;
    player = { username: name };
    status.textContent = "Looking them up…";
    build();
    maps.showFor(name);
    replays.showFor(name);
    const r = await call("GET", `/users/${encodeURIComponent(name)}`);
    if (mine !== asked) return;
    const found = r.status === 200 && r.player ? r.player : null;
    status.textContent = found ? "" : `Couldn't find ${name} on the accounts server.`;
    if (found) { player = found; build(); }
  }

  account.onChange(() => { if (username) build(); });

  return {
    el,
    show({ id } = {}) {
      if (id === undefined || id === null || String(id) === "" || String(id) === username) return;
      showPlayer(String(id));
    },
    address: () => username,
  };
}

// Developers: how many Gems to give `username` (a minus takes some away);
// null if closed (.scratch/shop-gems-challenges/).
export function gemsWindow(username) {
  return popup("Give Gems", (close) => {
    const amount = h("input", { type: "number", value: "100", min: "-100000", max: "100000", step: "1", "aria-label": "Gems" });
    return h("div", { class: "pop-body" },
      h("p", { text: `How many Gems to give ${username}?` }), amount,
      h("div", { class: "row-line" },
        h("button", { class: "wbtn yes", type: "button", text: "Give", onclick: () => close(Math.trunc(Number(amount.value)) || 0) }),
        h("button", { class: "wbtn", type: "button", text: "Cancel", onclick: () => close(null) })));
  }).then((v) => (v === undefined || v === null || v === 0 ? null : v));
}

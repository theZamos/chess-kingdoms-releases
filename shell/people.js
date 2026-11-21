// Players on the webpage, as the game shows them (game/name_badges.gd,
// game/player_card.gd, game/friends_panel.gd): their picture, status dot,
// clan tag and profile tags beside the name, what they're doing, their card
// when their name is clicked, and the staff's Ban and Assign Tags windows.

import { call, browse, why } from "./api.js";
import { account, TAGS, TAG_NAMES } from "./account.js";
import { h, fill, localTime, popup, reportFlag } from "./ui.js";
import { pictureImg } from "./pictures.js";
import { social } from "./social.js";
import { pathOf } from "./routes.js";

export const STATUS_NAMES = { online: "Online", lobby: "In a Lobby", match: "In a Game", map_maker: "In Map Maker",
  replay: "Viewing a Replay", offline: "Offline" };

// What the page needs to send you somewhere (app.go), set by app.js.
let goTo = () => {};
export function setNavigator(go) { goTo = go; }

// A round dot in the status's colour, with what it means as a tooltip.
export function statusDot(status) {
  const s = STATUS_NAMES[status] ? status : "offline";
  return h("span", { class: `status-dot s-${s}`, title: STATUS_NAMES[s], "aria-label": STATUS_NAMES[s] });
}

// The profile tags' icons in a row, each with its name as a tooltip.
export function tagRow(tags, px = 18) {
  const known = TAGS.filter((t) => Array.isArray(tags) && tags.includes(t));
  return h("span", { class: "tag-row" }, known.map((t) => h("img", { class: "px", src: `shell/pictures/tag_${t}.png`, alt: TAG_NAMES[t],
    title: TAG_NAMES[t], width: px, height: px })));
}

// "[TAG]" in the clan's gold, or null (NameBadges.clan_tag_label()).
export function cleanClanTag(tag) {
  return String(tag ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
}
export function clanTag(tag) {
  const clean = cleanClanTag(tag);
  return clean ? h("span", { class: "clan-tag", title: "Clan tag", text: `[${clean}]` }) : null;
}

// A player's clan: its logo and "[TAG] Name", opening its page. Null for none.
export function clanBadge(clan) {
  if (!clan || typeof clan !== "object" || !clan.tag) return null;
  return h("a", { class: "clan-badge", href: pathOf("clans", clan.tag), title: "Their clan's page",
    onclick: (e) => { if (plainClick(e)) { e.preventDefault(); closeCard(); goTo("clans", String(clan.tag)); } } },
  pictureImg(clan.logo || {}, { size: 20 }), ` [${clan.tag}] ${clan.name || ""}`);
}

// Whether a card has played a Ranked game (its Elo shows only then).
export function hasRanked(player) {
  const r = player && typeof player.ranked === "object" && player.ranked ? player.ranked : {};
  return (Number(r.wins) || 0) + (Number(r.losses) || 0) > 0;
}

// "Elo 1234" (and `extra`), opening the Ranked Leaderboard around the player.
export function eloLink(elo, name, extra = "") {
  return h("a", { class: "elo-link", href: "/leaderboard", title: "The Ranked Leaderboard", text: `Elo ${Number(elo) || 0}${extra}`,
    onclick: (e) => { if (plainClick(e)) { e.preventDefault(); closeCard(); goTo("leaderboard", "", { around: name }); } } });
}

// "for good" or "until 2026-11-03 14:00" (AccountClient.ban_time()).
export function banTime(ban) {
  const until = Number(ban && ban.until) || 0;
  return until <= 0 ? "for good" : `until ${localTime(until)}`;
}

// Red "Banned": for the player and staff (who are told when and why) a link that says so.
export function bannedLink(ban) {
  if (!ban || typeof ban !== "object") return null;
  if (!("until" in ban) && !("reason" in ban)) return h("span", { class: "banned", title: "Banned from online play.", text: "Banned" });
  const details = `Banned from online play ${banTime(ban)}.\nReason: ${String(ban.reason || "") || "none given"}`;
  return h("button", { class: "banned link", type: "button", title: details, text: "Banned",
    onclick: () => popup("Banned", (close) => h("div", { class: "pop-body" }, h("p", { class: "pre", text: details }),
      h("div", { class: "pop-buttons" }, h("button", { class: "wbtn yes", type: "button", text: "OK", onclick: () => close() })))) });
}

// "just now", "20 minutes ago", … "2 years ago" (NameBadges.ago()).
export function ago(ms, now = Date.now()) {
  const minutes = Math.max(Math.floor((now - Number(ms)) / 60000), 0);
  const plural = (n, unit) => `${n} ${unit}${n === 1 ? "" : "s"} ago`;
  if (minutes < 1) return "just now";
  if (minutes < 60) return plural(minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return plural(hours, "hour");
  const days = Math.floor(hours / 24);
  if (days < 7) return plural(days, "day");
  if (days < 30) return plural(Math.floor(days / 7), "week");
  if (days < 365) return plural(Math.max(Math.floor(days / 30.4375), 1), "month");
  return plural(Math.floor(days / 365.25), "year");
}

// "Ranked Match", "Local Match" or "Online Match"; "" when the server didn't say.
export function matchKindText(presence) {
  return { ranked: "Ranked Match", local: "Local Match", online: "Online Match" }[String(presence.kind || "")] || "";
}

// What a friend is doing (FriendsPanel.presence_text()).
export function presenceText(presence = {}) {
  const status = String(presence.status || "offline");
  if (["online", "map_maker", "replay"].includes(status)) return STATUS_NAMES[status];
  let text;
  if (status === "lobby") text = "In a Lobby";
  else if (status === "match") text = "In a Game";
  else return "Offline";
  const kind = matchKindText(presence);
  if (kind) text += ` · ${kind}`;
  const players = Number(presence.players) || 0;
  if (players > 0) text += ` · ${players} player${players === 1 ? "" : "s"}`;
  return text;
}

// What's under a friend's name: what they're doing, or when they were last online.
export function lastOnlineText(card, now = Date.now()) {
  const presence = card && typeof card.presence === "object" && card.presence ? card.presence : {};
  if (String(presence.status || "offline") !== "offline") return presenceText(presence);
  const seen = Number(card && card.seen) || 0;
  return seen > 0 ? `Last online ${ago(seen, now)}` : "Offline";
}

// Join, Request to join and Spectate for a friend's presence (FriendsPanel.join_options()).
export function joinOptions(presence = {}, watchOnly = false) {
  const out = { join: false, request: false, spectate: false };
  if (!String(presence.room || "")) return out;
  const status = String(presence.status || "");
  const max = Number(presence.max) || 0, players = Number(presence.players) || 0;
  const open = max === 0 || players < max;
  if (status === "lobby" && !watchOnly && open && !presence.queued) out[presence.public ? "join" : "request"] = true;
  if (status === "match" && !watchOnly && (Number(presence.open_seats) || 0) > 0 && !presence.queued) out.join = true;
  out.spectate = !!presence.spectate && ["lobby", "match"].includes(status) && presence.kind !== "ranked";
  return out;
}

// Who's playing first, then who's online, then everyone else (most recently online first).
export function byPresence(cards) {
  const order = { match: 0, lobby: 1, online: 2 };
  return [...cards].sort((a, b) => {
    const oa = order[(a.presence || {}).status] ?? 3, ob = order[(b.presence || {}).status] ?? 3;
    return oa !== ob ? oa - ob : (Number(b.seen) || 0) - (Number(a.seen) || 0);
  });
}

function plainClick(e) {
  return !(e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0);
}

// A player's name: a link to their full profile (/player/<name>) that opens
// their card first, as clicking a name in the game does.
export function nameLink(name, { card = true } = {}) {
  return h("a", { class: "who", href: pathOf("player", name) || "#", text: name, title: card ? "Their profile card" : "Their profile",
    onclick: (e) => {
      if (!plainClick(e)) return;
      e.preventDefault();
      if (card) openCard(name, e.currentTarget);
      else goTo("player", name);
    } });
}

// A row with the player's picture, status dot, clan tag, name, profile tags and `detail`.
export function person(card, detail = "", { size = 40 } = {}) {
  const name = String(card.username || "");
  return h("div", { class: "person" },
    pictureImg(card.picture || {}, { size }),
    h("div", { class: "person-names" },
      h("div", { class: "name-row" }, card.presence ? statusDot(String(card.presence.status || "offline")) : null,
        clanTag(card.clan_tag), nameLink(name), tagRow(card.tags, 16)),
      detail ? h("div", { class: "muted small", text: detail }) : null),
    h("div", { class: "person-buttons" }));
}

// The stats summary as lines: {matches: 12, win_ratio: "50%"} -> ["Matches: 12", "Win ratio: 50%"].
const STAT_NAMES = { most_won_on: "Best map", win_ratio: "Win ratio" };
export function statLines(stats) {
  // (String.capitalize(): "games_played" -> "Games Played". Whole numbers come as 12, not 12.0, in JSON.)
  const title = (key) => key.split("_").filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  return Object.entries(stats || {}).map(([key, value]) => `${STAT_NAMES[key] || title(key)}: ${value}`);
}

// Friends and clan-mates can be invited to your party (unless they're in it).
export function canParty(player) {
  const name = String(player.username || "");
  const party = social.state().party || {};
  if ((party.members || []).some((m) => String(m.username || "") === name)) return false;
  if (player.friend) return true;
  const mine = account.user().clan, theirs = player.clan;
  return !!(mine && theirs && typeof mine === "object" && typeof theirs === "object" && Number(mine.id) === Number(theirs.id));
}

// The friendly buttons for `player` (a card from the server): Add friend (or
// Accept, or Remove friend), Follow or Unfollow, Invite to party, Invite to
// game while you're in a lobby. `make(text, work)` makes each button, `work`
// resolving with why not, or "". Nothing for yourself, or signed out.
export function socialButtons(player, make) {
  const out = [];
  if (!account.signedIn() || player.username === account.username() || !("friend" in player)) return out;
  const name = String(player.username);
  if (player.friend) out.push(make("Remove friend", () => social.friend("/friends/remove", name), "No longer friends."));
  else if (player.requested_you) out.push(make("Accept friend request", () => social.friend("/friends/accept", name)));
  else if (player.requested) out.push(h("span", { class: "muted", text: "Friend request sent" }));
  else out.push(make("Add friend", () => social.friend("/friends/add", name)));
  if (!player.friend) {
    if (player.following) out.push(make("Unfollow", () => social.friend("/unfollow", name)));
    else out.push(make("Follow", () => social.friend("/follow", name), "See when they're playing, without being friends."));
  }
  if (canParty(player)) out.push(make("Invite to party", () => social.party("/party/invite", { username: name }),
    "Play together: your party joins the lobbies its leader joins."));
  const room = social.state().room || "";
  if (room && player.friend && String((player.presence || {}).room || "") !== room) {
    out.push(make("Invite to game", () => social.inviteToGame(name, room), "Ask them to join your lobby."));
  }
  return out;
}

// Moderators and Developers: Ban… (or Lift ban) for a player below them.
export function banButton(player, after) {
  const name = String(player.username || "");
  if (!account.isAdmin() || name === account.username() || !("created" in player) || !account.outranks(player)) return null;
  if (player.banned && typeof player.banned === "object") {
    return h("button", { class: "wbtn", type: "button", text: "Lift ban", title: "Let them play online again.", onclick: async (e) => {
      e.currentTarget.disabled = true;
      after(why(await call("POST", "/admin/ban", { username: name, banned: false })));
    } });
  }
  return h("button", { class: "wbtn danger", type: "button", text: "Ban…", title: "No online matches for a while, or for good.",
    onclick: async () => { const w = await banWindow(name); if (w !== undefined) after(w); } });
}

// BanWindow.LENGTHS: [words, minutes] (0: for good).
export const BAN_LENGTHS = [["1 hour", 60], ["1 day", 1440], ["3 days", 4320], ["1 week", 10080], ["30 days", 43200], ["For good", 0]];

// The Ban window: how long and why. Resolves with why not ("" banned), or undefined if cancelled.
export function banWindow(name) {
  return popup("Ban", (close) => {
    const length = h("select", { "aria-label": "How long" }, BAN_LENGTHS.map(([text], i) => h("option", { value: String(i), text, selected: i === 1 })));
    const reason = h("input", { type: "text", maxlength: "500", placeholder: "Reason (they see it)" });
    return h("div", { class: "pop-body" },
      h("p", { text: `Ban ${name} from online play? They can still sign in and see why.` }),
      h("label", { class: "field-row" }, h("span", { text: "How long" }), length), reason,
      h("div", { class: "pop-buttons" },
        h("button", { class: "wbtn yes", type: "button", text: "Ban", onclick: async () => {
          const r = await call("POST", "/admin/ban", { username: name, minutes: BAN_LENGTHS[Number(length.value)][1], reason: reason.value.trim() });
          close(why(r));
        } }),
        h("button", { class: "wbtn", type: "button", text: "Cancel", onclick: () => close(undefined) })));
  });
}

// Developers: the Assign Tags window (TagsWindow). Resolves with why not, "" saved, or undefined.
export function tagsWindow(name) {
  return popup("Assign Tags", (close) => {
    const note = h("p", { text: `Looking up ${name}'s tags…` });
    const checks = Object.fromEntries(TAGS.map((t) => [t, h("input", { type: "checkbox" })]));
    const save = h("button", { class: "wbtn yes", type: "button", text: "Save tags", disabled: true, onclick: async () => {
      const tags = TAGS.filter((t) => checks[t].checked);
      close(why(await call("POST", "/admin/tags", { username: name, tags }), "Couldn't save."));
    } });
    call("GET", `/admin/tags?username=${encodeURIComponent(name)}`).then((r) => {
      if (r.status !== 200) { note.textContent = why(r, "Couldn't look them up."); return; }
      note.textContent = `${name}'s tags. Everyone sees them beside their name; they pick which of theirs to show. Developer and Moderator also give staff powers.`;
      for (const t of TAGS) checks[t].checked = (r.tags || []).includes(t);
      save.disabled = false;
    });
    return h("div", { class: "pop-body" }, note,
      h("div", { class: "checks" }, TAGS.map((t) => h("label", { class: "check" }, checks[t], h("img", { class: "px", src: `shell/pictures/tag_${t}.png`,
        alt: "", width: 18, height: 18 }), ` ${TAG_NAMES[t]}`))),
      h("div", { class: "pop-buttons" }, save, h("button", { class: "wbtn", type: "button", text: "Cancel", onclick: () => close(undefined) })));
  });
}

// A Report flag for `player`'s profile, or null for yourself, signed out or before their card arrives.
export function profileFlag(player, after) {
  const name = String(player.username || "");
  if (!account.signedIn() || name === account.username() || !("created" in player)) return null;
  return reportFlag(`${name}'s profile`, async (reason) => why(await call("POST", `/users/${encodeURIComponent(name)}/report`, { reason })), after);
}

// ---------------------------------------------------------------- a player's card

let openCardEl = null;

export function closeCard() {
  if (openCardEl) openCardEl.remove();
  openCardEl = null;
  document.removeEventListener("pointerdown", outside, true);
}

function outside(e) {
  if (openCardEl && !openCardEl.contains(e.target)) closeCard();
}

// `name`'s card beside `near` (PlayerCard): picture, name, clan, Elo, when
// they joined, stats, their newest maps and replays, Full profile, and what
// you can do with them. It fills in when the server answers.
export async function openCard(name, near) {
  closeCard();
  const box = h("div", { class: "player-card box", role: "dialog", "aria-label": `${name}'s card` });
  const status = h("p", { class: "status", text: "Looking them up…" });
  openCardEl = box;
  document.body.append(box);
  const r = near ? near.getBoundingClientRect() : { left: 40, bottom: 80 };
  box.style.left = `${Math.max(8, Math.min(r.left, innerWidth - 340))}px`;
  box.style.top = `${Math.max(8, Math.min(r.bottom + 6, innerHeight - 360))}px`;
  setTimeout(() => document.addEventListener("pointerdown", outside, true), 0);
  let player = { username: name };
  let recent = null;
  const build = () => {
    if (openCardEl !== box) return;
    const nameRow = h("div", { class: "name-row" }, player.presence ? statusDot(String(player.presence.status || "offline")) : null,
      clanTag(player.clan_tag), h("strong", { class: "card-name", text: player.username }), tagRow(player.tags));
    const flag = profileFlag(player, (w) => { status.textContent = w || "Thanks: the staff will take a look."; });
    if (flag) nameRow.append(flag);
    const lines = [];
    const badge = clanBadge(player.clan);
    if (badge) lines.push(badge);
    const banned = bannedLink(player.banned);
    if (banned) lines.push(banned);
    if ("elo" in player && hasRanked(player)) lines.push(eloLink(player.elo, player.username));
    if ("created" in player) lines.push(h("div", { class: "muted", text: `Joined ${localTime(player.created).slice(0, 10)}` }));
    for (const line of statLines(player.stats)) lines.push(h("div", { class: "muted", text: line }));
    for (const kind of ["maps", "replays"]) {
      const items = recent && recent[kind];
      if (!items || !items.length) continue;
      lines.push(h("div", { class: "muted recent" }, `Recent ${kind}: `, items.map((item, i) => [i ? ", " : "",
        h("a", { href: pathOf(kind, item.id), text: String(item.name || ""), onclick: (e) => {
          if (!plainClick(e)) return; e.preventDefault(); closeCard(); goTo(kind, String(item.id));
        } })])));
    }
    const buttons = socialButtons(player, (text, work, title) => h("button", { class: "wbtn", type: "button", text, title, onclick: async (e) => {
      e.currentTarget.disabled = true;
      const w = await work();
      status.textContent = w;
      if (!w) refresh();
      else e.currentTarget.disabled = false;
    } }));
    const ban = banButton(player, (w) => { status.textContent = w; refresh(); });
    fill(box, h("div", { class: "card-top" }, "picture" in player ? pictureImg(player.picture, { size: 80 }) : h("span", { class: "pic-blank" }),
      h("div", { class: "card-info" }, nameRow, lines)),
    "created" in player ? h("button", { class: "wbtn", type: "button", text: "Full profile", onclick: () => { closeCard(); goTo("player", player.username); } }) : null,
    buttons.length ? h("div", { class: "row-line" }, buttons) : null, ban, status);
  };
  const refresh = async () => {
    const r2 = await call("GET", `/users/${encodeURIComponent(name)}`);
    if (r2.status === 200 && r2.player) { player = r2.player; build(); }
  };
  build();
  const found = await call("GET", `/users/${encodeURIComponent(name)}`);
  if (openCardEl !== box) return;
  status.textContent = found.status === 200 && found.player ? "" : `Couldn't find ${name} on the accounts server.`;
  if (found.player) player = found.player;
  build();
  if ("created" in player) {
    recent = {};
    for (const kind of ["maps", "replays"]) {
      const list = await browse(kind, { section: "new", sort: "newest", creator: name, limit: 3 });
      recent[kind] = list.items || [];
    }
    build();
  }
}

// Esc closes a card too.
if (typeof document !== "undefined") document.addEventListener("keydown", (e) => { if (e.key === "Escape" && openCardEl) closeCard(); });

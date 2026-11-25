// Clans as a webpage (.scratch/html-menus/), as the game's ClansPage
// (game/clans_page.gd): every clan, best Elo first (the clan leaderboard), with
// search; yours, invites and Make Clan; a clan's page with its logo, record,
// members and recent Ranked results; Join, Ask to join or Leave; and its
// leader's tools. It's all on the accounts server, so it shows at once. The
// same view is the Clan tab of your profile (embedded).

import { call, why } from "../api.js";
import { account } from "../account.js";
import { h, fill, loading, note, localTime, popup } from "../ui.js";
import { pictureImg, picture, choices } from "../pictures.js";
import { person, hasRanked } from "../people.js";
import { social } from "../social.js";
import { game } from "../game.js";

export const MAX_MEMBERS = 50;

// "1st", "2nd", "3rd", "4th".
export function place(n) {
  return { 1: "1st", 2: "2nd", 3: "3rd" }[n] || `${n}th`;
}

// After joining, leaving or making a clan, your account (its clan) changes.
async function refreshAccount() {
  const r = await call("GET", "/me");
  if (r.status === 200 && r.user) account.update(r.user);
  if (game.isReady()) social.refresh();
}

// `app`: address(id, {replace}), say(text). `embedded`: on your profile's Clan
// tab (no Back, no title, no address of its own).
export function clansView(app, { embedded = false } = {}) {
  let page = {};      // the clan on show, as the server sent its page ({} in the list)
  let clanId = 0;
  let opens = 0;
  const status = h("p", { class: "status", role: "status" });
  const search = h("input", { type: "search", placeholder: "Search clans by name or tag", "aria-label": "Search clans" });
  const mine = h("div", { class: "clan-mine" });
  const list = h("div", { class: "clan-list" });
  const listView = h("div", { class: "clans-list" },
    embedded ? null : h("div", { class: "head" }, h("h1", { text: "Clans" })),
    mine,
    h("div", { class: "row-line" }, search, h("button", { class: "wbtn", type: "button", text: "Search", onclick: () => showList() })),
    h("p", { class: "muted", text: "Clan leaderboard (by Elo: the average of its members' Ranked Elo)" }),
    list);
  const clanView = h("div", { class: "clan-page", hidden: true });
  const el = h("div", { class: embedded ? "clans embedded" : "pad clans" }, listView, clanView, status);
  search.addEventListener("keydown", (e) => { if (e.key === "Enter") showList(); });

  function say(text) { status.textContent = text || ""; }
  const link = (text, open) => h("a", { href: "#", text, onclick: (e) => { e.preventDefault(); open(); } });
  const action = (text, work) => h("button", { class: "wbtn", type: "button", text, onclick: work });

  // ---------------------------------------------------------------- the list
  async function showList({ push = true } = {}) {
    clanId = 0;
    page = {};
    opens++;
    listView.hidden = false;
    clanView.hidden = true;
    say("");
    if (!embedded && push) app.address("");
    fillMine();
    const q = search.value.trim();
    fill(list, loading("Looking…"));
    const asked = opens;
    const r = await call("GET", `/clans?sort=elo${q ? `&q=${encodeURIComponent(q)}` : ""}`);
    if (asked !== opens) return;
    if (r.status !== 200) { fill(list, note(why(r, "Couldn't reach the server."))); return; }
    const clans = r.clans || [];
    fill(list, clans.length ? null : note(q ? "No clans match that." : "No clans yet."));
    clans.forEach((c, i) => list.append(h("div", { class: "clan-row" },
      h("span", { class: "rank", text: `${i + 1}.` }), pictureImg(c.logo || {}, { size: 32 }),
      link(`${c.name} [${c.tag}]`, () => open(c.id)),
      h("span", { class: "muted", text: `Elo ${Number(c.elo) || 0}   ·   ${Number(c.wins) || 0}–${Number(c.losses) || 0}   ·   ${Number(c.members) || 0} member${Number(c.members) === 1 ? "" : "s"}${c.open ? "   ·   open" : ""}` }))));
  }

  async function fillMine() {
    if (!account.signedIn()) { fill(mine, note("Sign in on your Profile page to join or make a clan.")); return; }
    const clan = account.user().clan;
    if (clan && typeof clan === "object") fill(mine, h("p", {}, link(`Your clan: ${clan.name} [${clan.tag}]`, () => open(clan.id))));
    else fill(mine, note("You're not in a clan. Join one below, or make your own."), h("button", { class: "wbtn", type: "button", text: "Make Clan", onclick: makeClan }));
    const r = await call("GET", "/clans/mine");
    for (const c of r.invites || []) {
      mine.append(h("div", { class: "row-line" }, h("span", { text: `${c.name} [${c.tag}] invited you.` }), action("Open", () => open(c.id))));
    }
  }

  // "Make Clan": the Clan Name, Tag and Open; your picture is its logo to start with.
  async function makeClan() {
    const made = await popup("Make Clan", (close) => {
      const name = h("input", { type: "text", maxlength: "24", placeholder: "Clan name", "aria-label": "Clan Name" });
      const tag = h("input", { type: "text", maxlength: "4", placeholder: "Tag", "aria-label": "Tag", class: "short" });
      const open = h("input", { type: "checkbox" });
      return h("div", { class: "pop-body" },
        h("label", { class: "field-row" }, h("span", { text: "Clan Name" }), name),
        h("label", { class: "field-row" }, h("span", { text: "Tag" }), tag),
        h("label", { class: "check" }, open, " Open (anyone joins)"),
        h("div", { class: "pop-buttons" },
          h("button", { class: "wbtn yes", type: "button", text: "Make clan", onclick: () => close({ name: name.value.trim(), tag: tag.value.trim(), open: open.checked }) }),
          h("button", { class: "wbtn", type: "button", text: "Cancel", onclick: () => close(undefined) })));
    });
    if (!made) return;
    const logo = myPicture();
    const r = await call("POST", "/clans", { ...made, logo });
    if (r.status !== 200) { say(why(r, "Couldn't make the clan.")); return; }
    await refreshAccount();
    open(r.clan.id);
  }

  // ---------------------------------------------------------------- one clan
  // Show clan `id`'s page, or the one tagged `tag` (its address, /clans/RK).
  // Resolves with the server's status (200 shown, 404 no such clan, 0 no
  // server), or -1 if something else was opened meanwhile.
  function open(id, opts) { return show(`/clans/${Number(id)}`, Number(id), opts); }
  function openTag(tag, opts) { return show(`/clans/tag/${encodeURIComponent(tag)}`, -1, opts); }

  async function show(path, id, { push = true } = {}) {
    const asked = ++opens;
    clanId = id;
    listView.hidden = true;
    clanView.hidden = false;
    fill(clanView, loading("Loading…"));
    say("");
    const r = await call("GET", path);
    if (asked !== opens) return -1;
    if (r.status !== 200) {
      fill(clanView);
      say(why(r, "Couldn't load the clan."));
      return r.status;
    }
    page = r;
    clanId = Number(r.clan.id);
    if (!embedded) app.address(String(r.clan.tag), { replace: !push });
    build();
    return 200;
  }

  function build() {
    const c = page.clan;
    const buttons = h("div", { class: "row-line" });
    if (account.signedIn()) {
      if (page.member) buttons.append(action("Leave clan", askLeave));
      else if (page.invited) buttons.append(action("Accept invite", () => post("/join", {})), action("Decline", () => post("/decline", {})));
      else if (page.applied) buttons.append(h("span", { class: "muted", text: "You've asked to join." }), action("Take back", () => post("/decline", {})));
      else if (!(account.user().clan && typeof account.user().clan === "object")) buttons.append(action(c.open ? "Join" : "Ask to join", () => post("/join", {})));
    }
    const members = h("div", { class: "clan-members" }, (page.members || []).map((m) => {
      const row = person(m, (m.leader ? "Leader   ·   " : "") + (hasRanked(m) || !("ranked" in m) ? `Elo ${Number(m.elo) || 1000}` : "No Ranked games yet"), { size: 32 });
      if (page.leader && !m.leader) {
        row.querySelector(".person-buttons").append(action("Make leader", () => post("/leader", { username: m.username })),
          action("Remove", () => post("/kick", { username: m.username })));
      }
      return row;
    }));
    const results = page.results || [];
    fill(clanView,
      h("div", { class: "row-line" }, h("button", { class: "wbtn", type: "button", text: "All clans", onclick: () => showList() })),
      h("div", { class: "clan-head" }, pictureImg(c.logo || {}, { size: 96 }),
        h("div", { class: "clan-info" },
          h("h1", { class: "map-name", text: `${c.name} [${c.tag}]` }),
          c.description ? h("p", { text: String(c.description) }) : null,
          h("p", { class: "muted", text: `Led by ${c.leader || "?"}   ·   ${Number(c.members) || 0} of ${MAX_MEMBERS} members   ·   ${c.open ? "open: anyone can join" : "ask to join"}` }),
          h("p", { class: "muted", text: `Clan Elo ${Number(c.elo) || 0}   ·   Ranked ${Number(c.wins) || 0} won, ${Number(c.losses) || 0} lost (its members' record)` }),
          buttons)),
      page.leader ? leaderTools(c) : null,
      h("h2", { text: "Members" }), members,
      h("h2", { text: "Recent Ranked results" }),
      results.length ? results.map((r) => {
        const change = Number(r.elo_change) || 0;
        return h("p", { class: "muted", text: `${localTime(Number(r.created) || 0).slice(0, 10)}   ·   ${r.username}   ·   ${place(Number(r.place) || 0)} of ${Number(r.players) || 0}   ·   Elo ${change >= 0 ? "+" : ""}${change}` });
      }) : note("No Ranked games yet."));
  }

  function leaderTools(c) {
    const name = h("input", { type: "text", value: c.name, maxlength: "24", "aria-label": "Clan name" });
    const tag = h("input", { type: "text", value: c.tag, maxlength: "4", "aria-label": "Tag", class: "short" });
    const openBox = h("input", { type: "checkbox", checked: !!c.open });
    const invite = h("input", { type: "text", placeholder: "A player's username", "aria-label": "Invite a player" });
    const box = h("div", { class: "leader-tools" },
      h("h2", { text: "Leader" }),
      h("div", { class: "row-line" }, name, tag, h("label", { class: "check" }, openBox, " Open"),
        action("Save", () => post("/edit", { name: name.value.trim(), tag: tag.value.trim(), open: openBox.checked }))),
      logoPicker(c.logo || {}),
      h("div", { class: "row-line" }, invite, action("Invite", () => post("/invite", { username: invite.value.trim() }))));
    for (const a of page.applications || []) {
      box.append(h("div", { class: "row-line" }, h("span", { text: `${a.username} asks to join.` }),
        action("Accept", () => post("/invite", { username: a.username })), action("Decline", () => post("/decline", { username: a.username }))));
    }
    for (const i of page.invites || []) {
      box.append(h("div", { class: "row-line" }, h("span", { text: `Invited ${i.username}.` }), action("Take back", () => post("/decline", { username: i.username }))));
    }
    return box;
  }

  // The clan's logo, picked like a profile picture (a Piece on a tile, in a colour).
  function logoPicker(logo) {
    const preview = pictureImg(logo, { size: 48 });
    const row = h("div", { class: "row-line" }, h("span", { text: "Logo" }), preview);
    choices().then((p) => {
      if (!p) return;
      const piece = h("select", { "aria-label": "Logo Piece" }, p.pieces.map((x) => h("option", { value: x.id, text: x.name, selected: x.id === (logo.piece || "king") })));
      const tile = h("select", { "aria-label": "Logo tile" }, p.tiles.map((x) => h("option", { value: x.id, text: x.name, selected: x.id === (logo.tile || "grass") })));
      const color = h("select", { "aria-label": "Logo colour" }, p.palette.map((x, i) => h("option", { value: String(i), text: x.name, selected: i === (Number(logo.color) || 0) })));
      const picked = () => ({ piece: piece.value, tile: tile.value, color: Number(color.value) });
      for (const s of [piece, tile, color]) s.addEventListener("change", async () => { preview.src = await picture(picked()); });
      row.append(piece, tile, color, action("Save logo", () => post("/edit", { logo: picked() })),
        action("Use my picture", () => post("/edit", { logo: myPicture() })));
    });
    return row;
  }

  // Leaving asks first; a leader also picks who leads next.
  async function askLeave() {
    const others = (page.members || []).filter((m) => m.username !== account.username());
    const leads = !!page.leader && others.length > 0;
    let text = `Leave ${page.clan.name}?`;
    if (leads) text += " Leadership passes to:";
    else if (!others.length) text += " You're the last member: the clan will be deleted.";
    const answer = await popup("Leave clan", (close) => {
      const pick = h("select", { "aria-label": "Next leader" }, others.map((m) => h("option", { value: m.username, text: m.username })));
      return h("div", { class: "pop-body" }, h("p", { text }), leads ? pick : null,
        h("div", { class: "pop-buttons" },
          h("button", { class: "wbtn yes", type: "button", text: "Leave", onclick: () => close({ leader: leads ? pick.value : "" }) }),
          h("button", { class: "wbtn", type: "button", text: "Cancel", onclick: () => close(undefined) })));
    });
    if (!answer) return;
    const id = clanId;
    const r = await call("POST", `/clans/${id}/leave`, answer.leader ? { leader: answer.leader } : {});
    if (r.status !== 200) { say(why(r, "Couldn't leave.")); return; }
    await refreshAccount();
    if (r.deleted) {
      await showList();
      say("You left, and the clan is gone.");
    } else {
      open(id, { push: false });
    }
  }

  async function post(path, body) {
    const id = clanId;
    const r = await call("POST", `/clans/${id}${path}`, body);
    if (r.status !== 200) { say(why(r)); return; }
    if (path === "/join" || path === "/leave") await refreshAccount();
    if (clanId === id) {
      await open(id, { push: false });
      say(r.applied ? "Asked to join." : r.invited ? "Invited." : "");
    }
  }

  return {
    el, showList, open, openTag,
    // The clan on show (0 in the list).
    clanId: () => clanId,
    // Its tag once its page has loaded ("" before, or in the list).
    shownTag: () => (clanId > 0 && page.clan ? String(page.clan.tag) : ""),
    statusText: () => status.textContent,
    say,
  };
}

// Your picture (from your account, or as the game said it with the bar), for a new clan's logo.
function myPicture() {
  const fromAccount = account.user().profile && account.user().profile.picture;
  if (fromAccount && typeof fromAccount === "object") return fromAccount;
  try {
    const bar = JSON.parse(localStorage.getItem("ck.bar") || "{}");
    if (bar.picture_info) return bar.picture_info;
  } catch { /* fine */ }
  return {};
}

// The Clans page (/clans, /clans/<tag>).
export function clansPage(app) {
  const view = clansView(app);
  return {
    el: view.el,
    // `id` "" for every clan, a clan's tag; `clan_id`: a clan by its number (from the game).
    show({ id, clan_id: clanIdAsked } = {}) {
      if (clanIdAsked) { view.open(clanIdAsked); return; }
      if (id === undefined || id === null) return;
      id = String(id);
      if (id === "") { view.showList({ push: false }); return; }
      if (view.shownTag().toLowerCase() === id.toLowerCase()) return;
      view.openTag(id, { push: false }).then((status) => {
        if (status === 200 || status === -1) return;
        // A link that leads nowhere (MainMenu.link_note()): the list, a note, and its address swapped.
        const text = status === 404 ? "That clan doesn't exist any more, or the link is wrong." : view.statusText() || "Couldn't load the clan.";
        view.showList({ push: false });
        app.address("", { replace: true });
        app.say(text);
      });
    },
    address: () => view.shownTag(),
  };
}

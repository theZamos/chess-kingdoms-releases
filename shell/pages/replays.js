// The Replays page as a webpage (.scratch/html-menus/), the same as the
// game's (game/replays_page.gd, game/replay_detail.gd): rows of cards (Your
// Replays, then the shared sections), See all with search, sorts and filters,
// and one replay's page with its map, facts, likes, actions and comments. It
// shows at once: shared replays come from the accounts server; only the
// replays saved on this computer wait for the game behind a loading sign,
// asked with game.ask("replays.…") (game/web_replays.gd). Watch, Edit and
// View map hand over to the game.

import { call, browse, fetchItem, why } from "../api.js";
import { account } from "../account.js";
import { game } from "../game.js";
import { h, fill, loading, note, confirmBox, popup, foldButton } from "../ui.js";
import { commentsBox } from "../comments.js";
import { card, seeAllCard, fillRow, thumb, votesText, votesRow, panZoom } from "../library.js";
import { pathOf } from "../routes.js";

export const ROW_SIZE = 10;
// Shared sections: [section, title, needs signing in] (ReplaysPage.SHARED).
export const SHARED = [["trending", "Trending", false], ["new", "New", false], ["friends", "Friends' Replays", true],
  ["liked", "Liked", true], ["favorites", "Favorites", true]];
export const SORTS = [["trending", "Trending"], ["newest", "Newest"], ["liked", "Most liked"],
  ["downloads", "Most downloaded"], ["name", "Name"]];
export const SIZES = [["", "Any size"], ["small", "Small (up to 16)"], ["medium", "Medium (17 to 32)"], ["large", "Large (33+)"]];
export const PLAYERS = [[0, "Any Players"], [2, "2+ Players"], [3, "3+ Players"], [4, "4 Players"]];
// Replay.OUTDATED_TEXT.
export const OUTDATED_TEXT = "Past replays may not work correctly with modern fixes";

// GameMenu.clock(): "24:10", or "1:02:03" for an hour or more.
export function clock(seconds) {
  const s = Math.floor(Number(seconds) || 0);
  const two = (n) => String(n).padStart(2, "0");
  return s >= 3600 ? `${Math.floor(s / 3600)}:${two(Math.floor(s / 60) % 60)}:${two(s % 60)}` : `${Math.floor(s / 60)}:${two(s % 60)}`;
}

// "Meadow · 24:10 · 48 Turns" (ReplaysPage._facts_line()).
export function factsLine(facts, pending = false) {
  facts = facts || {};
  if (pending) return `${facts.map || "?"} · working out its length…`;
  return `${facts.map || "?"} · ${clock(facts.seconds)} · ${Number(facts.turns) || 0} Turns`;
}

// Replay.version_less(): "0.9.2" < "0.18.0", number by number.
export function versionLess(a, b) {
  const x = String(a).split("."), y = String(b).split(".");
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const p = parseInt(x[i] ?? "0", 10) || 0, q = parseInt(y[i] ?? "0", 10) || 0;
    if (p !== q) return p < q;
  }
  return false;
}

// ReplaysPage.matches_search(): every word in the title, description, map,
// Players' names or date, or as the number of Players ("4 players", "4p").
export function matchesSearch(entry, words) {
  const f = entry.facts || {};
  const players = Number(f.players) || 0;
  const text = [entry.name, entry.description, f.map, (f.names || []).join(" "), f.date, `${players} players ${players}p`]
    .map((x) => String(x ?? "")).join(" ").toLowerCase();
  return words.every((w) => text.includes(w));
}

export function searchWords(text) {
  return String(text).toLowerCase().split(" ").filter((w) => w !== "");
}

// `app`: as for the Maps page (pages/maps.js): address, inGame, say.
export function replaysPage(app) {
  const view = { name: "home", section: "", id: 0, path: "" };
  let local = null;              // the game's replays on this computer, once it has answered
  let sharedMine = new Map();    // your shared replays as the server lists them (id -> item)
  let rulesChanged = "";         // Replay.RULES_CHANGED, from the web build
  let refreshes = 0, localAsks = 0;

  // ---------------------------------------------------------------- the rows
  const rows = {}, sections = {};
  const find = h("input", { type: "search", placeholder: "Search your replays…", "aria-label": "Search your replays",
    title: "Title, description, map, Players' names, or \"4 players\". Browse all searches shared replays." });
  const home = h("div", { class: "maps-home" },
    h("div", { class: "head" },
      h("h1", { text: "Replays" }),
      h("a", { class: "wbtn page-btn", href: "/replays", text: "Browse all", title: "Every shared replay, with sorts and filters.",
        onclick: (e) => { e.preventDefault(); search.value = ""; openAll("all"); } }),
      find));
  find.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    search.value = find.value;
    find.value = "";
    openAll("yours");
  });
  function section(key, title) {
    const row = h("div", { class: "cards" });
    const box = h("section", { class: "maps-row", dataset: { section: key } },
      h("div", { class: "row-head" }, h("h2", { text: title }), h("button", { class: "flat", type: "button", text: "See all", onclick: () => openAll(key) }),
        foldButton("replays_" + key, row)), row);
    home.append(box);
    rows[key] = row;
    sections[key] = box;
  }
  section("yours", "Your Replays");
  for (const [key, title] of SHARED) section(key, title);

  // ---------------------------------------------------------------- See all
  const allTitle = h("h1");
  const search = h("input", { type: "search", placeholder: "Search…", "aria-label": "Search",
    title: "Words from the title, description, map, Players' names, or the number of Players (\"4 players\" or \"4p\")." });
  const select = (pairs, label) => h("select", { "aria-label": label }, pairs.map(([value, text]) => h("option", { value: String(value), text })));
  const sort = select(SORTS, "Sort");
  const players = select(PLAYERS, "Players");
  players.title = "How many Players the match had.";
  const size = select(SIZES, "Map size");
  const favoritesOnly = h("input", { type: "checkbox" });
  const favoritesLabel = h("label", { class: "check" }, favoritesOnly, " Favourites only");
  const creator = h("input", { type: "search", placeholder: "Shared by…", "aria-label": "Shared by" });
  const grid = h("div", { class: "cards grid" });
  const more = h("button", { class: "wbtn", type: "button", text: "Show more", hidden: true, onclick: () => loadAll(false) });
  const allView = h("div", { class: "maps-all", hidden: true },
    h("div", { class: "head" }, h("button", { class: "wbtn", type: "button", text: "← Back", onclick: () => showHome() }), allTitle),
    h("div", { class: "filters" }, search, sort, players, size, favoritesLabel, creator), grid, more);
  let offset = 0, allAsks = 0;
  for (const control of [sort, players, size, favoritesOnly]) control.addEventListener("change", () => loadAll(true));
  for (const box of [search, creator]) {
    box.addEventListener("keydown", (e) => { if (e.key === "Enter") loadAll(true); });
    box.addEventListener("search", () => loadAll(true));
  }
  search.addEventListener("input", () => { if (view.section === "yours") loadAll(true); });

  const detail = replayDetail();
  const el = h("div", { class: "pad maps replays" }, home, allView, detail.el);

  // ---------------------------------------------------------------- cards
  function outdated(facts) {
    return rulesChanged !== "" && versionLess(String((facts && facts.game_version) || "0"), rulesChanged);
  }

  function sharedCard(item) {
    const meta = item.meta || {};
    return card({ name: String(item.name || ""), picture: thumb(item), line: factsLine(meta),
      likes: Number(item.likes) || 0, dislikes: Number(item.dislikes) || 0, href: pathOf("replays", item.id),
      warning: outdated(meta) ? OUTDATED_TEXT : "", open: () => openShared(Number(item.id), item) });
  }

  function localCard(entry) {
    const listing = entry.online_id > 0 ? sharedMine.get(String(entry.online_id)) : null;
    return card({ name: entry.name, picture: entry.picture, line: factsLine(entry.facts, entry.pending),
      likes: listing ? Number(listing.likes) || 0 : -1, dislikes: listing ? Number(listing.dislikes) || 0 : 0,
      href: entry.online_id > 0 ? pathOf("replays", entry.online_id) : "/replays",
      warning: entry.outdated ? OUTDATED_TEXT : "", open: () => openLocal(entry) });
  }

  // Your replays' cards (ReplaysPage.your_cards()): the ones on this computer
  // (with likes when shared), then ones you shared that aren't on this computer.
  function yourCards(limit) {
    const cards = (local || []).map(localCard);
    const here = new Set((local || []).map((e) => String(e.online_id)));
    for (const [id, item] of sharedMine) if (!here.has(id)) cards.push(sharedCard(item));
    return cards.slice(0, limit);
  }

  // ---------------------------------------------------------------- filling
  function refresh() {
    const asked = ++refreshes;
    showYours();
    loadYours(asked);
    for (const [key, , needsSignIn] of SHARED) {
      sections[key].hidden = needsSignIn && !account.signedIn();
      if (!sections[key].hidden) loadRow(key, asked);
    }
    if (view.name === "all" && view.section !== "yours") loadAll(true);
    if (game.isReady()) askLocal();
  }

  function showYours() {
    const cards = yourCards(ROW_SIZE);
    if (cards.length) cards.push(seeAllCard(() => openAll("yours")));
    fillRow(rows.yours, cards, local ? "Replays you save show here: press Save Replay at the end of a match, or turn on Save every match's replay in Settings, Gameplay." : "");
    // Only the ones on this computer wait for the game.
    if (!local) rows.yours.prepend(loading("Your replays appear once the game has loaded…"));
  }

  async function loadYours(asked) {
    if (!account.signedIn()) {
      sharedMine = new Map();
      return;
    }
    const r = await browse("replays", { section: "mine", limit: 60 });
    if (asked !== refreshes) return;
    sharedMine = new Map((r.items || []).map((item) => [String(item.id), item]));
    showYours();
    if (view.name === "all" && view.section === "yours") loadAll(true);
  }

  async function loadRow(key, asked) {
    fill(rows[key], loading("Looking…"));
    const r = await browse("replays", { section: key, limit: ROW_SIZE });
    if (asked !== refreshes) return;
    const cards = (r.items || []).map(sharedCard);
    if (cards.length) cards.push(seeAllCard(() => openAll(key)));
    fillRow(rows[key], cards, r.error ? "Couldn't reach the Replays server. Your own replays still work." : "Nothing here yet.");
  }

  async function askLocal() {
    const asked = ++localAsks;
    const r = await game.ask("replays.local");
    if (asked !== localAsks || r.error) return;
    local = r.replays || [];
    showYours();
    if (view.name === "all" && view.section === "yours") loadAll(true);
    detail.localChanged();
  }

  async function loadRulesVersion() {
    try {
      const r = await fetch("shell/game.json");
      rulesChanged = r.ok ? String((await r.json()).rules_changed || "") : "";
    } catch { rulesChanged = ""; }
    if (rulesChanged) refresh();
  }

  // ---------------------------------------------------------------- views
  function showView(name) {
    view.name = name;
    home.hidden = name !== "home";
    allView.hidden = name !== "all";
    detail.el.hidden = name !== "detail";
    el.closest(".view")?.scrollTo(0, 0);
  }

  function showHome({ push = true } = {}) {
    showView("home");
    view.id = 0; view.path = "";
    if (push) app.address("");
  }

  function openAll(key) {
    view.section = key;
    showView("all");
    app.address("");
    const titles = { yours: "Your Replays", all: "All Replays", ...Object.fromEntries(SHARED.map(([k, t]) => [k, t])) };
    allTitle.textContent = titles[key] || "Replays";
    // Your replays (on this computer): search and Players; shared ones, everything.
    for (const control of [sort, size, creator]) control.hidden = key === "yours";
    favoritesLabel.hidden = !account.signedIn() || key === "yours";
    sort.value = { trending: "trending", new: "newest" }[key] || "newest";
    loadAll(true);
  }

  async function loadAll(reset) {
    const asked = ++allAsks;
    if (reset) { offset = 0; fill(grid); }
    if (view.section === "yours") {
      more.hidden = true;
      const words = searchWords(search.value);
      const fewest = Number(players.value) || 0;
      const filtering = words.length > 0 || fewest > 0;
      if (!local && filtering) { fill(grid, loading("Your replays appear once the game has loaded…")); return; }
      if (filtering) {
        const found = local.filter((e) => (Number(e.facts && e.facts.players) || 0) >= fewest && matchesSearch(e, words));
        fillRow(grid, found.map(localCard), "No replays match.");
        return; // (shared-only ones have no details here to search)
      }
      fillRow(grid, yourCards(9999), local ? "" : null);
      if (!local) grid.prepend(loading("Your replays appear once the game has loaded…"));
      return;
    }
    // "all" is every shared one: the New section without its usual sort.
    const params = { section: view.section === "all" ? "new" : view.section, sort: sort.value, limit: ROW_SIZE * 3, offset };
    if (Number(players.value) > 0) params.players = players.value;
    if (size.value) params.size = size.value;
    if (favoritesOnly.checked && account.signedIn()) params.favorites = 1;
    if (creator.value.trim()) params.creator = creator.value.trim();
    if (search.value.trim()) params.search = search.value.trim();
    const wait = loading("Looking…");
    grid.after(wait);
    more.hidden = true;
    const r = await browse("replays", params);
    wait.remove();
    if (asked !== allAsks) return;
    if (r.error) fill(grid, note(r.error));
    else if (reset && !(r.items || []).length) fill(grid, note("No replays match."));
    for (const item of r.items || []) grid.append(sharedCard(item));
    offset += (r.items || []).length;
    more.hidden = !r.more;
  }

  function openShared(id, item = null, { push = true, comment = 0 } = {}) {
    showView("detail");
    Object.assign(view, { id, path: "" });
    if (push) app.address(String(id));
    detail.showShared(id, item, comment);
  }

  function openLocal(entry, { push = true } = {}) {
    showView("detail");
    Object.assign(view, { id: entry.online_id > 0 ? entry.online_id : 0, path: entry.path });
    if (push) app.address(entry.online_id > 0 ? String(entry.online_id) : "");
    detail.showLocal(entry);
  }

  function missing(text = "That replay isn't shared any more, or the link is wrong.") {
    showHome({ push: false });
    app.address("", { replace: true });
    app.say(text);
  }

  // Hand over to the game for `what` (watch, edit, view); its error is said here.
  function inGame(title, what, args, say) {
    return app.inGame(title, () => game.ask(what, args)).then((r) => {
      if (r && r.error) say(r.error);
      return r;
    });
  }

  // ---------------------------------------------------------------- one replay's page
  function replayDetail() {
    let item = {};      // its listing ({} if it isn't shared, or until it loads)
    let entry = null;   // it on this computer (the game's)
    let shown = 0;
    let editing = false;
    let checked = false; // whether the game has said if a shared one is on this computer
    const comments = commentsBox();
    const picture = panZoom();
    const viewMap = h("button", { class: "wbtn", type: "button", text: "View map", title: "Look round the whole map before you play." });
    const fields = h("div", { class: "fields" });
    const creatorLink = h("a", { class: "creator", title: "Their profile", "data-go": "player" });
    const facts = h("p", { class: "muted facts" });
    const votes = votesRow("replays", "this replay", { say: (t) => say(t), changed: (changed) => { item = changed; build(); } });
    const actions = h("div", { class: "actions" });
    const status = h("p", { class: "status", role: "status" });
    const box = h("div", { class: "map-detail", hidden: true },
      h("div", { class: "head" }, h("button", { class: "wbtn", type: "button", text: "← Back", onclick: () => showHome() })),
      h("div", { class: "detail-row" },
        h("div", { class: "detail-pic" }, picture.el, viewMap),
        h("div", { class: "detail-info" }, fields, creatorLink, facts, votes.el, actions, status)),
      comments.el);
    viewMap.addEventListener("click", () => inGame("Map", "replays.view", { path: entry.path }, say));

    function say(text) { status.textContent = text || ""; }
    const shared = () => !!(item && item.id);
    const mine = () => !!(entry && entry.mine);

    function showShared(id, card, comment) {
      shown++;
      item = card ? { ...card } : { id };
      entry = null;
      checked = false;
      editing = false;
      say("");
      build();
      comments.showFor("replays", 0);
      findHere(id);
      loadListing(id, { comment, fromLink: !card });
    }

    function showLocal(e) {
      shown++;
      item = {};
      entry = e;
      checked = true;
      editing = false;
      say("");
      build();
      comments.showFor("replays", e.online_id > 0 ? e.online_id : 0);
      if (e.online_id > 0) loadMine(e.online_id);
    }

    // Whether shared replay `id` is on this computer (yours, or fetched to watch).
    async function findHere(id) {
      const asked = shown;
      const r = await game.ask("replays.for_listing", { id });
      if (asked !== shown) return;
      checked = true;
      if (r.entry) entry = r.entry;
      build();
    }

    async function loadListing(id, { comment = 0, fromLink = false }) {
      const asked = shown;
      const got = await fetchItem("replays", id);
      if (asked !== shown) return;
      if (got.error) {
        if (fromLink) missing(got.status === 404 ? undefined : got.error);
        else say(got.error);
        return;
      }
      delete got.data; // (the replay itself: the game fetches it to watch)
      item = got;
      build();
      comments.showFor("replays", id, comment);
    }

    // Your shared replay's listing, for its likes (ReplayDetail._load_listing()).
    async function loadMine(id) {
      const asked = shown;
      const listed = sharedMine.get(String(id));
      if (listed) { item = { ...listed }; build(); return; }
      const r = await browse("replays", { section: "mine", limit: 60 });
      if (asked !== shown) return;
      const found = (r.items || []).find((x) => Number(x.id) === id);
      if (found) { item = found; build(); }
    }

    function localChanged() {
      if (box.hidden || !entry || !entry.path || !local) return;
      const now = local.find((e) => e.path === entry.path);
      if (now) { entry = now; build(); }
    }

    function build() {
      const meta = mine() ? {} : item.meta || {};
      const f = entry ? entry.facts || {} : {};
      const name = entry ? entry.name : String(item.name || "");
      const description = mine() ? entry.description : String(item.description || "");
      if (!editing) buildFields(name, description);
      picture.set(entry && entry.picture ? entry.picture : thumb(item));
      viewMap.hidden = !(entry && entry.viewable);
      const maker = String((item.creator && item.creator.username) || "");
      creatorLink.hidden = maker === "" || mine();
      creatorLink.textContent = `shared by ${maker}`;
      creatorLink.href = pathOf("player", maker) || "#";
      creatorLink.dataset.id = maker;
      const names = f.names || meta.names || [];
      const lines = [`Map: ${f.map || meta.map || "?"}`];
      if (names.length) lines.push(`Players: ${names.join(", ")}`);
      if (entry && entry.pending && !Object.keys(meta).length) lines.push("Time and Turns: working them out…");
      else {
        lines.push(`Time ${clock(f.seconds ?? meta.seconds)}`);
        lines.push(`${Number(f.turns ?? meta.turns) || 0} Turns (${Number(f.rounds ?? meta.rounds) || 0} Rounds)`);
      }
      if (entry ? entry.outdated : outdated(meta)) lines.push(`⚠ ${OUTDATED_TEXT} (recorded on an older version).`);
      facts.textContent = lines.join("\n");
      votes.show(shared() ? item : {});
      buildActions(name);
    }

    function buildFields(name, description) {
      const heading = h("h1", { class: "map-name", text: name });
      const text = h("p", { class: "description", text: description || "" });
      if (!mine()) { fill(fields, heading, description ? text : null); return; }
      fill(fields, h("div", { class: "name-line" }, heading,
        h("button", { class: "pencil", type: "button", title: "Change its name and description", "aria-label": "Edit name and description",
          text: "✎", onclick: () => startEditing(name, description) })), description ? text : null);
    }

    function startEditing(name, description) {
      editing = true;
      const nameBox = h("input", { type: "text", value: name, maxlength: "40", "aria-label": "Name" });
      const text = h("textarea", { rows: "4", placeholder: "A few words about the match.", "aria-label": "Description" });
      text.value = description;
      fill(fields, nameBox, text, h("div", { class: "row-line" },
        h("button", { class: "wbtn", type: "button", text: "Save changes", onclick: () => saveText(nameBox.value, text.value) }),
        h("button", { class: "wbtn", type: "button", text: "Cancel", onclick: () => { editing = false; build(); } })));
      nameBox.focus();
    }

    async function saveText(name, description) {
      const r = await game.ask("replays.rename", { path: entry.path, name, description });
      if (r.error) { say(r.error); return false; }
      editing = false;
      entry = r.entry;
      say("Saved." + (entry.online_id > 0 ? " Press Update listing to change it on the Replays page too." : ""));
      build();
      askLocal();
      return true;
    }

    function action(text, title, work, { disabled = false } = {}) {
      const b = h("button", { class: "wbtn", type: "button", text, title, disabled, onclick: work });
      actions.append(b);
      return b;
    }

    function buildActions(name) {
      fill(actions);
      const signedIn = account.signedIn();
      action("Watch", "Step through it, play it at any speed, or carry on from any point.", watch);
      if (!checked) actions.append(loading("Checking this computer…"));
      if (entry && entry.path) action("Download", "Save the replay as a .zip file, to keep or send to someone.", download);
      if (mine()) {
        action("Edit", "Trim and cut the replay, then save it over this one or as a new one.",
          () => inGame("Replay", "replays.edit", { path: entry.path }, say));
        action("Delete", "Delete this replay from this computer.", askDelete);
        const b = action(entry.online_id > 0 ? "Update listing" : "Share", "Put it on the Replays page for everyone (again, to update it: likes stay).",
          share, { disabled: !signedIn || !account.emailConfirmed() });
        if (!signedIn) b.title = "Sign in on your Profile page to share replays.";
        else if (!account.emailConfirmed()) b.title = "Confirm your email to share replays: the link is in the email sent when you signed up.";
      }
      if (shared() && signedIn) {
        const creator = item.creator || {};
        const maker = String(creator.username || "");
        const own = maker === account.username();
        const staff = !own && account.outranks(creator);
        if (own) action("Take down", "Remove the listing from the Replays page (your copy stays).", takeDown);
        else if (staff) {
          action("Take down", "Staff: remove their listing from the Replays page.", async () => {
            if (await confirmBox(`Take down ${maker}'s replay "${name}" from the Replays page?`)) takeDown();
          });
        }
        if (staff) {
          const hidden = !!item.hidden;
          action(hidden ? "Show" : "Hide", "Staff: hide it from everyone else (or show it again).", async () => {
            if (await confirmBox(`${hidden ? "Show" : "Hide"} ${maker}'s replay "${name}" ${hidden ? "to" : "from"} everyone else?`)) hide();
          });
        }
      }
    }

    function watch() {
      const args = entry && entry.path ? { path: entry.path } : { id: Number(item.id) };
      if (!args.path) say("Fetching the replay…");
      inGame("Replay", "replays.watch", args, say).then((r) => { if (r && !r.error) say(""); });
    }

    async function download() {
      say("Packing it up…");
      const r = await game.ask("replays.download", { path: entry.path });
      if (r.error) { say(r.error); return; }
      const bytes = Uint8Array.from(atob(r.data), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/zip" }));
      const a = h("a", { href: url, download: r.name || "replay.zip", hidden: true });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      say("");
    }

    // Delete: "Are you sure?" first; a shared one can be taken down too, or kept on the Replays page.
    async function askDelete() {
      const title = entry.name.trim();
      const sharedHere = entry.online_id > 0;
      const choice = await popup("Delete replay", (close) => h("div", { class: "pop-body" },
        h("p", { text: sharedHere ? `Are you sure? "${title}" will be deleted from this computer and taken off the Replays page.`
          : `Are you sure? "${title}" will be deleted from this computer.` }),
        h("div", { class: "pop-buttons" },
          h("button", { class: "wbtn yes", type: "button", text: sharedHere ? "Delete everywhere" : "Delete", onclick: () => close("all") }),
          sharedHere ? h("button", { class: "wbtn", type: "button", text: "Only from this computer", onclick: () => close("local") }) : null,
          h("button", { class: "wbtn", type: "button", text: "Cancel", onclick: () => close(undefined) }))));
      if (!choice) return;
      if (choice === "all" && sharedHere) {
        const r = await call("DELETE", `/replays/${entry.online_id}`);
        if (r.status !== 200) { say(`Couldn't take it off the Replays page: ${why(r)}`); return; }
      }
      const r = await game.ask("replays.delete", { path: entry.path });
      if (r.error) { say(r.error); return; }
      askLocal();
      showHome();
    }

    async function share() {
      if (editing) {
        const nameBox = fields.querySelector("input"), text = fields.querySelector("textarea");
        if (!(await saveText(nameBox.value, text.value))) return;
      }
      say("Sharing…");
      const r = await game.ask("replays.share", { path: entry.path });
      if (r.error) { say(r.error); return; }
      entry = r.entry;
      item = r.item || {};
      view.id = Number(item.id) || 0;
      app.address(String(item.id), { replace: true });
      say("Shared: it's on the Replays page for everyone.");
      build();
      comments.showFor("replays", Number(item.id));
      askLocal();
    }

    async function takeDown() {
      const r = await call("DELETE", `/replays/${item.id}`);
      if (r.status !== 200) { say(why(r)); return; }
      if (mine()) {
        const u = await game.ask("replays.unshared", { path: entry.path });
        if (u.entry) entry = u.entry;
        askLocal();
      }
      item = {};
      view.id = 0;
      if (entry) app.address("", { replace: true });
      say("Taken down from the Replays page.");
      build();
      comments.showFor("replays", 0);
    }

    async function hide() {
      const hidden = !item.hidden;
      const r = await call("POST", `/replays/${item.id}/hide`, { hidden });
      say(why(r));
      if (r.status === 200) item.hidden = hidden;
      build();
    }

    return { el: box, showShared, showLocal, localChanged, rebuild: () => { if (!box.hidden) build(); } };
  }

  // ---------------------------------------------------------------- wiring
  account.onChange(() => { refresh(); detail.rebuild(); });
  game.onReady(() => askLocal());
  game.onChanged("replays", () => askLocal());
  loadRulesVersion();
  refresh();

  return {
    el,
    // Show the page: `id` "" for its rows or a shared replay's number;
    // undefined keeps what it showed (back from watching one).
    show({ id, comment = 0 } = {}) {
      if (game.isReady()) askLocal();
      if (id === undefined || id === null) return;
      id = String(id);
      if (id === "") {
        if (view.name !== "home") showHome({ push: false });
      } else if (/^\d+$/.test(id) && Number(id) > 0) {
        if (view.name !== "detail" || view.id !== Number(id) || comment) openShared(Number(id), null, { push: false, comment });
      } else {
        missing();
      }
    },
    address() {
      return view.name === "detail" && view.id > 0 ? String(view.id) : "";
    },
  };
}

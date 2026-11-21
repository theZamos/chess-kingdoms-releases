// The Maps page as a webpage (.scratch/html-menus/), the same as the game's
// (game/maps_page.gd, game/map_detail.gd): rows of cards (Your Maps, the shared
// sections, the Built-in Maps), See all with sorts, Tags and filters, and one
// map's page with its picture, likes, actions, replays and comments. It shows
// at once: shared maps come from the accounts server, the built-in ones from
// the list made with the web build (tools/make_web_art.gd); only what the game
// keeps (your own maps, which maps are on this computer) waits for it behind a
// loading sign, asked with game.ask("maps.…") (game/web_maps.gd). Opening the
// Map Maker or the map viewer hands over to the game.

import { call, browse, fetchItem, why } from "../api.js";
import { account } from "../account.js";
import { game } from "../game.js";
import { h, fill, loading, note, confirmBox, foldButton } from "../ui.js";
import { commentsBox } from "../comments.js";
import { card as libraryCard, seeAllCard as libraryAll, fillRow, thumb, votesText, votesRow, panZoom } from "../library.js";
import { pathOf } from "../routes.js";

export const ROW_SIZE = 10;
// Shared sections: [section, title, needs signing in] (MapsPage.SHARED).
export const SHARED = [["trending", "Trending", false], ["new", "New", false], ["friends", "Friends' Maps", true],
  ["liked", "Liked", true], ["favorites", "Favorites", true]];
export const SORTS = [["trending", "Trending"], ["newest", "Newest"], ["liked", "Most liked"],
  ["downloads", "Most downloaded"], ["name", "Name"]];
// MapPreview.PIXELS_PER_TILE: a card picture smaller than this per tile was shrunk.
const PIXELS_PER_TILE = 4;
// A map page's button that sets up a game on it (the game's MapDetail.HOST_LOBBY).
const HOST_LOBBY = "Host a lobby";
const HOST_LOBBY_TIP = "Set up a Play Local game on this map (as many Players as it has start spots). In a lobby you host, it switches the lobby to this map.";

// MapLibrary.file_name_for(): a map's file name from its name.
export function fileNameFor(name) {
  let safe = "";
  for (const c of String(name).trim().toLowerCase()) safe += /[a-z0-9]/.test(c) ? c : "_";
  safe = safe.replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  return (safe || "map") + ".tres";
}

// `app`: what the page needs from the rest of the webpage:
//   address(id, {replace}): the page now shows `id` ("" for the rows),
//   inGame(title, run): hand over to the game for `run()` (an ask that shows
//     the game, such as the Map Maker), after the wait screen if it's loading;
//     resolves with run()'s answer,
//   go(page, id): another page (a replay on this map, on the Replays page),
//   say(text): a note at the bottom of the page for a few seconds.
export function mapsPage(app) {
  const view = { name: "home", section: "", id: 0, builtIn: "", path: "" };
  let local = null;            // the game's {yours, built_in}, once it has answered
  let builtIns = null;         // the web build's list, until then
  let refreshes = 0;
  let localAsks = 0;
  let pictureQueue = Promise.resolve();
  const pictures = new Map(); // shared map id_updated -> full-detail picture

  // ---------------------------------------------------------------- the rows
  const rows = {}, sections = {}, seeAll = {};
  const home = h("div", { class: "maps-home" });
  const head = h("div", { class: "head" },
    h("h1", { text: "Maps" }),
    h("a", { class: "wbtn page-btn", href: "/maps", text: "Browse all", title: "Every shared map, with sorts and filters.",
      onclick: (e) => { e.preventDefault(); openAll("all"); } }),
    h("button", { class: "wbtn page-btn big", type: "button", text: "New Map", title: "Open the Map Maker on a blank map.",
      onclick: () => edit("") }));
  home.append(head);
  function section(key, title) {
    const row = h("div", { class: "cards" });
    const all = h("button", { class: "flat", type: "button", text: "See all", onclick: () => openAll(key) });
    const box = h("section", { class: "maps-row", dataset: { section: key } },
      h("div", { class: "row-head" }, h("h2", { text: title }), all, foldButton("maps_" + key, row)), row);
    home.append(box);
    rows[key] = row;
    sections[key] = box;
    seeAll[key] = all;
  }
  section("yours", "Your Maps");
  for (const [key, title] of SHARED) section(key, title);
  section("built_in", "Built-in Maps");
  seeAll.built_in.hidden = true; // the row already shows every one

  // ---------------------------------------------------------------- See all
  const allTitle = h("h1");
  const sort = h("select", { "aria-label": "Sort" }, SORTS.map(([value, label]) => h("option", { value, text: label })));
  const tagsButton = h("button", { class: "wbtn", type: "button", text: "Tags", "aria-pressed": "false",
    title: "Tick Tags to show only maps with every one of them." });
  const favoritesOnly = h("input", { type: "checkbox" });
  const favoritesLabel = h("label", { class: "check" }, favoritesOnly, " Favourites only");
  const creator = h("input", { type: "search", placeholder: "Made by…", "aria-label": "Made by" });
  const filters = h("div", { class: "filters" }, sort, tagsButton, favoritesLabel, creator);
  const tags = tagBox(() => { tagsButton.textContent = tags.ticked.size ? `Tags (${tags.ticked.size})` : "Tags"; loadAll(true); });
  tags.el.hidden = true;
  const grid = h("div", { class: "cards grid" });
  const more = h("button", { class: "wbtn", type: "button", text: "Show more", hidden: true, onclick: () => loadAll(false) });
  const allView = h("div", { class: "maps-all", hidden: true },
    h("div", { class: "head" }, h("button", { class: "wbtn", type: "button", text: "← Back", onclick: () => showHome() }), allTitle),
    filters, tags.el, grid, more);
  let offset = 0, allAsks = 0;
  sort.addEventListener("change", () => loadAll(true));
  favoritesOnly.addEventListener("change", () => loadAll(true));
  creator.addEventListener("keydown", (e) => { if (e.key === "Enter") loadAll(true); });
  creator.addEventListener("search", () => loadAll(true));
  tagsButton.addEventListener("click", () => {
    tags.el.hidden = !tags.el.hidden;
    tagsButton.setAttribute("aria-pressed", String(!tags.el.hidden));
    tagsButton.classList.toggle("on", !tags.el.hidden);
    if (!tags.el.hidden) tags.load();
  });

  // ---------------------------------------------------------------- one map
  const detail = mapDetail();
  const el = h("div", { class: "pad maps" }, home, allView, detail.el);

  // ---------------------------------------------------------------- cards
  function card({ item, ...rest }) {
    const a = libraryCard({ href: "/maps", ...rest });
    const img = a.querySelector("img");
    if (item && img) sharpen(img, item);
    return a;
  }

  function seeAllCard(key) {
    return libraryAll(() => openAll(key));
  }

  // A shared card picture that was shrunk (maps shared before v0.10.1): the
  // game draws it in full detail once it's loaded (SharedMapPicture).
  function sharpen(img, item) {
    const key = `${item.id}_${item.updated || 0}`;
    if (pictures.has(key)) { img.src = pictures.get(key); return; }
    img.addEventListener("load", () => {
      const fullW = (Number(item.width) || 0) * PIXELS_PER_TILE, fullH = (Number(item.height) || 0) * PIXELS_PER_TILE;
      if (!fullW || !fullH || (img.naturalWidth >= fullW && img.naturalHeight >= fullH)) return;
      pictureQueue = pictureQueue.then(async () => {
        if (!pictures.has(key)) {
          const r = await game.ask("maps.picture", { item: { id: item.id, updated: item.updated, width: item.width, height: item.height } });
          if (r.picture) pictures.set(key, r.picture);
        }
        if (pictures.has(key) && img.isConnected) img.src = pictures.get(key);
      });
    }, { once: true });
  }

  function sharedCard(item) {
    const by = (item.creator && item.creator.username) || "?";
    return card({ name: String(item.name || ""), picture: thumb(item), item,
      line: `by ${by} · ${Number(item.players) || 0} Players`, likes: Number(item.likes) || 0, dislikes: Number(item.dislikes) || 0,
      href: pathOf("maps", item.id), open: () => openShared(Number(item.id), item) });
  }

  function localCard(entry) {
    let line = "Built in";
    if (entry.downloaded) line = `by ${entry.creator}`;
    else if (entry.online_id > 0) line = "Yours · shared";
    else if (!entry.built_in) line = "Yours";
    const a = card({ name: entry.name, picture: entry.picture, line,
      href: entry.built_in ? pathOf("maps", entry.address) : entry.online_id > 0 && !entry.downloaded ? pathOf("maps", entry.online_id) : "/maps",
      open: () => openLocal(entry) });
    if (entry.online_id > 0 && !entry.downloaded) a.dataset.onlineId = String(entry.online_id);
    return a;
  }

  // The web build's built-in map, before the game has said its own list.
  function builtInCard(m) {
    return card({ name: m.name, picture: `shell/maps/${encodeURIComponent(m.file)}`, line: "Built in",
      href: pathOf("maps", m.address), open: () => openBuiltIn(m.address) });
  }

  // ---------------------------------------------------------------- filling
  function refresh() {
    const asked = ++refreshes;
    showYours();
    showBuiltIns();
    for (const [key, , needsSignIn] of SHARED) {
      sections[key].hidden = needsSignIn && !account.signedIn();
      if (!sections[key].hidden) loadRow(key, asked);
    }
    if (view.name === "all" && view.section !== "yours") loadAll(true);
    if (game.isReady()) askLocal();
  }

  function showYours() {
    if (!local) {
      fill(rows.yours, loading("Your maps appear once the game has loaded…"));
      return;
    }
    const cards = local.yours.slice(0, ROW_SIZE).map(localCard);
    if (cards.length) cards.push(seeAllCard("yours"));
    fillRow(rows.yours, cards, "Maps you make or download show here. Press New Map, or copy a built-in one.");
    showMyVotes(refreshes);
  }

  function showBuiltIns() {
    if (local) fillRow(rows.built_in, local.built_in.map(localCard), "");
    else if (builtIns) fillRow(rows.built_in, builtIns.map(builtInCard), "");
    else fill(rows.built_in, loading("Loading the built-in maps…"));
  }

  async function loadBuiltIns() {
    try {
      const r = await fetch("shell/maps/index.json");
      builtIns = r.ok ? await r.json() : [];
    } catch { builtIns = []; }
    if (!Array.isArray(builtIns)) builtIns = [];
    if (!local) showBuiltIns();
    if (detail.waitingFor() && builtIns.some((m) => String(m.address).toLowerCase() === detail.waitingFor().toLowerCase())) {
      openBuiltIn(detail.waitingFor(), { push: false });
    }
  }

  async function loadRow(key, asked) {
    fill(rows[key], loading("Looking…"));
    const r = await browse("maps", { section: key, limit: ROW_SIZE });
    if (asked !== refreshes) return;
    const cards = (r.items || []).map(sharedCard);
    if (cards.length) cards.push(seeAllCard(key));
    fillRow(rows[key], cards, r.error ? "Couldn't reach the Maps server. Your own maps still work." : "Nothing here yet.");
  }

  // Likes and dislikes on your shared maps' cards in Your Maps.
  async function showMyVotes(asked) {
    if (!account.signedIn()) return;
    const r = await browse("maps", { section: "mine", limit: 60 });
    if (asked !== refreshes) return;
    const byId = new Map((r.items || []).map((item) => [String(item.id), item]));
    for (const a of el.querySelectorAll(".card[data-online-id]")) {
      const item = byId.get(a.dataset.onlineId);
      if (!item) continue;
      const votes = a.querySelector(".votes");
      votes.hidden = false;
      votes.textContent = votesText(item.likes, item.dislikes);
    }
  }

  // The game's own list: your maps and its built-in ones (with Developers'
  // uploads), each with its picture.
  async function askLocal() {
    const asked = ++localAsks;
    const r = await game.ask("maps.local");
    if (asked !== localAsks || r.error) return;
    local = { yours: r.yours || [], built_in: r.built_in || [] };
    showYours();
    showBuiltIns();
    if (view.name === "all" && view.section === "yours") loadAll(true);
    detail.localChanged();
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
    view.id = 0; view.builtIn = ""; view.path = "";
    if (push) app.address("");
  }

  function openAll(key) {
    view.section = key;
    showView("all");
    app.address("");
    const titles = { yours: "Your Maps", all: "All Maps", ...Object.fromEntries(SHARED.map(([k, t]) => [k, t])) };
    allTitle.textContent = titles[key] || "Maps";
    filters.hidden = key === "yours";
    tags.el.hidden = key === "yours" || tagsButton.getAttribute("aria-pressed") !== "true";
    favoritesLabel.hidden = !account.signedIn();
    sort.value = { trending: "trending", new: "newest" }[key] || "newest";
    loadAll(true);
  }

  async function loadAll(reset) {
    const asked = ++allAsks;
    if (reset) {
      offset = 0;
      fill(grid);
    }
    if (view.section === "yours") {
      more.hidden = true;
      if (!local) fill(grid, loading("Your maps appear once the game has loaded…"));
      else fillRow(grid, local.yours.map(localCard), "No maps here yet.");
      showMyVotes(refreshes);
      return;
    }
    // "all" is every shared one: the New section without its usual sort.
    const params = { section: view.section === "all" ? "new" : view.section, sort: sort.value, limit: ROW_SIZE * 3, offset };
    if (tags.ticked.size) params.tags = [...tags.ticked].join(",");
    if (favoritesOnly.checked && account.signedIn()) params.favorites = 1;
    if (creator.value.trim()) params.creator = creator.value.trim();
    const wait = loading("Looking…");
    grid.after(wait);
    more.hidden = true;
    const r = await browse("maps", params);
    wait.remove();
    if (asked !== allAsks) return;
    if (r.error) fill(grid, note(r.error));
    else if (reset && !(r.items || []).length) fill(grid, note("No maps match."));
    for (const item of r.items || []) grid.append(sharedCard(item));
    offset += (r.items || []).length;
    more.hidden = !r.more;
  }

  // Open shared map `id` (`card`: its listing from a row, shown while the whole one loads).
  function openShared(id, card = null, { push = true, comment = 0 } = {}) {
    showView("detail");
    Object.assign(view, { id, builtIn: "", path: "" });
    if (push) app.address(String(id));
    detail.showShared(id, card, comment);
  }

  function openLocal(entry, { push = true } = {}) {
    showView("detail");
    const shared = entry.online_id > 0 ? entry.online_id : 0;
    Object.assign(view, { id: shared, builtIn: entry.built_in ? entry.address : "", path: entry.path });
    if (push) app.address(entry.built_in ? entry.address : shared ? String(shared) : "");
    detail.showLocal(entry);
  }

  // A built-in map by its address word (/maps/lakelands): the game's entry if
  // it has answered, else the web build's.
  function openBuiltIn(word, { push = true } = {}) {
    const lower = String(word).toLowerCase();
    const entry = local && local.built_in.find((m) => m.address.toLowerCase() === lower);
    if (entry) return openLocal(entry, { push });
    const m = builtIns && builtIns.find((x) => String(x.address).toLowerCase() === lower);
    if (m) {
      showView("detail");
      Object.assign(view, { id: 0, builtIn: m.address, path: "" });
      if (push) app.address(m.address);
      detail.showBuiltIn(m);
      return;
    }
    if (local) {
      missing();
      return;
    }
    // Not in the web build's list (or it hasn't come yet): it may be a
    // Developer's upload only the game knows, so wait for the game's list.
    showView("detail");
    Object.assign(view, { id: 0, builtIn: word, path: "" });
    detail.waitFor(word);
  }

  function missing(text = "That map isn't shared any more, or the link is wrong.") {
    showHome({ push: false });
    app.address("", { replace: true });
    app.say(text);
  }

  // ---------------------------------------------------------------- what only the game does
  function edit(path) {
    return app.inGame("Map Maker", () => game.ask("maps.edit", { path })).then((r) => {
      if (r && r.error) app.say(r.error);
      return r;
    });
  }

  // ---------------------------------------------------------------- one map's page
  function mapDetail() {
    let item = {};      // its listing ({} if it isn't shared, or until it loads)
    let entry = null;   // it on this computer (the game's), or the web build's built-in
    let waitingWord = "";
    let shown = 0;
    let editing = false;
    let trainingIds = null;
    const comments = commentsBox();
    const picture = panZoom();
    const viewMap = h("button", { class: "wbtn", type: "button", text: "View map", title: "Look round the whole map before you play." });
    const fields = h("div", { class: "fields" });
    const creatorLink = h("a", { class: "creator", title: "Their profile", "data-go": "player" });
    const facts = h("p", { class: "muted facts" });
    const votes = votesRow("maps", "this map", { say: (t) => say(t), changed: (changedItem) => { item = changedItem; build(); } });
    const actions = h("div", { class: "actions" });
    const status = h("p", { class: "status", role: "status" });
    const replays = h("div", { class: "replay-rows" });
    const box = h("div", { class: "map-detail", hidden: true },
      h("div", { class: "head" }, h("button", { class: "wbtn", type: "button", text: "← Back", onclick: () => showHome() })),
      h("div", { class: "detail-row" },
        h("div", { class: "detail-pic" }, picture.el, viewMap),
        h("div", { class: "detail-info" }, fields, creatorLink, facts, votes.el, actions, status)),
      h("h2", { text: "Replays on this map" }), replays,
      comments.el);

    viewMap.addEventListener("click", () => {
      const args = entry && entry.path ? { path: entry.path } : { id: Number(item.id) };
      app.inGame("Map", () => game.ask("maps.view", args)).then((r) => { if (r && r.error) say(r.error); });
    });

    function say(text) { status.textContent = text || ""; }
    const shared = () => !!(item && item.id);
    const mine = () => !!(entry && entry.mine);
    const onComputer = () => !!(entry && entry.path);

    function showShared(id, card, comment) {
      shown++;
      item = card ? { ...card } : { id };
      entry = local ? findLocal(id) : null;
      waitingWord = "";
      editing = false;
      say("");
      build();
      comments.showFor("maps", 0);
      loadListing(id, { comment, fromLink: !card });
    }

    function showLocal(e) {
      shown++;
      item = {};
      entry = e;
      waitingWord = "";
      editing = false;
      say("");
      build();
      comments.showFor("maps", 0);
      if (e.online_id > 0) loadListing(e.online_id, {});
      else showReplays(0);
    }

    function showBuiltIn(m) {
      shown++;
      item = {};
      entry = { name: m.name, description: m.description, players: m.players, width: m.width, height: m.height,
        picture: `shell/maps/${encodeURIComponent(m.file)}`, built_in: true, address: m.address, webBuild: true,
        // (The file the game ships it as: the game copies or opens it from there.)
        path: `res://maps/${m.address}.tres` };
      waitingWord = "";
      editing = false;
      say("");
      build();
      comments.showFor("maps", 0);
      showReplays(0);
    }

    // A built-in map only the game knows (a Developer's upload): wait for its list.
    function waitFor(word) {
      shown++;
      item = {};
      entry = null;
      waitingWord = word;
      say("");
      fill(fields, loading("Looking for the map…"));
      picture.set("");
      for (const x of [creatorLink, votes.el, viewMap]) x.hidden = true;
      facts.textContent = "";
      fill(actions);
      fill(replays);
      comments.showFor("maps", 0);
    }

    function findLocal(id) {
      return local ? local.yours.find((m) => m.online_id === id) || null : null;
    }

    // The game's list came (or changed): which maps are on this computer.
    function localChanged() {
      if (box.hidden) return;
      if (waitingWord) {
        const e = local.built_in.find((m) => m.address.toLowerCase() === waitingWord.toLowerCase());
        if (e) openLocal(e, { push: false });
        else missing();
        return;
      }
      if (entry && entry.path) entry = [...local.yours, ...local.built_in].find((m) => m.path === entry.path) || (shared() ? null : entry);
      else if (entry && entry.webBuild) entry = local.built_in.find((m) => m.address === entry.address) || entry;
      else if (shared()) entry = findLocal(Number(item.id));
      build();
    }

    async function loadListing(id, { comment = 0, fromLink = false }) {
      const asked = shown;
      const got = await fetchItem("maps", id);
      if (asked !== shown) return;
      if (got.error) {
        if (fromLink && !entry) {
          missing(got.status === 404 || !got.error ? undefined : got.error);
          return;
        }
        if (shared()) say(got.error);
      } else {
        delete got.data; // (the map file: the game has its own way to get it)
        item = got;
        build();
        comments.showFor("maps", id, comment);
      }
      showReplays(id);
    }

    async function showReplays(id) {
      if (!id) {
        fill(replays, note("No one has shared a replay on this map yet."));
        return;
      }
      const asked = shown;
      fill(replays, loading("Looking…"));
      const r = await browse("replays", { section: "new", map: id, sort: "liked", limit: 20 });
      if (asked !== shown) return;
      const list = r.items || [];
      fill(replays, list.length ? null : note(r.error || "No one has shared a replay on this map yet."));
      for (const replay of list) {
        const meta = replay.meta || {};
        replays.append(h("div", { class: "replay-line" },
          h("span", { text: `${replay.name}   ·   ${(meta.names || []).join(", ")}   ·   ${Number(meta.turns) || 0} Turns   ·   ▲ ${Number(replay.likes) || 0}` }),
          h("button", { class: "wbtn", type: "button", text: "Watch", onclick: () => app.go("replays", String(replay.id)) })));
      }
    }

    function build() {
      const name = entry ? entry.name : String(item.name || "");
      const description = mine() ? entry.description : String(item.description ?? (entry ? entry.description : ""));
      if (!editing) buildFields(name, description);
      picture.set(entry && entry.picture ? entry.picture : thumb(item));
      viewMap.hidden = !(onComputer() || shared());
      const maker = String((item.creator && item.creator.username) || (entry && entry.creator) || "");
      creatorLink.hidden = maker === "" || mine();
      creatorLink.textContent = `by ${maker}`;
      creatorLink.href = pathOf("player", maker) || "#";
      creatorLink.dataset.id = maker;
      const players = entry ? entry.players : Number(item.players) || 0;
      const w = entry ? entry.width : Number(item.width) || 0, ht = entry ? entry.height : Number(item.height) || 0;
      const list = [`For up to ${players} Players`, `${w} × ${ht}`];
      if (shared()) list.push(`${Number(item.downloads) || 0} downloads`);
      if (entry && entry.built_in) list.push("Built in");
      else if (entry && entry.downloaded) list.push("Downloaded");
      facts.textContent = list.join("   ·   ");
      votes.show(item);
      buildActions(name);
    }

    function buildFields(name, description) {
      if (!mine()) {
        fill(fields, h("h1", { class: "map-name", text: name }), h("p", { class: "description", text: description || "No description." }));
        return;
      }
      const pencil = h("button", { class: "pencil", type: "button", title: "Change its name and description", "aria-label": "Edit name and description",
        text: "✎", onclick: () => startEditing(name, description) });
      fill(fields, h("div", { class: "name-line" }, h("h1", { class: "map-name", text: name }), pencil),
        h("p", { class: "description", text: description || "No description." }));
    }

    function startEditing(name, description) {
      editing = true;
      const nameBox = h("input", { type: "text", value: name, maxlength: "40", "aria-label": "Name" });
      const text = h("textarea", { rows: "4", placeholder: "A few words about the map.", "aria-label": "Description" });
      text.value = description;
      const save = h("button", { class: "wbtn", type: "button", text: "Save", onclick: () => saveText(nameBox.value, text.value) });
      const cancel = h("button", { class: "wbtn", type: "button", text: "Cancel", onclick: () => { editing = false; build(); } });
      fill(fields, nameBox, text, h("div", { class: "row-line" }, save, cancel));
      nameBox.focus();
    }

    async function saveText(name, description) {
      const r = await game.ask("maps.rename", { path: entry.path, name, description });
      if (r.error) { say(r.error); return false; }
      editing = false;
      entry = r.entry;
      say("Saved." + (entry.online_id > 0 ? " Press Update listing to change it on the Maps page too." : ""));
      build();
      askLocal();
      return true;
    }

    // Play Local's setup on this map (the game hands over to the Play page); only
    // for maps on this computer (.scratch/batch-nov19/answers.md). Same as the game's MapDetail.
    async function hostLobby() {
      say("Opening Play…");
      const r = await game.ask("maps.play_local", { path: entry.path });
      say(r && r.error ? r.error : "");
    }

    function action(text, title, work, { disabled = false } = {}) {
      const b = h("button", { class: "wbtn", type: "button", text, title, disabled, onclick: work });
      actions.append(b);
      return b;
    }

    function buildActions(name) {
      fill(actions);
      const signedIn = account.signedIn();
      const creator = item.creator || {};
      const own = shared() && String(creator.username || "") === account.username() && signedIn;
      const staff = shared() && signedIn && !own && account.outranks(creator);
      // What's on this computer is the game's to say.
      const knowsLocal = !!local || (entry && entry.webBuild);
      if (!knowsLocal) {
        actions.append(loading("Checking this computer…"));
      } else if (mine()) {
        action("Edit", "Open it in the Map Maker.", () => edit(entry.path));
        const b = action(entry.online_id > 0 ? "Update listing" : "Share", "Put it on the Maps page for everyone (again, to update it: likes stay).", share,
          { disabled: !signedIn || !account.emailConfirmed() });
        if (!signedIn) b.title = "Sign in on your Profile page to share maps.";
        else if (!account.emailConfirmed()) b.title = "Confirm your email to share maps: the link is in the email sent when you signed up.";
        if (account.isDeveloper()) {
          action("Make built-in", "Developers: add it to every game's built-in maps (Random, Ranked, map lists) within minutes.", makeBuiltIn);
        }
      } else if (entry) {
        if (entry.built_in && account.isDeveloper()) {
          action("Edit", "Developers: change the built-in map in the Map Maker.", () => edit(entry.path));
          action("Remove built-in", "Developers: take it out of every game's built-in maps (you keep a copy).", removeBuiltIn);
        }
        action("Make a copy", "A copy of your own to change in the Map Maker.", copy);
      }
      if (knowsLocal && entry && entry.path) action(HOST_LOBBY, HOST_LOBBY_TIP, hostLobby);
      if (knowsLocal && shared() && !onComputer()) action("Download", "Keep it on this computer to play (and copy).", download);
      else if (knowsLocal && shared() && entry && entry.downloaded) action("Download again", "Get the latest version.", download);
      if (shared() && signedIn) {
        if (own) action("Take down", "Remove the listing from the Maps page (your copy stays).", takeDown);
        else if (staff) {
          action("Take down", "Staff: remove their listing from the Maps page.", async () => {
            if (await confirmBox(`Take down ${creator.username}'s map "${name}" from the Maps page?`)) takeDown();
          });
        }
        if (account.isDeveloper()) trainingButton();
        if (staff) {
          const hidden = !!item.hidden;
          action(hidden ? "Show" : "Hide", "Staff: hide it from everyone else (or show it again).", async () => {
            const q = `${hidden ? "Show" : "Hide"} ${creator.username}'s map "${name}" ${hidden ? "to" : "from"} everyone else?`;
            if (await confirmBox(q)) hide();
          });
        }
      }
    }

    async function trainingButton() {
      const b = action("Good for training", "Developers: let the CPU trainer use this map for self-play (it screens the map first). "
        + "Tests and the balance report stay on built-in maps.", toggleTraining, { disabled: true });
      b.classList.add("toggle");
      if (trainingIds === null) {
        const r = await call("GET", "/cpu/training-maps");
        trainingIds = r.status === 200 ? (r.maps || []).map((m) => Number(m.id)) : undefined;
      }
      if (!b.isConnected) return;
      if (trainingIds === undefined) {
        trainingIds = null;
        b.title = "Couldn't ask the server which maps are marked for training.";
        return;
      }
      b.disabled = false;
      const on = trainingIds.includes(Number(item.id));
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", String(on));
    }

    async function toggleTraining() {
      const id = Number(item.id);
      const on = !(trainingIds || []).includes(id);
      const r = await call("POST", "/cpu/training-maps", { id, on });
      if (r.status !== 200) say(why(r));
      else {
        trainingIds = (trainingIds || []).filter((x) => x !== id);
        if (on) trainingIds.push(id);
        say(on ? "Marked as good for CPU training: the trainer screens it next." : "No longer used for CPU training.");
      }
      build();
    }

    async function share() {
      if (editing) {
        const nameBox = fields.querySelector("input"), text = fields.querySelector("textarea");
        if (!(await saveText(nameBox.value, text.value))) return;
      }
      say("Sharing…");
      const r = await game.ask("maps.share", { path: entry.path });
      if (r.error) { say(r.error); return; }
      entry = r.entry;
      item = r.item || {};
      view.id = Number(item.id) || 0;
      app.address(String(item.id), { replace: true });
      say("Shared: it's on the Maps page for everyone.");
      build();
      comments.showFor("maps", Number(item.id));
      askLocal();
    }

    async function download() {
      say("Downloading…");
      const r = await game.ask("maps.download", { id: Number(item.id) });
      if (r.error) { say(r.error); return; }
      entry = r.entry;
      item = r.item || item;
      say("Downloaded: pick it for a match, or make a copy to change it.");
      build();
      askLocal();
    }

    async function copy() {
      const path = entry.path;
      const r = await app.inGame("Map Maker", async () => {
        const copied = await game.ask("maps.copy", { path });
        if (copied.error) return copied;
        return game.ask("maps.edit", { path: copied.entry.path });
      });
      if (r && r.error) say(r.error);
    }

    async function makeBuiltIn() {
      const file = fileNameFor(entry.name);
      const known = local && local.built_in.some((m) => `${m.address}.tres` === file);
      const q = known ? `Make "${entry.name}" built in? It replaces the built-in map with the same name in every game.`
        : `Make "${entry.name}" a built-in map in every game?`;
      if (!(await confirmBox(q))) return;
      say("Uploading…");
      const r = await game.ask("maps.make_built_in", { path: entry.path });
      say(r.error || "Built in: every game has it within a few minutes.");
      if (!r.error) askLocal();
    }

    async function removeBuiltIn() {
      if (!(await confirmBox(`Remove "${entry.name}" from every game's built-in maps? A copy goes to Your Maps, so you can make it built-in again.`))) return;
      say("Removing…");
      const r = await game.ask("maps.remove_built_in", { path: entry.path });
      if (r.error) { say(r.error); return; }
      askLocal();
      if (r.entry) {
        openLocal(r.entry, { push: false });
        app.address("", { replace: true });
        say("Removed from the built-in maps. Your copy is in Your Maps.");
      } else {
        showHome();
        app.say("Removed from the built-in maps.");
      }
    }

    async function takeDown() {
      const r = await call("DELETE", `/maps/${item.id}`);
      if (r.status !== 200) { say(why(r)); return; }
      if (mine()) {
        const u = await game.ask("maps.unshared", { path: entry.path });
        if (u.entry) entry = u.entry;
        askLocal();
      }
      item = {};
      view.id = 0;
      if (entry) app.address(entry.built_in ? entry.address : "", { replace: true });
      say("Taken down from the Maps page.");
      build();
      comments.showFor("maps", 0);
      showReplays(0);
    }

    async function hide() {
      const hidden = !item.hidden;
      const r = await call("POST", `/maps/${item.id}/hide`, { hidden });
      say(why(r));
      if (r.status === 200) item.hidden = hidden;
      build();
    }

    return { el: box, showShared, showLocal, showBuiltIn, waitFor, localChanged, waitingFor: () => (box.hidden ? "" : waitingWord),
      rebuild: () => { if (!box.hidden && !waitingWord) build(); } };
  }

  // ---------------------------------------------------------------- wiring
  account.onChange(() => { refresh(); detail.rebuild(); });
  game.onReady(() => askLocal());
  game.onChanged("maps", () => askLocal());
  loadBuiltIns();
  refresh();

  return {
    el,
    title: () => "Maps",
    // Show the page: `id` "" for its rows, a shared map's number or a
    // built-in map's word; undefined keeps what it showed (back from the Map
    // Maker); `comment`: one to light up.
    show({ id, comment = 0 } = {}) {
      if (game.isReady()) askLocal();
      if (id === undefined || id === null) return;
      id = String(id);
      if (id === "") {
        if (view.name !== "home") showHome({ push: false });
      } else if (/^\d+$/.test(id) && Number(id) > 0) {
        if (view.name !== "detail" || view.id !== Number(id) || comment) openShared(Number(id), null, { push: false, comment });
      } else if (view.name !== "detail" || view.builtIn.toLowerCase() !== id.toLowerCase()) {
        openBuiltIn(id, { push: false });
      }
    },
    // Where the address bar should say the page is ("" for the rows).
    address() {
      if (view.name !== "detail") return "";
      return view.id > 0 ? String(view.id) : view.builtIn || "";
    },
  };
}

// The Tags search (TagBox): every Tag from the server to tick; maps with every
// ticked one show. Developers add Tags at the top and remove the ones added.
function tagBox(onToggle) {
  const ticked = new Set();
  let loaded = false;
  const list = h("div", { class: "tag-list" });
  const status = h("p", { class: "status" });
  const addText = h("input", { type: "text", placeholder: "A new Tag", maxlength: "24", "aria-label": "New Tag" });
  const addRow = h("div", { class: "row-line", hidden: true }, addText,
    h("button", { class: "wbtn", type: "button", text: "Add", onclick: () => change("POST", "/map-tags", addText.value) }));
  const plus = h("button", { class: "wbtn tiny", type: "button", text: "+", title: "Developers: add a Tag to everyone's list",
    onclick: () => { addRow.hidden = !addRow.hidden; if (!addRow.hidden) addText.focus(); } });
  const el = h("div", { class: "tag-box box" },
    h("div", { class: "row-head" }, h("h3", { text: "Show maps with every Tag ticked" }), plus), addRow, list, status);

  async function load() {
    plus.hidden = !account.isDeveloper();
    if (loaded) return;
    fill(list, loading("Loading the Tags…"));
    const r = await call("GET", "/map-tags");
    if (r.status !== 200) { fill(list, note(why(r, "Couldn't load the Tags."))); return; }
    loaded = true;
    show(r.tags || []);
  }

  function show(tags) {
    fill(list);
    for (const t of tags) {
      const name = String(t.name);
      const box = h("input", { type: "checkbox", checked: ticked.has(name) });
      box.addEventListener("change", () => {
        if (box.checked) ticked.add(name); else ticked.delete(name);
        onToggle();
      });
      const row = h("label", { class: "check tag" }, box, " " + name);
      if (t.added && account.isDeveloper()) {
        row.append(h("button", { class: "flat x", type: "button", text: "×", title: "Developers: remove this Tag from everyone's list",
          onclick: (e) => { e.preventDefault(); change("POST", "/map-tags/remove", name); } }));
      }
      list.append(row);
    }
  }

  async function change(method, path, name) {
    const r = await call(method, path, { name });
    if (r.status !== 200) { status.textContent = why(r); return; }
    status.textContent = "";
    addText.value = "";
    show(r.tags || []);
  }

  return { el, ticked, load };
}

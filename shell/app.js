// The web dashboard (.scratch/web-dashboard/, .scratch/html-menus/): the
// webpage in front of the game in the web build. It shows Home, the changelog,
// Maps and Replays itself, loads the game hidden behind it as soon as it has shown, and
// hands over to the game for the game's pages (Play, your profile, Admin) and
// windows (Settings, Tutorial, Feedback), and for the Map Maker, the map
// viewer and watching a replay. The game hands back through window.ckShell
// (game/web_shell.gd), tells the page what its bar shows and your sign-in, and
// answers what the pages ask it (game.js).

import { route, pathOf, GAME_PAGES, WEB_PAGES, WEB_WINDOWS, PAGE_WINDOWS } from "./routes.js";
import { versions, toHtml } from "./changelog.js";
import { game } from "./game.js";
import { fromGame, refreshMe } from "./session.js";
import { setTimeZone } from "./ui.js";
import { setDisplay, display } from "./display.js";
import { cloudLayer } from "./clouds.js";
import { frameCap } from "./frames.js";
import { quietWatch } from "./quiet.js";
import { mapsPage } from "./pages/maps.js";
import { replaysPage } from "./pages/replays.js";
import { profilePage } from "./pages/profile.js";
import { playerPage } from "./pages/player.js";
import { clansPage } from "./pages/clans.js";
import { leaderboardWindow } from "./pages/leaderboard.js";
import { settingsWindow, tutorialWindow, feedbackWindow } from "./pages/settings.js";
import { mirrorPage, lobbyStrip } from "./pages/mirror.js";
import { shopPage } from "./pages/shop.js";
import { customizePage } from "./pages/customize.js";
import { challengesBox } from "./challenges.js";
import { setNavigator } from "./people.js";
import { social, partyPanel } from "./social.js";

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

// Kept in this browser: what the bar showed last time (from the game), so it
// shows at once next time, before the game has loaded.
const BAR_KEY = "ck.bar";
// The look (game or clean): the Home switch's, or Settings' (the game tells us).
const LOOK_KEY = "ck.look";
const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* private window: fine */ } },
};

const PAGE_TITLES = { play: "Play", maps: "Maps", replays: "Replays", profile: "Your profile", player: "Player",
  clans: "Clans", leaderboard: "Leaderboard", admin: "Admin", settings: "Settings", tutorial: "Tutorial", feedback: "Feedback",
  shop: "Shop", customize: "Customize" };
const WEB_PAGE_NAMES = Object.values(WEB_PAGES);
// How many steps the bar squeezes in (shell.css .sq1 to .sq6).
const SQUEEZES = 6;
// Slideshow timing, as MapSlideshow: each map shows 5 s between 1.2 s fades.
const SHOW_MS = 5000, FADE_MS = 1200;
// How long a note from say() shows.
const SAY_MS = 6000;

const state = {
  webPage: "home",
  inGame: false,
  // What waits for the game to finish loading: one of its pages ({page, id?}),
  // or something a page asked to hand over for ({title, run, done}).
  pending: null,
  // Back or Forward to one of the webpage's addresses while the game showed:
  // {page, id}, for when the game hands back.
  popped: null,
  game: { started: false, ready: false, booted: false, failed: "", loaded: 0, total: 0 },
  bar: {},
  // How many pages this visit has gone to on the webpage (Back stays on the site while > 0).
  moves: 0,
  leaderboardPushed: false,
};

// ---------------------------------------------------------------- the bar

function applyBar(bar) {
  state.bar = bar || {};
  const name = String(state.bar.name || "") || "Profile";
  $$('[data-bar="name"]').forEach((el) => { el.textContent = name; });
  $$('[data-go="profile"]').forEach((el) => { el.title = state.bar.name ? `Your profile (${state.bar.name})` : "Your profile"; });
  const picture = typeof state.bar.picture === "string" && state.bar.picture.startsWith("data:image/png;base64,")
    ? state.bar.picture : "shell/art/default_picture.png";
  $$('[data-bar="picture"]').forEach((img) => { if (img.getAttribute("src") !== picture) img.src = picture; });
  const unseen = Math.max(0, Number(state.bar.unseen) || 0);
  $$('[data-bar="unseen"]').forEach((el) => {
    el.hidden = unseen === 0;
    el.textContent = unseen < 10 ? String(unseen) : "9+";
    el.title = `${unseen} new`;
  });
  $$('[data-bar="update"]').forEach((el) => { el.hidden = !state.bar.update; });
  $$('[data-bar="admin"]').forEach((el) => { el.hidden = !state.bar.admin; });
  if (staffPower() !== shownPower) {
    // Signing in or out as staff adds or takes away the changelog's staff lines.
    shownPower = staffPower();
    showNews();
    showChangelog(changelogIndex);
  }
  setTimeZone(state.bar.time_zone);
  setDisplay(state.bar);  // UI scale, Font, Bold, Show FPS (display.js)
  fitBar();
}

// The webpage's look: "game" or "clean". The Home switch sets it and tells the
// game (Settings > Graphics > Dashboard look shows the same); a change in the
// game's Settings comes back with the bar.
function setLook(look, { tellGame = true } = {}) {
  look = look === "clean" ? "clean" : "game";
  store.set(LOOK_KEY, look);
  document.body.classList.toggle("look-clean", look === "clean");
  document.body.classList.toggle("look-game", look !== "clean");
  const box = $("#look-switch");
  if (box) box.checked = look === "clean";
  if (tellGame && state.game.ready && window.ck && window.ck.look) window.ck.look(look);
  fitBar();
}

// Squeeze the bar one step at a time until every button fits (DashboardBar.fit(),
// with a step more: the long Download button shortens before the title goes).
function fitBar() {
  const web = $("#web"), bar = $(".bar");
  for (let i = 1; i <= SQUEEZES; i++) web.classList.remove("sq" + i);
  if (window.matchMedia("(max-width: 760px)").matches) return;
  for (let i = 1; i <= SQUEEZES && tooWide(bar); i++) web.classList.add("sq" + i);
}

// Whether the bar's buttons reach into the gap at its right end (scrollWidth
// alone doesn't count that gap, so the last button could touch the edge).
function tooWide(bar) {
  const shown = [...bar.children].filter((el) => el.getClientRects().length);
  if (!shown.length) return false;
  const box = bar.getBoundingClientRect();
  // (Settings > UI scale zooms the page: boxes are measured zoomed, the gap isn't.)
  const zoom = bar.offsetWidth ? box.width / bar.offsetWidth : 1;
  const inner = box.right - parseFloat(getComputedStyle(bar).paddingRight) * zoom;
  return bar.scrollWidth > bar.clientWidth || shown.at(-1).getBoundingClientRect().right > inner + 0.5;
}

function markOn(page) {
  $$("[data-go]").forEach((el) => el.classList.toggle("on", el.dataset.go === page && !el.closest(".sheet") && !el.closest("main")));
}

// A note at the bottom of the page for a few seconds (MainMenu.say()).
let sayTimer = 0;
function say(text) {
  const toast = $("#toast");
  toast.textContent = text;
  toast.hidden = !text;
  clearTimeout(sayTimer);
  if (text) sayTimer = setTimeout(() => { toast.hidden = true; }, SAY_MS);
}

// ---------------------------------------------------------------- the webpage's own pages

// What the pages built in JavaScript need from the rest of the webpage.
const app = {
  // The page now shows `id` on it ("" for none): the address bar follows.
  address(id, { replace = false } = {}) {
    if (state.inGame) return;
    const path = pathOf(state.webPage, id);
    if (!path || location.pathname === path) return;
    if (replace) history.replaceState({}, "", path);
    else history.pushState({}, "", path);
  },
  inGame: (title, run) => handOver(title, run),
  openGamePage: (page, id) => openGame(page, { id }),
  // Go to one of the pages (and `id` on it, `extra`: {around} for the
  // Leaderboard), the webpage's or the game's.
  go: (page, id = "", extra = {}) => go(page, id, extra),
  // Back where you were on the webpage, or Home if this visit started here.
  back() {
    if (state.moves > 0) history.back();
    else showWeb("home");
  },
  say,
};

// The webpage's pages made in JavaScript, each in its <section data-page>.
const PAGES = { maps: mapsPage(app), replays: replaysPage(app), profile: profilePage(app), player: playerPage(app), clans: clansPage(app),
  play: mirrorPage(app, "play", { title: "Play" }), admin: mirrorPage(app, "admin", { title: "Admin" }),
  shop: shopPage(app), customize: customizePage(app) };
for (const [name, page] of Object.entries(PAGES)) $(`.view[data-page="${name}"]`).append(page.el);
// Home's Daily Challenges (.scratch/shop-gems-challenges/).
$("#challenges-slot").append(challengesBox(app.go).el);
setNavigator(app.go);

// The Leaderboard opens over the page you were on (/leaderboard); closing it
// puts that page's address back.
const leaderboard = leaderboardWindow({
  go: app.go,
  closed() {
    if (state.leaderboardPushed) history.back();
    else history.replaceState({}, "", pathOf(state.webPage, PAGES[state.webPage] ? PAGES[state.webPage].address() : "") || "/");
    state.leaderboardPushed = false;
  },
});

function openLeaderboard({ push = true, around = "" } = {}) {
  if (state.inGame) showWeb(state.webPage, { push: false });
  if (push && location.pathname !== "/leaderboard") {
    history.pushState({}, "", "/leaderboard");
    state.leaderboardPushed = true;
  }
  document.title = "Leaderboard · Chess Kingdoms";
  leaderboard.open(around);
}

// Settings, the Tutorial and Feedback: windows over the page you're on.
async function openWindow(page) {
  closeSheet();
  if (state.inGame) showWeb(state.webPage, { push: false });
  if (page === "settings") settingsWindow();
  else if (page === "tutorial") tutorialWindow(openUpgrades);
  else {
    const list = await loadChangelog();
    if ((await feedbackWindow(list.length ? list[0].version.replace(/^v/, "") : "")) === "sent") say("Thanks: your feedback was sent.");
  }
}

// The Tutorial's Upgrades button: the game's own Upgrades window, which hands
// back with {window: "tutorial"} (WebSettings.upgrades()).
function openUpgrades() {
  return handOver("Upgrades", () => game.ask("tutorial.upgrades", { back: state.webPage }))
    .then((r) => { if (r && r.error) say(r.error); });
}

// Your party, bottom left, and invites popping up at the top right.
$("#web").append(partyPanel((name) => go("player", name)));
// Joining a lobby (an invite, a friend's Join or Spectate): the game joins, and the lobby shows on Play.
social.setJoin((room, spectate) => {
  showWeb("play");
  return game.ask("play.join", { room, spectate });
});
// "You're in a lobby" on the other pages.
const strip = lobbyStrip(() => showWeb("play"));
$("#web").insertBefore(strip.el, $("#main"));

// Show one of the webpage's pages. `id`: one thing on it ("" for none,
// undefined to keep what it showed); `comment`: one of its comments to light up.
function showWeb(page, { push = true, id, comment = 0, clan_id = 0 } = {}) {
  if (!WEB_PAGE_NAMES.includes(page) || WEB_WINDOWS.includes(page)) page = "home";
  if (leaderboard.isOpen()) leaderboard.close(false);
  state.leaderboardPushed = false;
  closeSheet();
  hideWait();
  state.pending = null;
  state.inGame = false;
  for (const [name, p] of Object.entries(PAGES)) if (name !== page && p.hide) p.hide();
  state.webPage = page;
  document.body.dataset.page = page;
  strip.sync();
  document.body.classList.remove("in-game");
  $$(".view").forEach((v) => { v.hidden = v.dataset.page !== page; });
  markOn(page);
  if (PAGES[page]) PAGES[page].show({ id, comment, clan_id });
  const path = pathOf(page, PAGES[page] ? PAGES[page].address() : "");
  if (push && location.pathname !== path) { history.pushState({}, "", path); state.moves++; }
  else if (!push && location.pathname !== path && PAGES[page]) history.replaceState({}, "", path);
  document.title = page === "home" ? "Chess Kingdoms" : `${page === "changelog" ? "Changelog" : PAGE_TITLES[page] || "Chess Kingdoms"} · Chess Kingdoms`;
  if (page === "changelog") showChangelog();
  slides.wake();
}

// ---------------------------------------------------------------- the game

// Clicks, keys and scrolling, to start the game at a quiet moment (quiet.js).
const quiet = quietWatch(window);

function startGame() {
  const g = state.game;
  // A page waits for the game: start it as soon as it has downloaded.
  if (state.pending) quiet.now();
  if (g.started) return;
  g.started = true;
  const godot = window.ckGodot;
  if (!window.Engine || !godot) return fail("The game's files didn't load. Check your connection and reload the page.");
  const missing = window.Engine.getMissingFeatures({ threads: godot.threads });
  if (missing.length) return fail(`This browser can't run the game: it's missing ${missing.join(", ")}.`);
  const engine = new window.Engine(godot.config);
  // startGame() downloads the game, then calls start(), which runs Godot's
  // start-up in one go: held for a quiet moment (quiet.js).
  const start = engine.start;
  if (typeof start === "function") engine.start = (...args) => quiet.moment().then(() => start.apply(engine, args));
  engine.startGame({
    onProgress(loaded, total) {
      g.loaded = loaded;
      g.total = total;
      drawWait();
    },
  }).then(() => {
    g.booted = true;
    drawWait();
  }, (err) => fail(`The game couldn't start: ${err && err.message ? err.message : err}`));
}

function fail(why) {
  state.game.failed = why;
  drawWait();
}

// Show one of the game's pages or windows (`id`: one map, replay, player or
// clan on it): at once if the game is ready, else after the wait screen.
function openGame(page, { push = true, id = "" } = {}) {
  closeSheet();
  if (push && GAME_PAGES.includes(page)) {
    const path = pathOf(page, id);
    if (path && location.pathname !== path) history.pushState({}, "", path);
  }
  markOn(page);
  const request = id ? { page, id: String(id) } : { page };
  if (!state.game.ready) {
    cancelPending();
    state.pending = request;
    startGame();
    drawWait();
    return;
  }
  enterGame(request);
}

function enterGame(request) {
  hideWait();
  state.pending = null;
  showCanvas();
  window.ck.open(request);
}

function showCanvas() {
  state.inGame = true;
  document.body.classList.add("in-game");
  slides.sleep();
  const canvas = $("#canvas");
  if (canvas) canvas.focus();
}

// Hand over to the game for something a page asked (the Map Maker, the map
// viewer): `run()` asks the game, which shows itself; an answer with an
// error stays on the webpage. Waits for the game first (the wait screen).
// Resolves with run()'s answer ({error} if it was given up on).
function handOver(title, run) {
  return new Promise((done) => {
    closeSheet();
    const job = { title, run, done };
    if (!state.game.ready) {
      cancelPending();
      state.pending = job;
      startGame();
      drawWait();
      return;
    }
    runHandOver(job);
  });
}

async function runHandOver(job) {
  hideWait();
  state.pending = null;
  const r = await job.run();
  if (r && r.error) {
    job.done(r);
    return;
  }
  showCanvas();
  job.done(r || {});
}

// Whatever was waiting for the game is given up (Back on the wait screen).
function cancelPending() {
  const p = state.pending;
  state.pending = null;
  if (p && p.done) p.done({ error: "" });
}

function drawWait() {
  const wait = $("#wait");
  if (!state.pending) return;
  const g = state.game;
  wait.hidden = false;
  $("#wait-page").textContent = state.pending.title || PAGE_TITLES[state.pending.page] || "";
  const bar = $("#wait-bar"), text = $("#wait-text");
  wait.classList.remove("starting");
  if (g.failed) {
    $("#wait-tagline").textContent = "The game couldn't start";
    bar.style.width = "0%";
    text.textContent = g.failed;
    return;
  }
  $("#wait-tagline").textContent = "Starting the game";
  if (g.total > 0 && g.loaded < g.total && !g.booted) {
    const mb = (n) => (n / 1048576).toFixed(1);
    bar.style.width = `${Math.round((100 * g.loaded) / g.total)}%`;
    text.textContent = `Downloading the game: ${mb(g.loaded)} of ${mb(g.total)} MB. It started loading when the page opened, so this is only what's left.`;
  } else {
    wait.classList.add("starting");
    text.textContent = "Almost there: the game is starting.";
  }
}

function hideWait() {
  $("#wait").hidden = true;
}

// What the game calls (game/web_shell.gd).
// The game's frame cap (frames.js): set before the game starts asking for frames.
const frames = frameCap();

window.ckShell = {
  version: 2,
  // The game's frame cap, `fps` a second at most (0: none; WebShell.cap_frames()).
  frames(fps) {
    frames.set(fps);
  },
  // The game has started and listens on window.ck.
  ready() {
    state.game.ready = true;
    state.game.booted = true;
    // The game may have an older look than the Home switch's last choice.
    setLook(store.get(LOOK_KEY));
    game.markReady();
    const p = state.pending;
    if (p && p.run) runHandOver(p);
    else if (p) enterGame(p);
  },
  // The game went to one of the webpage's pages: show it. `where` is {page,
  // id?, comment?} as JSON (id: one thing on it, as /maps/13), or just the
  // page's name. Until it's ready the game is only starting on its own Home,
  // so a page the address asked for (state.pending) stays asked for.
  show(where) {
    if (!state.game.ready) return;
    let at;
    try { at = String(where).startsWith("{") ? JSON.parse(where) : { page: String(where) }; } catch { return; }
    if (!at || typeof at !== "object") return;
    const page = String(at.page || "home");
    const popped = state.popped;
    state.popped = null;
    if (page === "leaderboard") {
      hideWait();
      state.inGame = false;
      document.body.classList.remove("in-game");
      openLeaderboard({ push: !(popped && popped.page === page), around: String(at.around || "") });
    } else if (popped && popped.page === page) showWeb(page, { push: false, id: popped.id });
    else showWeb(page, { id: at.id === undefined ? undefined : String(at.id), comment: Number(at.comment) || 0, clan_id: Number(at.clan_id) || 0 });
    if (at.window === "tutorial") openWindow("tutorial");
  },
  // The game is showing one of its pages: the address bar says so. `where` is
  // {page, id?, replace?} as JSON (replace: swap the address, as when a link
  // led nowhere, so Back doesn't lead there again), or just the page's name.
  at(where) {
    let at;
    try { at = String(where).startsWith("{") ? JSON.parse(where) : { page: String(where) }; } catch { return; }
    if (!at || typeof at !== "object") return;
    const page = String(at.page || "");
    const path = GAME_PAGES.includes(page) ? pathOf(page, at.id ?? "") : null;
    if (path && location.pathname !== path) {
      if (at.replace) history.replaceState({}, "", path);
      else history.pushState({}, "", path);
    }
    if (path) document.title = `${PAGE_TITLES[page] || "Chess Kingdoms"} · Chess Kingdoms`;
    markOn(page);
  },
  // What the bar shows: your name, picture, red dots, Admin, the look.
  bar(json) {
    let bar;
    try { bar = JSON.parse(json); } catch { return; }
    if (!bar || typeof bar !== "object") return;
    store.set(BAR_KEY, JSON.stringify(bar));
    applyBar(bar);
    // Before the game is ready its look may be older than the switch's.
    if (state.game.ready && bar.look) setLook(bar.look, { tellGame: false });
    slides.setMotion(bar.motion);
  },
  // Your sign-in ({} signed out; WebShell.account_state()).
  account(json) {
    let a;
    try { a = JSON.parse(json); } catch { return; }
    fromGame(a);
  },
  // The game's answer to something a page asked (game.ask).
  answer(json) {
    game.answer(json);
  },
  // The game left its Dashboard for a match, the Map Maker or a replay: it shows.
  game() {
    hideWait();
    state.pending = null;
    showCanvas();
  },
  // Something the game keeps changed ("maps"): pages showing it ask again.
  changed(what) {
    game.changed(String(what));
  },
};

// ---------------------------------------------------------------- Home: slideshow and news

const slides = (() => {
  let list = [], at = 0, timer = 0, front = null, motion = "moving", started = false;
  const box = () => $(".slides");
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function mode() { return motion === "static" ? "static" : (motion === "still" || reduced() ? "still" : "moving"); }
  function shown() { return !state.inGame && state.webPage === "home" && !document.hidden; }
  // Cloud shadows over the maps (clouds.js): drifting only while the maps move.
  let clouds = null, scale = 2;
  function syncClouds() {
    if (!clouds) return;
    const d = display();
    clouds.set({ on: d.clouds, drift: mode() === "moving", scale });
    if (shown()) clouds.wake(); else clouds.sleep();
  }
  function next() {
    clearTimeout(timer);
    if (!list.length || !shown()) return;
    const m = mode();
    const item = m === "static" ? list[0] : list[at++ % list.length];
    const slide = document.createElement("div");
    slide.className = "slide";
    slide.style.backgroundImage = `url("shell/slides/${encodeURIComponent(item.file)}")`;
    if (m === "moving") {
      const angle = Math.random() * Math.PI * 2;
      const dx = (Math.cos(angle) * 4).toFixed(2), dy = (Math.sin(angle) * 4).toFixed(2);
      slide.style.setProperty("--from-x", `${-dx}%`); slide.style.setProperty("--from-y", `${-dy}%`);
      slide.style.setProperty("--to-x", `${dx}%`); slide.style.setProperty("--to-y", `${dy}%`);
      slide.classList.add("pan");
    }
    box().append(slide);
    const old = front;
    front = slide;
    const img = new Image();
    img.onload = img.onerror = () => {
      // How big the map is drawn (cover, over a box 130% of the page: .slide), for the clouds' size.
      const b = box();
      if (img.naturalWidth && b) {
        scale = Math.max(1.3 * b.clientWidth / img.naturalWidth, 1.3 * b.clientHeight / img.naturalHeight) || scale;
        syncClouds();
      }
      requestAnimationFrame(() => slide.classList.add("show"));
      if (old) setTimeout(() => old.remove(), FADE_MS + 50);
    };
    img.src = `shell/slides/${encodeURIComponent(item.file)}`;
    if (m !== "static" && list.length > 1) timer = setTimeout(next, SHOW_MS + FADE_MS);
  }
  return {
    async start() {
      if (started) return;
      started = true;
      clouds = cloudLayer(box());
      syncClouds();
      // A change on the Settings window (display.js) reaches the slideshow at once.
      addEventListener("ck-display", (e) => {
        const m = e.detail && e.detail.motion;
        if (m && m !== motion) {
          const before = mode();
          motion = m;
          if (before !== mode()) next();
        }
        syncClouds();
      });
      try {
        const r = await fetch("shell/slides/index.json");
        list = (await r.json()).filter((m) => m && m.file);
      } catch { list = []; }
      if (mode() === "static") list.sort((a, b) => a.file.localeCompare(b.file));
      else list.sort(() => Math.random() - 0.5);
      next();
    },
    setMotion(m) {
      const before = mode();
      motion = ["static", "still", "moving"].includes(m) ? m : "moving";
      if (before !== mode() && started) next();
      syncClouds();
    },
    sleep() { clearTimeout(timer); if (clouds) clouds.sleep(); },
    wake() { if (started && shown() && !timer) next(); else if (started && shown()) { clearTimeout(timer); next(); } syncClouds(); },
  };
})();

// The changelog's text, fetched once; Moderators and Developers (the bar's
// `power`) also see their staff lines, mixed in (.scratch/one-changelog/).
let changelog = null;
async function loadChangelog() {
  if (!changelog) {
    changelog = fetch("shell/CHANGELOG.md").then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
      .catch(() => "");
  }
  const text = await changelog;
  return text ? versions(text, staffPower()) : [];
}

function escapeHtml(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function showNews() {
  const list = await loadChangelog();
  const news = $("#news");
  if (!list.length) {
    news.innerHTML = '<p class="muted">The changelog couldn\'t be read.</p>';
    return;
  }
  $("#version").textContent = `Version ${list[0].version.replace(/^v/, "")}`;
  news.innerHTML = `<h3>${escapeHtml(list[0].title)}</h3>${toHtml(list[0].body)}`;
}

let shownPower = 0;
// Which staff lines the changelog shows: 2 Developers, 1 Moderators, 0 anyone else.
function staffPower() {
  const power = Math.trunc(Number(state.bar && state.bar.power) || 0);
  return Math.max(0, Math.min(2, power));
}
let changelogIndex = 0;
async function showChangelog(index = 0) {
  changelogIndex = index;
  const list = await loadChangelog();
  const nav = $("#versions"), notes = $("#notes");
  if (!list.length) {
    notes.innerHTML = '<p class="muted">The changelog couldn\'t be read.</p>';
    return;
  }
  if (!nav.children.length) {
    list.forEach((v, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "wbtn";
      b.textContent = v.version;
      b.title = v.title;
      b.addEventListener("click", () => showChangelog(i));
      nav.append(b);
    });
  }
  $$("button", nav).forEach((b, i) => b.classList.toggle("on", i === index));
  notes.innerHTML = `<h3>${escapeHtml(list[index].title)}</h3>${toHtml(list[index].body) || '<p class="muted">Nothing for the web build in this version.</p>'}`;
}

// ---------------------------------------------------------------- More (phones)

function openSheet() {
  $("#sheet").classList.add("open");
  $("#sheet").setAttribute("aria-hidden", "false");
  $("#scrim").classList.add("open");
}
function closeSheet() {
  $("#sheet").classList.remove("open");
  $("#sheet").setAttribute("aria-hidden", "true");
  $("#scrim").classList.remove("open");
}

// ---------------------------------------------------------------- wiring

// Go to `page` (and `id` on it): the bar's buttons go to a page's start ("").
function go(page, id = "", extra = {}) {
  if (PAGE_WINDOWS.includes(page)) openWindow(page);
  else if (page === "leaderboard") openLeaderboard({ around: extra.around || "" });
  else if (WEB_PAGE_NAMES.includes(page)) showWeb(page, { id });
  else openGame(page, { id });
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-go], [data-act]");
  if (!el) return;
  if (el.dataset.act === "more") { openSheet(); return; }
  if (el.tagName === "A" && (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0)) return; // a new tab: let it go
  e.preventDefault();
  go(el.dataset.go, el.dataset.id || "");
});
$("#scrim").addEventListener("click", closeSheet);
$("#look-switch").addEventListener("change", (e) => setLook(e.target.checked ? "clean" : "game"));
$("#wait-back").addEventListener("click", () => {
  cancelPending();
  showWeb(state.webPage, { push: false });
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });

addEventListener("popstate", () => {
  const r = route(location.pathname);
  if (r.page === "leaderboard" && !state.inGame) { openLeaderboard({ push: false }); return; }
  if (leaderboard.isOpen()) { state.leaderboardPushed = false; leaderboard.close(false); }
  if (r.game) openGame(r.page, { push: false, id: r.id });
  else if (state.inGame) {
    // The game hands back when it's on its Dashboard (not in a match or the Map Maker).
    state.popped = { page: r.page, id: r.id || "" };
    window.ck.open({ page: r.page });
  }
  else showWeb(r.page, { push: false, id: r.id || "" });
});
addEventListener("resize", fitBar);
document.addEventListener("visibilitychange", () => (document.hidden ? slides.sleep() : slides.wake()));

// Start: the bar as it was last time, the page the address asks for, then the game.
let saved = {};
try { saved = JSON.parse(store.get(BAR_KEY) || "{}") || {}; } catch { saved = {}; }
applyBar(saved);
setLook(store.get(LOOK_KEY) || saved.look, { tellGame: false });
slides.setMotion(saved.motion);
const first = route(location.pathname);
if (first.game) {
  showWeb("home", { push: false });
  openGame(first.page, { push: false, id: first.id });
} else if (first.page === "leaderboard") {
  showWeb("home", { push: false });
  history.replaceState({}, "", "/leaderboard");
  openLeaderboard({ push: false });
} else {
  showWeb(first.page, { push: false, id: first.id || "" });
}
social.load();
if (document.fonts) document.fonts.ready.then(fitBar);
showNews();
slides.start();
refreshMe();
// The game starts loading once the webpage has shown (Zac's choice: game_preload).
if (document.readyState === "complete") setTimeout(startGame, 0);
else addEventListener("load", () => setTimeout(startGame, 0));

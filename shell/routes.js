// Which page each web address shows (the web dashboard, .scratch/web-dashboard/,
// and its addresses, .scratch/web-links/). The webpage shows some pages itself;
// the rest are the game's, which the webpage asks the game to show
// (window.ck.open). Kept in step with WebShell.WEB_PAGES and WebShell.GAME_PAGES
// in game/web_shell.gd. Every menu moves to the webpage one PR at a time
// (.scratch/html-menus/): Maps, Replays, the profiles, Clans and the Leaderboard so far.

// Pages the webpage shows itself, by web address.
export const WEB_PAGES = { "/": "home", "/changelog": "changelog", "/maps": "maps", "/replays": "replays", "/profile": "profile",
  "/player": "player", "/clans": "clans", "/leaderboard": "leaderboard", "/play": "play", "/admin": "admin" };
// The webpage's windows with an address: opened over the page you were on.
export const WEB_WINDOWS = ["leaderboard"];
// The game's pages that have a web address of their own: /<page>, and for
// those in ITEM_PAGES (the webpage's too) also /<page>/<id> for one thing on it.
// (None left: every menu is the webpage's. The game shows only for matches,
// the Map Maker (where Scenarios are made too), replays and Admin's CPU Training.)
export const GAME_PAGES = [];
// What the id after a page's address is (Zac's answers, .scratch/web-links/):
// a shared map's number or a built-in map's name (/maps/13, /maps/lakelands), a
// shared replay's number, a player's name, a clan's tag (/clans/RK). Another
// player's profile has no page without one (/player alone is Home).
export const ITEM_PAGES = { maps: "number or built-in map", replays: "number", player: "name", clans: "tag" };
// The game's windows: opened over the page you're on, with no address.
export const GAME_WINDOWS = [];
// The webpage's windows without an address of their own, opened over the page you're on.
export const PAGE_WINDOWS = ["settings", "tutorial", "feedback"];

// What `pathname` shows: {page, game} (game: the game shows it), plus `id` (a
// string) for one map, replay, player or clan. Anything unknown is Home; an id
// the page doesn't take is dropped, and one that names nothing is the game's
// to say so.
export function route(pathname) {
  const parts = String(pathname || "/").split("/").filter((p) => p !== "");
  const first = (parts[0] || "").toLowerCase();
  const web = WEB_PAGES["/" + first];
  let id = "";
  if (ITEM_PAGES[first] && parts.length >= 2) {
    try { id = decodeURIComponent(parts[1]); } catch { id = parts[1]; }
  }
  if (first === "player" && id === "") return { page: "home", game: false };
  if (web && (parts.length <= 1 || ITEM_PAGES[first])) return id === "" ? { page: web, game: false } : { page: web, game: false, id };
  if (!GAME_PAGES.includes(first)) return { page: "home", game: false };
  return id === "" ? { page: first, game: true } : { page: first, game: true, id };
}

// The web address of `page` (and of one thing on it, `id`), or null for one
// with no address of its own (a window, or a game page the webpage doesn't know).
export function pathOf(page, id = "") {
  id = String(id ?? "");
  if (page === "player" && id === "") return null;
  for (const [path, name] of Object.entries(WEB_PAGES)) {
    if (name === page) return ITEM_PAGES[page] && id !== "" ? `${path}/${encodeURIComponent(id)}` : path;
  }
  if (!GAME_PAGES.includes(page)) return null;
  if (ITEM_PAGES[page] && id !== "") return `/${page}/${encodeURIComponent(id)}`;
  return page === "player" ? null : "/" + page;
}

// Whether `page` is one of the game's (a page or a window).
export function isGamePage(page) {
  return GAME_PAGES.includes(page) || GAME_WINDOWS.includes(page);
}

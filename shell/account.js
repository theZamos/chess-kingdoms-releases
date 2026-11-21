// Your sign-in on the webpage: the token and your account as the server sent
// it (GET /me), kept in the browser, so pages ask the accounts server as you
// before the game has loaded. Signing in and out happens on the webpage
// (session.js); the game is told, and the game tells the page when its own
// sign-in changes (window.ckShell.account). Powers match
// AccountClient.power(): 2 Developer, 1 Moderator, 0 player; the server
// checks everything again.

const KEY = "ck.account";
const listeners = new Set();
let state = load();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    return valid(saved) ? saved : {};
  } catch {
    return {};
  }
}

function valid(s) {
  return !!(s && typeof s === "object" && typeof s.token === "string" && s.token !== "" && s.user && typeof s.user === "object"
    && typeof s.user.username === "string");
}

function save() {
  try {
    if (state.token) localStorage.setItem(KEY, JSON.stringify(state));
    else localStorage.removeItem(KEY);
  } catch { /* a private window: kept for this visit only */ }
}

function changed() {
  for (const fn of listeners) {
    try { fn(); } catch (e) { console.error(e); }
  }
}

// The profile tags (NameBadges.TAGS), in their usual order.
export const TAGS = ["developer", "moderator", "artist", "creator", "beta"];
export const TAG_NAMES = { developer: "Developer", moderator: "Moderator", artist: "Artist", creator: "Content Creator", beta: "Beta Tester" };

export const account = {
  token: () => state.token || "",
  user: () => state.user || {},
  signedIn: () => !!state.token,
  username: () => (state.user && state.user.username) || "",
  power() {
    const u = state.user || {};
    if ("power" in u) return Math.max(0, Number(u.power) || 0);
    const tags = Array.isArray(u.tags) ? u.tags : [];
    return tags.includes("developer") ? 2 : tags.includes("moderator") ? 1 : 0;
  },
  isAdmin: () => account.signedIn() && account.power() >= 1,
  isDeveloper: () => account.signedIn() && account.power() >= 2,
  emailConfirmed: () => !state.user || state.user.email_confirmed !== false,
  // The profile tags an Admin gave you (AccountClient.my_tags()).
  myTags: () => TAGS.filter((t) => Array.isArray(state.user && state.user.tags) && state.user.tags.includes(t)),
  // The tags you show: the ones you picked, or all of yours until you pick.
  shownTags() {
    const shown = state.user && state.user.profile && state.user.profile.tags_shown;
    const mine = account.myTags();
    return Array.isArray(shown) ? mine.filter((t) => shown.includes(t)) : mine;
  },
  // Whether you could act on a player with this card (take down their uploads,
  // ban them): only players below you (AccountClient.outranks_player()).
  outranks(card) {
    if (!card || typeof card !== "object") return false;
    let theirs;
    if ("power" in card) theirs = Number(card.power) || 0;
    else {
      const tags = Array.isArray(card.tags) ? card.tags : [];
      theirs = tags.includes("developer") ? 2 : tags.includes("moderator") ? 1 : 0;
    }
    return account.power() > theirs;
  },
  // Signed in as `user` with `token` ({} or no token: signed out).
  set(next) {
    next = valid(next) ? { token: next.token, user: next.user } : {};
    if (JSON.stringify(next) === JSON.stringify(state)) return;
    state = next;
    save();
    changed();
  },
  // Fresh details of the same account (GET /me, or the game's).
  update(user) {
    if (!state.token || !user || typeof user !== "object") return;
    const merged = { ...state.user, ...user };
    if (JSON.stringify(merged) === JSON.stringify(state.user)) return;
    state = { token: state.token, user: merged };
    save();
    changed();
  },
  // The server refused the token: signed out here.
  forget() {
    if (!state.token) return;
    state = {};
    save();
    changed();
  },
  onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

// Signing in, up and out on the webpage (.scratch/html-menus/), as the game's
// AccountClient does (net/account.gd), and keeping the webpage's sign-in and
// the game's the same: what one does, the other is told.
//   - The page signs in with the accounts server itself, so it works before
//     the game has loaded; the game takes the sign-in (game.ask("account.adopt"))
//     with the account's profile and settings, as signing in there does.
//   - Signing up sends this computer's profile, settings and stats with the
//     account, which only the game has, so it waits for the game.
//   - The first time the game says its sign-in after loading, the page's wins
//     if it has one (it signed in before the game loaded); else the game's
//     (one kept from before the webpage did signing in).

import { account } from "./account.js";
import { call, why } from "./api.js";
import { game } from "./game.js";

let heardGame = false;

// Tell the game the page's sign-in. The game says its own just before it
// says it's ready (WebShell.connect_page()), so this may wait for that.
let telling = false;
function tellGame() {
  if (!game.isReady()) {
    if (!telling && heardGame) {
      telling = true;
      game.onReady(() => { telling = false; tellGame(); });
    }
    return; // (before the game has spoken at all, fromGame() tells it)
  }
  if (account.signedIn()) game.ask("account.adopt", { token: account.token(), user: account.user() });
  else game.ask("account.sign_out");
}

// Your account's details again (GET /me).
export async function refreshMe() {
  if (!account.signedIn()) return;
  const r = await call("GET", "/me");
  if (r.status === 200 && r.user && typeof r.user === "object") account.update(r.user);
}

// What the game says its sign-in is (window.ckShell.account): {} signed out,
// else {token, user}.
export function fromGame(state) {
  const theirs = state && typeof state === "object" && state.token ? state : null;
  const first = !heardGame;
  heardGame = true;
  if (first && account.signedIn() && (!theirs || theirs.token !== account.token())) {
    tellGame(); // signed in here before the game loaded
    return;
  }
  if (!theirs) {
    account.forget();
    return;
  }
  if (theirs.token !== account.token()) {
    account.set(theirs);
    refreshMe();
  } else {
    account.update(theirs.user);
  }
}

function signedInWith(r, otherwise) {
  if (r.status !== 200 || !r.token) return String(r.error || otherwise);
  account.set({ token: r.token, user: r.user || {} });
  tellGame();
  refreshMe();
  return "";
}

// Sign in with your username or email. Resolves with why not, or "".
export async function signIn(login, password) {
  const r = await call("POST", "/login", { login: String(login).trim(), password });
  return signedInWith(r, "Something went wrong.");
}

// Make an account (with this computer's profile, settings and stats, from the
// game). Resolves with why not, or "" (then the emailed link, then sign in).
export async function signUp(username, email, password) {
  const extras = await game.ask("account.sign_up_extras");
  const r = await call("POST", "/register", { ...extras, username: String(username).trim(), email: String(email).trim(), password });
  if (r.status === 200 && r.check_email) return "";
  return signedInWith(r, "Something went wrong.");
}

// Email a code to set a new password. Resolves with why not, or "".
export async function forgotPassword(email) {
  const r = await call("POST", "/password/forgot", { email: String(email).trim() });
  return r.status === 200 ? "" : String(r.error || "");
}

// Set a new password with the emailed code, and sign in.
export async function resetPassword(email, code, password) {
  const r = await call("POST", "/password/reset", { email: String(email).trim(), code: String(code).trim(), password });
  return signedInWith(r, "Something went wrong.");
}

export async function signOut() {
  if (account.signedIn()) await call("POST", "/logout");
  account.forget();
  tellGame();
}

// Email a new link to confirm your address. Resolves with why not, or "".
export async function resendConfirmation() {
  const r = await call("POST", "/email/resend");
  if (r.status !== 200) return why(r);
  if (r.confirmed) account.update({ email_confirmed: true });
  return "";
}

// "Almost there!…" once the sign-up is sent (AccountPanel.sign_up_done_text()).
export function signUpDoneText(email) {
  return `Almost there! We've sent a link to ${email}. Click it to confirm your email, then sign in here. (Not there? Check your spam folder.)`;
}

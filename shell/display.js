// The Graphics settings the webpage itself follows (.scratch/settings-fixes/):
// UI scale, Font, Bold and Show FPS, and for Home's slideshow Cloud shadows and
// Accessibility > Menu background (the page's `ck-display` event tells it). The game's own screens follow them in
// Graphics.apply(); on the web build every menu is a webpage, so without this
// those settings did nothing there. The game sends them with the bar
// (WebShell.bar_state()), the page keeps them with the bar in the browser, and
// the Settings window applies a change at once (before the game has loaded too).

// As the game fits its UI (Graphics.fitted_scale()): the page is laid out to
// fit FIT_W × FIT_H page pixels at 100%, or UPRIGHT_W across on a phone held
// upright (UPRIGHT_BELOW: narrower than this and taller than wide, or a screen
// whose shorter side is under it); a pick too big for the window shrinks to
// fit, never below MIN_SCALE (50%).
export const FIT_W = 1024;
export const FIT_H = 600;
export const UPRIGHT_W = 360;
export const UPRIGHT_BELOW = 600;
export const MIN_SCALE = 0.5;
export const SCALE_RANGE = [0.75, 2.0];
// The parts of the page the UI scale zooms (never the game's canvas).
export const ZOOMED = ".web, .toast, .invites, .wait, .pop-back";

// Whether a `w` × `h` page (on a `screenW` × `screenH` screen, 0: unknown) is
// laid out for a phone held upright (Graphics.upright_for() on the web).
export function uprightFor(w, h, screenW = 0, screenH = 0) {
  if (h > w && w < UPRIGHT_BELOW) return true;
  return screenW > 0 && screenH > 0 && Math.min(screenW, screenH) < UPRIGHT_BELOW;
}

// The zoom actually used for a picked UI scale on a `w` × `h` page.
export function fittedZoom(picked, w, h, upright = false) {
  let p = Number(picked);
  if (!Number.isFinite(p) || p <= 0) p = 1;
  p = Math.min(Math.max(p, SCALE_RANGE[0]), SCALE_RANGE[1]);
  if (!(w > 0 && h > 0)) return p;
  const fits = upright ? w / UPRIGHT_W : Math.min(w / FIT_W, h / FIT_H);
  return Math.max(Math.min(p, fits), Math.min(p, MIN_SCALE));
}

// The settings as the page keeps them, from the bar (or a Settings change).
export function displayFrom(src = {}) {
  const out = {};
  if (src.ui_scale !== undefined) out.ui_scale = Number(src.ui_scale) || 1;
  if (src.show_fps !== undefined) out.show_fps = !!src.show_fps;
  if (src.font !== undefined) out.font = src.font === "plain" ? "plain" : "medieval_sharp";
  if (src.bold !== undefined) out.bold = src.bold !== false;
  if (src.clouds !== undefined) out.clouds = src.clouds !== false;
  if (src.motion !== undefined) out.motion = ["static", "still", "moving"].includes(src.motion) ? src.motion : "moving";
  return out;
}

const state = { ui_scale: 1, show_fps: false, font: "medieval_sharp", bold: true, clouds: true, motion: "moving" };
let fpsBox = null, frames = 0, since = 0, looping = false;

function fpsLoop(now) {
  if (!state.show_fps || !fpsBox) { looping = false; return; }
  frames++;
  if (!since) since = now;
  if (now - since >= 500) {
    fpsBox.textContent = `${Math.round((frames * 1000) / (now - since))} FPS`;
    frames = 0;
    since = now;
  }
  requestAnimationFrame(fpsLoop);
}

function applyNow() {
  const body = document.body;
  const zoom = fittedZoom(state.ui_scale, innerWidth, innerHeight,
    uprightFor(innerWidth, innerHeight, screen && screen.width, screen && screen.height));
  body.style.setProperty("--ui-zoom", String(zoom));
  body.dataset.uiZoom = String(zoom);
  body.classList.toggle("font-plain", state.font === "plain");
  body.classList.toggle("text-regular", !state.bold);
  if (state.show_fps && !fpsBox) {
    fpsBox = document.createElement("div");
    fpsBox.className = "fps";
    fpsBox.setAttribute("aria-hidden", "true");
    fpsBox.textContent = "… FPS";
    body.append(fpsBox);
  }
  if (fpsBox) fpsBox.hidden = !state.show_fps;
  if (state.show_fps && !looping) {
    looping = true;
    frames = 0;
    since = 0;
    requestAnimationFrame(fpsLoop);
  }
}

// Take `partial` ({ui_scale, show_fps, font, bold}, any of them) and apply all.
export function setDisplay(partial) {
  Object.assign(state, displayFrom(partial || {}));
  applyNow();
  if (typeof dispatchEvent === "function" && typeof CustomEvent === "function") dispatchEvent(new CustomEvent("ck-display", { detail: { ...state } }));
}

export function display() {
  return { ...state };
}

if (typeof addEventListener === "function") addEventListener("resize", () => { if (document.body) applyNow(); });

// Settings, the Tutorial and Feedback as windows on the webpage
// (.scratch/html-menus/), over the page you're on, as the game's
// SettingsWindow, TutorialWindow and FeedbackWindow.
//   - Settings belong to this computer, in the game: the game says every field
//     and its value (game/web_settings.gd) and the page keeps a copy in the
//     browser, so next time Settings shows at once and can be changed before
//     the game has loaded; the change reaches the game once it has
//     (settings_before_load). The very first time, it waits for the game.
//   - The Tutorial's numbers come from the rules, so its text comes from the
//     game once, then from the browser's copy (for that version).
//   - Feedback goes straight to the accounts server.

import { call, why } from "../api.js";
import { account } from "../account.js";
import { game } from "../game.js";
import { h, fill, loading, note, popup } from "../ui.js";
import { setDisplay } from "../display.js";

const SETTINGS_KEY = "ck.settings";
const TUTORIAL_KEY = "ck.tutorial";
const store = {
  get(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private window: fine */ } },
};

// A window over the page (the same look as the game's windows); resolves when closed.
function windowOver(title, build, cls = "") {
  return popup(title, (close) => h("div", { class: `pop-body ${cls}`.trim() }, build(close),
    h("div", { class: "pop-buttons" }, h("button", { class: "wbtn yes", type: "button", text: "Close", onclick: () => close() }))));
}

// ---------------------------------------------------------------- Settings

// The browser's key (KeyboardEvent.code) as Godot names it (OS.find_keycode_from_string()).
const KEY_NAMES = {
  Space: "Space", Enter: "Enter", NumpadEnter: "Kp Enter", Escape: "Escape", Tab: "Tab", Backspace: "BackSpace", Delete: "Delete",
  Insert: "Insert", Home: "Home", End: "End", PageUp: "PageUp", PageDown: "PageDown", ArrowUp: "Up", ArrowDown: "Down",
  ArrowLeft: "Left", ArrowRight: "Right", Minus: "Minus", Equal: "Equal", BracketLeft: "BracketLeft", BracketRight: "BracketRight",
  Backslash: "BackSlash", Semicolon: "Semicolon", Quote: "Apostrophe", Backquote: "QuoteLeft", Comma: "Comma", Period: "Period",
  Slash: "Slash", CapsLock: "CapsLock", ControlLeft: "Ctrl", ControlRight: "Ctrl", AltLeft: "Alt", AltRight: "Alt",
  ShiftLeft: "Shift", ShiftRight: "Shift", NumpadAdd: "Kp Add", NumpadSubtract: "Kp Subtract", NumpadMultiply: "Kp Multiply",
  NumpadDivide: "Kp Divide", NumpadDecimal: "Kp Period",
};
export function godotKeyName(code) {
  if (KEY_NAMES[code]) return KEY_NAMES[code];
  let m = /^Key([A-Z])$/.exec(code);
  if (m) return m[1];
  m = /^Digit([0-9])$/.exec(code);
  if (m) return m[1];
  m = /^Numpad([0-9])$/.exec(code);
  if (m) return `Kp ${m[1]}`;
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(code)) return code;
  return "";
}

// A value as the window shows it (SettingsWindow._slider: fmt % (value × times)).
export function sliderText(field, value) {
  const v = Number(value) * (Number(field.times) || 1);
  const fmt = String(field.format || "%s");
  return fmt.replace(/%(\.(\d+))?([dfs])/, (_, __, places, type) => (type === "d" ? String(Math.trunc(v))
    : type === "f" ? v.toFixed(places ? Number(places) : 6) : String(v))).replace("%%", "%");
}

// What a Settings change means for the webpage itself (display.js): the UI
// scale, Font, Bold and Show FPS, Cloud shadows and Menu background also apply
// to the page, at once.
export function displayChange(args, spec) {
  const key = args && args.key;
  if (key === "ui_scale") return { ui_scale: args.value };
  if (key === "show_fps") return { show_fps: args.value };
  if (key === "bold_text") return { bold: args.value };
  if (key === "cloud_shadows") return { clouds: args.value };
  if (key === "menu_background") return { motion: ["moving", "still", "static"][Number(args.value)] || "moving" };
  if (key === "font") {
    const fields = spec && spec.tabs ? spec.tabs.flatMap((t) => t.fields) : [];
    const f = fields.find((x) => x.key === "font");
    const ids = f && Array.isArray(f.ids) ? f.ids : ["medieval_sharp", "plain"];
    return { font: ids[Number(args.value)] || ids[0] };
  }
  return {};
}

export function settingsWindow() {
  let spec = store.get(SETTINGS_KEY);
  let tab = "Sound";
  let waitingKey = null; // the action whose key is being changed
  return windowOver("Settings", () => {
    const tabs = h("div", { class: "tab-buttons", role: "tablist" });
    const body = h("div", { class: "settings-body" });
    const status = h("p", { class: "status small", role: "status" });
    const el = h("div", { class: "settings" }, tabs, body, status);

    function save(next) {
      if (!next || next.error) { if (next && next.error) status.textContent = next.error; return; }
      spec = next;
      store.set(SETTINGS_KEY, spec);
      draw();
    }
    // Change it here at once (and in the browser's copy); the game is told as soon as it can be.
    function change(what, args, apply) {
      apply();
      if (what === "settings.set") setDisplay(displayChange(args, spec));
      store.set(SETTINGS_KEY, spec);
      if (!game.isReady()) status.textContent = "Saved here; the game takes it once it has loaded.";
      game.ask(what, args).then((r) => { if (r.error) status.textContent = r.error; else { status.textContent = ""; save(r); } });
    }

    function draw() {
      if (!spec) { fill(tabs); fill(body, loading("Your settings load in with the game the first time…")); return; }
      const names = ["Sound", ...spec.tabs.map((t) => t.name), "Keybinds"];
      if (!names.includes(tab)) tab = "Sound";
      fill(tabs, names.map((n) => h("button", { class: `wbtn tab-btn${n === tab ? " on" : ""}`, type: "button", role: "tab", "aria-selected": String(n === tab),
        text: n, onclick: () => { tab = n; waitingKey = null; draw(); } })));
      if (tab === "Sound") drawSound();
      else if (tab === "Keybinds") drawKeys();
      else drawFields(spec.tabs.find((t) => t.name === tab));
    }

    function drawSound() {
      const s = spec.sound;
      const mute = h("input", { type: "checkbox", checked: !!s.muted });
      mute.addEventListener("change", () => change("settings.sound", { muted: mute.checked }, () => { s.muted = mute.checked; }));
      const chime = h("input", { type: "checkbox", checked: s.turn_chime !== false });
      chime.addEventListener("change", () => change("settings.sound", { turn_chime: chime.checked }, () => { s.turn_chime = chime.checked; }));
      fill(body, h("label", { class: "check" }, mute, " Mute all sound"),
        h("label", { class: "check", title: "The chime with the \"Your turn!\" banner. The banner shows either way." }, chime,
          " Play a sound when my Turn starts"),
        h("div", { class: "settings-grid" }, s.buses.map((b) => {
          const value = h("span", { class: "value", text: `${Math.round(b.value)}%` });
          const slider = h("input", { type: "range", min: "0", max: String(b.max), step: "1", value: String(b.value), "aria-label": b.label,
            title: "100% is the usual level; up to 200%." });
          slider.addEventListener("input", () => { value.textContent = `${slider.value}%`; });
          slider.addEventListener("change", () => change("settings.sound", { bus: b.id, value: Number(slider.value) }, () => { b.value = Number(slider.value); }));
          return [h("label", { text: b.label }), h("span", { class: "slider-row" }, slider, value)];
        })),
        h("p", { class: "muted", text: "Songs played during matches and in the map maker (unchecked songs are skipped; none: no music). ▶ plays a song now." }),
        h("div", { class: "songs" }, s.songs.map((song) => {
          const check = h("input", { type: "checkbox", checked: !!song.enabled });
          check.addEventListener("change", () => change("settings.sound", { song: song.id, enabled: check.checked }, () => { song.enabled = check.checked; }));
          return h("div", { class: "song" },
            h("span", { class: "playing", title: "Playing now", text: song.id === s.playing ? "🔊" : "" }),
            h("button", { class: "wbtn tiny", type: "button", text: "▶", title: "Play this song now",
              onclick: () => change("settings.sound", { play: song.index }, () => { s.playing = song.id; }) }),
            h("label", { class: "check" }, check, ` ${song.title}`));
        })));
    }

    function drawFields(page) {
      const fields = (page ? page.fields : []).filter((f) => !f.account || spec.signed_in || account.signedIn());
      const grid = h("div", { class: "settings-grid" });
      let accountShown = false;
      for (const f of fields) {
        if (f.account && !accountShown) { accountShown = true; grid.append(h("h3", { class: "span", text: "Account" })); }
        grid.append(...fieldRow(f));
      }
      fill(body, fields.length ? grid : note("Nothing to set here."));
    }

    function fieldRow(f) {
      const label = h("label", { text: f.label, title: f.tooltip || "" });
      if (f.kind === "check") {
        const box = h("input", { type: "checkbox", checked: !!f.value, "aria-label": f.label, title: f.tooltip || "" });
        box.addEventListener("change", () => change("settings.set", { key: f.key, value: box.checked }, () => { f.value = box.checked; }));
        return [label, h("span", {}, box)];
      }
      if (f.kind === "option") {
        const select = h("select", { "aria-label": f.label, title: f.tooltip || "" }, f.options.map((o, i) => h("option", { value: String(i), text: o, selected: i === f.value })));
        select.addEventListener("change", () => change("settings.set", { key: f.key, value: Number(select.value) }, () => { f.value = Number(select.value); }));
        return [label, select];
      }
      if (f.kind === "slider") {
        const value = h("span", { class: "value", text: sliderText(f, f.value) });
        const slider = h("input", { type: "range", min: String(f.min), max: String(f.max), step: String(f.step), value: String(f.value),
          "aria-label": f.label, title: f.tooltip || "" });
        slider.addEventListener("input", () => { value.textContent = sliderText(f, slider.value); });
        // Saved when let go, as the window does (the UI scale doesn't rescale with every step).
        slider.addEventListener("change", () => change("settings.set", { key: f.key, value: Number(slider.value) }, () => { f.value = Number(slider.value); }));
        return [label, h("span", { class: "slider-row" }, slider, value)];
      }
      if (f.kind === "button") {
        const b = h("button", { class: "wbtn", type: "button", text: "Save settings to account", title: f.tooltip || "" });
        b.addEventListener("click", async () => {
          b.disabled = true;
          const r = await game.ask("settings.push");
          b.disabled = false;
          if (r.error) status.textContent = r.error;
          else b.textContent = "Saved ✓";
        });
        return [h("label", { text: "Settings and keybinds" }), b];
      }
      return [];
    }

    function drawKeys() {
      const rows = h("div", { class: "settings-grid keys" });
      for (const k of spec.keybinds) {
        if (k.heading) { rows.append(h("h3", { class: "span", text: k.heading })); continue; }
        rows.append(h("label", { text: k.label }), h("button", { class: `wbtn key${waitingKey === k.action ? " on" : ""}`, type: "button",
          text: waitingKey === k.action ? "press a key…" : k.keys, onclick: () => { waitingKey = k.action; drawKeys(); } }));
      }
      fill(body, h("p", { class: "muted", text: "Click a key, then press the new one or a combo like Ctrl+Z." }), rows,
        h("button", { class: "wbtn", type: "button", text: "Reset to defaults", onclick: () => game.ask("settings.reset_keys").then(save) }));
    }

    // Waiting for a key: a key (with any Ctrl, Alt or Shift held) binds that
    // combo; Ctrl, Alt or Shift pressed and let go on its own binds just that key.
    let heldMod = "";
    function bind(name, e) {
      const action = waitingKey;
      waitingKey = null;
      heldMod = "";
      if (!name) { status.textContent = "That key can't be bound."; drawKeys(); return; }
      game.ask("settings.rebind", { action, key: name, ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey }).then(save);
      if (!game.isReady()) status.textContent = "The new key is set once the game has loaded.";
    }
    const onKeyDown = (e) => {
      if (!waitingKey || e.repeat) return;
      e.preventDefault();
      e.stopPropagation();
      const name = godotKeyName(e.code);
      if (["Ctrl", "Alt", "Shift"].includes(name)) { heldMod = name; return; }
      bind(name, e);
    };
    const onKeyUp = (e) => {
      if (!waitingKey) return;
      const name = godotKeyName(e.code);
      if (heldMod && name === heldMod) bind(name, { ctrlKey: false, altKey: false, shiftKey: false });
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("keyup", onKeyUp, true);
    new MutationObserver((_, obs) => {
      if (!el.isConnected) {
        document.removeEventListener("keydown", onKeyDown, true);
        document.removeEventListener("keyup", onKeyUp, true);
        obs.disconnect();
      }
    }).observe(document.body, { childList: true });

    draw();
    game.ask("settings.get").then(save);
    return el;
  }, "wide");
}

// ---------------------------------------------------------------- Tutorial

// The Tutorial's BBCode as HTML: [b], [i], [u], [font_size=N] and [color=…];
// everything else in it is text.
export function bbcodeToHtml(text) {
  const esc = String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc
    .replace(/\[b\]/g, "<b>").replace(/\[\/b\]/g, "</b>")
    .replace(/\[i\]/g, "<i>").replace(/\[\/i\]/g, "</i>")
    .replace(/\[u\]/g, "<u>").replace(/\[\/u\]/g, "</u>")
    .replace(/\[font_size=(\d+)\]/g, (_, n) => `<span class="big" style="font-size:${Math.min(Number(n), 40)}px">`).replace(/\[\/font_size\]/g, "</span>")
    .replace(/\[color=(#?[0-9a-zA-Z]+)\]/g, (_, c) => `<span style="color:${/^#?[0-9a-fA-F]{3,8}$/.test(c) ? (c.startsWith("#") ? c : `#${c}`) : c.replace(/[^a-z]/gi, "")}">`)
    .replace(/\[\/color\]/g, "</span>")
    .split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
}

export function tutorialWindow() {
  return windowOver("How to play", () => {
    const text = h("div", { class: "tutorial notes" });
    const kept = store.get(TUTORIAL_KEY);
    if (kept && kept.text) text.innerHTML = bbcodeToHtml(kept.text);
    else fill(text, loading("The tutorial loads in with the game the first time…"));
    game.ask("tutorial.text").then((r) => {
      if (r.error || !r.text) return;
      store.set(TUTORIAL_KEY, r);
      text.innerHTML = bbcodeToHtml(r.text);
    });
    return text;
  }, "wide");
}

// ---------------------------------------------------------------- Feedback

export const FEEDBACK_MAX = 2000;

// `version`: the game's version, sent with it (Updater.current_version()).
export function feedbackWindow(version) {
  return popup("Feedback and Reviews", (close) => {
    const box = h("textarea", { placeholder: "Your feedback…", maxlength: String(FEEDBACK_MAX), rows: "8", "aria-label": "Your feedback" });
    const status = h("p", { class: "status", role: "status" });
    const send = h("button", { class: "wbtn yes", type: "button", text: "Send", disabled: true });
    box.addEventListener("input", () => { send.disabled = box.value.trim() === ""; });
    // Enter sends (after "Finished?"); Shift+Enter starts a new line.
    box.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } });
    send.addEventListener("click", ask);
    async function ask() {
      const text = box.value.trim();
      if (!text) return;
      const sure = await popup("Finished?", (done) => h("div", { class: "pop-body" }, h("p", { text: "Finished? Send your feedback now?" }),
        h("div", { class: "pop-buttons" }, h("button", { class: "wbtn yes", type: "button", text: "Send", onclick: () => done(true) }),
          h("button", { class: "wbtn", type: "button", text: "Keep writing", onclick: () => done(false) }))));
      if (!sure) { box.focus(); return; }
      send.disabled = true;
      status.textContent = "Sending…";
      const r = await call("POST", "/feedback", { text, version: String(version || "") });
      send.disabled = false;
      if (r.status !== 200) { status.textContent = why(r); return; }
      close("sent");
    }
    setTimeout(() => box.focus(), 0);
    return h("div", { class: "pop-body wide" },
      h("p", { text: "Tell us what you think: what you love, what's broken, what you'd like to see." }), box,
      h("div", { class: "pop-buttons" }, send, h("button", { class: "wbtn", type: "button", text: "Close", onclick: () => close() })), status);
  });
}

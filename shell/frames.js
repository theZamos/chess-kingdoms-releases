// The game's frame cap, kept by the webpage (.scratch/web-loading/).
//
// In the web build (no threads) Godot's own cap (Engine.max_fps) waits out
// the rest of every frame in a busy loop: hidden behind the webpage at 10
// frames a second, the game held the page for about 95 ms of every 100, so
// clicks and scrolling waited. The game keeps Engine.max_fps at 0 there and
// says its cap with ckShell.frames(fps) (WebShell.cap_frames()); this holds
// Godot's next frame back with a timer instead, leaving the page free between
// frames.
//
// Godot asks for each frame with requestAnimationFrame(MainLoop_runner)
// (Emscripten's main loop, which looks requestAnimationFrame up every frame),
// so only that callback is held back; the page's own animations aren't.

export const ENGINE_FRAME = "MainLoop_runner";
// A held frame is asked of the browser this much before it's due, as the
// browser runs it at its next screen refresh (up to about 16 ms later).
const EARLY_MS = 8;

export function frameCap(win = window) {
  const raf = win.requestAnimationFrame.bind(win);
  let cap = 0;
  let last = -Infinity;
  let held = null;  // {cb, timer}: the game's next frame, waiting

  const run = (cb) => raf((t) => { last = t; cb(t); });
  win.requestAnimationFrame = function (cb) {
    if (typeof cb !== "function" || cb.name !== ENGINE_FRAME) return raf(cb);
    if (!cap) return run(cb);
    const wait = last + 1000 / cap - EARLY_MS - win.performance.now();
    if (wait <= 0) return run(cb);
    held = { cb, timer: win.setTimeout(() => { held = null; run(cb); }, wait) };
    return 0;
  };

  return {
    // `fps` frames a second at most; 0 (or less) for no cap. A frame held for
    // a slower cap goes at once.
    set(fps) {
      const n = Number(fps);
      cap = Number.isFinite(n) && n > 0 ? n : 0;
      if (held) {
        win.clearTimeout(held.timer);
        const { cb } = held;
        held = null;
        win.requestAnimationFrame(cb);
      }
    },
    get cap() { return cap; },
  };
}

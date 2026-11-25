// When to start the game (.scratch/web-loading/).
//
// The game downloads as soon as the page has shown (Zac's game_preload), but
// starting it (Godot's start-up, its scripts and the Dashboard) is one piece
// of work of several seconds that the browser can't break up: the page can't
// answer a click until it's done. So once everything has downloaded, the start
// waits for a quiet moment: no click, key, scroll or touch for QUIET_MS (at
// once if there was none, or the tab is in the background), and never longer
// than MOST_MS. Anything that needs the game starts it at once (now()).

export const QUIET_MS = 1000;
export const MOST_MS = 15000;
const INPUTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"];

// Watches `target` for input from now on. `hidden()`: whether the page is
// out of sight. `clock()`: the time in ms.
export function quietWatch(target = window, {
  quietMs = QUIET_MS, mostMs = MOST_MS,
  hidden = () => typeof document !== "undefined" && document.hidden,
  clock = () => Date.now(),
} = {}) {
  let last = -Infinity;
  let waiting = null;  // {done, promise, timer}
  let needed = false;
  const mark = () => { last = clock(); };
  for (const e of INPUTS) target.addEventListener(e, mark, { capture: true, passive: true });

  function finish() {
    if (!waiting) return;
    clearTimeout(waiting.timer);
    const { done } = waiting;
    waiting = null;
    done();
  }

  return {
    // Resolves at the next quiet moment (see above).
    moment() {
      if (waiting) return waiting.promise;
      const asked = clock();
      let done;
      const promise = new Promise((r) => { done = r; });
      waiting = { done, promise, timer: 0 };
      const check = () => {
        if (!waiting) return;
        const now = clock();
        if (needed || hidden() || now - last >= quietMs || now - asked >= mostMs) return finish();
        waiting.timer = setTimeout(check, Math.max(1, Math.min(last + quietMs, asked + mostMs) - now));
      };
      check();
      return promise;
    },
    // Stop waiting, now and from now on: the game is needed.
    now() {
      needed = true;
      finish();
    },
    get waiting() { return !!waiting; },
  };
}

// Asking the game for what only it has (.scratch/html-menus/): your own maps,
// opening the Map Maker. `game.ask(what, args)` sends window.ck.ask({id, what,
// args}) once the game is ready (asks made before that wait for it, which is
// what the pages' loading signs stand for), and resolves with the game's
// answer (window.ckShell.answer, from WebShell.ask() and its handlers, such as
// WebMaps): an object, with `error` when it couldn't. The game also says when
// something it keeps changed (window.ckShell.changed("maps")).

let ready = false;
let next = 1;
const waiting = new Map();
const queued = [];
const readyFns = new Set();
const changedFns = new Map();

function send(id, what, args) {
  if (!(window.ck && typeof window.ck.ask === "function")) {
    settle(id, { error: "The game can't answer that." });
    return;
  }
  try {
    window.ck.ask({ id, what, args });
  } catch (e) {
    settle(id, { error: `The game couldn't answer: ${e && e.message ? e.message : e}` });
  }
}

function settle(id, result) {
  const done = waiting.get(id);
  if (!done) return;
  waiting.delete(id);
  done(result && typeof result === "object" ? result : { error: "The game's answer made no sense." });
}

export const game = {
  isReady: () => ready,
  // The game has started and listens (window.ckShell.ready()).
  markReady() {
    if (ready) return;
    ready = true;
    while (queued.length) send(...queued.shift());
    for (const fn of readyFns) fn();
  },
  // Ask the game; resolves with its answer once it's ready and has answered.
  ask(what, args = {}) {
    const id = next++;
    return new Promise((resolve) => {
      waiting.set(id, resolve);
      if (ready) send(id, what, args);
      else queued.push([id, what, args]);
    });
  },
  // window.ckShell.answer(json): {id, result}.
  answer(json) {
    let a;
    try { a = typeof json === "string" ? JSON.parse(json) : json; } catch { return; }
    if (a && typeof a === "object") settle(a.id, a.result);
  },
  // window.ckShell.changed(what).
  changed(what) {
    for (const fn of changedFns.get(String(what)) || []) fn();
  },
  onReady(fn) {
    readyFns.add(fn);
    if (ready) fn();
  },
  onChanged(what, fn) {
    if (!changedFns.has(what)) changedFns.set(what, new Set());
    changedFns.get(what).add(fn);
  },
};

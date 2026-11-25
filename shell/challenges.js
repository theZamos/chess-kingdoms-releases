// Home's Daily Challenges on the webpage (.scratch/shop-gems-challenges/), as
// the game's ChallengesBox (game/challenges_box.gd): today's three, easy to
// hard, each with what it asks, a progress bar, the Gems it pays and a pin to
// show it during matches. They live in the game (ChallengeBook), so they come
// in once it has loaded, behind a loading sign; signed out, they show with a
// "Sign in to earn Gems" button.

import { game } from "./game.js";
import { account } from "./account.js";
import { h, fill, loading, note } from "./ui.js";
import { gems } from "./shop_items.js";

const LEVEL_CLASS = ["easy", "medium", "hard"];

export function challengesBox(go) {
  const list = h("div", { class: "challenge-list" }, loading("Today's Challenges load in with the game…"));
  const resets = h("span", { class: "muted small resets" });
  const signIn = h("button", { class: "wbtn", type: "button", hidden: true, onclick: () => go("profile") }, "Sign in to earn Gems");
  const el = h("aside", { class: "challenges", "aria-labelledby": "challenges-heading" },
    h("div", { class: "news-head" }, h("h2", { id: "challenges-heading", text: "Daily Challenges" }), resets), list, signIn);

  function draw(r) {
    resets.textContent = r.resets || "";
    signIn.hidden = Boolean(r.signed_in);
    fill(list, (r.list || []).map((c) => {
      const pin = h("button", { class: "wbtn tiny pin", type: "button", text: c.pinned ? "Unpin" : "Pin", disabled: c.done,
        title: "Show it during matches (in the pinned window, with your pinned Achievements).", "aria-pressed": String(Boolean(c.pinned)),
        onclick: async () => { const a = await game.ask("challenges.pin", { slot: c.slot, on: !c.pinned }); if (!a.error) draw(a); } });
      const meter = h("span", { class: "meter", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(c.goal), "aria-valuenow": String(c.progress) },
        h("span", { class: "done-part", style: `width:${Math.round((100 * Math.min(c.progress, c.goal)) / Math.max(c.goal, 1))}%` }));
      return h("div", { class: `challenge${c.done ? " done" : ""}`, dataset: { slot: c.slot } },
        h("div", { class: "row-line" }, h("span", { class: `level ${LEVEL_CLASS[c.slot] || ""}`, text: c.level }),
          h("span", { class: "what", text: `${c.done ? "✓ " : ""}${c.text}` }), gems(c.gems), pin),
        h("div", { class: "row-line" }, meter, h("span", { class: "muted small", text: `${Math.min(c.progress, c.goal)} / ${c.goal}` })));
    }));
  }

  async function load() {
    const r = await game.ask("challenges.list");
    if (r.error) { fill(list, note(r.error)); return; }
    draw(r);
  }

  game.onChanged("challenges", load);
  account.onChange(() => { signIn.hidden = account.signedIn(); });
  // The countdown, and a new day's three at midnight, while Home shows.
  setInterval(() => { if (el.getClientRects().length && game.isReady() && !document.hidden) load(); }, 60000);
  signIn.hidden = account.signedIn();
  load();
  return { el, load };
}

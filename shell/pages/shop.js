// The Shop as a webpage (/shop, .scratch/shop-gems-challenges/), as the game's
// ShopPage (game/shop_page.gd): Piece styles, Tilesets, Victory effects and
// Piece colours to buy with Gems, each on a card as maps and replays are, with
// your Gems at the top. It shows at once and asks the accounts server itself
// (GET /shop, POST /shop/buy), then tells the game (shop.bought) so the game
// knows what you have. Clicking a card asks before buying.

import { call, why } from "../api.js";
import { account } from "../account.js";
import { game } from "../game.js";
import { h, fill, loading, confirmBox } from "../ui.js";
import { card } from "../library.js";
import { KIND_NAMES, ofKind, item, itemPicture, gems } from "../shop_items.js";

// The sections, in order: the ones with things to sell first (ShopPage.ORDER).
const KINDS = ["color", "effect", "pieces", "tiles"];

export function shopPage(app) {
  let wallet = { gems: 0, owned: [], signed_in: false };
  const status = h("p", { class: "status", role: "status" });
  const balance = h("span", { class: "balance", title: "Your Gems. Earn them with Daily Challenges (on Home)." });
  const signIn = h("button", { class: "wbtn", type: "button", text: "Sign in to buy", hidden: true, onclick: () => app.go("profile") });
  const sections = {};
  for (const kind of KINDS) sections[kind] = h("div", { class: "cards wrap", dataset: { kind } });
  const el = h("div", { class: "pad shop-page" },
    h("div", { class: "head" }, h("h1", { text: "Shop" }), balance,
      h("button", { class: "wbtn", type: "button", text: "Customize", title: "Wear what you have.", onclick: () => app.go("customize") })),
    status, signIn,
    KINDS.map((kind) => [h("h2", { text: `${KIND_NAMES[kind]}s` }), sections[kind]]));

  function draw() {
    fill(balance, wallet.signed_in ? gems(wallet.gems) : null);
    signIn.hidden = wallet.signed_in;
    if (!wallet.signed_in && !status.textContent) status.textContent = "Sign in to earn Gems with Daily Challenges and spend them here.";
    for (const kind of KINDS) {
      const forSale = ofKind(kind).filter((i) => i.price > 0);
      if (!forSale.length) { fill(sections[kind], h("p", { class: "muted", text: "More coming soon." })); continue; }
      fill(sections[kind], forSale.map((it) => {
        const owned = wallet.owned.includes(it.id);
        const c = card({ name: it.name, art: itemPicture(it.id), line: owned ? "Owned" : "", open: () => ask(it.id) });
        c.dataset.item = it.id;
        if (!owned) c.querySelector(".line").replaceWith(h("span", { class: "line price" }, gems(it.price)));
        return c;
      }));
    }
  }

  async function load() {
    if (!account.signedIn()) { wallet = { gems: 0, owned: [], signed_in: false }; draw(); return; }
    fill(balance, loading(""));
    const r = await call("GET", "/shop");
    if (r.status === 200) wallet = { gems: r.gems || 0, owned: r.owned || [], signed_in: Boolean(r.signed_in) };
    else status.textContent = why(r, "Couldn't reach the Shop.");
    draw();
  }

  async function ask(id) {
    const it = item(id);
    if (wallet.owned.includes(id)) { status.textContent = `${it.name} is yours already: pick it on Customize.`; return; }
    if (!wallet.signed_in) { status.textContent = `Sign in to buy ${it.name}.`; return; }
    if (wallet.gems < it.price) {
      status.textContent = `${it.name} costs ${it.price} Gems; you have ${wallet.gems}. Daily Challenges on Home earn more.`;
      return;
    }
    if (!(await confirmBox(`Buy ${it.name} (${KIND_NAMES[it.kind]}) for ${it.price} Gems? You have ${wallet.gems}.`))) return;
    const r = await call("POST", "/shop/buy", { item: id });
    if (r.status !== 200) { status.textContent = why(r, "Couldn't buy it."); return; }
    wallet = { gems: r.gems, owned: r.owned, signed_in: true };
    status.textContent = `${it.name} is yours! Pick it on Customize.`;
    draw();
    game.ask("shop.bought");
  }

  account.onChange(() => { status.textContent = ""; load(); });
  return { el, show() { status.textContent = ""; draw(); load(); }, address: () => "" };
}

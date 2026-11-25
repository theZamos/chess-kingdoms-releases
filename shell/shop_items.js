// The Shop's items as the webpage shows them (.scratch/shop-gems-challenges/):
// the same list as the accounts server's (relay/shop.js CATALOG) and the
// game's (game/shop_catalog.gd); tests keep the three equal. The Shop shows
// at once, before the game has loaded; each card's picture is the game's own
// and comes in with the game (itemPicture()).

import { h } from "./ui.js";
import { game } from "./game.js";

export const KIND_NAMES = { pieces: "Piece style", tiles: "Tileset", effect: "Victory effect", color: "Piece colour" };
export const KINDS = ["pieces", "tiles", "effect", "color"];

export const CATALOG = [
  { id: "color_white", kind: "color", name: "White", price: 0 },
  { id: "color_black", kind: "color", name: "Black", price: 0 },
  { id: "color_red", kind: "color", name: "Red", price: 0 },
  { id: "color_blue", kind: "color", name: "Blue", price: 0 },
  { id: "color_green", kind: "color", name: "Green", price: 0 },
  { id: "color_yellow", kind: "color", name: "Yellow", price: 0 },
  { id: "color_orange", kind: "color", name: "Orange", price: 0 },
  { id: "color_purple", kind: "color", name: "Purple", price: 0 },
  { id: "color_brown", kind: "color", name: "Brown", price: 0 },
  { id: "color_pink", kind: "color", name: "Pink", price: 0 },
  { id: "color_gold", kind: "color", name: "Gold", price: 500 },
  { id: "color_silver", kind: "color", name: "Silver", price: 500 },
  { id: "color_bronze", kind: "color", name: "Bronze", price: 500 },
  { id: "color_sunset", kind: "color", name: "Sunset", price: 500 },
  { id: "color_ocean", kind: "color", name: "Ocean", price: 500 },
  { id: "color_forest", kind: "color", name: "Forest", price: 500 },
  { id: "color_rainbow", kind: "color", name: "Rainbow", price: 800 },
  { id: "effect_fireworks", kind: "effect", name: "Fireworks", price: 0 },
  { id: "effect_confetti", kind: "effect", name: "Confetti", price: 600 },
  { id: "effect_crowns", kind: "effect", name: "Falling Crowns", price: 600 },
  { id: "pieces_classic", kind: "pieces", name: "Classic", price: 0 },
  { id: "tiles_classic", kind: "tiles", name: "Classic", price: 0 },
];

export function item(id) {
  return CATALOG.find((i) => i.id === id) || null;
}

export function ofKind(kind) {
  return CATALOG.filter((i) => i.kind === kind);
}

// The blue diamond and a number: an amount of Gems.
export function gems(n) {
  return h("span", { class: "gems", title: "Gems" }, gemIcon(), h("span", { class: "n", text: String(n) }));
}

export function gemIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("class", "gem");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = '<path d="M3 2h10l3 3-8 10L0 5z" fill="#0d1a4d"/><path d="M3.6 3h8.8l2.2 2.2H1.4z" fill="#b8e6ff"/>'
    + '<path d="M1.6 6h12.8L8 13.6z" fill="#4d9eff"/><path d="M8 6h6.4L8 13.6z" fill="#1f4dc7"/><path d="M4 3.4h1v1H4z" fill="#fff"/>';
  return svg;
}

// The game's own pictures for the cards (WebShop.pictures(): {cards, rows},
// each an item id's PNG address), asked for once, so the cards look as on
// Windows. They come in once the game has loaded; until then a card's picture
// is an empty square.
let pictures = null;

export function gamePictures() {
  if (!pictures) {
    pictures = game.ask("shop.pictures").then((r) => {
      if (r.error || !r.cards) { pictures = null; return { cards: {}, rows: {} }; }
      return { cards: r.cards, rows: r.rows || {} };
    });
  }
  return pictures;
}

// Item `id`'s square picture, for its card (`row`: a colour's picture in
// Customize's colour list, a Pawn in it), drawn by the game (ShopCatalog.picture()).
export function itemPicture(id, { row = false } = {}) {
  const img = h("img", { class: `px item-pic${row ? " small" : ""}`, alt: "", dataset: { item: id } });
  gamePictures().then((p) => {
    const src = (row ? p.rows : p.cards)[id];
    if (src) img.src = src;
  });
  return img;
}

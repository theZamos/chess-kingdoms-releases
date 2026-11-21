// Players' pictures drawn on the webpage as the game draws them
// (Profile.picture() in game/profile.gd): a Piece in a colour standing on a
// tile, 20 x 20 pixels. The parts come from the game's own art
// (web/shell/pictures/, made by tools/make_web_art.gd), so a picture shows
// before the game has loaded. picture({piece, tile, color}) resolves with a
// data: PNG address; a missing or unknown picture is a Pawn on grass.

let parts = null;
const images = new Map();
const drawn = new Map();

async function loadParts() {
  if (!parts) {
    parts = fetch("shell/pictures/index.json").then((r) => (r.ok ? r.json() : null)).catch(() => null);
  }
  return parts;
}

function image(file) {
  if (!images.has(file)) {
    images.set(file, new Promise((done) => {
      const img = new Image();
      img.onload = () => done(img);
      img.onerror = () => done(null);
      img.src = `shell/pictures/${file}`;
    }));
  }
  return images.get(file);
}

function pixels(img) {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d");
  g.drawImage(img, 0, 0);
  return g.getImageData(0, 0, img.width, img.height);
}

// The lists to pick from: {tiles: [{id, name}], pieces: [{id, name}],
// palette: [{name, color}]}, or null if they couldn't be read.
export async function choices() {
  return loadParts();
}

// `info`: {piece, tile, color} as players send it (Profile.picture_info()).
export async function picture(info = {}) {
  const p = await loadParts();
  if (!p) return "shell/art/default_picture.png";
  const piece = String(info.piece || p.default_piece);
  const tile = String(info.tile || "grass");
  const color = Math.min(Math.max(Number.parseInt(info.color, 10) || 0, 0), p.palette.length - 1);
  const key = `${piece}:${tile}:${color}`;
  if (!drawn.has(key)) drawn.set(key, draw(p, piece, tile, color));
  return drawn.get(key);
}

async function draw(p, piece, tile, color) {
  const size = p.size, t = p.tile;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d");
  const out = g.createImageData(size, size);
  // The tile repeats to fill the picture, from its middle outwards.
  if (p.tiles.some((x) => x.id === tile)) {
    const tileImg = await image(`tile_${tile}.png`);
    if (tileImg) {
      const src = pixels(tileImg);
      const offset = Math.floor((size - t) / 2);
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const sx = (((x - offset) % t) + t) % t, sy = (((y - offset) % t) + t) % t;
          const from = (sy * src.width + sx) * 4, to = (y * size + x) * 4;
          for (let k = 0; k < 4; k++) out.data[to + k] = src.data[from + k];
        }
      }
    }
  }
  const def = p.pieces.find((x) => x.id === piece);
  const entry = p.palette[color];
  if (def && def.arts > 0) {
    const art = entry.art < def.arts ? entry.art : 0;
    const spriteImg = await image(`piece_${piece}_${art}.png`);
    if (spriteImg) {
      const src = pixels(spriteImg);
      const ax = Math.floor((size - src.width) / 2), ay = Math.floor((size - src.height) / 2);
      for (let y = 0; y < src.height; y++) {
        for (let x = 0; x < src.width; x++) {
          const tx = x + ax, ty = y + ay;
          if (tx < 0 || ty < 0 || tx >= size || ty >= size) continue;
          const from = (y * src.width + x) * 4, to = (ty * size + tx) * 4;
          // The sprite's pixel times the colour's tint, blended over the tile (Image.blend_rect).
          const sa = (src.data[from + 3] / 255) * entry.tint[3];
          if (sa <= 0) continue;
          const da = out.data[to + 3] / 255;
          const oa = sa + da * (1 - sa);
          for (let k = 0; k < 3; k++) {
            const s = (src.data[from + k] / 255) * entry.tint[k], d = out.data[to + k] / 255;
            out.data[to + k] = Math.round(((s * sa + d * da * (1 - sa)) / oa) * 255);
          }
          out.data[to + 3] = Math.round(oa * 255);
        }
      }
    }
  }
  g.putImageData(out, 0, 0);
  return canvas.toDataURL("image/png");
}

// An <img> showing `info`'s picture once it's drawn (pixels stay sharp).
export function pictureImg(info, { size = 36, cls = "" } = {}) {
  const img = document.createElement("img");
  img.className = `px pic-img ${cls}`.trim();
  img.alt = "";
  img.width = img.height = size;
  img.src = "shell/art/default_picture.png";
  picture(info || {}).then((src) => { img.src = src; });
  return img;
}

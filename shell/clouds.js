// Cloud shadows over the webpage Home's slideshow (.scratch/settings-fixes/):
// the game's cloud shader (game/cloud_shadows.gdshader) worked out on a small
// canvas over the maps and stretched smoothly over them, so they look like the
// clouds over the Windows menus and in matches. Graphics > Cloud shadows
// switches them; they drift only while Menu background is Moving (and the
// browser isn't asking for less motion).

// The shader's numbers (its uniforms' defaults; BoardView.CLOUD_SPEED).
export const STRENGTH = 0.3;
export const SIZE = 80;
export const SPACING = 180;
export const COVERAGE = 0.9;
export const SPEED = 12;
// CSS pixels per canvas pixel: the clouds are soft, so a coarse grid stretched
// smoothly looks the same and costs a fraction of the work.
export const CELL = 10;
// Frames a second the drift is drawn at (clouds move 12 world pixels a second).
export const FPS = 12;

const fract = (x) => x - Math.floor(x);

// The shader's hash (no sin(), so it's the same everywhere).
export function hash(x, y) {
  let a = fract(x * 0.1031), b = fract(y * 0.1031), c = fract(x * 0.1031);
  const d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33);
  a += d; b += d; c += d;
  return fract((a + b) * c);
}

function noise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return (a + (b - a) * ux) * (1 - uy) + (c + (d - c) * ux) * uy;
}

function cloud(cx, cy, px, py) {
  if (hash(cx + 3.7, cy + 1.3) > COVERAGE) return 0;
  const mx = (cx + 0.15 + 0.7 * hash(cx, cy)) * SPACING;
  const my = (cy + 0.15 + 0.7 * hash(cx + 19.19, cy + 7.31)) * SPACING;
  const r = SIZE * 0.5 * (0.75 + 0.5 * hash(cx + 8.1, cy + 2.9));
  let d = 0;
  for (let i = 0; i < 7; i++) {
    const hx = hash(cx + i * 4.17, cy + 11.3), hy = hash(cx + i * 4.17 + 19.19, cy + 11.3 + 7.31);
    const ox = i === 0 ? 0 : (hx - 0.5) * 1.7 * r, oy = i === 0 ? 0 : (hy - 0.5) * 0.7 * r;
    const pr = r * (i === 0 ? 0.42 : 0.2 + 0.18 * hy);
    const qx = px - mx - ox, qy = (py - my - oy) / 0.85;
    d += Math.exp(-(qx * qx + qy * qy) / (pr * pr));
  }
  return d;
}

const smoothstep = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };

// The shadow's opacity (0 to STRENGTH) at world pixel (x, y), as the shader's fragment().
export function shadeAt(x, y) {
  const hx = Math.floor(x / SPACING), hy = Math.floor(y / SPACING);
  let density = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) density += cloud(hx + i, hy + j, x, y);
  density += (noise(x / 4, y / 4) - 0.5) * 0.2 + (noise(x / 9, y / 9) - 0.5) * 0.2;
  let shade = smoothstep(0.35, 0.95, density);
  shade *= 0.75 + 0.25 * smoothstep(1.1, 1.8, density);
  return shade * STRENGTH;
}

// The layer over `box` (the slideshow): clouds.set({on, drift, scale}).
// `scale`: CSS pixels per world pixel (how big the maps are drawn). Working out
// the clouds costs about 20 ms for a laptop's page, so they're worked out once
// on a canvas MARGIN bigger than the page all round, which then slides with
// the wind (a CSS transform); before it runs out, the next one is worked out a
// few rows at a time (SLICE_MS each) and swapped in.
export const MARGIN = 320;
export const SLICE_MS = 6;

export function cloudLayer(box) {
  const wind = (() => { const a = Math.random() * Math.PI * 2; return [Math.cos(a) * SPEED, Math.sin(a) * SPEED]; })();
  const make = () => {
    const c = document.createElement("canvas");
    c.className = "clouds";
    c.setAttribute("aria-hidden", "true");
    c.hidden = true;
    box.append(c);
    return c;
  };
  let shown = make(), spare = make();
  let on = false, drift = false, scale = 2, awake = true, tick = 0, building = null;
  const clock = () => performance.now() / 1000;
  // The time each canvas was worked out for, and the size and scale it was worked out at.
  const made = new Map();

  // Work out `canvas` for time `t0`, a few rows per slice; `done` when finished.
  function build(canvas, t0, done) {
    const ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) return;
    const bw = box.clientWidth, bh = box.clientHeight;
    const w = Math.max(1, Math.ceil((bw + 2 * MARGIN) / CELL)), h = Math.max(1, Math.ceil((bh + 2 * MARGIN) / CELL));
    const img = ctx.createImageData(w, h);
    const t = drift ? t0 : 0, sc = scale;
    let y = 0;
    const job = { cancelled: false };
    function slice() {
      if (job.cancelled) return;
      const until = performance.now() + SLICE_MS;
      for (; y < h && performance.now() < until; y++) {
        for (let x = 0; x < w; x++) {
          const a = shadeAt((x * CELL - MARGIN) / sc - wind[0] * t, (y * CELL - MARGIN) / sc - wind[1] * t);
          const k = (y * w + x) * 4;
          img.data[k] = 5; img.data[k + 1] = 5; img.data[k + 2] = 20; img.data[k + 3] = Math.round(a * 255);
        }
      }
      if (y < h) { setTimeout(slice, 0); return; }
      canvas.width = w; canvas.height = h;
      canvas.style.width = `${w * CELL}px`; canvas.style.height = `${h * CELL}px`;
      ctx.putImageData(img, 0, 0);
      made.set(canvas, { t0, bw, bh, sc, drift });
      done();
    }
    slice();
    return job;
  }

  // Slide the shown canvas with the wind; start the next one before it runs out.
  function place() {
    const m = made.get(shown);
    if (!m) return;
    const dt = m.drift ? clock() - m.t0 : 0;
    const dx = wind[0] * dt * m.sc, dy = wind[1] * dt * m.sc;
    shown.style.transform = `translate(${(dx - MARGIN).toFixed(1)}px, ${(dy - MARGIN).toFixed(1)}px)`;
    const stale = m.bw !== box.clientWidth || m.bh !== box.clientHeight || m.sc !== scale || m.drift !== drift;
    if (!building && (stale || Math.max(Math.abs(dx), Math.abs(dy)) > MARGIN / 2)) {
      building = build(spare, clock(), () => {
        building = null;
        [shown, spare] = [spare, shown];
        spare.hidden = true;
        shown.hidden = !on;
        place();
      });
    }
  }

  function run() {
    clearInterval(tick);
    tick = 0;
    shown.hidden = !on || !made.has(shown);
    if (!on || !awake) return;
    if (!made.has(shown) && !building) {
      building = build(shown, clock(), () => { building = null; shown.hidden = !on; place(); });
    } else place();
    if (drift) tick = setInterval(place, 1000 / FPS);
  }

  return {
    set(next) {
      if (next.on !== undefined) on = !!next.on;
      if (next.drift !== undefined) drift = !!next.drift;
      if (next.scale > 0) scale = next.scale;
      run();
    },
    sleep() { awake = false; clearInterval(tick); tick = 0; },
    wake() { if (!awake) { awake = true; run(); } },
    state: () => ({ on, drift, scale, ready: made.has(shown) }),
  };
}

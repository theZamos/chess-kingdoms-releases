// AP as its blue circle on the webpage, as the game's ApText (game/ap_text.gd):
// the character SIGN, drawn by the ApCircle font every stack in shell.css
// starts with. Text from the game already has it; the page changes what it
// keeps or reads itself (the changelog, the Tutorial, Settings' labels).

export const SIGN = String.fromCharCode(0xf8a0);
const WORD = /\bAP\b/g;

// `text` with the circle for each word AP.
export function apText(text) {
  return String(text ?? "").replace(WORD, SIGN);
}

// Where only plain words can go (hover titles, what screen readers say): AP again.
export function apWord(text) {
  return String(text ?? "").replaceAll(SIGN, "AP");
}

// The same in HTML that's already escaped: each circle is read out as AP.
export function apHtml(html) {
  return apText(html).replaceAll(SIGN, `<span class="ap" role="img" aria-label="AP">${SIGN}</span>`);
}

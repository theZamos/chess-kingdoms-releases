// The changelog (CHANGELOG.md) as the web build shows it: the same rules as
// the game's ChangelogWindow (game/changelog_window.gd), which this mirrors.
// "- [Web] …" lines are this build's, "- [Windows] …" lines are left out, and
// "- [Dev] …" lines (staff notes) are left out; "###" headings left with no
// lines go too.

const DEV = "[Dev] ";

export function forPlatform(markdown, which = "web") {
  const mine = which === "web" ? "[Web] " : "[Windows] ";
  const other = which === "web" ? "[Windows] " : "[Web] ";
  const out = [];
  let heading = "";
  let under = [];
  let kept = false;
  const lines = String(markdown).replace(/\r/g, "").split("\n");
  for (let i = 0; i <= lines.length; i++) {
    let line = i < lines.length ? lines[i] : "## ";
    if (line.startsWith("#")) {
      if (heading !== "") {
        if (kept) out.push(heading, ...under);
      } else {
        out.push(...under);
      }
      heading = "";
      under = [];
      kept = false;
      if (i === lines.length) break;
      if (line.startsWith("### ")) {
        heading = line;
        continue;
      }
      out.push(line);
      continue;
    }
    const stripped = line.replace(/^\s+/, "");
    if (stripped.startsWith("- ")) {
      const lead = line.slice(0, line.length - stripped.length + 2);
      let rest = stripped.slice(2);
      if (rest.startsWith(DEV)) continue;
      if (rest.startsWith(other)) continue;
      if (rest.startsWith(mine)) line = lead + rest.slice(mine.length);
    }
    under.push(line);
    if (line.trim() !== "") kept = true;
  }
  return out.join("\n");
}

// The versions, newest first: [{version, title, body}] from each
// "## v1.2.3 — Title" heading and the Markdown under it.
export function parse(markdown) {
  const out = [];
  for (const line of String(markdown).split("\n")) {
    if (line.startsWith("## ")) {
      const title = line.slice(3).trim();
      out.push({ version: title.split(" ")[0], title, body: "" });
    } else if (out.length) {
      out[out.length - 1].body += line + "\n";
    }
  }
  for (const s of out) s.body = s.body.trim();
  return out;
}

// The web build's versions, newest first.
export function versions(markdown) {
  return parse(forPlatform(markdown, "web"));
}

function escape(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inline(text) {
  return escape(text)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

// The Markdown the changelog uses (### headings, - bullets, nested by two
// spaces, **bold**, `code`) as HTML.
export function toHtml(markdown) {
  const html = [];
  const open = []; // indents of the lists that are open
  const close = (to) => {
    while (open.length && open[open.length - 1] > to) {
      open.pop();
      html.push("</li></ul>");
    }
  };
  for (const raw of String(markdown).split("\n")) {
    const stripped = raw.replace(/^\s+/, "");
    if (stripped.startsWith("- ")) {
      const indent = raw.length - stripped.length;
      if (!open.length || indent > open[open.length - 1]) {
        open.push(indent);
        html.push("<ul><li>");
      } else {
        close(indent);
        html.push("</li><li>");
      }
      html.push(inline(stripped.slice(2)));
      continue;
    }
    close(-1);
    if (raw.startsWith("### ")) html.push(`<h4>${inline(raw.slice(4))}</h4>`);
    else if (raw.trim() !== "") html.push(`<p>${inline(raw.trim())}</p>`);
  }
  close(-1);
  return html.join("");
}

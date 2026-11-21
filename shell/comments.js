// Comments at the bottom of a shared map's page, as the game's CommentsBox
// (game/comments_box.gd): what players said, oldest first; a box to add one
// (signed in); Remove on the ones you may take down (the server says which);
// a Report flag on other players'. A report on the Admin page opens the page
// at its comment, lit up (`focus`).

import { call, why } from "./api.js";
import { account } from "./account.js";
import { h, fill, loading, note, localTime, reportFlag } from "./ui.js";
import { pathOf } from "./routes.js";

export const MAX_LENGTH = 500;

export function commentsBox() {
  let kind = "maps", id = 0, shown = 0, focus = 0;
  const list = h("div", { class: "comment-list" });
  const status = h("span", { class: "status" });
  const entry = h("textarea", { placeholder: "Say something about it…", maxlength: String(MAX_LENGTH), rows: "3" });
  const post = h("button", { class: "wbtn", type: "button", text: "Post comment", disabled: true });
  const signIn = note("Sign in to comment.");
  const box = h("section", { class: "comments", hidden: true },
    h("h2", { text: "Comments" }), list, entry, h("div", { class: "row-line" }, post, status), signIn);

  entry.addEventListener("input", () => { post.disabled = entry.value.trim() === ""; });
  post.addEventListener("click", async () => {
    const text = entry.value.trim();
    if (!text || id <= 0) return;
    post.disabled = true;
    const r = await call("POST", `/${kind}/${id}/comments`, { text });
    if (r.status !== 200) {
      status.textContent = why(r);
      post.disabled = false;
      return;
    }
    entry.value = "";
    show(r.comments || []);
  });

  function show(comments, empty = "No comments yet.") {
    status.textContent = "";
    fill(list, comments.length ? null : note(empty));
    let lit = null;
    for (const c of comments) {
      const row = rowOf(c);
      list.append(row);
      if (focus > 0 && Number(c.id) === focus) lit = row;
    }
    if (lit) {
      focus = 0;
      requestAnimationFrame(() => lit.scrollIntoView({ block: "center" }));
    }
  }

  function rowOf(c) {
    const author = String((c.author && c.author.username) || "");
    const commentId = Number(c.id) || 0;
    const top = h("div", { class: "comment-top" },
      h("a", { class: "who", href: pathOf("player", author) || "#", text: author, "data-go": "player", "data-id": author }),
      h("span", { class: "muted when", text: `·  ${localTime(Number(c.created) || 0)}` }));
    if (account.signedIn() && author !== account.username()) {
      top.append(reportFlag(`${author}'s comment`,
        async (reason) => why(await call("POST", `/${kind}/${id}/report`, { reason, comment_id: commentId })),
        (w) => { status.textContent = w || "Thanks: the staff will take a look."; }));
    }
    if (c.removable) {
      top.append(h("button", { class: "wbtn tiny", type: "button", text: "Remove", onclick: async () => {
        const r = await call("POST", `/${kind}/${id}/uncomment`, { id: commentId });
        if (r.status !== 200) status.textContent = why(r);
        else show(r.comments || []);
      } }));
    }
    return h("div", { class: "comment" + (focus > 0 && commentId === focus ? " lit" : "") }, top,
      h("p", { class: "text", text: String(c.text || "") }));
  }

  return {
    el: box,
    // Show shared item `itemId`'s comments (0 hides the box: it isn't shared);
    // `focusComment`: one to light up.
    async showFor(itemKind, itemId, focusComment = 0) {
      kind = itemKind;
      id = Number(itemId) || 0;
      if (focusComment) focus = Number(focusComment) || 0;
      box.hidden = id <= 0;
      status.textContent = "";
      if (id <= 0) return;
      const signedIn = account.signedIn();
      entry.hidden = post.hidden = !signedIn;
      signIn.hidden = signedIn;
      const asked = ++shown;
      fill(list, loading("Loading the comments…"));
      const r = await call("GET", `/${kind}/${id}/comments`);
      if (asked !== shown) return;
      if (r.status !== 200) show([], why(r, "Couldn't load the comments."));
      else show(r.comments || []);
    },
  };
}

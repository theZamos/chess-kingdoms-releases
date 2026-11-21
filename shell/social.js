// Friends, invites and your party on the webpage (.scratch/html-menus/), as
// the game's AccountClient keeps them (net/account.gd). Once the game has
// loaded, it keeps asking the server (its /sync and /pulse) and says when they
// change (window.ckShell.changed("social")), so the page asks the game rather
// than the server; before that, the page asks the server once itself. The
// page's own changes (Add friend, Accept…) go to the server, then the game is
// asked to look again. Also here: the party panel at the bottom left and the
// invite pop-ups (PartyPanel, InviteToast).

import { call, why } from "./api.js";
import { account } from "./account.js";
import { game } from "./game.js";
import { h, fill } from "./ui.js";
import { pictureImg } from "./pictures.js";

// How long an invite's pop-up stays (AccountClient.INVITE_SECONDS) and the
// most players in a party (PARTY_MAX).
export const INVITE_SECONDS = 10;
export const PARTY_MAX = 4;

const EMPTY = () => ({ friends: {}, notifications: {}, party: {}, party_invites: [], room: "" });
let state = EMPTY();
const listeners = new Set();
let loads = 0;
// Joining a lobby is the game's (set by app.js): join(room, spectate).
let joinRoom = async () => ({ error: "The game isn't ready." });

function changed() {
  for (const fn of listeners) {
    try { fn(state); } catch (e) { console.error(e); }
  }
}

function take(next) {
  state = { ...EMPTY(), ...(next && typeof next === "object" ? next : {}) };
  changed();
}

export const social = {
  state: () => state,
  onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  setJoin(fn) { joinRoom = fn; },
  join: (room, spectate = false) => joinRoom(room, spectate),

  // What the game knows, or (before it has loaded) what the server says.
  async load() {
    const asked = ++loads;
    if (!account.signedIn()) { take(EMPTY()); return; }
    if (game.isReady()) {
      const r = await game.ask("account.social");
      if (asked === loads && !r.error) take(r);
      return;
    }
    const [f, n, p] = await Promise.all([call("GET", "/friends"), call("GET", "/notifications"), call("GET", "/party")]);
    if (asked !== loads || game.isReady()) return;
    const strip = (r) => { const { status, error, ...rest } = r; return r.status === 200 ? rest : {}; };
    const party = strip(p);
    take({ friends: strip(f), notifications: strip(n), party: party.party || {}, party_invites: party.invites || [] });
  },

  // After a change here: the game looks again (or the page, before it has loaded).
  async refresh() {
    if (game.isReady()) {
      const r = await game.ask("account.refresh");
      if (!r.error) take(r);
    } else {
      await social.load();
    }
  },

  // A friend call (/friends/add, /friends/accept, /friends/remove, /follow, /unfollow): why not, or "".
  async friend(path, name) {
    const r = await call("POST", path, { username: String(name).trim() });
    if (r.status !== 200) return why(r);
    await social.refresh();
    return "";
  },

  // A party call (/party/invite, /party/accept, /party/decline, /party/leave, /party/leader, /party/kick).
  async party(path, body = {}) {
    const r = await call("POST", path, body);
    if (r.status !== 200) return why(r);
    await social.refresh();
    return "";
  },

  async inviteToGame(name, room) {
    return why(await call("POST", "/invites", { username: name, room }));
  },
  async requestJoin(name) {
    return why(await call("POST", "/invites", { username: name, request: true }));
  },
  // Answer an invite, a request or an approval (AccountClient.respond_invite()).
  async respond(id, accept, joined = false) {
    const body = { id, accept };
    if (joined) body.joined = true;
    const r = await call("POST", "/invites/respond", body);
    await social.refresh();
    return why(r);
  },

  unseen() {
    let n = 0;
    for (const key of ["invites", "requests"]) for (const x of state.notifications[key] || []) if (!x.seen) n++;
    return n;
  },
  // Opening your profile marks invites and requests seen (AccountClient.mark_seen()).
  async markSeen() {
    if (!social.unseen()) return;
    for (const key of ["invites", "requests"]) for (const x of state.notifications[key] || []) x.seen = true;
    changed();
    await call("POST", "/notifications/seen");
  },
};

// An invite you take straight away (from the host, or to a public lobby).
export function joinsDirectly(invite) {
  return String(invite.kind || "invite") === "invite" && !invite.needs_approval;
}

// What an invite, request or approval says after the name (FriendsPanel.invite_text()).
export function inviteText(invite) {
  const kind = String(invite.kind || "invite");
  if (kind === "request") return "wants to join your lobby";
  if (kind === "approval") return invite.via ? `was invited by ${invite.via}` : "wants to join your lobby";
  return "invites you to their lobby" + (invite.needs_approval ? " (the host lets you in)" : "");
}

export function acceptText(invite) {
  return String(invite.kind || "invite") === "invite" && !joinsDirectly(invite) ? "Ask to join" : "Accept";
}

// Accept (or Ask to join) and Decline for `invite`; `said(why)` hears how it went.
export function inviteButtons(invite, said) {
  const id = Number(invite.id) || 0;
  const direct = joinsDirectly(invite);
  return [
    h("button", { class: "wbtn", type: "button", text: acceptText(invite), onclick: async () => {
      if (direct) {
        const r = await social.join(String(invite.room || ""), false);
        if (r && r.error) { said(r.error); return; }
      }
      said(await social.respond(id, true, direct));
    } }),
    h("button", { class: "wbtn", type: "button", text: "Decline", onclick: async () => said(await social.respond(id, false, false)) }),
  ];
}

// ---------------------------------------------------------------- invite pop-ups

const toasted = new Set();

function toastInvite(invite) {
  const box = document.querySelector("#invites");
  if (!box) return;
  const from = invite.from || {};
  const close = () => row.remove();
  const row = h("div", { class: "invite-toast box", role: "alert", dataset: { id: String(invite.id) } },
    pictureImg(from.picture || {}, { size: 40 }),
    h("span", { class: "text", text: `${from.username || "A friend"} ${inviteText(invite)}.` }),
    inviteButtons(invite, () => close()),
    h("button", { class: "flat", type: "button", text: "×", title: "Not now (it stays on your Profile page for an hour).", onclick: close }));
  for (const b of row.querySelectorAll(".wbtn")) b.addEventListener("click", close);
  box.append(row);
  setTimeout(close, INVITE_SECONDS * 1000);
}

social.onChange((s) => {
  const invites = s.notifications.invites || [];
  for (const invite of invites) {
    if (!invite.seen && !toasted.has(invite.id)) {
      toasted.add(invite.id);
      toastInvite(invite);
    }
  }
  // Answered elsewhere, or gone: its pop-up goes.
  for (const row of document.querySelectorAll("#invites .invite-toast")) {
    if (!invites.some((i) => String(i.id) === row.dataset.id)) row.remove();
  }
});

// ---------------------------------------------------------------- the party panel

// Bottom left of the webpage (PartyPanel): your party and parties inviting you;
// folded, a row of the members' faces.
export function partyPanel(openProfile) {
  let expanded = false;
  const el = h("aside", { class: "party box", "aria-label": "Party", hidden: true });
  const status = h("p", { class: "status small", hidden: true });
  const act = async (work) => {
    const w = await work();
    status.textContent = w;
    status.hidden = !w;
  };
  const personRow = (card, detail) => h("div", { class: "party-person" },
    pictureImg(card.picture || {}, { size: 28 }),
    h("div", {}, h("a", { href: `/player/${encodeURIComponent(card.username || "")}`, text: String(card.username || ""), title: "Their profile",
      onclick: (e) => { e.preventDefault(); openProfile(String(card.username || "")); } }),
    detail ? h("div", { class: "muted small", text: detail }) : null));
  function draw(s) {
    const party = s.party || {}, invites = s.party_invites || [];
    const inParty = !!(party.members && party.members.length);
    el.hidden = !inParty && !invites.length;
    fill(el);
    for (const invite of invites) {
      const id = Number(invite.id) || 0;
      el.append(personRow(invite.from || {}, "invites you to their party"), h("div", { class: "row-line end" },
        h("button", { class: "wbtn tiny", type: "button", text: "Accept", onclick: () => act(() => social.party("/party/accept", { id })) }),
        h("button", { class: "wbtn tiny", type: "button", text: "Decline", onclick: () => act(() => social.party("/party/decline", { id })) })));
    }
    if (inParty) {
      const members = party.members;
      const head = h("div", { class: "row-line" }, expanded ? null : members.map((m) => pictureImg(m.picture || {}, { size: 24 })),
        h("button", { class: "flat", type: "button", text: `Party ${members.length} / ${PARTY_MAX}  ${expanded ? "−" : "+"}`,
          title: expanded ? "Fold your party away" : "Your party: who's in it, and Leave", onclick: () => { expanded = !expanded; draw(state); } }));
      el.append(head);
      if (expanded) {
        const lead = String(party.leader || "") === account.username();
        for (const m of members) {
          const row = personRow(m, m.leader ? "Leader" : "");
          const name = String(m.username || "");
          if (lead && name !== account.username()) {
            row.append(h("select", { class: "tiny-menu", title: `Make ${name} the leader, or remove them`, "aria-label": `${name}: more`,
              onchange: (e) => {
                const pick = e.target.value;
                e.target.value = "";
                if (pick === "lead") act(() => social.party("/party/leader", { username: name }));
                if (pick === "kick") act(() => social.party("/party/kick", { username: name }));
              } }, h("option", { value: "", text: "…" }), h("option", { value: "lead", text: "Make leader" }),
            h("option", { value: "kick", text: "Remove from party" })));
          }
          el.append(row);
        }
        el.append(h("p", { class: "muted small", text: lead ? "You lead: the party joins the lobbies you join." : "Where the leader goes, the party follows." }),
          h("button", { class: "wbtn tiny", type: "button", text: "Leave party", onclick: () => act(() => social.party("/party/leave")) }));
      }
    }
    el.append(status);
  }
  social.onChange(draw);
  draw(state);
  return el;
}

// Sign-in changes: load again. The game's changes come with ckShell.changed("social").
account.onChange(() => social.load());
game.onChanged("social", () => social.load());
game.onReady(() => social.load());

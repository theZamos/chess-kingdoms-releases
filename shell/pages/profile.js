// Your profile as a webpage (/profile, .scratch/html-menus/), as the game's
// ProfilePage (game/profile_page.gd): your name and picture (the pencil
// changes them), your status, tags, clan and Elo; signing in, up and out
// (AccountPanel); Friends, your Clan, and your stats; your shared maps and
// replays; and the Achievements window. What the accounts server has shows at
// once; what this computer keeps (your stats, achievements, and saving your
// profile, which the game keeps) comes from the game, behind a loading sign.

import { why } from "../api.js";
import { account, TAG_NAMES } from "../account.js";
import { game } from "../game.js";
import { h, fill, loading, note, popup } from "../ui.js";
import { pictureImg, picture, choices } from "../pictures.js";
import { statusDot, STATUS_NAMES, tagRow, clanBadge, hasRanked, eloLink, bannedLink, ownBan, person, lastOnlineText, byPresence, joinOptions, canParty } from "../people.js";
import { social, inviteText, inviteButtons } from "../social.js";
import { signIn, signUp, forgotPassword, resetPassword, signOut, resendConfirmation, signUpDoneText } from "../session.js";
import { clansView } from "./clans.js";
import { uploadsList } from "./player.js";
import { call } from "../api.js";

const NAME_LENGTH = 20;

function bar() {
  try { return JSON.parse(localStorage.getItem("ck.bar") || "{}") || {}; } catch { return {}; }
}

export function profilePage(app) {
  // Your profile as the game keeps it (profile.get), once it has loaded.
  let local = null;
  let editing = false;
  let tab = "";
  const picture128 = h("img", { class: "px profile-pic", alt: "Your picture", width: 128, height: 128 });
  const nameRow = h("div", { class: "name-row big" });
  const clanRow = h("div", { class: "row-line clan-line" });
  const editBox = h("div", { class: "edit-box", hidden: true });
  const renameStatus = h("p", { class: "status", role: "status" });
  const accountBox = h("div", { class: "box account-panel" });
  const tabsRow = h("div", { class: "tab-buttons", role: "tablist" });
  const tabBody = h("div", { class: "tab-body box" });
  const maps = uploadsList("maps", 12, app.go);
  const replays = uploadsList("replays", 12, app.go);
  const clans = clansView(app, { embedded: true });
  const el = h("div", { class: "pad profile-page" },
    h("div", { class: "profile-columns" },
      h("div", { class: "profile-main" },
        h("div", { class: "head" }, h("h1", { text: "Your Profile" }),
          h("button", { class: "wbtn", type: "button", title: "Every achievement: which you have, and pins for the ones to show during matches.",
            onclick: () => achievementsWindow() }, h("img", { class: "px", src: "shell/art/achievements.png", alt: "", width: 24, height: 24 }), "Achievements"),
          h("button", { class: "wbtn customize", type: "button", title: "Your Piece style, Tileset, Victory effect and Piece colours.",
            onclick: () => app.go("customize") }, "Customize")),
        h("div", { class: "profile-top" }, picture128, h("div", { class: "profile-info" }, nameRow, clanRow, editBox)),
        renameStatus, accountBox),
      h("div", { class: "profile-tabs" }, tabsRow, tabBody)),
    maps.el, replays.el);

  // ---------------------------------------------------------------- the top
  function shownName() {
    if (account.signedIn()) return account.username();
    return (local && local.name) || bar().name || "";
  }
  function shownPicture() {
    if (local) return local.picture;
    const fromAccount = account.signedIn() && account.user().profile && account.user().profile.picture;
    return fromAccount || bar().picture_info || {};
  }
  function hideStatus() {
    if (local) return !!local.hide_status;
    return !!(account.user().profile && account.user().profile.hide_status);
  }

  function drawTop() {
    if (!editing) picture(shownPicture()).then((src) => { picture128.src = src; });
    fill(nameRow);
    if (account.signedIn()) {
      const status = hideStatus() ? "offline" : (local && local.status) || "online";
      const pick = h("select", { class: "status-pick", "aria-label": "Your status", title: `${STATUS_NAMES[status] || "Online"}. Change your status.` },
        h("option", { value: "online", text: "Online", selected: !hideStatus() }),
        h("option", { value: "hidden", text: "Invisible (appear offline)", selected: hideStatus() }));
      pick.addEventListener("change", async () => {
        const r = await game.ask("profile.status", { hide: pick.value === "hidden" });
        if (r.profile) local = r.profile;
        drawTop();
      });
      nameRow.append(h("span", { class: "status-wrap" }, statusDot(status), pick));
    }
    nameRow.append(h("span", { class: "profile-name", text: shownName() || "No name yet" }));
    if (account.signedIn()) nameRow.append(tagRow(account.shownTags(), 22));
    if (!editing) nameRow.append(h("button", { class: "pencil", type: "button", title: "Edit your name and picture", "aria-label": "Edit your name and picture",
      text: "✎", onclick: startEditing }));
    fill(clanRow);
    if (account.signedIn()) {
      const u = account.user();
      const badge = clanBadge(u.clan);
      if (badge) clanRow.append(badge);
      if (hasRanked(u)) {
        const r = u.ranked || {};
        clanRow.append(eloLink(u.elo ?? 1000, account.username(), `   ·   Ranked ${Number(r.wins) || 0}–${Number(r.losses) || 0}`));
      }
      const banned = bannedLink(ownBan(u.banned));
      if (banned) clanRow.append(banned);
    }
  }

  // The pencil: name, Piece, tile, colour, your tags and the clan tag, shown as
  // you pick them; Save changes keeps them (in the game: it keeps your profile).
  async function startEditing() {
    editing = true;
    renameStatus.textContent = "";
    drawTop();
    editBox.hidden = false;
    fill(editBox, loading("Loading the pictures…"));
    const p = await choices();
    if (!editing) return;
    const now = shownPicture();
    const name = h("input", { type: "text", value: shownName(), maxlength: String(NAME_LENGTH), placeholder: "Your name", "aria-label": "Name",
      title: account.signedIn() ? "Your username: names are unique, and you can change yours any time." : "" });
    const piece = h("select", { "aria-label": "Piece" }, (p ? p.pieces : []).map((x) => h("option", { value: x.id, text: x.name, selected: x.id === (now.piece || p.default_piece) })));
    const tile = h("select", { "aria-label": "Tile" }, (p ? p.tiles : []).map((x) => h("option", { value: x.id, text: x.name, selected: x.id === (now.tile || "grass") })));
    const color = h("select", { "aria-label": "Favourite colour", title: "Your colour outside matches. In a match you have your match colour." },
      (p ? p.palette : []).map((x, i) => h("option", { value: String(i), text: x.name, selected: i === (Number(now.color) || 0) })));
    const picked = () => ({ piece: piece.value, tile: tile.value, color: Number(color.value) });
    for (const s of [piece, tile, color]) s.addEventListener("change", async () => { picture128.src = await picture(picked()); });
    picture128.src = await picture(picked());
    const mine = account.signedIn() ? account.myTags() : [];
    const shown = account.signedIn() ? account.shownTags() : [];
    const tagChecks = Object.fromEntries(mine.map((t) => [t, h("input", { type: "checkbox", checked: shown.includes(t) })]));
    const inClan = account.signedIn() && account.user().clan && typeof account.user().clan === "object";
    const clanCheck = h("input", { type: "checkbox", checked: local ? !!local.show_clan_tag : !(account.user().profile || {}).hide_clan_tag });
    const save = h("button", { class: "wbtn", type: "button", text: "Save changes" });
    const cancel = h("button", { class: "wbtn", type: "button", text: "Cancel", onclick: stopEditing });
    name.addEventListener("keydown", (e) => { if (e.key === "Enter") save.click(); });
    save.addEventListener("click", async () => {
      save.disabled = true;
      renameStatus.textContent = game.isReady() ? "Saving…" : "Saving once the game has loaded…";
      const body = { name: name.value.trim(), picture: picked() };
      if (mine.length) body.tags_shown = mine.filter((t) => tagChecks[t].checked);
      if (inClan) body.show_clan_tag = clanCheck.checked;
      const r = await game.ask("profile.save", body);
      if (r.profile) local = r.profile;
      if (r.error) {
        renameStatus.textContent = r.error;
        save.disabled = false;
        return;
      }
      // The game kept it and sent it to your account: the page's copy follows.
      if (account.signedIn()) {
        const me = await call("GET", "/me");
        if (me.status === 200 && me.user) account.update(me.user);
      }
      stopEditing();
      renameStatus.textContent = "Saved.";
    });
    fill(editBox,
      h("div", { class: "edit-grid" },
        h("label", { text: "Name" }), name, h("label", { text: "Piece" }), piece, h("label", { text: "Tile" }), tile,
        h("label", { text: "Favourite colour" }), color),
      mine.length ? h("div", { class: "show-tags" }, h("p", { text: "Show my tags" }), h("div", { class: "checks" },
        mine.map((t) => h("label", { class: "check" }, tagChecks[t], h("img", { class: "px", src: `shell/pictures/tag_${t}.png`, alt: "", width: 18, height: 18 }), ` ${TAG_NAMES[t]}`)))) : null,
      inClan ? h("label", { class: "check", title: "Your clan's tag before your name, wherever others see it." }, clanCheck, " Display Clan Tag") : null,
      h("div", { class: "row-line" }, save, cancel));
    name.focus();
  }

  function stopEditing() {
    editing = false;
    editBox.hidden = true;
    fill(editBox);
    drawTop();
  }

  // ---------------------------------------------------------------- signing in (AccountPanel)
  let form = "sign_in";
  let busy = false;
  const accountStatus = h("p", { class: "status", role: "status" });

  function drawAccount() {
    if (account.signedIn()) {
      const u = account.user();
      fill(accountBox, h("h2", { text: `Signed in as ${account.username()}` }),
        h("p", { class: "muted", text: String(u.email || "") + (account.isAdmin() ? "   ·   Admin" : "") }),
        account.emailConfirmed() ? null : [note("Check your email for a link to confirm your address."),
          h("button", { class: "wbtn", type: "button", text: "Send the link again", onclick: () => run(resendConfirmation, "Sent: check your email.") })],
        h("div", { class: "row-line" }, h("button", { class: "wbtn", type: "button", text: "Sign out", onclick: async () => {
          await signOut();
          form = "sign_in";
          accountStatus.textContent = "Signed out.";
        } })), accountStatus);
      return;
    }
    const fields = {};
    const field = (key, placeholder, type = "text", autocomplete = "") => {
      fields[key] = h("input", { type, placeholder, "aria-label": placeholder, autocomplete: autocomplete || undefined, name: key });
      return fields[key];
    };
    const submit = (text, work) => {
      const b = h("button", { class: "wbtn yes", type: "submit", text });
      fields._submit = b;
      fields._work = work;
      return b;
    };
    const link = (text, to) => h("a", { href: "#", text, onclick: (e) => { e.preventDefault(); showForm(to, fields.email ? fields.email.value : ""); } });
    let body;
    if (form === "sign_up") {
      body = [h("h2", { text: "Create an account" }), note("Your name, picture, settings and keybinds go with it, and follow you to any computer you sign in on."),
        field("username", "Username (3 to 20 letters, digits, _ or -)", "text", "username"), field("email", "Email", "email", "email"),
        field("password", "Password (8 or more characters)", "password", "new-password"), field("confirm", "Confirm password", "password", "new-password"),
        submit("Create account", async () => {
          const username = fields.username.value, email = fields.email.value;
          if (!game.isReady()) accountStatus.textContent = "Getting your profile from the game…";
          const w = await signUp(username, email, fields.password.value);
          if (w === "" && !account.signedIn()) {
            const signInForm = showForm("sign_in");
            signInForm.querySelector('input[name="login"]').value = username;
            return signUpDoneText(email);
          }
          return w;
        }), link("I have an account: sign in", "sign_in")];
    } else if (form === "forgot") {
      body = [h("h2", { text: "Forgot your password?" }), note("We'll email you a code to set a new one."), field("email", "Email", "email", "email"),
        submit("Email me a code", async () => {
          const email = fields.email.value;
          const w = await forgotPassword(email);
          if (!w) showForm("reset", email);
          return w || "If that email has an account, a code is on its way.";
        }), link("I have a code", "reset"), link("Back to sign in", "sign_in")];
    } else if (form === "reset") {
      body = [h("h2", { text: "Set a new password" }), field("email", "Email", "email", "email"), field("code", "Code from the email", "text", "one-time-code"),
        field("password", "New password", "password", "new-password"), field("confirm", "Confirm new password", "password", "new-password"),
        submit("Set password and sign in", async () => (await resetPassword(fields.email.value, fields.code.value, fields.password.value)) || "Password changed; you're signed in."),
        link("Back to sign in", "sign_in")];
    } else {
      body = [h("h2", { text: "Sign in" }), note("Sign in to keep your profile on every computer, add friends and get invites."),
        field("login", "Username or email", "text", "username"), field("password", "Password", "password", "current-password"),
        submit("Sign in", async () => (await signIn(fields.login.value, fields.password.value)) || "Signed in."),
        link("Create an account", "sign_up"), link("Forgot your password?", "forgot")];
    }
    // A real <form>, so password managers fill it in.
    const accountForm = h("form", { class: "account-form", autocomplete: "on" }, body);
    accountForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (fields._submit.disabled) { accountStatus.textContent = "The passwords don't match."; return; }
      run(fields._work);
    });
    if (fields.confirm) {
      // With a Confirm password box, the button is greyed out until both passwords match.
      const sync = () => {
        const ok = fields.password.value !== "" && fields.password.value === fields.confirm.value;
        fields._submit.disabled = !ok;
        fields._submit.title = ok ? "" : "Type the same password in both boxes.";
      };
      fields.password.addEventListener("input", sync);
      fields.confirm.addEventListener("input", sync);
      sync();
    }
    fill(accountBox, accountForm, accountStatus);
    return accountForm;
  }

  function showForm(name, email = "") {
    form = name;
    accountStatus.textContent = "";
    const f = drawAccount();
    const box = f && f.querySelector('input[name="email"]');
    if (box && email) box.value = email;
    return f;
  }

  async function run(work, doneText = "") {
    if (busy) return;
    busy = true;
    accountStatus.textContent = "Asking the accounts server…";
    const result = await work();
    busy = false;
    accountStatus.textContent = result || doneText;
  }

  // ---------------------------------------------------------------- the tabs
  const TABS = [["friends", "Friends", true], ["clan", "Clan", true], ["online", "Online stats", false], ["local", "Local stats", false], ["cpu", "Vs CPU stats", false]];

  let wasSignedIn = account.signedIn();
  function drawTabs() {
    // Signing in opens Friends, as the game's page does.
    if (account.signedIn() && !wasSignedIn) tab = "friends";
    wasSignedIn = account.signedIn();
    const visible = TABS.filter(([, , needs]) => !needs || account.signedIn());
    if (!visible.some(([k]) => k === tab)) tab = visible[0][0];
    fill(tabsRow, visible.map(([key, title]) => h("button", { class: `wbtn tab-btn${key === tab ? " on" : ""}`, type: "button", role: "tab",
      "aria-selected": String(key === tab), text: title, onclick: () => { tab = key; drawTabs(); } })));
    if (tab === "friends") drawFriends();
    else if (tab === "clan") {
      fill(tabBody, clans.el);
      if (!clans.clanId() && !clans.el.querySelector(".clan-row, .clan-page:not([hidden]) h1")) showMyClan();
    } else drawStats();
  }

  function showMyClan() {
    const mine = account.user().clan;
    if (mine && typeof mine === "object" && Number(mine.id) > 0) clans.open(mine.id);
    else clans.showList();
  }

  // ---------------------------------------------------------------- Friends (FriendsPanel)
  const friendsStatus = h("p", { class: "status", role: "status" });
  const addBox = h("input", { type: "text", placeholder: "A player's username", "aria-label": "A player's username", list: "player-suggestions" });
  const suggestions = h("datalist", { id: "player-suggestions" });
  let suggestTimer = 0;
  addBox.addEventListener("input", () => {
    clearTimeout(suggestTimer);
    const q = addBox.value.trim();
    if (q.length < 2) return;
    suggestTimer = setTimeout(async () => {
      const r = await call("GET", `/users?q=${encodeURIComponent(q)}`);
      fill(suggestions, (r.players || r.users || []).slice(0, 3).map((p) => h("option", { value: String(p.username || p) })));
    }, 250);
  });
  const addFriend = async () => {
    const name = addBox.value.trim();
    if (!name) return;
    friendsStatus.textContent = "Asking…";
    const w = await social.friend("/friends/add", name);
    friendsStatus.textContent = w || `Friend request sent to ${name}.`;
    if (!w) addBox.value = "";
  };
  addBox.addEventListener("keydown", (e) => { if (e.key === "Enter") addFriend(); });
  const friendsList = h("div", { class: "friends-list" });
  const friendsPanel = h("div", { class: "friends" },
    h("h2", { text: "Friends" }),
    h("div", { class: "row-line" }, addBox, suggestions, h("button", { class: "wbtn", type: "button", text: "Add friend", onclick: addFriend })),
    friendsStatus, friendsList);

  const act = (work) => async () => {
    friendsStatus.textContent = "Asking…";
    friendsStatus.textContent = await work();
  };
  const button = (text, work, title = "") => h("button", { class: "wbtn tiny", type: "button", text, title, onclick: act(work) });

  function drawFriends() {
    fill(tabBody, friendsPanel);
    const s = social.state();
    fill(friendsList);
    const section = (text) => friendsList.append(h("h3", { class: "section", text }));
    const row = (card, detail) => { const r = person(card, detail); friendsList.append(r); return r.querySelector(".person-buttons"); };
    const invites = s.notifications.invites || [];
    if (invites.length) {
      section("Invites");
      for (const invite of invites) row(invite.from || {}, inviteText(invite)).append(...inviteButtons(invite, (w) => { friendsStatus.textContent = w; }));
    }
    const requests = s.friends.requests || [];
    if (requests.length) {
      section("Friend requests");
      for (const card of requests) row(card, "wants to be friends").append(button("Accept", () => social.friend("/friends/accept", card.username)),
        button("Decline", () => social.friend("/friends/remove", card.username)));
    }
    const friends = s.friends.friends || [];
    section("Friends");
    if (!friends.length) friendsList.append(note("No friends yet. Add one by their username above."));
    for (const card of byPresence(friends)) {
      const buttons = row(card, lastOnlineText(card));
      joinButtons(buttons, card);
      const friend = { ...card, friend: true };
      if (canParty(friend)) buttons.append(button("Invite to party", () => social.party("/party/invite", { username: card.username }),
        "Play together: your party joins the lobbies its leader joins."));
      if (s.room && String((card.presence || {}).room || "") !== s.room) {
        buttons.append(button("Invite to game", () => social.inviteToGame(card.username, s.room), "Ask them to join your lobby."));
      }
    }
    const sent = s.friends.requested || [];
    if (sent.length) {
      section("Requests you sent");
      for (const card of sent) row(card, "hasn't answered yet").append(button("Take back", () => social.friend("/friends/remove", card.username)));
    }
    // Friends already follow each other: they're listed once, as friends.
    const friendNames = new Set(friends.map((c) => c.username));
    const following = (s.friends.following || []).filter((c) => !friendNames.has(c.username));
    if (following.length) {
      section("Following");
      for (const card of byPresence(following)) joinButtons(row(card, lastOnlineText(card)), card, true);
    }
  }

  function joinButtons(into, card, watchOnly = false) {
    const presence = card.presence || {};
    const room = String(presence.room || "");
    const options = joinOptions(presence, watchOnly);
    if (options.join) into.append(button("Join", async () => (await social.join(room, false)).error || ""));
    if (options.request) into.append(button("Request to join", () => social.requestJoin(String(card.username || "")),
      "Their lobby is invite-only: they (and the host) are asked first."));
    if (options.spectate) into.append(button("Spectate", async () => (await social.join(room, true)).error || ""));
  }

  // ---------------------------------------------------------------- stats
  let stats = null;
  async function drawStats() {
    if (!stats) {
      fill(tabBody, loading("Your stats load in with the game…"));
      const r = await game.ask("profile.stats");
      if (r.error) { fill(tabBody, note(r.error)); return; }
      stats = r;
    }
    if (tab === "friends" || tab === "clan") return;
    const kind = (stats.kinds || []).find((k) => k.kind === tab);
    if (!kind) { fill(tabBody); return; }
    fill(tabBody, kind.none ? note(kind.none) : h("table", { class: "stats" },
      h("tbody", {}, (kind.rows || []).map(([label, value]) => h("tr", {}, h("th", { text: label }), h("td", { text: value }))))));
  }

  // ---------------------------------------------------------------- achievements
  function achievementsWindow() {
    let showing = "all";
    return popup("Achievements", (close) => {
      const count = h("p", { class: "muted" });
      const list = h("div", { class: "achievement-list" }, loading("Your achievements load in with the game…"));
      const switcher = h("div", { class: "row-line" }, ["all", "locked", "unlocked"].map((key) => h("button", {
        class: `wbtn tiny${key === showing ? " on" : ""}`, type: "button", text: key[0].toUpperCase() + key.slice(1), dataset: { show: key },
        onclick: () => { showing = key; for (const b of switcher.children) b.classList.toggle("on", b.dataset.show === key); draw(data); } })));
      let data = null;
      function draw(d) {
        if (!d) return;
        count.textContent = `${d.unlocked} of ${d.total} unlocked`;
        const items = d.items.filter((a) => showing === "all" || (showing === "locked") !== a.got);
        fill(list, items.length ? null : note(showing === "unlocked" ? "None yet. Play a match to start unlocking them!" : "You've unlocked them all!"));
        for (const a of items) {
          list.append(h("div", { class: `achievement${a.got ? " got" : ""}` },
            a.picture ? h("img", { class: "px", src: a.picture, alt: "", width: 56, height: 56 }) : h("span", { class: "pic-blank" }),
            h("div", { class: "achievement-text" }, h("strong", { text: a.name }), h("p", { text: a.text }), a.when ? h("p", { class: "muted small", text: a.when }) : null),
            a.can_pin ? h("button", { class: `pin${a.pinned ? " on" : ""}`, type: "button", "aria-pressed": String(!!a.pinned),
              title: a.pinned ? "Pinned: it shows during matches. Click to unpin." : "Pin it to show during matches.", text: "📌",
              onclick: async () => { const r = await game.ask("achievements.pin", { id: a.id, on: !a.pinned }); if (!r.error) { data = r; draw(data); } } }) : null));
        }
      }
      game.ask("achievements.list").then((r) => { if (!r.error) { data = r; draw(data); } else fill(list, note(r.error)); });
      return h("div", { class: "pop-body wide" }, count, switcher, list,
        h("div", { class: "pop-buttons" }, h("button", { class: "wbtn yes", type: "button", text: "Close", onclick: () => close() })));
    });
  }

  // ---------------------------------------------------------------- wiring
  function draw() {
    drawTop();
    drawAccount();
    drawTabs();
    const name = account.signedIn() ? account.username() : "";
    maps.el.hidden = replays.el.hidden = !name;
    maps.showFor(name);
    replays.showFor(name);
  }

  async function loadLocal() {
    const r = await game.ask("profile.get");
    if (!r.error) { local = r; if (!editing) drawTop(); }
  }

  account.onChange(() => { stats = null; draw(); });
  social.onChange(() => { if (tab === "friends" && !el.closest("[hidden]")) drawFriends(); });
  game.onReady(loadLocal);
  game.onChanged("profile", () => { stats = null; loadLocal(); });
  draw();

  return {
    el,
    show() {
      social.markSeen();
      if (game.isReady()) loadLocal();
    },
    address: () => "",
  };
}

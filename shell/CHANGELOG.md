# Changelog

## v0.27.2 — Settings that reach the web menus, and clouds over the menus

### Changed
- Accessibility > **Menu background** is one picker: Moving, Still or One map. It replaces the Static background and No scrolling backgrounds checkboxes (Still is the old No scrolling backgrounds, One map the old Static background), and your old choice carries over.
- **Cloud shadows** now drift over the menu backgrounds too, not just in matches. With Menu background set to Still or One map, the clouds stand still.

### Fixed
- [Web] UI scale, Font, Bold and Show FPS now change the menus too, not just the game's own screens, and a change applies at once.
- [Web] View map on the Play page and in lobbies opened the map behind the webpage. It now shows the map.
- [Web] Changing a Graphics setting in the menus no longer makes the game run at full speed in the background.

## v0.27.1 — The Nov 19 changes, now in the notes

These came out in v0.26.3 but were left out of its notes.

### Added
- Settings > Sound: "Play a sound when my Turn starts" (on by default; the Turn banner still shows).
- Map pages have a **Host a lobby** button for maps on this computer. It opens Play Local with that map picked and a Player for each start spot (2 to 4). In a lobby you host, it switches the lobby to that map; in someone else's lobby, it asks you to leave first.

### Changed
- **Wheat** blocks more sight: each Wheat tile a Piece looks past takes 2 off its sight (was 1). A Piece standing in Wheat loses 3 sight (was 4).
- Jacqui has Upgrade Turns: at Round 20 and every 5th Round after, she starts her Turn by buying an Upgrade if she can afford one.

### Fixed
- Maps you download, save, copy, import or rename now show in the lobby's and Play Local's map lists straight away.
- [Web] View map on a phone's Play page and lobby opened the map behind the webpage. It now shows the map, and closing it takes you back to the page.
- [Web] Changing the music volume no longer starts the song over.
- [Web] The menu music no longer glitches when it loops.
- [Web] The phone's keyboard now comes up when you tap a text box.

## v0.27.0 — Story Mode on the way: Scenes, Explore and the Scene Tree

### Added
- Play has a Story Mode choice under Play Local Game. It's greyed out for now: Story Mode is coming in a later update.
- New keybinds group "Explore Scenarios": step with WASD or the arrow keys, and Talk with E (Settings > Keybinds).
- [Dev] One Story for the whole game, edited in the new Scene Tree (the button beside Story Mode on Play). Wire Scenarios together from a fixed Start box with Next, Then and Else links; If boxes branch on the Story's Variables with several AND/OR checks; losing a Scenario retries it; "Play from here" plays on along the tree, with Next Scenario or Try again when a match ends. The Story is saved on the server.
- [Dev] Scenes: a Trigger's new "Start Scene" (and a new When, "Scenario starts") plays a Scene right after the action that fired it. A Scene is an ordered list of events (moves, attacks, spawns, camera moves, fades, sounds, pauses, text boxes and Choices of 2 to 4 options), timed in frames, each with "Wait for this to finish". Scenes keep their board changes and fog, can be skipped, and hand the camera back when they end. "End the Scenario" ends the match: a win if the Goal is met then, otherwise a loss.
- [Dev] Explore Scenarios: walk your Piece by clicking a tile, WASD or the arrows; Pieces and tiles it can't stand on block the way. Other Pieces stay still unless given a wander path or moved by a Scene. Talk to a Piece with the Talk button, E or a click. Each Scenario sets its own fog (it can be off) and base sight.

### Changed
- [Dev] Scenarios are made in the Map Maker's new Scenario tab (Battle or Explore), not in Admin; Admin's Scenarios tab is gone on Windows and the web. Save in Scenario mode saves the Scenario as a Draft, with its own copy of the map. Old Scenarios are kept, and the Scene Tree now sets their order.
- [Dev] Story matches don't record replays.
- [Dev] CPU training gets unstuck: tests and the kept and shipped networks use weights averaged over generations (10% a generation), while self-play learns on the newest. A stalled match is still a loss for both, but the Player clearly ahead in material loses less (0.6).
- [Dev] CPU training tests every 10 generations, and plays Against Jacqui only for a new best. Exploring after an update takes 2 generations per change, up to 40. Training matches run to Round 160.
- [Dev] CPU training: new switch "Learn from Jacqui's rules", so the main network learns from the choices Jacqui's forced rules made. Every new number is a Methods setting.

## v0.26.3 — Faster CPU training

### Changed
- [Dev] CPU training keeps every core busy: each phase's matches go through one queue, so a new match starts as soon as one ends (Jacqui's matches first). Same matches and results, sooner.

### Fixed
- [Dev] Fixed a test that failed now and then when a Normal CPU's first random action ended its Turn.

## v0.26.2 — Every web menu is a webpage, and CPU training status fixes

### Changed
- [Web] Every Dashboard menu is now a webpage in Home's layout that shows at once: Maps, Replays, Profiles, Clans, Leaderboard, friends, party and invites, Settings, Tutorial, Feedback, Play, the lobby and Admin. The game only loads in afterwards, behind a loading sign, and its canvas shows only for matches, the Map Maker, replays, the map viewer and Admin's CPU Training and Scenarios. Signing in, up and out happen on the webpage.

### Fixed
- [Dev] CPU training no longer says "Not training" during a long test: the trainer posts its status every 5 minutes, and the tab counts it as training while its heartbeat is fresh.
- [Dev] CPU training's Now page shows "N of M matches played" during tests.
- [Dev] CPU training: new Methods setting "Most time against Jacqui in each test" (30 minutes; 0 = no limit).
- [Dev] CPU training: the cores and hours boxes widen to fit their text.

## v0.26.1 — Web addresses that survive a refresh, and smoother phones

### Added
- [Web] Every page has an address that survives a refresh, and the Back and Forward buttons work: /maps/13, /maps/lakelands, /replays/42, /player/<name>, /clans/<tag> and /leaderboard. An address that doesn't exist opens its list page with a note.
- Settings > Graphics > "Dashboard look" (it was "Webpage look", web only) now gives every Dashboard page and window the cleaner look, on the web and on Windows. Matches, the map maker and replays keep the game's look.

### Changed
- [Web] The webpage uses the Alegreya Sans font in the cleaner look.
- [Web] On a phone, the game's top and bottom bars match the webpage's: your crest on the left, your picture on the right, with the cleaner look's gold line and round green Play button.
- Clan tags are now unique. Clans that already share a tag open the oldest one.

### Fixed
- [Web] Refreshing /maps showed a bare file listing instead of the Maps page, and other pages fell back to Home. Both are fixed.
- [Web] On a phone, pages follow your finger exactly and glide when you flick them, scrolling never opens a map card or presses a button, scroll bars hide while you use touch, and Admin > CPU Training > Now fits the screen.

## v0.26.0 — The game on a phone held upright

### Added
- [Web] The game works on a phone held upright: every window is laid out for a narrow screen at full size, with the page buttons along the bottom, End Turn in a bar at the bottom of a match, Upgrades one Piece at a time, and touch on the board (tap, drag to look around, pinch to zoom, press and hold for a tile's info).

### Fixed
- [Web] Text on phones and high-resolution screens is no longer drawn at a third of its size.

### Changed
- Key hints like (Enter) hide while you use a touch screen.

## v0.25.1 — CPU training's look-ahead and stall fixes

### Fixed
- [Dev] CPU training: look-ahead now waits for a steady board judge (its share explained is pooled over the last 5 generations), never ends the Turn early, and its lessons stop pulling once the pick is 20% likelier than before. It switches on at 40% and off below 30%, and a worse test after it ran switches it off for a window.
- [Dev] CPU training: the lead now counts the enemies a CPU hasn't seen (a guess from its start army, kept in step with the CPU, minus the losses it has seen), so staying away no longer pays and fewer self-play matches stall. Boards kept with the old lead are dropped.
- [Dev] CPU training: health rows count Holds, and the Methods page charts Holds, stalls and the pooled judge measure. Restart the trainer on this version.
- [Dev] A flaky branch-culling test no longer fails about 1 run in 12.

## v0.25.0 — Communication network, map Tags and a fiercer Jacqui

### Added
- Communication network: a new Level 2 Castle Upgrade (10), only in matches with Teams. Allies no longer see anything of each other without it, and only the Player who buys it gets their allies' sight.
- Map Tags: the map maker ticks the Tags it can work out (size by the longer side: Small up to 16, Medium 17–24, Medium-large 25–32, Large 33–48, Huge 49+, and 2, 3 or 4 players by start spots), and you can change them after. Browse all searches by Tags (a map must have every one you tick) instead of size and Players. Maps already shared got their size and Players Tags.
- [Dev] Developers can add Tags to shared maps and remove the ones they added.
- Anyone in a lobby, the Host too, can pick Spectator in their own turn-order picker.
- The rows on the Maps and Replays pages fold with − / +, and stay folded.
- Jacqui always takes an enemy Queen when one of her Pieces can, unless it puts her King in danger.

### Changed
- Cannons is now a Level 2 Upgrade for 5, and Armored Wagons a Level 1 Upgrade for 3.
- Castles and Foundations can't be built on Hills, the same as on Cliffs. The info panel says "No Castles or Foundations here" on both. Starting Castles placed in the map maker are unchanged.
- Jacqui counts numbers in a fight: she avoids tiles where more enemy Pieces reach than cover them, makes even or better trades, makes any trade when she has the numbers near, and a trapped Piece of hers takes what it can.
- Jacqui takes back a Piece that took one of her covered Pieces, and counts a take as free when she can take every Piece covering the target this Turn.
- Jacqui no longer castles onto spots an enemy Piece can reach.
- In Team games, Jacqui recruits a few Checkers that go to her allies' Castles to be crowned, and her King crowns allies' Checkers on her Castles.
- Replays recorded before this version show the "Past replays may not work correctly" warning, because Cannons, Armored Wagons and Castles on Hills changed.

## v0.24.2 — CPU training's board judge fixed

### Fixed
- [Dev] CPU training: the board judge report no longer shows huge negative percentages (each part is measured against the spread of all the generation's results; older reports are dropped).
- [Dev] CPU training: the board judge can no longer get stuck saying a loss when far ahead; the lead now moves its odds, and it learns the result itself.
- [Dev] Tests use their own replays and maps folders, so they no longer fail on a PC with saved replays or maps.

## v0.24.1 — CPU training grades its choices by the board judge

### Changed
- [Dev] CPU training: how far a match's result reaches back, and how much the per-Turn lead reward counts, now follow how well the board judge predicts results (Methods: "Board judge counted as poor up to" 10% and "Board judge counted as good from" 40%), every generation, instead of fading after 300 generations. Credit is counted in Turns, not choices.
- [Dev] CPU training: the lead now counts Pieces at their learned worth, unspent Resources and owned Upgrades, enemy Pieces remembered until known captured (fading with two or more opponents), Castle HP on both sides, income, King of the Hill points and steps toward Castle Level 4, with allies counted as your own side. Each part has a Methods weight.
- [Dev] CPU training: the board judge has its own first layer, so learning to judge never changes how the CPU plays, and the Now page shows a judge report by stage of match, opponent and more. Learned Piece worth is pulled toward recruit cost a quarter as hard.

### Fixed
- [Dev] CPU training: Force Stop ends a trainer that was started before the game was restarted.

## v0.24.0 — The CPU can Hold, and learns from people

### Added
- [Dev] Help train the CPU: a new setting, on by default. Finished matches between a person and a CPU are sent to the server as a compact replay (no names, no chat) so the trainer can learn from them later. Online, a match is sent only if every person in it has the setting on. Free Play and endless Resources matches are never sent.
- The CPU can Hold a Piece: keep it where it is for the rest of its Turn. The built-in CPU never Holds, and Jacqui's forced rules still come first. Only networks trained on the new inputs (features version 6) Hold; the live network doesn't.
- [Dev] CPU training: Jacqui now plays as a self-play opponent for the main network, without it copying her (Methods: "Self-play against Jacqui", setting "Against Jacqui"), and the Tests page shows an "Against Jacqui" result.

### Changed
- [Dev] CPU training: a self-play match that stalls out of Rounds counts as a loss for everyone, the board judge learns from the last 20 generations of boards, and a new best network needs 48 test matches.

## v0.23.3 — More Castles for Jacqui, steadier CPU training

### Added
- Jacqui builds more Castles. She wants 1 Castle plus 1 for every 500 tiles past the first (2 on a 24×24 map, 3 on a 32×32 map) and builds the second by Round 15 and the third by Round 25 if she is short. From Round 81 she keeps expanding to up to 7 Castles, at spots anywhere on the map.
- From Round 51, when Jacqui has seen an enemy Castle with none of hers within 8 steps, she builds a forward Castle near it, guarded by at least 4 offensive Pieces. If she has fewer than 4, she waits and recruits first.
- [Dev] CPU training: a Methods switch, "Balance checks and queued tests", off by default. While it is off, training skips balance checks and queued tests (testing the newest network still runs) and the Tests page shows a note.
- [Dev] CPU training: after Stop, the button becomes Cancel stop and removes the stop request. A new Force Stop button asks first, then ends the trainer and its matches.

### Fixed
- King of the Hill's border no longer shows in games where King of the Hill isn't a win condition.
- Removing a map from the built-in lineup now really removes it from the lineup and from every game, and leaves you a copy in Your Maps so you can add it back.
- [Dev] CPU training: "Where the time goes" no longer adds up to more than 100% when the PC clock jumps. Phases use a steady timer, and the Now page shows "counted since" when the breakdown starts again.
- [Dev] CPU training: the cores box and the trainer's workers are capped at the CPU count, and the networks and brain files are saved safely so a crash can't leave a half-written file.

## v0.23.2 — Fairer CPU training ratings

### Fixed
- [Dev] CPU training: Jacqui's branch rating now moves with the best network she plays on top of, so she is no longer culled as "fell behind" after beating the main network. She joins 25 below it. Restart the trainer on this version for it to take effect.
- [Dev] CPU training: the main network's rating stays as its tests set it during a tournament, and a branch's first tournament places it (every match counts in full), then one Elo step per opponent as before.

## v0.23.1 — A much quicker Jacqui

### Changed
- Jacqui's Turns are much quicker, most of all with many Pieces or enemies near: she no longer lags the game. She still picks exactly the same moves.

## v0.23.0 — Zone Rounds and a sharper Jacqui

### Added
- Map maker: the Zone brush has "Joins at Round". A tile joins the King of the Hill Zone at the start of that Round and stays in it. Tiles still waiting show faded with their Round, and the log says when tiles join. Older maps keep every Zone tile from Round 1.

### Changed
- Jacqui plays King of the Hill: she holds the Zone with more Pieces as the match goes on (and at least one more than the enemies in it), and goes all in on the Zone when an opponent is one point from winning.
- Jacqui takes any enemy Piece that nobody could take back, and her King joins in when it's safe.
- Jacqui guards her Castles: her Pieces hunt enemies on, near or attacking a Castle, a Castle with an enemy beside it recruits a Rook or Bishop to hit it, and when a Pawn, Fortress or her King is blocked on its way to build a Castle, other Pieces chase the blocker off.
- Jacqui's Scouts may make a risky first jump when the second jump gets them out of danger, closer to where they're going.
- Jacqui sees discovered attacks: when an enemy Piece could step aside to let another Piece attack through the gap in the same Turn, she counts that as danger.
- Jacqui leans on Rooks and Precedent Presence once she has more than 40 Units.
- Jacqui's Turns are quicker: she reuses what she worked out for Pieces whose surroundings didn't change. She still picks the same moves.

### Fixed
- Jacqui's Archers on either side of a looping map edge now count as beside each other.

## v0.22.2 — Smoother online CPU Turns and a CPU that learns from winning

### Fixed
- Online matches on the match server no longer lag while a CPU takes its Turn: its CPUs think in the background, as a PC Host's already do.
- G gathers with every Pawn in one go online, instead of asking about each Pawn first.
- Your "Queued actions: time between each" setting now sets how fast your own queue plays in online matches.
- The piece panel and the Upgrades window keep their hover and tooltips while the match updates, and acting with a Piece online clears its old moves and outline straight away.
- Actions queued after your Round 1 Turn no longer get the First Round AP, so Pawns can't queue two Gathers or moves.
- A Castle's recruit tiles show again when you select it.
- Your sign-in is kept when the game updates itself.
- [Web] Muting the game now pauses the music and silences the browser tab.
- Status dots show left of names on Your Profile and on Requests you sent.

### Added
- While watching a match (spectating, out and watching, or a Play Local game of only CPUs), click a CPU's name in the info bar to see the Upgrades it has bought.
- A defeat plays a fireworks show (placeholder art for now).

### Changed
- [Dev] CPU training learns from winning, not from the plans it's handed. The value head learns straight from how each match ended, so early choices get credit and look-ahead lessons can start.
- [Dev] Plan bonuses add up to at most a fifth of a win per CPU per match. A set plan carries on past the opening until that CPU falls well behind (new Methods switch "Set plans carry on past the opening").
- [Dev] CPUs lean to the plan that wins on each map in only a quarter of matches, and those seats no longer count towards which plan wins. A strategy branch the main network beats 75% of the time takes a copy of the main network, keeping its lean.
- [Dev] A training match that runs out of Rounds costs both CPUs a fifth of a loss. The built-in CPU is now 10% of opponents, and with Strategy branches off, branches aren't opponents either.
- [Dev] "Learn from shared replays" starts off. Lessons wait for 100 replays, only run when new ones arrive, and are undone if the network comes out clearly worse.

## v0.22.1 — Strategy branches stay on

### Fixed
- [Dev] CPU training's Strategy branches (and Lessons from looking ahead) no longer switch themselves off: running the game's tests on the training PC was changing the trainer's switches. Branches, Jacqui's included, play their tournaments again.
- [Dev] Running the game's tests no longer resets your settings, keybinds or sign-in on that PC.

## v0.22.0 — Jacqui's late game and a smoother CPU

### Changed
- [Windows] The CPUs think in the background while the game keeps running, so their Turns no longer freeze the screen. Pressing Space plays the rest of a CPU's Turn straight away, without the waits. They still pick exactly the same moves.
- The Jacqui CPU does less repeated work when she thinks, so her Turns are quicker on every build.
- Both CPUs now see everything an enemy Piece can do in its whole next Turn, not just one move: a Queen's second move with Royal Rights, a Scout's third jump with Vitality, carrying and Portals.
- Jacqui's late game: from Round 51 she sends up to 2 Bishops after the Relics that are left, buys Unlock Queen and recruits a Queen once the Relics are gone, and never lets one Piece type go over 60% of her army. From Round 61 she leans towards Knights.
- Jacqui's King promotes a Pawn beside him when both are safe, and otherwise walks towards the nearest Pawn by safe tiles. She buys Act of Supremacy so he can go for a second Queen.
- Jacqui's Scouts carrying a Cache take it straight to a free tile beside her King, and her Fortresses keep Pawns at 30% or more of her Pieces.
- Jacqui's King only castles where a Castle has room to stand, and he and a Fortress line up at the nearest spot that works, instead of waiting across Trees or Water.

### Fixed
- The game no longer freezes after you leave a long match and save its replay. The Replays page works out a replay's card details bit by bit instead.
- [Dev] Trained CPU networks now see a little more danger than they learned on (whole-Turn reach); retraining is worthwhile. The features version is unchanged.

## v0.21.0 — Jacqui goes on the attack

### Changed
- Jacqui goes on the offense: her Pieces take enemy Pieces whenever the tile they land on is safe next Turn, her spare Castles recruit attackers, she closes in on enemy Kings to surround them, and after knocking a Player out she builds a Castle where his King stood.
- Jacqui guards her King: he steps out of reach of every enemy Piece she can see (counting their owner's possible Upgrades), and her own Pieces make way when his best escape tile is blocked.
- Jacqui no longer makes bad trades: her Pieces stay out of enemy reach unless they're covered and worth no more than the attacker.
- Jacqui's Fortresses take a shortcut when one of her Pieces can step aside, and only go on the attack from Round 21; the Pawn sent to build a Castle is the one with the shortest route.
- A Castle Upgrade on Jacqui's must-buy list is forced only until one of her Castles has it; after that she weighs it like any other Upgrade.
- [Dev] CI runs the tests in 4 parallel shards on Ubuntu 24.04.

## v0.20.0 — Checker sprites and achievements

### Added
- The three Checker achievements are switched on: **Passing through** (15 Hops by one Checker in a Turn), **Fingers crossed** (capture a Checker your own King crowned) and **Leap frog** (a Scout's or Knight's jump with a Checker on its way).
- Profile pictures now offer every Piece, the Checker included.

### Changed
- The Checker has its real pictures now (and a kinged one); the crown takes the colour of the Player who crowned it.
- Jacqui's army and buying now fit the map: she leans to Archers, Rooks, Bishops or Scouts depending on the terrain and Relics, and her Archers keep together and advance front first.
- Jacqui's Pieces heading for a goal go round her own Pieces, carriers aim at free tiles round her King, and she no longer buys Threshing, Flaming Arrow or Guerilla Tactics when the map has no Wheat or Trees left for them.

## v0.19.0 — Achievements and the Checker

### Added
- **Achievements.** 39 of them, listed in a window opened from your Profile page (All / Locked / Unlocked, locked ones greyed out). Pin the ones you're chasing and they show in a window on the right edge of a match with this match's progress. Every unlock pops up wherever you are, and they're kept on your PC and with your account.
- **Special Pieces**, a new lobby option (Online and Play Local, off by default; never in Random or Ranked matches). The first one is the **Checker**: it costs 1 Resource from a Fortress or a Castle, moves 1 tile diagonally, can't attack, and **Hops** diagonally over a Piece, chaining Hops for free after the first each Turn.
- Four Checker Upgrades: Hoping for Hopping (Hop enemies too), Dreaming big (step straight up and down too), Eastern Influence (Gather on another Player's Castle) and Forced Take (**Taunt** an enemy so it attacks the Checker).
- **Crowns.** A King can crown another Player's Checker next to it; its owner gets 3 Resources when it comes home to its own King.
- The CPU now plays with Checkers: it recruits them, Hops, crowns and Taunts.

### Changed
- Jacqui's Pieces get out of the way only as far as they must, planning several Turns ahead when one isn't enough.
- The relay's player card says whether beating a Player counts for Corruption of skill.
- Checker pictures are placeholders for now.
- [Dev] CPU features version 5. "Train with Special Pieces" on the Methods page (on, 10% of matches by default). Networks trained before this keep playing as they did, without using Special Pieces, until retrained.

## v0.18.4 — Jacqui plays a smarter game

### Changed
- The CPU Personality **Jacqui** builds and guards her Castles better. Her Pawns and Fortresses head straight for a new Foundation's corners, her Pieces keep the tiles round it clear, and she never walks a Piece into a spot it can't get out of.
- Jacqui opens with Pawns Gathering and Fortresses recruiting Pawns, always keeps at least one Pawn and one Fortress, and sends Pawns to Wheat once she has Threshing.
- Once one of her Castles reaches Level 3, Jacqui builds a second Castle away from the others, and rebuilds whenever she's down to one.
- Fixed: Jacqui's King fled onto his own Foundation and stayed there. He now flees only from Round 21, never onto a Foundation, and steps off one first.
- [Dev] Jacqui's rules are in `rules/cpu/cpu_jacqui.gd`, with the readings in `.scratch/jacqui-castle-rules/`, `.scratch/jacqui-trap-path-rules/` and `.scratch/jacqui-flee-foundation/`.

## v0.18.3 — Lobby invites, Piece ability tips and a Beta Tester tag

### Added
- **Lobby invites.** An invite now has an Accept button. "Invite to game" only shows where you can actually invite, and a × removes a CPU or Player from the lobby.
- Hover a Piece's ability to see what it does.
- A **Beta Tester** profile tag, given to every account until v1.0.

### Changed
- The Admin menus fit any window size.
- [Dev] CPU training: strategy branches can set plans for the main network, and each branch card has **Cull Branch**.

## v0.18.2 — Room-code matches no longer stall

### Changed
- Fixed: room-code matches could stall for long stretches (no moves, abilities or End Turn) and lose the Host. A waiting Player's Upgrades window made the match server redo its work once per Upgrade after every move; it now answers from one pass, and the window remembers its answers until the match changes.
- [Dev] `tools/profile_match_server.gd` times the Host's work in a scripted 2-Player match.

## v0.18.1 — The CPU learns Level 4, Artisans and every win condition

### Changed
- The CPU now knows about Castle Level 4, Artisans and every win condition (King of the Hill's Zone too). It always buys Castle Level 4 when it can, whatever its Level.
- Without Checkmate, the CPU treats a King as an ordinary Piece.
- Fixed: after buying Artisans, the CPU still saw a Fortress's old recruiting price.
- Networks trained before this update keep playing as they did until they are retrained.
- [Dev] CPU features version 4. Training can mix the win conditions ("Mix the win conditions" on the Methods page, 30% of matches by default); retrain to use the new inputs.

## v0.18.0 — Win conditions, Artisans and the Map window

### Added
- **Win conditions.** Maps tick which ones they allow; in the lobby and Play Local the Host ticks one or more, and the first one met wins:
  - **Checkmate**: as before.
  - **Conquest**: a Player who has had a Castle and loses every one is out.
  - **Annihilation**: a Player with no Pieces left is out.
  - **King of the Hill**: the map maker paints **Zone tiles** (their own layer, under anything). The Zone's border turns the colour of whoever got in first, and goes grey when it's empty. Start your Turn as the only Player in it for a point; points show at the top left. The map sets the points to win and a Round limit (most points then win); casual lobbies can change both.
  - **Level 4**: a new Castle Upgrade, **Castle Level 4** (Level 3, 50 Resources, needs 10 Level 3 Upgrades). Buying it wins.
- Without Checkmate, the King is an ordinary Piece, and maps don't need Kings to save.
- **Artisans** (Fortress, Level 2, 5 Resources): Fortresses cost 0.5 less to recruit.
- **Map window** (M, or the Map button): the whole map, as View Map shows it, to zoom and pan round during a match.
- **View Map** has a button for each letter the map uses: All shows every placement marked with its letter, and a letter shows where things go when a match draws it.
- **Replay search**: search your replays (title, description, map, Players' names, or "4 players") and shared ones; filter yours by Players too.
- The Find a Game panel shows how many players are online and how many are waiting in the Random and Ranked queues.
- **Time zone** in Settings: Automatic (this computer's) or any other. Every time shown in the game uses it.
- Spectators can click a CPU's name at the top left to follow it and see the Upgrades it has bought.
- Old replays have a warning marker: they may not play correctly after rules changes.
- The Host can save CPU-only replays (automatically too, when Settings say so).

### Changed
- Act of Supremacy and Matriarchy can't both be bought; once you own one, the other is greyed out.
- New requirements:
  - Masonry also needs Artisans; Resourcefulness needs Masonry; Export City needs Healthy Harvest.
  - Threshing needs Fertilizer; En Passant needs Birthrights.
  - Royal Rights needs Matriarchy; 2nd in Command needs Act of Supremacy; Act of Supremacy needs Queen's Blessing; Matriarchy needs The Amazon.
  - Target Practice also needs Art of War; Well Motivated Armies also need Squires and Lancers.
  - Joust also needs Lancers, Advanced Swordsmanship and Horse Breeding; Precedent Presence also needs Crusade and Queen's Blessing.
  - Shogi Alliance also needs Export City, Birthrights, Spread the Word and Royal Harvest.
- Costs: Castle Level 2 is 10, Castle Level 3 is 17, Citizenship is 10, and every Level 3 Knight Upgrade is 7.
- The Upgrades window draws lines within a column as before; an Upgrade that needs ones from other columns has a small "+n" badge, and hovering it draws those lines.
- Portals no longer show their number in a match (their colour still links them).
- Queued actions are only sent to the Player who queued them until they play out, so they don't interrupt the Player taking their Turn.
- Opening the menu pauses the CPUs (and the clocks) in CPU-only games and games with one person against CPUs.
- Map maker, looping edges: Cliffs, Hills and Trees join up across the seam, a Cliff or Hill dragged across it turns its corners there, and the Fill bucket runs round the loop.
- [Dev] The changelog has a Developers & Moderators tab for "- [Dev]" lines; release notes leave them out.
- [Dev] CPUs have no inputs yet for Artisans and Castle Level 4 (CpuFeatures.UPGRADES_WITHOUT_INPUT), so trained networks still load; add them at the next feature version.

## v0.17.0 — Trades, Jacqui and smarter CPU inputs

### Added
- CPU: new Research, Exploration and Trades plan parts (eight in all). Trades weighs the value a capture takes against what it risks.
- CPU: learned Piece values, shown on the Strategies page ("What Pieces are worth"), learned from who wins.
- CPU: new inputs for Upgrades, the Round, lobby options, where Caches may be, and distances by each Piece's own moves. Old brains carry over.
- CPU: Jacqui, the best network so far with hand-written rules on top (Scouts fetch Caches, Pawns pick up nearby Caches, Fortresses attack at the Unit Cap).
- Admin > CPU Training: queue a Personality or Jacqui to take the place of a culled branch.

### Changed
- CPU training: only CPUs in training matches lean toward the plan that wins most on each map. A set plan gets a bigger bonus than a chosen one.
- A CPU turn takes about a fifth longer because of the extra inputs.

## v0.16.5 — Training gets past gen 0

### Fixed
- CPU training: the check after a lesson from people's replays now tests the network as it really is, so a good lesson is no longer thrown away.
- CPU training no longer runs a look-ahead drift lesson right after a rollback, which kept training stuck at gen 0.

## v0.16.4 — Look-ahead training fix

### Fixed
- CPU training: look-ahead lessons now judge each board with the lead added back, so the CPU no longer misjudges who is ahead while looking ahead.
- The check of how well the network judges positions is now measured honestly, so the training tab shows a true score. Turn Look-ahead lessons back on after updating.

## v0.16.3 — CPU training keeps going

### Fixed
- CPU training no longer stops a few minutes in, right after its lesson from people's shared replays. Saving its progress failed on a number from the new check of how well the network judges positions, which also left the save half-written, so every Start began again from scratch.
- When an error stops CPU training, the tab now says what it was, and the details are in training.log. Before, the trainer just went quiet.
- After the trainer on this PC stops without saying so, the CPU Training tab no longer offers Stop and Start at the same time.

## v0.16.2 — CPU training starts again

### Fixed
- [Windows] CPU training no longer stops right after it starts. The trainer couldn't write a log line with an arrow in it (the one saying what a game update changed), so it quit before training.

## v0.16.1 — CPU training fixes and remote control

### Added
- CPU Training (Developers): any Developer can use the whole tab from their own PC or the browser while another Developer's PC trains: change the Methods page, Stop, Start fresh and save a strategy branch as a Personality. The trainer takes the changes at its next generation.
- When the trainer runs another version of the game, the Methods page greys out the switches and settings only one side has and leaves them as they are. A trainer too old to take changes from other PCs is named in the tab.
- Methods page: a new **Value head needed before looking ahead** setting.

### Fixed
- CPU training no longer gets worse over time. Self-play now plays the network it learns from, even after going back to the best network or a lesson from shared replays. The first network also learns to judge positions, so look-ahead isn't guessing. Training starts again once (the old networks are archived).

## v0.16.0 — Map maker tools and Shogi Alliance

### Added
- **Shogi Alliance** (Bishop, Level 3, needs Daoism): a Bishop can spend 1 AP to try to Convert an enemy Piece straight next to it (20%, or 5% on a Queen; never Kings, Bishops or Fortified Pieces). A Rook Counter Attacking from the Bishop's side resists, and may Reverse Convert the Bishop.
- Map maker: **Raise** and **Indent** brushes for 3×3 mounds and holes, a width × length readout while selecting, **Ctrl+D** to clear the selection and the arrow keys to move it, tile info under the mouse, and Starting Upgrades picked in the real Upgrades tree.
- Selecting a Piece shows a picture for each of its upgrades, with the same hover details as the upgrade tree.
- **In Map Maker** and **Viewing a Replay** statuses.
- Replay editing has **Cut Pawn Gathers**.

### Changed
- **Armored Wagons** gives +1 movement (was +2). **Routing the Landscape** turns no longer get faster on Roads and Bridges. A Queen from a Castle costs 15 (was 10). **Daoism** moves to Level 2.
- Stacked Cliffs and Hills: each further drop along a sight line or attack adds the bonus again.
- Redrawn Bridge tiles with rails, posts and corners; Bridges touching at a corner join diagonally.
- Move in the map maker drags the selection (Alt for items only) and never draws a box; Shift locks a line only while held; Cliffs and Hills turn round corners as you drag.
- Map and replay names and descriptions are edited with a pencil, like the profile.
- Opening a replay shows a loading screen and no longer freezes the game on big replays.
- **Gather All** only uses Pawns, and End Turn shows its key.

### Fixed
- Moving or copying a map maker selection no longer drops Castles and Foundations.

## v0.15.1 — Scenario CPU settings

### Fixed
- In Scenarios, each CPU seat now keeps and plays its Personality, plan and locks, in Play test and in the Check it run.

## v0.15.0 — Teams, Scenarios and CPU personalities

### Added
- **Teams**: allies in a match share vision, can't attack each other and win together. Choose Teams in Play Local and in lobbies.
- **Scenarios** (Developers): a new Admin > Scenarios tab to make singleplayer Scenarios with a map, Goals, Bonus Goals and Triggers, saved on the relay as Draft or Published. Play test one, or let an Expert CPU check it can be won.
- **CPU Personalities** (Developers): saved strategy branches that CPU seats can use in Scenarios, Play Local, lobbies and the Seats window, with Strategy focus and plan locks.
- A rebuilt Admin > CPU Training tab with eight pages: Now, Strategies, Maps, Suggestions, Tests, Updates, Methods and Networks.

### Changed
- CPU training is faster and fairer: per-Turn rewards, stop-early tests for a new best, and ratings for every saved network.
- The CPU remembers enemy Pieces it has seen and knows more about the map, plans its strategy during a match, and is trained with look-ahead. Training restarts once for the new features.

## v0.14.0 — Balance update

### Added
- Rook upgrades **Counter Attack** (Level 2) and **Precedent Presence** (Level 3, needs Counter Attack and Chariot).
- A **Seats** window for the Host when a Player drops out: wait, skip their Turns, replace them with a CPU, or invite a friend. Newcomers can ask to play in a match in progress, and a friend's match with a free seat shows **Join**.
- Swamp and Rocks reduce what a Gather brings (never below 0).

### Changed
- Many upgrade costs and Levels rebalanced; recruiting a Rook now costs 1.5.
- Gathers pay at the start of your next Turn again, and are lost if the Pawn is captured first.
- Vitality: two moves in a row by a Scout give it 0.5 AP back for a third move, instead of +0.5 AP every Turn.
- Joust costs 1 AP.
- Art of War: Archers can also attack the 8 tiles around them.
- A Foundation made during a match must set until its owner's next Turn.
- The upgrade tree lines no longer cross as often.

### Fixed
- Diagonal steps up a Cliff can no longer cut past Stairs onto a bare ledge edge.

## v0.13.1 — Bug fixes

### Fixed
- The whole board no longer shows on a local game where a CPU moves first; the first human Player's fog applies from the start.
- [Windows] CPU training now starts in the installed game (the trainer was missing a file it needs).
- The Upgrades window is as wide as the whole tree, so the Queen column is no longer cut off on the right (seen when opened from the Tutorial).

## v0.13.0 — Board controls, upgrade previews, friends' status and better replays

### Playing
- **Purple tiles**: with Range on, a tile a Piece can both move to and attack is purple. A selected opponent's moves are blue like your own.
- **Top bar**: Resources and Pieces sit on dark chips with icons; only the Player's Turn text is in their colour. End Turn is a big green button at the far right.
- **Next Piece**: Space selects the next Piece that can still act, and Shift+Space goes back.
- **Hotkeys** can use Ctrl, Alt and Shift combos, or one of those keys alone. Undo is now Z and Burn Wheat is H.
- The bottom-right panel lists Castles, Foundations, Caches and Relics. You can remove your own Castles and Foundations on your Turn.
- **Build Castle**: a selected Pawn shows a green corner for each Castle it could build, with arrows to the Fortress and Foundation used.
- Dragging a Piece places it without the slide. A selected Castle gets one outline around its whole 2×2.
- A Pawn's Gather now pays out as its owner ends the Turn, so a capture can't take it first.
- Clouds are lumpier and cover about half as much. Recruits can't be placed up a bare Cliff edge.
- **Fixed**: clicking or dropping a Piece on an enemy Castle's empty tile now attacks instead of walking onto it.
- Random and Ranked games can never use Dev Mode, Freeplay or Infinite Resources. Play Local has a Dev Mode setting, off by default.

### Upgrades
- Hover an Upgrade to see small boards of the moves, attacks or vision it adds. Every Upgrade has a placeholder picture.
- Castle Level boxes fill as you own the Upgrades they need, and prerequisite lines run around other Upgrades.
- The Dev menu can command a CPU's Pieces.

### Friends
- Friends show as In a Game or In a Lobby, with the match type and player count. **Spectate**, **Join** and **Request to join** appear when they can be used. Click your own status dot to go Online or Invisible.

### Replays
- **Continue from here** lets you choose who plays each seat: you, a local player, a CPU or an invited friend.
- The viewer shows real names. Replay pictures show only the start spots used.
- Faster playback, a zoomable timeline, and a **Moves** list that jumps to any move.
- The Replay Menu no longer offers Offer Draw or Resign.

### For Developers: CPU Training
- The trainer learns from public shared replays, with winners counting most.

## v0.12.0 — Correspondence games, match summaries and new Pawn upgrades

### Rules
- **Pawns get 2 AP in each Player's first Turn** (Round 1 only), then 1 as before.
- New Level 1 Pawn upgrade, **Birthrights** (5 Resources): Pawns move one tile further.
- New Level 3 Pawn upgrade, **En Passant** (4 Resources): when one of your Pawns captures an enemy Pawn, you gain 1 Resource.
- **Art of War** moves to Level 2 and costs 4.
- **Flaming Arrow** moves to Level 3 and costs 10. Burning Wheat now burns the Wheat around it too (Pieces standing there are unaffected).
- New **Round limit** option in Play Local and the lobby. When the last Round ends, the match is a draw. The top bar shows "Round 12 of 40".

### Playing
- **Correspondence games**: in a Host Game lobby, tick **Correspondence game** and pick 1 to 7 days per Turn (3 by default). Players can leave and come back. Whoever's Turn it is sees it on their Play page and gets an email. Running out of time skips the Turn, and the third skip resigns.
- **Match summary**: press **Summary** at the end of a match to see everyone's results side by side, with graphs of Pieces, Castles and Resources Round by Round.
- **Ask the CPU** in replays: the Expert CPU says what it would do next for the Player whose Turn it is, and marks it on the board. It only sees what that Player could see.
- **Settings → Gameplay**: set how fast CPU Players move, choose **Hide my username in other players' saved replays** (they see your colour instead), and turn off Turn emails for correspondence games.
- The **Tutorial** has an **Upgrades** button, so you can look through every Upgrade without starting a match.
- Cloud shadows are smaller, and the checkerboard overlay now shows on Bridges too.

### Map Maker
- **Test play** can put you against CPUs, or let you watch CPUs play each other.
- **Check this map** plays 20 Normal CPU matches and reports how each start spot does, how many matches stall and how long they last.

### Accounts and online
- A new account can be used once you click the link in its email. Accounts made before this update work as they did.
- Signing up with an email that already has an account sends that account's owner an email instead.
- **Online stats are now counted by the server** from matches on the match server (Host Game and Find a Game). Your current numbers stay. Games hosted on a Player's own computer (by IP address or room code) no longer count as Online.
- Joining a game by IP address from a browser is limited to 30 times an hour from one address.

### For Developers: CPU Training
- Balance reports compare how Players spend their Resources, and suggest fixes for going first, start spots, matches that stall, key Upgrades and Upgrades nobody buys. **Try fixes** tests these in training matches only; real matches don't change.
- The trainer now gets its own token that can only send training results, instead of your sign-in.

## v0.11.7 — Safer accounts and shared files

### Your account
- Signing in now lasts a month after you last play, and a year at most; after that, sign in again.
- Changing your password signs you out on your other computers and browsers (this one stays signed in).
- Someone typing wrong passwords for your account no longer locks you out: they wait, and you can still sign in from home. Lots of wrong guesses from many places still pause the account for 15 minutes.
- Signing in takes the same time whether or not the account exists, so nobody can test names that way. Sign-ups and reset emails are limited per hour, so an inbox can't be flooded.
- On your computer, the game keeps your sign-in encrypted in its own file instead of in plain text in settings.cfg.

### Shared maps, replays and online games
- Maps, replays, and the rules a Host sends are checked as plain data before the game reads them, so a file can't run code on your computer however it's written. A map or replay that fails the check isn't opened.
- In Ranked, the game proves who you are to the match server with your queue ticket instead of your sign-in.
- Updates can't write files outside the game's folder.

## v0.11.6 — See which balance check is running

### For Developers: CPU Training
- The balance check training is playing right now says **▶ Running now**, and the one it runs next says **Up next**.
- The list explains that training takes turns through the checks from the top.

## v0.11.5 — Training keeps its Stop button after a restart

### For Developers: CPU Training
- If you close and reopen the game while training runs, the tab still knows it's training: **Stop** works, and **Start** stays greyed out. Before, Start could be pressed again, which ran a second trainer alongside the first.
- Only one trainer runs at a time on a PC. A second one that's started anyway stops straight away.

## v0.11.4 — Balance reports start again only when the rules change

### For Developers: CPU Training
- The balance report now starts again only after an update that changes a rule value or a built-in map. Updates that just fix things keep the report going.

## v0.11.3 — Every suggested fix gets tested

### For Developers: CPU Training
- **Try fixes** tests the suggestions it hasn't tried yet first. Before, it kept retesting the top three, so the rest never got tested.

## v0.11.2 — Balance reports start again after an update

### For Developers: CPU Training
- After an update, the CPU keeps what it has learned and carries on training under the new rules, but the **balance report starts again**, so matches from before the update don't hide what it changed. The old matches are kept in the training folder.
- The report says which game version it's for.

## v0.11.1 — CPU training reaches the server

### For Developers: CPU Training
- Training now sends its progress, reports, clips and networks to the server. Before, the server's firewall turned the trainer away ("HTTP Error 403: Forbidden" in training.log), so the CPU Training tab never heard from it. Training on your PC was unaffected.
- When the server does refuse something, training.log now says why.
- After **Stop**, the tab says "Training stopped." once the trainer has finished, instead of "Stopping…" staying up.
- [Web] The tab no longer shows the stray words "for", "using" and "Python:" where the training controls are hidden.

## v0.11.0 — CPU Players, and CPU training that finds balance problems

### CPU Players
- **Play against the computer:** in Play Local, each Player can be a person or a **CPU** at one of five levels: Beginner, Easy, Normal, Hard or Expert. Matches can be all CPUs, to watch.
- **Online too:** a lobby's owner (or the Host) adds CPUs with **Add CPU**, changes their level or removes them from their row. CPUs are always Ready. They can't join Random or Ranked games.
- **They play fair:** a CPU sees only what its own Pieces see. It knows the map, but not where your Pieces are in the fog.
- **One action at a time,** so you can follow what it does. Press **Space** to skip the rest of a CPU's Turn (it's in Keybinds as "Skip a CPU's Turn").
- CPUs answer draw offers: they accept when they're clearly behind.
- **Vs CPU stats:** a match with a CPU in it counts on your profile's new **Vs CPU stats** tab, not Online or Local.

### For Developers: CPU Training
- **Admin → CPU Training** (Developers only) trains the CPU on your PC: pick how many hours and cores, press **Start**. It plays CPU against CPU on every built-in map (2 Players first, then 3 and 4), learns from the matches, and keeps its progress, so Stop and Start carry on where it left off. It needs Python; **Install PyTorch** sets up the rest.
- **Networks:** every time training makes a stronger CPU it shows up here. **Give to players** sends it to every game and the match server within a few minutes; **Take back** returns everyone to the built-in CPU.
- **Balance checks:** going first, start spots, Pieces and Upgrades worth more or less than they cost, matches that stall, match length, actions never used, the first Castle, 3 and 4 Player matches, and trying out fixes. Drag them into the order you want training to work through them, and untick the ones to skip.
- **The report** lists what training found, with how sure it is, a **Watch clip** button that opens the part of a match that shows it as a cut replay, and suggested config changes, tested in more matches.

## v0.10.5 — Back and forward, clan tags, clearer clouds, a bar that fits

### Dashboard
- **Back and forward:** your mouse's side buttons go back and forward through the pages you've visited, players' and clans' pages included. **← Back** on those pages does the same.
- **Clan pages stay put:** clicking a clan on another player's page opens it there, with **← Back** to them, instead of taking you to your own profile.
- **One pop-up at a time:** opening Tutorial, Feedback, Settings or another pop-up closes the one that was open, and so does switching pages.
- The **top bar fits any window:** as the window narrows, the buttons lose their extra width, the title and then your name give way to icons, and the text shrinks, so every button stays on screen.
- **Play** turns a darker green when you hover it while it's open (not brown), and its word turns gold when hovered or open, like the other buttons.

### Clans
- A player's **clan tag** shows before their name: on their card and profile, in friends lists, parties and clan pages, in lobbies and in matches.
- **Display Clan Tag** (on by default) is in your profile's editing fields.

### Updates
- [Web] Settings no longer has **Check for updates**: the page always loads the newest version.
- [Web] Joining a game on a newer version says to **refresh the page**, with a button that does it.
- [Windows] Joining a game on a newer version says so, with **Install update**, which downloads it and restarts the game.

### Map Maker
- **Tool keys follow the toolbar:** Select 1, Move 2, Paint 3, Fill 4, Pick 5, Renumber 6, Erase 7. The Keybinds list is in the same order. If you kept the old keys, you get the new ones.
- **Long tips** (like Mirror's) break into short lines, a sentence per line, so none run off the screen.

### Everywhere
- **Cloud shadows** are easier to see: separate clouds with clear edges, all drifting one way, picked as the match starts.
- **No scrolling backgrounds** in Settings → Accessibility: the maps behind the menus still change, but each one stands still instead of scrolling.

## v0.10.4 — Map maker tools and rules, picking maps in Find a Game, live built-in maps

### Map maker
- **New toolbar:** Select, Move, Paint, Fill, Pick, Renumber and Erase, each with its own cursor, also shown on its button (keys 1–7). Renumber and Move moved here from the side menu.
- **Erase** works like right click, and right click picks it while you hold it down. The Erase Item brush is gone.
- **Move** picks up a Cache, Relic, Portal or starting Piece (or all of them in a selection) and drops it where you let go.
- **Mirror** toggles (↔ ↕ ↔↕) copy what you paint across the map. With one mirror, the copy belongs to Player 2. With two or three, Players 1 and 2 are diagonal from each other. Copies keep the letter, and Caches, Relics and Portals keep their number and letter.
- **Higher-level Castles** can be placed as starting Pieces.
- **Map rules:** turn off gathering, Upgrades, recruiting, or building Castles (and so Foundations). Give every Player **starting Upgrades** (any Upgrade, even without what it needs first). Set the map's **Max Castle Level**.
- Maps can be up to **100 × 100**.
- Drag drawing no longer lags, even on big maps or with a selection.

### Playing
- **Max Castle Level** is a match option in the lobby and in Play Local. It starts at the map's own setting.
- **Find a Game:** the Maps… list is gone. Once you're matched in Random or Ranked, everyone picks one of the built-in maps from its card, and the match is on one of the picks. It starts 5 seconds after everyone has picked, or after 20 seconds.
- **Developers** can make a map built in from its page (**Make built-in**), or save a built-in map they edited in the Map Maker. Every game and the match server pick it up within a few minutes, with no update needed. **Remove built-in** takes it out again (a built-in map it replaced comes back).

### Everywhere
- Feedback closes as soon as you press Send, and has no star rating.
- A clan's page on your profile fits the window with no scrolling sideways.
- Clan leaders can change the clan's logo on the clan page without changing their own picture.
- **Static background** in Settings → Accessibility keeps the menu's map background still.

## v0.10.3 — Profile editing, Report flags, staff tools

### Profiles and friends
- Your profile sits lower on the page. Your name and picture show as they are; the **pencil** beside your name opens the fields, with **Save changes** and **Cancel**.
- A player's full profile has the same buttons as their card (Add friend, Remove friend, Follow, Unfollow, Invite to party, Invite to game) instead of **Friend and follow…**, and shows their **Best map**.
- "Most won on map" is gone from under the sign-in box; in your stats it's now **Best map**.
- Games and Wins on profile cards are whole numbers.
- The friends list says when offline friends were **last online** ("20 minutes ago", "3 weeks ago"). Players who hide their status don't show it.

### Reports
- Player profiles, maps, replays and comments have a **Report flag** that turns red under the mouse. Click it, say what's wrong, and the report goes to the Admin page's **Reports** tab.
- Each report there has **Open**, which goes to the profile, map or replay. For a comment, it scrolls to the comment and lights it up.

### Staff
- Developers can no longer ban each other or take down each other's maps and replays.
- **Ban** is at the bottom of player cards and full profiles, and only shows for players you can ban.
- The Admin page's Tags tab is gone: Developers use **Assign Tags** on a player's full profile. The **Accounts** tab can filter by each tag.
- Only the banned player, Moderators and Developers can click **Banned** to see how long and why. Everyone else just sees the word.

### Everywhere
- The arrows on scroll bars scroll: click for a step, or hold to keep scrolling.

## v0.10.2 — Browse every map and replay, starting Castles

- **Browse all** at the top of the Maps and Replays pages opens every shared map or replay, with sorts and filters.
- **See all** shows on every row (and as the card at its end), not only on rows with more than 10.
- Map Maker: the Starting Pieces brush places **Foundations** and **Castles** (a Castle covers 2×2 tiles from where you click). Players start the match with them.
- Player cards and profiles stay blank until the player's picture loads, instead of showing the default King on Grass first. A shared map's page waits for its full picture instead of flashing a blurry one.

## v0.10.1 — Moderators and Developers, map maker letters, account maps

### Map maker
- **Kings set spawn letters.** The Starting Pieces brush places any Player's Pieces with any letter (A–F, next to **Player #**). Each Player and letter needs a King: a map won't save or test play until it has them, and a window says which are missing. Letters only show when a Player has more than one King ("1" or "1A"/"1B").
- **Each match picks one letter** per Player, falling back to their first letter. Caches, Relics and Portals can have letters too, and each kind picks its own letter.
- Numbers and letters draw in front of Pieces, Relics, Caches and Portals, sharper.
- The side menu shows only what fits the brush: Starting Pieces with the Piece brush, spawn rates with the Cache and Relic brushes, letters and Renumber with Relics, Caches and Portals, with a short note on what numbers and letters mean. Unit Cap and Looping edges stay at the bottom.
- **Unit Cap can be 0**, and new maps start at 8.
- **Looping edges:** red lines mark the seams, and the copies around the map draw fully and crisply. Painting across a seam no longer lags or paints across the whole map, and Select reaches across seams (up to the map's size). New **Show looped map in editor** toggle.
- A click without dragging selects one tile, even inside a selection, and a one-tile selection clears when you switch tools. With more than one tile selected, the brush and fill only paint inside it.
- Developers can edit the built-in maps.

### Moderators, Developers and bans
- Staff powers now come from tags: **Moderator** and, one level above, **Developer**. Other tags are only for show.
- Staff can hide or take down anyone's maps and replays, with an **Are you sure?** first. Moderators can't act on Moderators' or Developers' uploads.
- **Bans** for a time or for good, with a reason (Developers can ban anyone; Moderators can ban players who aren't staff). Banned accounts can't play online, and their profile shows a red **Banned**: click it for how long and why.
- Only Developers give tags. The Admin page has an **Accounts** tab: every account with when they were last online, sorted by Account Created, Last Online, Elo or Games Played, with a Banned filter.
- The moderator badge is a mallet.

### Profiles and friends
- **Elo** shows once you've played a Ranked game.
- Friends list: **Invite to party**, and **Invite to game** while you're in a lobby with a seat open. Remove friend and Unfollow are on the player's card.
- **Clan** tab on your Profile, between Friends and Online stats. **Make Clan** opens a menu for the name and tag.
- Name searches (friends, Admin page) and the clan search suggest the 3 closest matches.
- Profile pictures are always square, and the profile no longer jumps when your shared maps and replays load.
- Friend requests and game invites arrive within a few seconds.

### Maps and replays
- Shared maps' pictures show every tile (maps shared before now are redrawn from the map).
- **Your maps follow your account** to every computer and browser you sign in on.
- Your shared maps show their likes and dislikes in Your maps.
- A **See all** card ends each row, opening the full list with its filters and sorts.
- **View map** shows the whole map, sharply. The detail page's picture no longer zooms or pans.
- Names and descriptions are text boxes only when you can edit them.

### Everywhere
- Faint **cloud shadows** drift over the board (turn them off in Settings, Graphics).
- Every scrolling page and menu has a bold scroll bar with arrow buttons.
- Checkboxes are lighter so they show on dark panels, and windows you can drag (like the Ranked Leaderboard) have a solid title bar like Settings.
- Clicking outside a text box stops typing in it.
- The selected Piece's panel sits higher, with the chat box just above it.
- A lobby's Host only gets the dev menu by ticking Dev Mode.
- Online play needs everyone on the same version.
- [Web] Settings leaves out what a browser controls (window mode, resolution, VSync).
- [Web] The game checks for a newer version, and **Reload** loads it.
- [Web] The changelog shows only the changes for the browser build.
- [Windows] The changelog shows only the changes for the desktop build.

## v0.10.0 — Ranked, the match server, clans and parties, replay editing

### Play online
- **Find a Game** on the Play page: tick **2 Players**, **4 Players** or both, pick the maps you'd play (**Maps…**), then **Random** or **Ranked**. Each game is on a map one of its Players ticked.
- **Random** is for anyone, guests too, and a party's leader queues the whole party. **Ranked** needs an account with a confirmed email, and you play it alone: you're matched with players within 100 Elo, widening by 50 every 15 seconds you wait.
- **Elo:** beating an equal player is worth 50. In 4-player games everyone is scored against everyone else by finishing order. Your Elo and Ranked record show on your profile and player card; click it for the **Leaderboard**.
- **A match server runs online games**, so nobody's game has to host: a Host who tabs out of the browser no longer freezes the match. The first Player into a Host Game lobby sets it up. It runs on Cloudflare and sleeps when nobody is playing: the first game after a quiet spell says "Starting the match server…" for a few seconds. If the match server is down, your own game hosts as before.
- A Player who drops out has **2 minutes** to come back. Then their Turns are skipped, or in Ranked they forfeit.
- **Rematch** at the end of an online match takes everyone still there back to the lobby. In public and queued games, new Players can fill the empty seats.
- **Lobbies:** **Ready** buttons (when everyone is Ready, a 10-second countdown starts; changing a setting clears Ready; the Host can Force Start), **Freeplay** and **Infinite Resources** options, and **Random colour**. Room-code games keep the last moves on screen until new ones arrive (no more flashing).

### Clans and parties
- **Clans:** make one (with a confirmed email) with a name, a 2–4 letter tag and a logo. Up to 50 members. Players ask to join and the leader approves, the leader invites, or the clan is open to anyone. The leader edits the clan, removes members and hands over leadership. A leader who leaves picks who leads next.
- A clan's record is its members' **Ranked** wins and losses (leaving with them), and its Elo is their average, which ranks the **clan leaderboard**. Your clan shows beside your name.
- **Parties** of up to 4: invite friends and clan-mates from their player card. When the party's leader joins a lobby, the whole party follows (only if there's room for everyone). The party box folds down to your members' faces at the bottom left.

### Profiles
- **Profile tags** (Developer, Moderator, Artist, Content Creator) given by Admins, shown beside names. Pick which of yours to show.
- **Status dots:** blue online, green in a game, grey offline. You can hide yours in Settings.
- **Change your username** any time on the Profile page.
- Your shared maps and replays are at the bottom of your Profile page, with **Most won on map**. Player cards show their newest uploads and a **Full profile** button.
- **Feedback** button (left of Quit): feedback and reviews with optional stars. Admins get an **Admin page** to read feedback and reports.
- **Comments** at the bottom of shared map and replay pages.
- Friends aren't listed as followed too (friends already follow each other).
- Web: browsers and password managers can save and fill your sign-in. **Confirm password** when making an account.

### Pieces and rules
- **Royal Rights** (Queen, Level 3, 10 Resources): moves cost 0.5 AP, but moving and acting don't mix in a Turn.
- Stepping across **Stairs** costs 1.5.
- **Portals:** a piece landing on one (a slide stops there) comes out of a linked one at random, capturing an enemy there.
- **Looping edges:** maps can wrap left-right, top-bottom or both. Moves, attacks and sight cross the seam, and the camera pans round forever.
- Caches and Relics can share a number: a match uses one of each group, picked at random.
- The top bar shows **Round and Turn**.

### In matches
- **Pieces slide** from tile to tile when they move.
- Pawns that gathered show **+x** over their heads at the start of your Turn.
- An **info bar** at the top left lists every Player in Turn order with their highest Castle Level and your research.
- Pieces on lower tiles draw on top. Spectators see where a clicked piece can move and attack. A Castle's recruits stay on its panel, greyed out, when it can't recruit.
- **Tutorial** button on the top bar and in matches.

### Map maker
- **Right-click erases** (what's on a tile first, then the tile to grass). Middle-drag pans.
- **Fill** puts Caches or Relics on a whole area.
- **Pick sides** paints Cliffs and Hills with the sides or inner corner you choose.
- **Spawn letters** (1A, 1B…): each with its own starting Pieces, and a random letter per match. New start spots get a King, Pawn and Scout to move round.
- Cliff and Hill drags close their loops, **Shift** keeps a drag on one line, and maps hold up to 4 Players.
- Map previews give Cliffs, Hills, Rocks, Trees and Wheat their own colours.
- **View map** under every map preview shows the whole map to look round before playing.

### Replays
- **Edit** a replay: select a stretch on the time bar, then **Cut**, **Cut to Selection**, **Cut Before** or **Cut After**. It still shows the real Round and Turn. Save over the original (this updates a shared copy too) or as a new replay.
- The time bar is coloured by whose Turn each step was.
- **Download** and **Delete** your replays. Names and descriptions save when you click away. Shared replays always show in Your Replays with their likes.

### Settings, look and sound
- **Settings → Gameplay:** a Remove Piece confirmation, skipping failed queued actions, saving every replay and the account options. Queued actions can run with no wait.
- Only **Admins** change rule values in the dev menu.
- **Every screen** has the Dashboard's look: wooden buttons and dark panels in the map maker, replay viewer, Settings and matches.
- The title art replaces the Godot logo at launch.
- **Volume** goes to 200%, with 100% in the middle.
- The landing page's map slideshow is sharp (pixel perfect, no blur).
- On the website, **Download** saves the Windows game straight away.

### Maps
- The Holy Trinity is now **The Amazon**. Traditional, Elements and Confrontation are gone from the built-in maps. Thin Lines: the bottom-left pond's stray Road tile is water.

## v0.9.0 — Dashboard, accounts, shared maps and replays, Hills

### Dashboard
- A new **top bar** of wood and stone: **Maps**, **Replays**, **Play** (in the middle), **Settings** and **Quit**. Your picture and name sit at the far left; the crest and title open the **landing page**: the newest changelog over a slideshow of maps.
- **Play** has Host Game, Play Local Game and "Enter Room Code or IP" side by side, with a **server list** under them: **Public** games to join and matches to **Spectate**. Invites from friends show at the top.
- The **Map Maker** opens from the Maps page (New map, or Edit on your own map). Resuming local games and Random maps are inside Play Local Game. The Changelog, updates and version are at the bottom of Settings, with a dot on Settings when an update is out.
- In a **lobby** you can look around the other pages while you wait. The others' pictures show under yours with **Back to lobby**, and a fanfare pulls you in when the match starts.

### Accounts and friends
- **Sign in or create an account** on your Profile page (email and password). Your name, picture, stats, settings and keybinds then follow you to every computer. Forgot your password? A reset code comes by email.
- **Friends and follows:** see who's Online, In a lobby (Join) or In a match (Spectate). **Invite friends** from your lobby; invites pop up wherever they are. A dot on your profile shows new invites and friend requests (requests can be muted).
- Click any name or picture for their **player card**, with Add friend and Follow.

### Names, pictures and stats
- **Names and pictures** replace "Player 1" everywhere: the turn bar, the cover between hot-seat turns, events and the end of the match. Your picture is any Piece on a tile, in your favourite colour (your match colour in a match).
- **Hot-seat:** Player 1 is you; the others type a name and pick a picture.
- **Stats** on your Profile page, online and local in separate tabs: games won, lost, forfeited and drawn, win ratio and streak, upgrades, recruits, Pieces captured and lost, Castles built and destroyed, Resources gathered, Checkmates, Kings captured, average match length and favourite map.

### Draws
- **Offer Draw** in the match menu. It's a draw when every Player still in the match accepts.

### Spectators
- Watch a match **without a seat**: spectators get an eye instead of a turn number and see what all the Players see. Click a Player to see only their view, Resources and queued moves.
- Hosts choose **Allow spectating** and whether spectators see **one Round behind**. Players see how many are watching; spectators chat only with each other.
- **Eliminated?** Spectate the rest, save the replay, or go back to the menu.

### Maps page
- Rows of maps: **Your Maps**, **Trending**, **New**, **Friends' Maps**, **Liked** and **Favorites**, plus the Built-in Maps to copy. **See all** opens a grid with sorts (Trending, Newest, Most liked, Most downloaded, Name) and filters (Players, size, Favourites only, creator).
- Click a map for its page: pan and zoom around it, like, dislike, favourite, and its best replays. **Share** your own maps (share again to update the listing; likes stay). **Download** shared ones; downloads stay as they are, so press **Make a copy** to change one.
- Browsing and downloading need no account. Liking and sharing do.

### Replays page
- The same rows for replays, with each match's map, Players, Time and Turns. **Share** your replays and **Watch** anyone's.
- **Continue from here:** start a local or hosted game from any step of a replay, choosing who plays each seat.
- Replays save only when you press Save Replay, unless you tick **Save every match's replay**.

### Board
- **Drag Pieces** to move or attack (while queuing too). The selected Piece **lifts** off the board.
- Select an **enemy** Piece to see its moves in light orange and attacks in red.
- **Click a Fortress** your King can castle with to castle (green tile). The button stays too.

### Hills
- **Hills** have 1 to 4 low sides. Stepping up onto one costs ×2, stepping down costs ×0.5, and arrows going downhill use half their reach.
- A Piece standing on a Hill gets **+1 Vision**.
- Cliff Slopes are gone: old ones load as Stairs.

### Map Maker
- **Q** and **E** rotate.
- **Cliffs** pick one side, and drag-painting turns the face with the drag and fills the corners. Cliff and Hill are their own brushes, drawn on grass.
- **Bridges** have a full tileset: point or drag them any way, make wide bridges and crossings.

### Maps
- The built-in maps are Zac's 19 Map Maker maps, with tidied names.

### Web version
- The game now lives at **chesskingdoms.net**.

## v0.8.3 — Fit small windows, paste on the web

### Screen size
- **Small windows:** menus and panels shrink to fit when the window is too small for them, then grow back to your **UI scale** when it's bigger again.
- In a match, the top bar's buttons move to a second line and a Piece's ability buttons wrap when there isn't room for one line. Long messages wrap too.
- The **Upgrades** window and the **Map Maker** side panel never run off the screen; they scroll instead. So does the lobby.

### Fonts
- **MedievalSharp** with **Bold** is the new default. Milwich is gone; if you'd picked it, you get MedievalSharp.
- The **Bold** checkbox sits next to the Font list.
- **Bold text in the changelog** is in your font, not the built-in one.

### Online
- **Connect by** just says "IP address".

### Web version
- **Paste works:** Ctrl+V pastes into text boxes without asking for clipboard permission.

## v0.8.2 — Fonts, clearer highlights and fixes

### Board
- **Highlight tiles** are see-through, so you can see the Terrain under them. A red attack tile never gets a blue one drawn on top.
- Highlights **radiate** out only when you pick a Piece, not again after it moves.
- **Click the selected Piece again** to deselect it. A Piece on its own Castle goes Piece, Castle, then nothing.

### Fonts
- **Font** in Settings > Graphics: **Milwich** (the new default), **MedievalSharp** or **Plain**.
- **Bold text** option under Font. Milwich text is bigger and easier to read.

### Online
- **Join by IP from the browser:** web Players can join a Host by IP address too, through the relay. Desktop and browser Players can share one game hosted by IP.
- The Play Online page puts **Connect by** and the port right above the Room Code, with space between the sections instead of lines.

### Web version
- **Download Desktop Client** button on the main menu.
- Pasting into any text box pastes what's really on your clipboard.
- Arrows, stars and ▶ show up instead of empty boxes.

### Fixes
- Changing a Graphics setting no longer un-maximizes a maximized window.

## v0.8.1 — Discord fix

- **Discord Rich Presence** now shows up. v0.8.0 couldn't reach the Discord app on Windows, so nothing appeared on your profile.

## v0.8.0 — Play online without port forwarding, and in a browser

### Online
- **Room codes:** Host Game now gets a short Room Code (like KTWPM) from the relay server. Friends choose Join Game and type it. Nobody forwards a port or looks up an IP address.
- The lobby shows the Room Code with a **Copy room code** button. Hosting again (or resuming a hosted game) asks for the same code, so friends can keep using it.
- If the Host loses the relay for a moment, the game reconnects on its own with the same code; Players rejoin as usual.
- **Connect by** on the Play Online page switches back to the old way (IP address and UDP port) if you want it.

### Rules
- **Fortified Pawns** can't be hit by Archers. Other Pieces can still attack them, and they still stop arrows flying past.
- **Caches** are worth 4 Resources (were 3).
- **Wheat:** Pawns only get the extra 0.25 Resources for Gathering on Wheat with the new **Threshing** upgrade (Pawn, Level 2, 5 Resources).

### Queen upgrades
- **Royal Harvest** (Level 1, 2 Resources): Queens can Gather, like a Pawn.
- **The Holy Trinity** (Level 2, 4 Resources): Queens can also jump like a Knight (2×1) to move or attack, ignoring Terrain Cost.
- **Act of Supremacy** (Level 3, 8 Resources): you may have 2 Queens at once.
- **2nd in Command** (Level 3, 9 Resources): Queens can recruit whatever a Fortress can, at the same cost.

### Match setup
- **Random map** at the top of the map list (Play Local and the online lobby). A map that fits the Players is picked when the match starts; the preview shows a question mark until then. **Maps…** next to it chooses which maps it picks from (all at first), with **All**, **Default only** and **Custom only** buttons.

### Dev Mode
- In **Free Play**, any upgrade can be bought, whatever the Castle's Level and the upgrades it normally needs. Click an upgrade you own to remove it and get its Resources back.

### Discord
- **Rich Presence** (Windows): your Discord profile shows whether you're in the menu, a local or online match (map, Round, Players), a lobby, the Map Maker or replays.

### Web version
- Chess Kingdoms runs in a web browser too, at the releases repository's GitHub Pages site. Browser and desktop Players can play together by Room Code.
- In the browser: no updater (the page is always the newest), files are kept by the browser, and the Map Maker and Replays have **Download** and **Import** buttons instead of Open folder.

## v0.7.1 — Fixes, diagonal terrain and new maps

### Art
- Terrain at the map's edge is drawn as if it runs on past it: a line of Trees along the edge is forest, and Roads, Water, Wheat and Rocks run off the edge.
- Road, Water, Swamp, Wheat and Rocks tiles that touch only at a corner join up across it, and a diagonal line of them is one straight, even band; Trees touching at a corner get a Tree on that corner.
- Where two of those cross at one corner, only one joins across it, in this order: Road, Rocks, Wheat, Water, Swamp. The other's tiles stay single there.
- Roads are redrawn with tighter corners, so a lone Road tile is a clear patch of path.
- Trees and forests are drawn top to bottom, so a line of Trees going into a forest stands behind the forest's Trees instead of its trunk showing in front of them.
- Side by side Bridges each run the way their line of Bridge tiles reaches land (so two Bridges next to each other across a thin river both run across it).

### Settings
- **Pixel Perfect** (Graphics): the board only zooms to whole multiples of the art's pixels (1×, 2×, 3×…), so every art pixel is the same size on screen.

### Main menu
- Checks for updates when you open it.
- **Changelog** button (next to Check for updates): this version's changes, with a sidebar to look at earlier versions'.

### Maps
- 10 new preset maps made in the Map Maker: Aggressive Expansion, Confrontation, Crazy Crossroads, Elements, Finding a Home, Maize Runner, Moving Mountains, Suprise Attack, Tactical Approach and Traditional. Your own copy of one isn't listed twice.

### Map Maker
- Relic and Cache counts for 3 or 4 Players show only once that many start spots are placed.
- The starting Pieces' Player list has one Player per placed start spot.
- Placing a Player's first starting Piece keeps their King on their start spot (it used to vanish).

## v0.7.0 — New terrain art, Bridges and Save Game

### Rules
- **Wheat** costs 1.5 to move and to attack through (was 3).
- **Archers standing in Wheat** shoot at most 2 tiles, whatever their range; Wheat they shoot over doesn't shorten that.
- **Pawns gathering on Wheat** get +0.25 Resources (on top of the usual Gather amount).
- **Queen:** movement 4 and attack range 4 (Matriarchy makes it 5). Queens take **2 HP** off a Castle per hit; every other Piece takes 1 (a per-Piece value in the rules and the Dev Menu).
- **Lancers** (Scout, Level 2, 4): Scouts can attack like a Knight, for 1 AP. Joust (Level 3) still adds hits on Pieces along the jump.
- **Flaming Arrow** (Archer, Level 2, 4, needs Unlock Archer): **Burn Wheat** (Z, 1 AP) turns a Wheat tile the Archer could shoot at into Grass, and shooting a Piece standing in Wheat burns that Wheat too.
- **Bridges:** a new tile painted over Water or Swamp. Crossed like a Road (move 0.5, attack 1), and Castles can be built on them.

### Match screen
- **Chat:** messages to Everyone now reach every Player (they were going privately to Player 1). The chat box is see-through, starts in the top-left corner, can be dragged, and minimizes to a tab that counts new messages (T opens it).
- **Information window** shows a Piece's real stats: its owner's Upgrades, Inspire, Cliff and terrain applied, its Castle damage, and the Upgrades it has.
- Hovering an ability or Recruit button shows its AP cost next to the Piece's AP.
- **Range** (Y): marks every tile the selected Piece could attack, even with nothing on it.
- **Save Game** in the Menu: a named save beside the auto-save (online, only the Host can save). Resume on the main menu lists the auto-save and your saves, with Delete.
- The Relic no longer has a box round it.

### Replays
- The Graphs window can be dragged, and clicking a point jumps to the start of that Player's Turn in that Round.

### Art
- Grass uses the tileset's 9 grass textures, picked per tile.
- Water's shores, corners and turns fit themselves, and the Water is animated. Roads fit the same way and run straight onto Bridges.
- Swamp is the Water art turned murky and dark, with bubbles rising and popping here and there.
- Trees in a 2×2 or bigger cluster join into a forest; lone Trees stay single trees.
- Wheat and Rocks have new drawn sprites (tools/make_cluster_sprites.py makes assets/terrain/cluster_tiles.png) that join up with their neighbours like Water: Wheat looks like a wheat field, and touching Rocks fuse into bigger boulder piles.
- Trees in a line (across or down) join with extra Trees between them; 2×2 or bigger clusters are still drawn as forest.
- Bridges pick their sprite from their neighbours: short or long, north–south or east–west. Bridges are always 1 tile wide; side by side ones stay separate.
- Castles use the tileset's castles: 4 towers at Level 1, 5 at Level 2, the rounded roof at Level 3, with their coloured parts in the owner's colour. Each lost HP turns one corner tower dark and broken.
- Next to unexplored tiles, edges are drawn as if the hidden tile matched, so they never give hidden terrain away.

### Map Maker
- **Bridge** brush (paint it on Water or Swamp).
- **Stairs** and **Slope** brushes: pick the side they face (like the Cliff edge picker) and paint them on a Cliff's edge. Pieces can walk, shoot and see up a Cliff there, as well as down.
- While painting with the Cliff, Stairs or Slope brush, the rotate and flip buttons (and their hotkeys) turn the brush.
- **Starting Pieces:** place any Piece for any Player (pick the type and Player, then Place). A Player with starting Pieces placed starts with exactly those, where you put them (they need a King); other Players start with the usual King, Pawn and Scout.
- **Unit Cap:** each map can set its own Unit Cap (0 keeps the game's).
- Maps made in older versions still open, play and draw (checked by tests on saved copies of older map files).
- The Cliff brush shows the south-edge Cliff.

## v0.6.0 — Cliffs, chat and a better Map Maker

### Cliffs
- New **Cliff** tile, placed on Grass or Road (the top is grass, a Road stays a Road). Each Cliff has 4 edges you turn on or off.
- Standing on a Cliff gives +1 Vision and +1 attack range for line attacks (like Inspire).
- An edge blocks walking, jumping and shooting **up** it from the outside; going down or along the top is fine. A diagonal step is allowed if either of its two routes is clear.
- Looking up an edge costs 2 Vision for the Cliff tile and everything past it.
- No Castles or Foundations on Cliff tiles.

### Upgrades
- **Knight tree:** Horse Breeding (Level 2, 4) lets Knights jump exactly 3 tiles in a straight line, to move and attack. Stamina Training (3×1) and Cartography (2×2) are Level 3 for 6 and need Horse Breeding. Well Motivated Armies (Level 3, 6) needs both and is for moves only, not attacks.
- **Trample** is gone.
- **Joust** moved to the Scout: Level 3, 15, needs Vitality; a Joust attack costs 1.5 AP.
- Castle Level 3 needs 8 Level 2 Upgrades.

### Match screen
- The Resources counter also shows what you'll have at the start of your next Turn (Gathers coming in, minus queued Recruits and Upgrades).
- A sound plays for news everyone hears (a King captured, a Player eliminated or checkmated, milestones, resignations, the winner).
- Revealing map you hadn't seen (or an enemy Piece) is shared with the notices and can't be undone.
- Clicking Recruit at the Piece cap explains why it can't happen.
- Queued actions that played out at the start of your Turn can be undone (when Undo is on).
- The info panel shows the coordinates of the selected tile and of the tile under the mouse.
- **Move log** (L): your own moves this match.
- **Chat** (T, online only): to everyone or to one Player. Replays keep messages to everyone and your own private messages sent or received, never other Players' private messages to each other.
- Ready outlines show while you queue actions on another Player's Turn.

### Map Maker
- Tool cursors: arrow for Select, brush for Paint, bucket for Fill, eyedropper for Picker.
- Tile and object brushes are picture buttons; hover or pick one for its details.
- Start spots take the next unused Player number (no dropdown); the Start brush is a King in that Player's colour and number. Erasing a start spot renumbers the later ones.
- Cliff brush with an edge picker: a square whose sides you click on or off. Painting any terrain over a Cliff removes it. Fill works with Cliffs too.
- Rotate selections (⟲ [ and ⟳ ]) and mirror them (⇆ H and ⇅ V), Cliff edges and start spots included. With nothing selected they turn the Stamp.
- Axis lines mark the middle of the map both ways.
- The Tree tile is a single tree with no looping edge.
- **Back to Map Maker** in the game Menu after Test Play. Quitting to the main menu from Test Play asks to save an unsaved map.

### Maps
- **Favorites:** the ☆ next to any map list stars the chosen map, and starred maps are listed first (main menu, lobby and Map Maker).

### Replays
- **Graphs** (K): line graphs of each Player's Population and Resources at the start of each of their Turns (after Gathers), one colour per Player. Each graph and each Player's line can be turned off.

### Dev Menu
- Castles can only be spawned on buildable tiles (not Wheat, Rocks or Cliffs).

## v0.5.1 — Fixes

- **Lobby:** changing your colour or turn number no longer closes the colour or turn list another Player has open.
- **Start spots:** Player 1 always starts on the map's start spot 1, Player 2 on spot 2, and so on, so a 2-Player game uses spots 1 and 2 and a 3-Player game spots 1 to 3, whatever the Turn order. The preset maps' spots are renumbered so Players 1 and 2 still start in opposite corners.
- **Map Maker:** the "Made for N Players" choice is gone. A map is for as many Players as it has start spots.
- **Piece outline** thickness starts at 0 (off).
- **Updater:** Install and restart no longer tries to overwrite the running game. It moves the old files aside, copies the new ones in and starts the new version (the old files are deleted on the next start). If that fails, a script copies the files once the game has really closed. Each step is written to `%APPDATA%\ChessKingdoms\update\update.log`.

## v0.5.0 — Unlocks, Inspire and a lot of polish

### Upgrades
- Every Upgrade has a new name (Fertilizer, Carts, Militia, Patrols, Squires, Cannons, Armored Wagons, Advanced Swordsmanship, Code of Honor, Chariot, Guerilla Tactics, Well Motivated Armies, Cartography, Stamina Training, Target Practice, Art of War, Spread the Word, Crusade, Daoism, Matriarchy, Healthy Harvest, Export City, Resourcefulness, Routing the Landscape, Citizenship, Trample and Joust).
- The Upgrades window's boxes show only the name and price (with the Resource icon); everything else is in the tooltip.
- **Unlocks:** "Recruit X" is now "Unlock X", in that Piece's own tree. Unlock Bishop and Unlock Archer are Level 1 (Archer still needs Bishop); Unlock Knight, the new Unlock Rook and Unlock Queen are Level 2 for 2 each.
- Unlocks count for the whole Player: every Castle can recruit an unlocked Piece, Level 1 included. The Rook no longer needs a Level 2 Castle.
- Every other Upgrade in a Piece's tree needs its Unlock first (except Queen's Blessing).
- Castle Level 2 needs 5 Level 1 Upgrades; Level 3 needs 9 Level 2 Upgrades.
- Knight: Trample is Level 2. Cartography (2×2) and Stamina Training (3×1) are separate, Level 2, 2 each; Well Motivated Armies (2×3) needs both. Joust costs 15.
- Advanced Swordsmanship costs 5.
- New: **Vitality** (Scout, Level 3, 7: +0.5 AP), **Trained Hawks** (Archer, Level 1, 2: +2 Vision; Target Practice needs it), **Masonry** (Pawn, Level 2, 3, needs Militia: Create Foundation), **Queen's Blessing** (Queen, Level 2, 5: Queens can Inspire).

### Rules
- **Inspire** (King, and Queen with Queen's Blessing): 1 AP, one other own Piece on the 8 surrounding tiles gets +1 Vision, +1 Movement and +1 attack range during its owner's next turn (Knights: only the Vision). An Inspired Pawn's Gather brings 0.5 more. Doesn't stack.
- **Create Foundation** (Masonry): a Pawn spends 1 AP and 2 Resources to turn an own Fortress next to it into a Foundation, on a tile that's part of a buildable 2×2.
- Foundations: your own Pieces can stand on them. Enemies destroy one only by attacking it (one hit; a melee attacker moves onto it), and a Piece standing on it is captured with it.
- Castles have no spacing rule: side by side is fine, overlapping isn't.
- Archers and Bishops have +1 Vision (5). Archers shoot 2–3 tiles diagonally (2–4 with Target Practice).
- A Piece always sees every tile it could hit right now, even past its Vision (blockers still count).
- Wheat: −1 Vision for each Wheat tile looked past, and −1 reach for each Wheat tile a shot passes over. Rocks give +2 Vision to a Piece standing on them.
- **Player Undo** (Host option, off by default): take back your own actions this turn, back to the last capture, Castle hit or anything another Player was told.
- Queued actions play out one at a time at the start of your turn (0.6 s apart, adjustable), each as its own replay step. A Turn timer turns queuing off.

### Match screen
- **Check Queue** lists every queued action with Remove for each, and Clear Queue.
- Undo button (when the Host allows it), Inspire and Create Foundation buttons, and hotkeys for every ability plus Gather with all Pawns (G).
- The camera no longer moves when turns start or end. In hot-seat each Player keeps their own camera, and a "Start turn" cover screen hides the board between turns (Local setup option, on by default).
- The game Menu looks like Settings and opens Settings in its place, with Return to Menu. The separate Settings button is gone. Player names show in their colours on a mid-grey background.
- Every in-game window can be dragged. Dev menu submenus close with it, and spawning shows a see-through preview.
- Optional "Are you sure?" before End Turn while Pieces still have AP.

### Menus and Settings
- Main menu: Quit Game; the keyboard highlight works on every page.
- Local setup: Player colours, the Undo toggle, the cover screen and a map preview. The online lobby gets the map preview and the Undo toggle.
- Settings: new Graphics (window mode, resolution, VSync, FPS cap, UI scale, Show FPS), Gameplay (queued playback speed, camera pan and zoom speed, edge panning, End Turn confirm) and Accessibility (piece outline, larger notifications) tabs. Every hotkey is rebindable.

### Map Maker
- Select, Paint, Fill and Picker tools (1–4), Copy/Paste and Undo/Redo (Ctrl+C/V/Z/Y, 100 steps).
- Select: click for a tile's details, drag a box, drag the selection to move it (Grass is left behind). Copy includes items and start spots, and pastes by painting.
- Paint shows a see-through preview. Fill spreads over touching tiles of the same terrain. Picker takes the item, otherwise the terrain; Ctrl+click picks with any tool.
- Asks Save / Don't Save / Cancel before New, Open or leaving with unsaved changes. A Menu (Esc) with Resume, Save, Settings and Main Menu.
- Typing in a text box no longer moves the view. The map maker plays the in-game songs.

### Replays
- Rename replays, a playback speed slider, hotkeys, and the Menu shows the replay's own game time.

### Music
- New song: Ladies in Waiting (tokyorifft).
- Every song is levelled to the same loudness and about 6 dB quieter. Matches start on a random song.
- Sound settings show which song is playing and have a play button for each.

### Fixed
- Re-tested the report that only one Fortress can recruit per turn: it doesn't reproduce, and six tests now cover it.

## v0.4.1

### Fixed
- Attacking a Castle didn't use up the attacker's AP, so a Piece could hit a Castle again and again in one turn.

### Changed
- A melee attack on a Castle now moves the attacker onto the tile it hit (not only on the final blow). Castle tiles still end a move, and attacks reach no further than a Castle's first tile; Knights still jump over Castles and can attack by landing on one.
- Recruit Queen (Castle upgrade) costs 2 Resources; recruiting the Queen still costs 10.

## v0.4.0 — Polish

### Changed
- The old Rook is now the **Fortress** (new art), and the Battle Rook is now the **Rook** (classic Rook art). Their upgrades are renamed to match.
- The game icon is the Fortress.
- The game keeps its files in its own folder, %APPDATA%\ChessKingdoms (maps, replays, saves, settings). Files from the old Godot folder are copied over on first start.
- Main menu: Play Local and Play Online open their own pages, alongside Replays, Map Maker and Settings.
- The Upgrades window is a tree: a column per Piece (and the Castle), bands for Levels 1 to 3, lines from each Upgrade to those it unlocks, hover for details, click to buy.

### New
- Settings (main menu and in-game): Sound (all, music and effects volume; mute; choose which songs play in matches) and Keybinds.
- Music: a looping tune on the menus and a playlist during matches.
- Resign from the game menu (asks first).
- Queue Castle upgrades during other Players' turns.
- "Open maps folder" in the Map Maker and "Open replays folder" in Replays.

## v0.3.0 — Content and tools

### New
- Battle Rook: Movement 4 and Attack 4, recruited from Level 2 Castles for 3 Resources. Skill Tree: diagonal attack (L2), +1 Vision (L2), +1 attack range (L3, needs +1 Vision), Clear Forest (L3: turn a Trees tile in its attack lines into Grass).
- Bishop Level 3 upgrade (5 Resources): Bishops may also move up to 2 straight.
- Ten preset maps: Hot Centre (32), Divide (2 Players, 64×32), Frontline (48), Flanks (48), Highlands (48), Cold War (48), Corn Maze (48), Lakelands (48), Lakelands XL (64), Water Maze (64).
- Match timer: a total time per Player for the whole match (their own Turns only); at zero they're eliminated. Works with the Turn timer.
- Replays: Save Replay at the end of a match; the Replays screen steps, plays and seeks through it, and can continue from any point as a local Dev Mode game.
- Updates: the main menu shows the version and checks GitHub Releases for a newer one, then downloads and installs it.

### Changed
- Map items are numbered by priority; maps set how many Caches and Relics appear for 2, 3 and 4 Players. The map maker shows the numbers, renumbers items and edits the counts.
- The Host can change the map, the Turn and Match timers, and random turn order in the lobby.
- The dev menu's spawn owner list shows each Player's colour.

## v0.2.0 — Playtest feedback

### Rules
- Rook: Movement 2, Attack range 3. Melee captures land on the target's tile.
- Attacks have their own terrain Attack Cost. Roads only speed up movement (attack cost 1).
- Vision: Base Vision 4 for every piece, plus a per-piece Vision Bonus (Scout +2).
- Recruit costs: Pawn and Scout 1, Rook and Bishop 1.5, Knight and Archer 1.75.
- Every Rook can recruit once per turn while it has the AP.
- Gather pays out at the start of your next turn; it's lost if the Pawn is captured first.
- Castles take damage only from attacks (1 per hit). Enemies can walk onto Castle tiles (each one ends the move). The hit that destroys a Castle brings a melee attacker onto it.
- Remove your own Piece (not the King) on your turn, for free, with an "Are you sure?" prompt that can be turned off.

### Items and maps
- Relics = Players − 1 and Caches = Players × 2, picked as fairly as the map allows. Maps with extra spots scale them up.
- Meadow redesigned: centre island with a Relic, 8 Caches, 3 Relics.
- Map Maker: paint terrain; place Caches, Relics and start spots; resize; set the player count; save; test play.
- Choose the map for local and hosted games.

### Match screen
- Checkerboard shading on the board.
- Ready (R): outlines the Pieces and Castles that can still act.
- Select any visible Piece to see its vision; opponents' Pieces also show where they could move and attack next turn.
- Info panel for the selected tile and Piece (movement, attack and vision effects).
- Resource icon next to every cost.
- "Your turn" banner and chime.
- "See board" after the match ends.
- Game menu (Menu / Tab / Esc): Round and Turn, match clock with each Player's share, your Piece counts, settings, Quit to Main Menu.
- Local games for 2, 3 or 4 Players.
- Redder Red, and the white Rook as the game icon.

### Online
- Lobby: pick one of 10 colours and a turn number. The Host can change anyone's, or choose Random. Duplicate turn numbers block the start.
- Queued actions: plan moves during other Players' turns; they run when your turn begins. The first failure stops the rest, or skip failures from the game menu.

### Notifications
- Other Players only hear about your first Castle, first Level 2 and first Level 3 Castle, plus checkmates, eliminations and wins. Everything else is told only to the Players involved.

### Dev menu
- Undo / Redo for every move, action, spawn and delete.
- Delete Castles and Foundations.
- One Base Vision setting for all pieces.

### Fixes
- Exported builds lost Piece abilities, Upgrade prerequisites and starting pieces (settings are now stored in a form that survives export).

### Upgrading from v0.1
- Start new games; v0.1 saves don't match the new rules and map.

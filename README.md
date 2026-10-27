# Chess Kingdoms

**PLAY ONLINE IN YOUR BROWSER: https://thezamos.github.io/chess-kingdoms-releases/**

A turn-based strategy game played with chess pieces. Grow an economy, upgrade your Castles, raise an army and be the last King standing.

Every Player starts with a King and a few Pieces on a map hidden by fog of war. Pawns gather Resources, Bishops carry Relics, Fortresses build Castles, and Castles recruit and upgrade your army, in the spirit of Age of Empires. Then you go hunting for the other Kings.

This repository holds the Windows downloads. The game's code lives elsewhere.

## Features

- **2 to 4 Players**, on one computer (hot-seat) or online.
- **Fog of war**: you see only what your Pieces can see, and you can attack only what you see.
- **An economy**: gather Resources, carry Caches home, build Castles and recruit new Pieces.
- **Upgrade trees** for every Piece, Castle Levels, Relics and Promotion.
- **Ten preset maps** and a **Map Maker** to make your own.
- **Replays** of every match, which you can watch step by step or continue from any point.
- **Auto-save** after every turn, so you can Resume a match later.
- Turn and Match timers, queued moves for when it isn't your turn, rebindable keys and music.

## Download and install

1. Open the [latest release](../../releases/latest).
2. Under **Assets**, download `ChessKingdoms-windows.zip`.
3. Unzip it into a folder of its own, for example `Documents\Chess Kingdoms`.
4. Run `ChessKingdoms.exe`.

Keep the `.exe` and the `.pck` file together in the same folder. The game needs both.

Windows may show a "Windows protected your PC" warning the first time, because the game isn't signed. Click **More info**, then **Run anyway**.

## Updates

The game updates itself. From the main menu choose **Check for updates**. If there's a newer release here, the game downloads it, and **Install and restart** swaps in the new files and opens the new version.

You can also update by hand: download the new zip and unzip it over your old game folder. Your saves and maps aren't kept in the game folder, so they're safe either way.

## Your files

The game keeps your maps, replays, saves and settings in:

```
%APPDATA%\ChessKingdoms
```

Paste that into the File Explorer address bar to open it. Back up this folder to keep your maps and replays, or copy maps into it to share them with friends. Deleting the game folder doesn't touch it.

## Playing online

One Player **hosts** and the others **join**. The Host's computer runs the match and sends each Player only what they're allowed to see.

**To host:**

1. Choose **Play Online**, enter your name and press **Host Game**. You pick the map, the Player count and the match options in the lobby.
2. The game uses **UDP port 24565**.
3. Forward that UDP port on your router to your computer. Search for "port forwarding" plus your router's brand for the steps.
4. Allow Chess Kingdoms through Windows Firewall if Windows asks.
5. Give your friends your public IP address (search "what is my IP") and the port.

**To join:** choose **Play Online**, enter your name and the Host's IP address, and join.

If someone drops out, they can rejoin by connecting again with the **same name**. The match waits for them, or the Host can skip their turns until they're back.

## How to play

### Turns

On your turn you can act with any or all of your Pieces, in any order. Each Piece has its own **Action Points (AP)**, and moving, attacking and using abilities all cost AP. End your turn when you're done.

### Check and Checkmate

Your King is in **Check** when an enemy Piece you can see could capture it. You can't end your turn in Check. If your turn starts in Check and nothing gets you out, that's **Checkmate** and you're out of the match. You're also out if your King is captured, or if you Resign.

The last Player with a King wins.

### The map

- **Vision** spreads out from each Piece in a diamond shape. Scouts see further, and Rocks give a Piece standing on them a better view. Trees and Wheat cut it short.
- **Terrain** costs AP to cross: Roads are cheap, Grass is normal, and Swamp, Rocks and Wheat are slow.

### The Pieces

- **King**: lose it and you lose. It can Inspire a nearby Piece for its next turn.
- **Pawn**: gathers Resources and helps build Castles.
- **Scout**: fast, with long Vision.
- **Fortress**: tough and slow. It builds Castles and recruits Pawns and Scouts.
- **Bishop**: moves diagonally and carries Relics to the King.
- **Knight**: jumps in an L, like in chess.
- **Archer**: shoots from a distance.
- **Rook**: a strong, fast attacker.
- **Queen**: the strongest Piece. You can have only one.

New Pieces are unlocked in your Castle's upgrade trees.

### Resources, Caches and Relics

- **Resources** pay for recruiting, building and upgrades. Everyone starts with 3.
- Pawns **Gather** for more Resources at the start of your next turn.
- **Caches** on the map are worth extra Resources once a Piece carries them back to your King.
- **Relics** carried to your King by a Bishop make a Blessed King, who can promote a Pawn standing next to it.

### Castles

Build a Castle with a Pawn and a Fortress on a Foundation. Castles recruit new Pieces and level up to unlock stronger upgrades. Enemies can attack and destroy them, so defend them.

## Feedback

Found a bug or have an idea? Open an [issue](../../issues).

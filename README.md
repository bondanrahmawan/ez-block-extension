# Twitter Quick Block & Retweet

A Chrome extension that adds one-click block and one-click retweet/unretweet buttons to every tweet on Twitter/X — skipping all confirmation dialogs and dropdown menus.

## Features

- **One-click block** (`🚫`) — blocks a user instantly, bypassing the three-dot menu and confirmation dialog
- **One-click retweet** (`🔁`) — retweets instantly, bypassing the retweet/quote dropdown menu
- **One-click undo retweet** — if already retweeted, undoes it in one click
- Works on both `twitter.com` and `x.com`
- Buttons appear in every tweet's action bar (beside like, reply, etc.)
- Automatically handles new tweets loaded via infinite scroll

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select this extension's folder

## Usage

Once installed, every tweet will have two extra buttons appended to the action bar:

| Button | State | Action |
|--------|-------|--------|
| `🚫` (gray) | Default | Click to instantly block the tweet author |
| `🚫` → `✓` (green) | After block | User has been blocked |
| `🔁` (gray) | Not retweeted | Click to instantly retweet |
| `🔁` (green) | Already retweeted | Click to instantly undo retweet |
| `⏳` | Loading | Action is in progress |

No menus, no confirmation dialogs — just click and done.

## How It Works

The extension does **not** call Twitter's API directly. Instead it automates the existing UI:

1. **Block**: clicks the three-dot menu → selects "Block @user" → auto-confirms the dialog
2. **Retweet**: clicks the native retweet button → selects "Repost" from the dropdown
3. **Undo retweet**: clicks the native unretweet button → selects "Undo Repost" from the dropdown

A `MutationObserver` watches for newly loaded tweets and injects buttons automatically.

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension config (Manifest V3) |
| `content.js` | All logic — button injection, block/retweet automation, DOM observation |
| `icon16.png` / `icon48.png` / `icon128.png` | Extension icons |
| `create-icons.html` | Utility page for generating the icon PNGs |
| `CLAUDE.md` | LLM-parseable project reference |

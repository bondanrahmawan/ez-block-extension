# Project: ez-block-extension

Chrome extension (Manifest V3) that adds one-click block and one-click retweet/unretweet buttons to tweets on Twitter/X.

## Architecture

- **Single content script** (`content.js`) — no background script, no popup, no options page.
- Runs on `twitter.com` and `x.com` at `document_end`.
- All interaction is **DOM automation** — clicks native Twitter UI elements and auto-selects menu items. No direct API calls.
- Uses `MutationObserver` on `document.body` to detect dynamically loaded tweets (infinite scroll).

## content.js structure

The file is wrapped in an IIFE. Key functions in order:

| Function | Purpose |
|----------|---------|
| `executeQuickBlock(username, button)` | Automates: caret menu → "Block @user" → confirm dialog |
| `executeQuickRetweet(tweet, button)` | Automates: native retweet btn → "Repost" or "Undo Repost" menu item |
| `updateRetweetButtonState(tweet, button)` | Syncs button color (green/gray) with actual retweet state |
| `addQuickBlockButton(tweet)` | Creates and appends `🚫` button to a tweet's action bar |
| `addQuickRetweetButton(tweet)` | Creates and appends `🔁` button to a tweet's action bar |
| `processTweets()` | Queries all `article[data-testid="tweet"]` and calls both `add*` functions |
| MutationObserver (inline) | Calls `processTweets()` on DOM changes |

## Key Twitter/X selectors used

| Selector | Element |
|----------|---------|
| `article[data-testid="tweet"]` | Tweet container |
| `[role="group"]` | Tweet action bar (reply, retweet, like, etc.) |
| `[data-testid="caret"]` | Three-dot "more" button on a tweet |
| `[role="menu"]` / `[role="menuitem"]` | Dropdown menus and their items |
| `[data-testid="confirmationSheetConfirm"]` | Block confirmation button |
| `[data-testid="retweet"]` | Native retweet button (not yet retweeted) |
| `[data-testid="unretweet"]` | Native unretweet button (already retweeted) |
| `a[href^="/"][href*="/status/"]` | Link used to extract tweet author username |

## Button conventions

- Custom buttons use classes `.quick-block-btn` and `.quick-retweet-btn` (used for duplicate prevention).
- Styled inline via `Object.assign(el.style, {...})` — no external CSS.
- Size: `34.75px x 34.75px`, circular (`borderRadius: 9999px`), matches native action buttons.
- States: default icon → `⏳` (loading) → result icon. Block shows `✓` green on success. Retweet toggles green/gray.
- Hover backgrounds: block uses pink tint `rgba(249, 24, 128, 0.1)`, retweet uses green tint `rgba(0, 186, 124, 0.1)`.

## Timing

- `setTimeout` delays of 100–150ms between UI automation steps (menu open → item click → confirm).
- These are necessary to let Twitter's React UI render between steps.

## Gotchas

- Twitter uses both "retweet"/"repost" and "undo retweet"/"undo repost" terminology — the code checks for both.
- Menu item matching must exclude "quote" to avoid selecting "Quote" instead of "Repost".
- If a menu fails to open, the retweet handler dispatches an Escape keydown to close any stale overlay.
- The block button extracts the username from the tweet's status link, not from display name elements.

# Twitter Quick Block

A Chrome extension that allows you to block Twitter users with a single click instead of the usual 3 clicks.

## Features

- Adds a "⚡ Quick Block" button to user profile menus
- Automatically confirms the block action
- Works on both twitter.com and x.com

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `ez-block` folder

## Usage

1. On Twitter/X, click on the three-dot menu on any user's profile or tweet
2. Click the "⚡ Quick Block" button at the top of the menu
3. The user will be blocked immediately without confirmation dialogs

## Note on Icons

The extension requires icon files (icon16.png, icon48.png, icon128.png). You can:
- Create simple PNG icons with your preferred tool
- Use placeholder images temporarily
- Remove the icons section from manifest.json if you don't need them

## Files

- `manifest.json` - Extension configuration
- `content.js` - Script that adds the quick block functionality to Twitter pages
- `README.md` - This file

// Twitter Quick Block - Content Script
// Adds a quick block button directly beside tweets

(function () {
  'use strict';

  // Function to execute block action
  function executeQuickBlock(username, button) {
    // Disable button to prevent double clicks
    button.disabled = true;
    button.textContent = '⏳';

    // Find the tweet's more button (three dots) and click it
    const tweet = button.closest('article');
    if (!tweet) {
      button.disabled = false;
      button.textContent = '🚫';
      return;
    }

    const moreButton = tweet.querySelector('[data-testid="caret"]');
    if (!moreButton) {
      button.disabled = false;
      button.textContent = '🚫';
      return;
    }

    // Click the more button to open menu
    moreButton.click();

    // Wait for menu to appear and find block option
    setTimeout(() => {
      const menu = document.querySelector('[role="menu"]');
      if (!menu) {
        button.disabled = false;
        button.textContent = '🚫';
        return;
      }

      // Find and click block option
      const menuItems = menu.querySelectorAll('[role="menuitem"]');
      let blockItem = null;

      for (const item of menuItems) {
        const text = item.textContent.toLowerCase();
        if (text.includes('block @')) {
          blockItem = item;
          break;
        }
      }

      if (blockItem) {
        blockItem.click();

        // Wait for confirmation dialog and auto-confirm
        setTimeout(() => {
          const confirmButton = document.querySelector('[data-testid="confirmationSheetConfirm"]');
          if (confirmButton) {
            confirmButton.click();
            button.textContent = '✓';
            button.style.backgroundColor = '#00ba7c';
            console.log('Quick block executed successfully');
          } else {
            button.disabled = false;
            button.textContent = '🚫';
          }
        }, 100);
      } else {
        button.disabled = false;
        button.textContent = '🚫';
      }
    }, 100);
  }

  // Function to execute retweet/unretweet action
  function executeQuickRetweet(tweet, button) {
    button.disabled = true;
    button.textContent = '⏳';

    // Detect current retweet state from the native button
    const retweetBtn = tweet.querySelector('[data-testid="retweet"]');
    const unretweetBtn = tweet.querySelector('[data-testid="unretweet"]');
    const nativeBtn = retweetBtn || unretweetBtn;
    const isRetweeted = !!unretweetBtn;

    if (!nativeBtn) {
      button.disabled = false;
      button.textContent = '🔁';
      return;
    }

    // Click the native retweet/unretweet button to open the menu
    nativeBtn.click();

    setTimeout(() => {
      // Find the dropdown menu that appears
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      let targetItem = null;

      for (const item of menuItems) {
        const text = item.textContent.toLowerCase();
        if (isRetweeted && (text.includes('undo repost') || text.includes('undo retweet'))) {
          targetItem = item;
          break;
        }
        if (!isRetweeted && (text.includes('repost') || text.includes('retweet')) && !text.includes('quote') && !text.includes('undo')) {
          targetItem = item;
          break;
        }
      }

      if (targetItem) {
        targetItem.click();
        if (isRetweeted) {
          button.textContent = '🔁';
          button.style.color = 'rgb(113, 118, 123)';
          button.style.backgroundColor = 'transparent';
        } else {
          button.textContent = '🔁';
          button.style.color = '#00ba7c';
          button.style.backgroundColor = 'transparent';
        }
        button.disabled = false;
      } else {
        // Menu didn't open or option not found, close by pressing Escape
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        button.disabled = false;
        updateRetweetButtonState(tweet, button);
      }
    }, 150);
  }

  // Update retweet button appearance based on current state
  function updateRetweetButtonState(tweet, button) {
    const isRetweeted = !!tweet.querySelector('[data-testid="unretweet"]');
    button.textContent = '🔁';
    button.style.color = isRetweeted ? '#00ba7c' : 'rgb(113, 118, 123)';
  }

  // Function to add quick block button to a tweet
  function addQuickBlockButton(tweet) {
    // Check if we already added the button
    if (tweet.querySelector('.quick-block-btn')) {
      return;
    }

    // Get username from tweet
    const usernameLink = tweet.querySelector('a[href^="/"][href*="/status/"]');
    if (!usernameLink) return;

    const username = usernameLink.getAttribute('href').split('/')[1];
    if (!username) return;

    // Find the action bar (like, retweet, reply buttons)
    const actionBar = tweet.querySelector('[role="group"]');
    if (!actionBar) return;

    // Create quick block button
    const blockButton = document.createElement('button');
    blockButton.className = 'quick-block-btn';
    blockButton.textContent = '🚫';
    blockButton.title = 'Quick Block @' + username;

    // Style the button to match Twitter's design
    Object.assign(blockButton.style, {
      backgroundColor: 'transparent',
      color: 'rgb(113, 118, 123)',
      border: 'none',
      borderRadius: '9999px',
      padding: '0',
      width: '34.75px',
      height: '34.75px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '15px',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    });

    // Hover effect
    blockButton.addEventListener('mouseenter', () => {
      blockButton.style.backgroundColor = 'rgba(249, 24, 128, 0.1)';
    });

    blockButton.addEventListener('mouseleave', () => {
      if (!blockButton.disabled) {
        blockButton.style.backgroundColor = 'transparent';
      }
    });

    // Click handler
    blockButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      executeQuickBlock(username, blockButton);
    });

    // Add button to action bar
    actionBar.appendChild(blockButton);
  }

  // Function to add quick retweet button to a tweet
  function addQuickRetweetButton(tweet) {
    if (tweet.querySelector('.quick-retweet-btn')) {
      return;
    }

    const actionBar = tweet.querySelector('[role="group"]');
    if (!actionBar) return;

    const isRetweeted = !!tweet.querySelector('[data-testid="unretweet"]');

    const retweetButton = document.createElement('button');
    retweetButton.className = 'quick-retweet-btn';
    retweetButton.textContent = '🔁';
    retweetButton.title = isRetweeted ? 'Quick Undo Retweet' : 'Quick Retweet';

    Object.assign(retweetButton.style, {
      backgroundColor: 'transparent',
      color: isRetweeted ? '#00ba7c' : 'rgb(113, 118, 123)',
      border: 'none',
      borderRadius: '9999px',
      padding: '0',
      width: '34.75px',
      height: '34.75px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '15px',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    });

    retweetButton.addEventListener('mouseenter', () => {
      retweetButton.style.backgroundColor = 'rgba(0, 186, 124, 0.1)';
    });

    retweetButton.addEventListener('mouseleave', () => {
      if (!retweetButton.disabled) {
        retweetButton.style.backgroundColor = 'transparent';
      }
    });

    retweetButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      executeQuickRetweet(tweet, retweetButton);
    });

    actionBar.appendChild(retweetButton);
  }

  // Function to process all tweets on the page
  function processTweets() {
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    tweets.forEach(tweet => {
      addQuickBlockButton(tweet);
      addQuickRetweetButton(tweet);
    });
  }

  // Observer to watch for new tweets
  const observer = new MutationObserver((mutations) => {
    processTweets();
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Process initial tweets
  processTweets();

  console.log('Twitter Quick Block extension loaded');
})();

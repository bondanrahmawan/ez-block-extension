// Reddit Quick Block - Content Script
// Supports: shreddit (new Reddit web components) + old Reddit layout
// Adds a one-click block button next to Reddit usernames using Reddit's internal API

(function () {
    'use strict';

    // --------------------------------------------------------------------------
    // API helpers
    // --------------------------------------------------------------------------

    let cachedModhash = null;

    async function getModhash() {
        if (cachedModhash) return cachedModhash;
        const res = await fetch('/api/me.json', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch user info');
        const data = await res.json();
        cachedModhash = data.data?.modhash;
        if (!cachedModhash) throw new Error('Not logged in');
        return cachedModhash;
    }

    async function getUserAccountId(username) {
        const res = await fetch(`/user/${encodeURIComponent(username)}/about.json`, { credentials: 'include' });
        if (!res.ok) throw new Error(`Cannot fetch profile: ${username}`);
        const data = await res.json();
        const id = data.data?.id;
        if (!id) throw new Error(`No account ID for: ${username}`);
        return `t2_${id}`;
    }

    async function executeQuickBlock(username, button) {
        button.disabled = true;
        button.textContent = '⏳';
        button.style.opacity = '1';
        try {
            const [modhash, accountId] = await Promise.all([
                getModhash(),
                getUserAccountId(username)
            ]);

            const res = await fetch('/api/block_user', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Modhash': modhash
                },
                body: new URLSearchParams({
                    account_id: accountId,
                    name: username,
                    api_type: 'json',
                    uh: modhash
                })
            });

            if (!res.ok) throw new Error(`Block request failed: ${res.status}`);

            button.textContent = '✓';
            button.style.color = '#00ba7c';
            button.title = `Blocked u/${username}`;
            console.log(`[QuickBlock] Blocked u/${username}`);

        } catch (err) {
            console.error('[QuickBlock] Error:', err);
            button.disabled = false;
            button.textContent = '🚫';
            button.style.opacity = '0.5';
            button.title = `Quick Block u/${username} (try again)`;
        }
    }

    // --------------------------------------------------------------------------
    // Button factory
    // --------------------------------------------------------------------------

    function makeButton(username) {
        const btn = document.createElement('button');
        btn.className = 'reddit-quick-block-btn';
        btn.textContent = '🚫';
        btn.title = `Quick Block u/${username}`;
        btn.setAttribute('data-qb-user', username);

        Object.assign(btn.style, {
            all: 'unset',
            cursor: 'pointer',
            fontSize: '11px',
            padding: '0 3px',
            margin: '0 2px',
            borderRadius: '3px',
            opacity: '0.5',
            transition: 'opacity 0.15s',
            verticalAlign: 'middle',
            lineHeight: '1',
            display: 'inline-block',
            boxSizing: 'border-box',
        });

        btn.addEventListener('mouseenter', () => { if (!btn.disabled) btn.style.opacity = '1'; });
        btn.addEventListener('mouseleave', () => {
            if (!btn.disabled && btn.textContent !== '✓') btn.style.opacity = '0.5';
        });
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            executeQuickBlock(username, btn);
        });
        return btn;
    }

    // --------------------------------------------------------------------------
    // Helpers
    // --------------------------------------------------------------------------

    const SKIP = new Set(['deleted', 'automoderator', 'reddit']);

    function isValid(username) {
        if (!username) return false;
        const l = username.toLowerCase();
        return !SKIP.has(l) && !l.startsWith('[');
    }

    function alreadyInjected(el) {
        const next = el.nextElementSibling;
        return next && next.classList.contains('reddit-quick-block-btn');
    }

    function findAuthorLink(root, username) {
        return root.querySelector(
            `a[href*="/user/${username}"], a[href*="/u/${username}/"]`
        );
    }

    function injectAfterLink(link, username) {
        if (alreadyInjected(link)) return;
        link.insertAdjacentElement('afterend', makeButton(username));
    }

    // --------------------------------------------------------------------------
    // shreddit-comment processing
    // --------------------------------------------------------------------------

    function processShredditComments() {
        document.querySelectorAll('shreddit-comment[author]:not([data-qb])').forEach(el => {
            el.setAttribute('data-qb', '1');
            const username = el.getAttribute('author');
            if (!isValid(username)) return;

            // 1️⃣ Light DOM
            let link = findAuthorLink(el, username);
            if (link) { injectAfterLink(link, username); return; }

            // 2️⃣ Shadow DOM
            if (el.shadowRoot) {
                link = findAuthorLink(el.shadowRoot, username);
                if (link) { injectAfterLink(link, username); return; }

                const metaSlot = el.shadowRoot.querySelector(
                    '[part*="author"], [part*="meta"], [class*="author"], [class*="byline"], header'
                );
                if (metaSlot && !metaSlot.querySelector('.reddit-quick-block-btn')) {
                    metaSlot.appendChild(makeButton(username));
                    return;
                }
            }

            // 3️⃣ Fallback: top of element
            const slot = el.querySelector('[slot="authorFlair"], [slot="commentMeta"]') || el;
            if (!slot.querySelector('.reddit-quick-block-btn')) {
                slot.prepend(makeButton(username));
            }
        });
    }

    // --------------------------------------------------------------------------
    // shreddit-post processing
    // --------------------------------------------------------------------------

    function processShredditPosts() {
        document.querySelectorAll('shreddit-post[author]:not([data-qb-post])').forEach(el => {
            el.setAttribute('data-qb-post', '1');
            const username = el.getAttribute('author');
            if (!isValid(username)) return;

            // 1️⃣ Light DOM
            let link = findAuthorLink(el, username);
            if (link) { injectAfterLink(link, username); return; }

            // 2️⃣ Shadow DOM
            if (el.shadowRoot) {
                link = findAuthorLink(el.shadowRoot, username);
                if (link) { injectAfterLink(link, username); return; }

                const metaSlot = el.shadowRoot.querySelector(
                    '[part*="author"], [part*="meta"], [class*="author"], header, [slot="authorFlair"]'
                );
                if (metaSlot && !metaSlot.querySelector('.reddit-quick-block-btn')) {
                    metaSlot.appendChild(makeButton(username));
                    return;
                }
            }

            // 3️⃣ Fallback
            const byline = el.querySelector('[data-testid="post_author_link"], [class*="author"], [class*="byline"]');
            const target = byline || el;
            if (!target.querySelector('.reddit-quick-block-btn')) {
                target.appendChild(makeButton(username));
            }
        });
    }

    // --------------------------------------------------------------------------
    // Regular anchor-link processing (old Reddit / non-shreddit)
    // --------------------------------------------------------------------------

    function processRegularLinks() {
        document.querySelectorAll(
            'a[href*="/user/"]:not([data-qb-link]), a[href*="/u/"]:not([data-qb-link])'
        ).forEach(link => {
            link.setAttribute('data-qb-link', '1');

            const href = link.getAttribute('href') || '';
            const m = href.match(/\/u(?:ser)?\/([^/?#]+)/);
            if (!m) return;
            const username = m[1];
            if (!isValid(username)) return;
            if (link.closest('header, nav, #USER_DROPDOWN_ID, [data-testid="subreddit-sidebar"]')) return;

            const text = link.textContent.trim();
            if (!text || text.length > 50) return;

            if (!alreadyInjected(link)) {
                link.insertAdjacentElement('afterend', makeButton(username));
            }
        });
    }

    // --------------------------------------------------------------------------
    // Main loop
    // --------------------------------------------------------------------------

    function processAll() {
        processShredditComments();
        processShredditPosts();
        processRegularLinks();
    }

    const observer = new MutationObserver(processAll);
    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(processAll, 800);
    setTimeout(processAll, 2000);

    processAll();

    console.log('[Reddit Quick Block] loaded');
})();

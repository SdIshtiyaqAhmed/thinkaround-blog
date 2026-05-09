const POSTS_LITE_URL = '/posts/index-lite.json';
const POSTS_FULL_URL = '/posts/index.json';
const THEME_STORAGE_KEY = 'quiet-journal-theme';
const STATS_STORAGE_KEY = 'quiet-journal-stats';
const contentRoot = document.getElementById('content');

// --- Stats Management ---
function getStats(slug) {
  const allStats = JSON.parse(localStorage.getItem(STATS_STORAGE_KEY) || '{}');
  return allStats[slug] || { views: 0, shares: 0 };
}

function updateStats(slug, type) {
  const allStats = JSON.parse(localStorage.getItem(STATS_STORAGE_KEY) || '{}');
  if (!allStats[slug]) allStats[slug] = { views: 0, shares: 0 };
  allStats[slug][type]++;
  localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(allStats));
  
  // Re-render the stats if we are on the post page or home page
  // (In a real app, you might use an event emitter or state management)
}

function incrementView(slug) {
  // Only increment if we haven't viewed this post in this session
  const sessionKey = `viewed_${slug}`;
  if (!sessionStorage.getItem(sessionKey)) {
    updateStats(slug, 'views');
    sessionStorage.setItem(sessionKey, 'true');
  }
}

function incrementShare(slug) {
  const sessionKey = `shared_${slug}`;
  if (!sessionStorage.getItem(sessionKey)) {
    updateStats(slug, 'shares');
    sessionStorage.setItem(sessionKey, 'true');
    return true; // Return true to indicate successful increment
  }
  return false;
}

function triggerIncrementAnimation(element) {
  if (!element) return;
  const badge = document.createElement('span');
  badge.className = 'stat-increment-badge';
  badge.textContent = '+1';
  const rect = element.getBoundingClientRect();
  badge.style.position = 'fixed'; // Use fixed to avoid relative positioning issues
  badge.style.left = `${rect.left + rect.width / 2}px`;
  badge.style.top = `${rect.top - 10}px`;
  document.body.appendChild(badge);
  element.classList.add('stat-pop');
  setTimeout(() => {
    badge.remove();
    element.classList.remove('stat-pop');
  }, 800);
}
// ------------------------

const themeToggle = document.getElementById('theme-toggle');
const focusToggle = document.getElementById('focus-toggle');
const focusExit = document.getElementById('focus-exit');
const pageType = document.body.dataset.page || 'home';
let posts = [];

function readInitialPosts() {
  const initialPostsScript = document.getElementById('initial-posts');
  if (!initialPostsScript) {
    return null;
  }

  try {
    const data = JSON.parse(initialPostsScript.textContent);
    return Array.isArray(data.posts) ? data.posts : null;
  } catch (error) {
    return null;
  }
}

function renderHomeSkeleton(count = 4) {
  return `
    <section class="posts skeleton-posts" aria-hidden="true">
      <ol class="posts-list">
        ${Array.from({ length: count }, () => `
          <li class="post-item skeleton-card">
            <div class="cover-image skeleton-block"></div>
            <div class="post-chip skeleton-chip"></div>
            <div class="post-meta">
              <span class="meta-chip skeleton-chip"></span>
              <span class="meta-chip skeleton-chip"></span>
              <span class="meta-chip skeleton-chip skeleton-chip-wide"></span>
            </div>
            <div class="skeleton-line skeleton-title"></div>
            <div class="skeleton-line skeleton-text"></div>
            <div class="skeleton-line skeleton-text skeleton-text-short"></div>
            <div class="post-link skeleton-button"></div>
          </li>
        `).join('')}
      </ol>
    </section>
  `;
}

function renderArticleSkeleton() {
  return `
    <article class="article-page skeleton-article" aria-hidden="true">
      <header class="article-header">
        <div class="skeleton-line skeleton-meta"></div>
        <div class="skeleton-line skeleton-article-title"></div>
        <div class="skeleton-line skeleton-article-title skeleton-article-title-short"></div>
        <div class="skeleton-line skeleton-text"></div>
        <div class="skeleton-line skeleton-text skeleton-text-short"></div>
      </header>
      <div class="article-layout">
        <div class="article-body">
          <div class="skeleton-line skeleton-paragraph"></div>
          <div class="skeleton-line skeleton-paragraph"></div>
          <div class="skeleton-line skeleton-paragraph skeleton-text-short"></div>
        </div>
      </div>
    </article>
  `;
}

function showLoading() {
  contentRoot.innerHTML = pageType === 'home' ? renderHomeSkeleton() : renderArticleSkeleton();
}

function setTheme(mode) {
  const isDarkMode = mode === 'dark';
  document.body.classList.toggle('dark-mode', isDarkMode);
  
  if (themeToggle) {
    const lightIcon = themeToggle.querySelector('.theme-icon-light');
    const darkIcon = themeToggle.querySelector('.theme-icon-dark');
    if (lightIcon && darkIcon) {
      lightIcon.style.display = isDarkMode ? 'none' : 'block';
      darkIcon.style.display = isDarkMode ? 'block' : 'none';
    }
    themeToggle.setAttribute('aria-pressed', String(isDarkMode));
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  setTheme(savedTheme === 'dark' ? 'dark' : 'light');
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  setTheme(nextTheme);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load JSON at ${url}`);
  }
  return response.json();
}

async function loadPosts() {
  const candidateUrls = pageType === 'post'
    ? ['posts/index.json', './posts/index.json', '/posts/index.json']
    : ['posts/index-lite.json', './posts/index-lite.json', '/posts/index-lite.json'];

  for (const url of candidateUrls) {
    try {
      const data = await fetchJson(url);
      if (Array.isArray(data.posts) && data.posts.length) {
        return data.posts;
      }
    } catch (error) {
      console.warn(error.message);
    }
  }

  if (pageType === 'post') {
    const liteUrls = ['posts/index-lite.json', './posts/index-lite.json', '/posts/index-lite.json'];
    for (const url of liteUrls) {
      try {
        const data = await fetchJson(url);
        if (Array.isArray(data.posts) && data.posts.length) {
          return data.posts;
        }
      } catch (error) {
        console.warn(error.message);
      }
    }
  }

  const fallbackPosts = pageType === 'home' ? readInitialPosts() : null;
  return Array.isArray(fallbackPosts) ? fallbackPosts : [];
}

function getPostBySlug(slug) {
  return posts.find((entry) => entry.slug === slug) || null;
}

function formatDate(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
  });
}

function createHeadingId(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function parseInlineMarkdown(text) {
  let html = text;
  const codeTokens = [];

  // Handle code spans first
  html = html.replace(/`([^`]+)`/g, (match, code) => {
    const token = `%%CODE_${codeTokens.length}%%`;
    codeTokens.push(`<code>${escapeHtml(code)}</code>`);
    return token;
  });

  // Handle images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
    return `<div class="image-wrapper" data-alt="${escapeHtml(alt)}"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" /></div>`;
  });

  // Handle links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, href) => {
    const isExternal = href.startsWith('http');
    const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${escapeHtml(href)}"${targetAttr}>${escapeHtml(label)}</a>`;
  });

  // Handle bold and italic
  html = html
    .replace(/\*\*([^*]+)\*\*/g, (match, content) => `<strong>${escapeHtml(content)}</strong>`)
    .replace(/__([^_]+)__/g, (match, content) => `<strong>${escapeHtml(content)}</strong>`)
    .replace(/\*([^*]+)\*/g, (match, content) => `<em>${escapeHtml(content)}</em>`)
    .replace(/_([^_]+)_/g, (match, content) => `<em>${escapeHtml(content)}</em>`);

  // Restore code spans
  codeTokens.forEach((token, index) => {
    html = html.replace(`%%CODE_${index}%%`, token);
  });

  return html;
}

function parseMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  const headings = [];
  let paragraph = [];
  let listType = '';
  let inCodeBlock = false;
  let codeLines = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${parseInlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  const closeList = () => {
    if (!listType) return;
    html.push(`</${listType}>`);
    listType = '';
  };

  const flushCodeBlock = () => {
    if (!inCodeBlock) return;
    const code = codeLines.join('\n');
    html.push(`
      <div class="code-container">
        <button class="copy-code-btn" type="button" aria-label="Copy code">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span>Copy</span>
        </button>
        <pre><code>${escapeHtml(code)}</code></pre>
      </div>
    `);
    inCodeBlock = false;
    codeLines = [];
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    const unorderedMatch = trimmed.match(/^[-*]\s+(.*)$/);
    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    const quoteMatch = trimmed.match(/^>\s+(.*)$/);
    const hrMatch = trimmed.match(/^([-*_])\s*\1\s*\1[\s-*_]*$/);

    if (trimmed.startsWith('```')) {
      flushParagraph();
      closeList();
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        inCodeBlock = true;
        codeLines = [];
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      return;
    }

    if (headingMatch) {
      flushParagraph();
      closeList();
      const level = Math.min(6, headingMatch[1].length);
      const text = headingMatch[2].trim();
      const id = createHeadingId(text);
      headings.push({ level, text, id });
      html.push(`<h${level} id="${id}">${parseInlineMarkdown(text)}</h${level}>`);
      return;
    }

    if (hrMatch) {
      flushParagraph();
      closeList();
      html.push('<hr />');
      return;
    }

    if (quoteMatch) {
      flushParagraph();
      closeList();
      html.push(`<blockquote>${parseInlineMarkdown(quoteMatch[1])}</blockquote>`);
      return;
    }

    if (unorderedMatch || orderedMatch) {
      flushParagraph();
      const nextListType = unorderedMatch ? 'ul' : 'ol';
      const itemText = unorderedMatch ? unorderedMatch[1] : orderedMatch[1];
      if (listType && listType !== nextListType) {
        closeList();
      }
      if (!listType) {
        listType = nextListType;
        html.push(`<${listType}>`);
      }
      html.push(`<li>${parseInlineMarkdown(itemText)}</li>`);
      return;
    }

    if (!trimmed) {
      flushParagraph();
      closeList();
      return;
    }

    paragraph.push(trimmed);
  });

  flushParagraph();
  closeList();
  flushCodeBlock();

  return { html: html.join(''), headings };
}

function getVisiblePosts() {
  return [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderCover(post) {
  if (!post.coverImage) {
    return `
      <div class="cover-image cover-placeholder">
        <span>Cover image</span>
      </div>
    `;
  }

  const src = escapeHtml(post.coverImage);
  const backgroundUrl = src.startsWith('/') || src.startsWith('http') ? src : `/${src}`;
  const alt = `Cover image for ${post.title}`;
  return `
    <div class="cover-image" style="--cover-image-url:url('${backgroundUrl}')" data-alt="${escapeHtml(alt)}">
      <img src="${src}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" />
    </div>
  `;
}

function renderPostCard(post, options = {}) {
  const featuredChip = options.featured
    ? '<span class="post-chip">Featured</span>'
    : '';
  const titleTag = options.featured ? 'h1' : 'h2';
  const metaChips = [
    `<span class="meta-chip meta-chip-date">${formatDate(post.date)}</span>`,
    `<span class="meta-chip meta-chip-time">${post.readingTime} min read</span>`
  ].join('');

  const tagsMarkup = `<div class="post-tags">${post.tags.map(tag => `<span class="meta-chip meta-chip-tag">#${escapeHtml(tag)}</span>`).join('')}</div>`;

  const stats = getStats(post.slug);
  const statsMarkup = `
    <div class="post-stats">
      <span class="stat-item" aria-label="${stats.views} views">
        <svg width="16" height="16" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
        <span class="stat-views-count">${stats.views}</span>
        <span class="stat-label">views</span>
      </span>
      <span class="stat-item" aria-label="${stats.shares} shares">
        <svg width="16" height="16" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
        <span class="stat-shares-count">${stats.shares}</span>
        <span class="stat-label">shares</span>
      </span>
    </div>
  `;

  return `
    <li class="post-item${options.featured ? ' is-featured' : ''}">
      ${renderCover(post)}
      ${featuredChip}
      <div class="post-meta">${metaChips}</div>
      <${titleTag}><a href="post.html#/post/${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a></${titleTag}>
      ${tagsMarkup}
      <p class="post-summary">${escapeHtml(post.summary)}</p>
      <div class="post-footer">
        <div class="footer-left">
          ${statsMarkup}
        </div>
        <div class="footer-right">
          <button class="icon-button share-button-lite" id="share-article-btn" data-title="${escapeHtml(post.title)}" data-slug="${post.slug}" title="Share article">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            <span>Share</span>
          </button>
          <a class="post-link" href="post.html#/post/${encodeURIComponent(post.slug)}">Read article</a>
        </div>
      </div>
    </li>
  `;
}

function getPageSlug() {
  const query = new URLSearchParams(window.location.search);
  if (query.has('slug')) {
    return query.get('slug');
  }

  const hash = window.location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean);
  if (parts[0] === 'post' && parts.length > 1) {
    return decodeURIComponent(parts.slice(1).join('/'));
  }

  return null;
}

function renderHome() {
  const entries = getVisiblePosts();

  document.title = 'ThinkAround';

  if (!entries.length) {
    contentRoot.innerHTML = '<p>No posts available.</p>';
    return;
  }

  const listMarkup = entries
    .map((post, index) => renderPostCard(post, { featured: index === 0 }))
    .join('');

  contentRoot.innerHTML = `
    <section class="posts">
      <ol class="posts-list">${listMarkup}</ol>
    </section>
  `;
}

function renderAbout() {
  document.title = 'About - ThinkAround';
  contentRoot.innerHTML = `
    <article class="article-page">
      <header class="article-header">
        <p class="article-meta">Thoughtful writing on technology, society, systems, and ideas.</p>
        <h1 class="article-title">About ThinkAround</h1>
        <p class="article-intro">ThinkAround is a calm, thoughtful, minimalist blog focused on technology, society, productivity, sustainability, AI, education, economics, and everyday observations.</p>
      </header>
      <div class="article-layout">
        <div class="article-body">
          <p>ThinkAround is a place for long-form writing and thoughtful ideas. The design is intentionally simple, with generous spacing, clear typography, and subtle interactions.</p>
          <p>Navigate with the header links, open a post, and use focus mode to keep the experience minimal. The site is fully static and works without any external libraries.</p>
          <p>Every article is loaded from structured JSON, parsed in the browser, and rendered as clean on-page content.</p>
        </div>
      </div>
    </article>
  `;
}

function renderNotFound() {
  document.title = 'Not found - ThinkAround';
  contentRoot.innerHTML = `
    <article class="article-page">
      <header class="article-header">
        <p class="article-meta">Post unavailable</p>
        <h1 class="article-title">Not found</h1>
      </header>
      <div class="article-layout">
        <div class="article-body">
          <p>The article you requested could not be found. Return to the homepage to explore other writing.</p>
        </div>
      </div>
    </article>
  `;
}

function renderPost(slug) {
  const post = getPostBySlug(slug);
  if (!post) {
    renderNotFound();
    return;
  }

  document.title = `${post.title} - ThinkAround`;
  const { html, headings } = parseMarkdown(post.content);
  const toc = headings.length > 1
    ? `
      <aside class="article-toc">
        <h2>In this article</h2>
        <ul>
          ${headings
            .map((entry) => `
              <li class="toc-level-${entry.level}">
                <a href="#${entry.id}">${escapeHtml(entry.text)}</a>
              </li>
            `)
            .join('')}
        </ul>
      </aside>
    `
    : '';

  const tagMarkup = post.tags
    .map((tag) => `<a href="index.html#">#${escapeHtml(tag)}</a>`)
    .join(' ');

  if (!sessionStorage.getItem(`viewed_${slug}`)) {
    incrementView(slug);
    sessionStorage.setItem(`viewed_${slug}`, 'true');
  }
  const stats = getStats(slug);
  const statsMarkup = `
      <div class="post-stats-header">
        <span class="stat-item" aria-label="${stats.views} total views">
          <svg width="18" height="18" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          <span class="stat-views-count">${stats.views}</span>
          <span class="stat-label">views</span>
        </span>
        <span class="stat-item" aria-label="${stats.shares} total shares">
          <svg width="16" height="16" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
          <span class="stat-shares-count">${stats.shares}</span>
          <span class="stat-label">shares</span>
        </span>
      </div>
  `;

  contentRoot.innerHTML = `
    <article class="article-page fade-in">
      ${renderCover(post)}
      <header class="article-header">
        <p class="article-meta">By ${escapeHtml(post.author)} &bull; ${formatDate(post.date)} &bull; ${post.readingTime} min read</p>
        ${statsMarkup}
        <h1 class="article-title">${escapeHtml(post.title)}</h1>
        <p class="article-intro">${escapeHtml(post.summary)}</p>
        <div class="article-header-actions">
          <div class="article-tags">${tagMarkup}</div>
          <button class="share-button" id="share-article-btn" data-title="${escapeHtml(post.title)}" data-slug="${post.slug}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            <span>Share</span>
          </button>
        </div>
      </header>
      <div class="article-layout">
        <div class="article-body content-body">${html}</div>
        ${toc}
      </div>
    </article>
  `;

  window.scrollTo(0, 0);
  updateProgressBar();
}

function route() {
  const hash = window.location.hash || '#/';
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);

  if (parts[0] === 'about') {
    renderAbout();
    return;
  }

  if (parts[0] === 'post' && parts.length > 1) {
    showLoading();
    renderPost(getPageSlug());
    return;
  }

  // If we're on a post page and the hash doesn't match a post route,
  // don't navigate away - just let the browser handle anchor scrolling
  if (pageType === 'post') {
    const slug = getPageSlug();
    if (slug) {
      // We're already on a post page, let browser handle anchor links
      return;
    }
    renderNotFound();
    return;
  }

  renderHome();
}

function setFocusMode(enabled) {
  document.body.classList.toggle('focus-mode', enabled);
  focusToggle.setAttribute('aria-pressed', String(enabled));
}

function updateProgressBar() {
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight - windowHeight;
  const scrolled = window.scrollY;
  const progress = documentHeight > 0 ? (scrolled / documentHeight) * 100 : 0;
  const progressBar = document.getElementById('progress-bar');
  if (progressBar) {
    progressBar.style.width = progress + '%';
  }
}

function setupImageModal() {
  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('image-modal-img');
  const closeBtn = document.getElementById('image-modal-close');

  if (!modal || !modalImg || !closeBtn) return;

  // Close modal when clicking the close button
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('show');
  });

  // Close modal when clicking outside the image
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      modal.classList.remove('show');
    }
  });

  // Make images clickable
  document.addEventListener('click', (e) => {
    if (e.target.tagName === 'IMG' && (e.target.closest('.article-body') || e.target.closest('.cover-image'))) {
      e.preventDefault();
      modalImg.src = e.target.src;
      modalImg.alt = e.target.alt;
      modal.classList.add('show');
    }
  });
}

function initialize() {
  loadTheme();
  if (!contentRoot.children.length) {
    showLoading();
  }

  loadPosts()
    .then((loadedPosts) => {
      posts = Array.isArray(loadedPosts) ? loadedPosts : [];
      route();
    })
    .catch(() => {
      renderNotFound();
    });

  window.addEventListener('hashchange', route);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('focus-mode')) {
      setFocusMode(false);
    }
  });

  window.addEventListener('scroll', updateProgressBar);

  focusToggle.addEventListener('click', () => {
    setFocusMode(!document.body.classList.contains('focus-mode'));
  });

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  if (focusExit) {
    focusExit.addEventListener('click', () => setFocusMode(false));
  }

  setupImageModal();

  // Mobile Navigation Toggle
  const navToggle = document.getElementById('nav-toggle');
  const navClose = document.getElementById('nav-close');
  const siteNav = document.getElementById('site-nav');

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = siteNav.classList.toggle('is-active');
      document.body.classList.toggle('nav-active', isActive);
      navToggle.setAttribute('aria-expanded', isActive);
      document.body.style.overflow = isActive ? 'hidden' : '';
    });

    if (navClose) {
      navClose.addEventListener('click', () => {
        siteNav.classList.remove('is-active');
        document.body.classList.remove('nav-active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    }

    // Close on navigation link click
    siteNav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' || e.target.closest('button')) {
        siteNav.classList.remove('is-active');
        document.body.classList.remove('nav-active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });

    // Close on clicking outside (backdrop)
    document.addEventListener('click', (e) => {
      if (siteNav.classList.contains('is-active') && !siteNav.contains(e.target) && !navToggle.contains(e.target)) {
        siteNav.classList.remove('is-active');
        document.body.classList.remove('nav-active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }
  
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link) {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#') && href.length > 1 && !href.startsWith('#/')) {
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  });

  updateProgressBar();

  // Handle Share Button Click
  document.addEventListener('click', async (e) => {
    const shareBtn = e.target.closest('#share-article-btn');
    if (shareBtn) {
      const title = shareBtn.dataset.title;
      const slug = shareBtn.dataset.slug;
      
      const shared = incrementShare(slug);
      
      if (shared) {
        // Update share count in the UI if visible
        const shareCounters = document.querySelectorAll(`[data-slug="${slug}"] .stat-shares-count, .post-stats-header .stat-shares-count`);
        shareCounters.forEach(counter => {
          const currentCount = parseInt(counter.textContent) || 0;
          counter.textContent = currentCount + 1;
          triggerIncrementAnimation(counter);
        });
      }

      const sharePath = `share/${slug}.html`;
      const absoluteUrl = new URL(sharePath, window.location.origin + window.location.pathname).href;

      try {
        if (navigator.share) {
          await navigator.share({
            title: title,
            url: absoluteUrl
          });
        } else {
          await navigator.clipboard.writeText(absoluteUrl);
          const originalContent = shareBtn.innerHTML;
          shareBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied!</span>';
          shareBtn.classList.add('copied');
          setTimeout(() => {
            shareBtn.innerHTML = originalContent;
            shareBtn.classList.remove('copied');
          }, 2000);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
  });

  // Copy Code Blocks
  document.addEventListener('click', async (e) => {
    const copyBtn = e.target.closest('.copy-code-btn');
    if (copyBtn) {
      const container = copyBtn.closest('.code-container');
      const codeElement = container ? container.querySelector('code') : null;
      if (!codeElement) return;

      const code = codeElement.textContent;
      
      try {
        await navigator.clipboard.writeText(code);
        const originalContent = copyBtn.innerHTML;
        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied!</span>';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.innerHTML = originalContent;
          copyBtn.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
    }
  });
}

initialize();

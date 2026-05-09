const POSTS_URL = './posts/index.json';
const contentRoot = document.getElementById('content');
const queryInput = document.getElementById('search-query');
const sortSelect = document.getElementById('sort-select');
const tagFilters = document.getElementById('tag-filters');
const resultsCount = document.getElementById('search-summary');
const resultsList = document.getElementById('search-results');

let posts = [];
let activeTags = new Set();

const STATS_STORAGE_KEY = 'quiet-journal-stats';

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
}

function incrementShare(slug) {
  const sessionKey = `shared_${slug}`;
  if (!sessionStorage.getItem(sessionKey)) {
    updateStats(slug, 'shares');
    sessionStorage.setItem(sessionKey, 'true');
    return true;
  }
  return false;
}

function triggerIncrementAnimation(element) {
  if (!element) return;
  const badge = document.createElement('span');
  badge.className = 'stat-increment-badge';
  badge.textContent = '+1';
  const rect = element.getBoundingClientRect();
  badge.style.position = 'fixed';
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

function renderSearchSkeleton(count = 4) {
  return Array.from({ length: count }, () => `
    <article class="post-item search-result-item skeleton-card" aria-hidden="true">
      <div class="post-meta">
        <span class="meta-chip skeleton-chip"></span>
        <span class="meta-chip skeleton-chip"></span>
        <span class="meta-chip skeleton-chip skeleton-chip-wide"></span>
      </div>
      <div class="skeleton-line skeleton-title"></div>
      <div class="skeleton-line skeleton-text"></div>
      <div class="skeleton-line skeleton-text skeleton-text-short"></div>
      <div class="result-tags">
        <span class="result-tag skeleton-chip"></span>
        <span class="result-tag skeleton-chip"></span>
      </div>
      <div class="post-link skeleton-button"></div>
    </article>
  `).join('');
}

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function getAllTags(items) {
  const tags = new Set();
  items.forEach((post) => {
    (post.tags || []).forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}

function renderTagFilters(tags) {
  if (!tags.length) {
    tagFilters.innerHTML = '<p>No tags available.</p>';
    return;
  }

  tagFilters.innerHTML = tags
    .map((tag) => {
      const active = activeTags.has(tag) ? ' active' : '';
      return `<button type="button" class="tag-filter${active}" data-tag="${encodeURIComponent(tag)}">${tag}</button>`;
    })
    .join('');
}

function filterPosts(items) {
  const term = normalizeText(queryInput.value);

  return items.filter((post) => {
    const haystack = [post.title, post.summary, post.slug, post.author, post.content, (post.tags || []).join(' ')].map(normalizeText).join(' ');
    const matchesTerm = term ? haystack.includes(term) : true;
    const matchesTags = activeTags.size === 0 || (post.tags || []).some((tag) => activeTags.has(tag));
    return matchesTerm && matchesTags;
  });
}

function sortPosts(items) {
  const value = sortSelect.value;
  const sorted = [...items];

  switch (value) {
    case 'date-oldest':
      sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
      break;
    case 'views-desc':
      sorted.sort((a, b) => {
        const statsA = getStats(a.slug);
        const statsB = getStats(b.slug);
        return statsB.views - statsA.views;
      });
      break;
    case 'shares-desc':
      sorted.sort((a, b) => {
        const statsA = getStats(a.slug);
        const statsB = getStats(b.slug);
        return statsB.shares - statsA.shares;
      });
      break;
    case 'title-asc':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'title-desc':
      sorted.sort((a, b) => b.title.localeCompare(a.title));
      break;
    case 'time-asc':
      sorted.sort((a, b) => a.readingTime - b.readingTime);
      break;
    case 'time-desc':
      sorted.sort((a, b) => b.readingTime - a.readingTime);
      break;
    default:
      sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  return sorted;
}

function renderResults(items) {
  const results = sortPosts(filterPosts(items));
  if (resultsCount) {
    resultsCount.textContent = results.length === 1
      ? '1 article found'
      : `${results.length} articles found`;
  }

  if (!results.length) {
    resultsList.innerHTML = '<div class="search-empty">No articles match your search.</div>';
    return;
  }

  resultsList.innerHTML = results
    .map((post) => {
      const stats = getStats(post.slug);
      const metaChips = [
        `<span class="meta-chip meta-chip-date">${new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>`,
        `<span class="meta-chip meta-chip-time">${post.readingTime} min read</span>`
      ].join('');

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

      const tagsMarkup = `<div class="post-tags">${(post.tags || []).map(tag => `<span class="meta-chip meta-chip-tag">#${escapeHtml(tag)}</span>`).join('')}</div>`;

      return `
        <article class="post-item search-result-item">
          <div class="post-meta">${metaChips}</div>
          <h2><a href="post.html#/post/${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a></h2>
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
        </article>
      `;
    })
    .join('');
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function updateSearch() {
  renderResults(posts);
}

const THEME_STORAGE_KEY = 'quiet-journal-theme';
const themeToggle = document.getElementById('theme-toggle');
const focusToggle = document.getElementById('focus-toggle');
const focusExit = document.getElementById('focus-exit');

function setTheme(mode) {
  const isDark = mode === 'dark';
  document.body.classList.toggle('dark-mode', isDark);
  
  if (themeToggle) {
    const lightIcon = themeToggle.querySelector('.theme-icon-light');
    const darkIcon = themeToggle.querySelector('.theme-icon-dark');
    if (lightIcon && darkIcon) {
      lightIcon.style.display = isDark ? 'none' : 'block';
      darkIcon.style.display = isDark ? 'block' : 'none';
    }
    themeToggle.setAttribute('aria-pressed', String(isDark));
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

function setFocusMode(enabled) {
  document.body.classList.toggle('focus-mode', enabled);
  if (focusToggle) {
    focusToggle.setAttribute('aria-pressed', String(enabled));
  }
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

async function loadPosts() {
  try {
    resultsCount.textContent = 'Loading articles...';
    resultsList.innerHTML = renderSearchSkeleton();
    const response = await fetch(POSTS_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Could not load posts.');
    }
    const data = await response.json();
    posts = Array.isArray(data.posts) ? data.posts : [];
    renderTagFilters(getAllTags(posts));
    updateSearch();
  } catch (error) {
    resultsCount.textContent = 'Unable to load articles.';
    resultsList.innerHTML = '<p>Unable to load articles. Please check your network or file structure.</p>';
  }
}

function handleTagFilterClick(event) {
  const button = event.target.closest('button[data-tag]');
  if (!button) return;
  const tag = decodeURIComponent(button.dataset.tag);

  if (activeTags.has(tag)) {
    activeTags.delete(tag);
  } else {
    activeTags.add(tag);
  }

  renderTagFilters(getAllTags(posts));
  updateSearch();
}

function initializeSearchPage() {
  loadTheme();
  queryInput.addEventListener('input', updateSearch);
  sortSelect.addEventListener('change', updateSearch);
  tagFilters.addEventListener('click', handleTagFilterClick);

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  if (focusToggle) {
    focusToggle.addEventListener('click', function () {
      setFocusMode(!document.body.classList.contains('focus-mode'));
    });
  }

  if (focusExit) {
    focusExit.addEventListener('click', function () {
      setFocusMode(false);
    });
  }

  window.addEventListener('scroll', updateProgressBar);

  // Mobile Navigation Toggle
  const navToggle = document.getElementById('nav-toggle');
  const siteNav = document.getElementById('site-nav');

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !expanded);
      siteNav.classList.toggle('is-active');
      document.body.classList.toggle('nav-active');
      document.body.style.overflow = expanded ? '' : 'hidden';
    });

    siteNav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' || e.target.closest('button')) {
        navToggle.setAttribute('aria-expanded', 'false');
        siteNav.classList.remove('is-active');
        document.body.classList.remove('nav-active');
        document.body.style.overflow = '';
      }
    });
  }

  // Handle Share Button Click
  document.addEventListener('click', async (e) => {
    const shareBtn = e.target.closest('#share-article-btn');
    if (shareBtn) {
      const title = shareBtn.dataset.title;
      const slug = shareBtn.dataset.slug;
      
      const shared = incrementShare(slug);
      
      if (shared) {
        // Update share count in the UI if visible
        const shareCounters = document.querySelectorAll(`[data-slug="${slug}"] .stat-shares-count`);
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

  loadPosts();
}

initializeSearchPage();

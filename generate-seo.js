const fs = require('fs');
const path = require('path');

// Read the posts data
const indexJson = JSON.parse(fs.readFileSync('posts/index.json', 'utf8'));
const posts = indexJson.posts;

// Create 'share' directory if it doesn't exist
if (!fs.existsSync('share')) {
  fs.mkdirSync('share');
}

// Ensure the base URL matches the production GitHub Pages URL
const BASE_URL = 'https://sdishtiyaqahmed.github.io/thinkaround-blog';

const template = (post) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${post.title} - ThinkAround</title>
  
  <!-- Open Graph / Social Media Meta Tags -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${post.title}" />
  <meta property="og:description" content="${post.summary}" />
  <meta property="og:image" content="${BASE_URL}/${post.coverImage || 'images/default-cover.jpg'}" />
  <meta property="og:url" content="${BASE_URL}/share/${post.slug}.html" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${post.title}">
  <meta name="twitter:description" content="${post.summary}">
  <meta name="twitter:image" content="${BASE_URL}/${post.coverImage || 'images/default-cover.jpg'}">

  <!-- Instant Redirect to the SPA -->
  <meta http-equiv="refresh" content="0;url=${BASE_URL}/post.html#/post/${post.slug}">
  <script>
    window.location.replace("${BASE_URL}/post.html#/post/${post.slug}");
  </script>
</head>
<body>
  <p>Redirecting to article: <a href="${BASE_URL}/post.html#/post/${post.slug}">${post.title}</a>...</p>
</body>
</html>`;

// Generate a static file for each post
posts.forEach(post => {
  fs.writeFileSync(path.join('share', `${post.slug}.html`), template(post));
});

console.log('Successfully generated SEO share pages for all posts in the /share folder.');

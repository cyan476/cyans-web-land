document.addEventListener("DOMContentLoaded", () => {
  const contentBox = document.querySelector('.contentbox');
  if (!contentBox) return;

  // Fetch and parse the RSS feed
  fetch('feed.xml')
    .then(response => {
      if (!response.ok) throw new Error("Feed not found");
      return response.text();
    })
    .then(str => new window.DOMParser().parseFromString(str, 'text/xml'))
    .then(data => {
      const items = data.querySelectorAll('item');
      
      const posts = [];
      items.forEach((item, index) => {
        posts.push({
          id: index,
          title: item.querySelector('title').textContent,
          description: decodeHTML(item.querySelector('description').textContent),
          date: item.querySelector('pubDate') ? item.querySelector('pubDate').textContent : ''
        });
      });

      // Function to render the main list of posts
      function renderList() {
        let html = `<h3>Latest Transmissions</h3><ul class="post-list">`;
        posts.forEach(post => {
          html += `<li><a href="#" data-id="${post.id}" class="post-link">${post.title}</a> <small>(${post.date})</small></li>`;
        });
        html += `</ul>`;

        // Clickable image button (NO anchor tag, impossible to redirect) + feedback text
        html += `
          <div style="margin-top: 15px; text-align: center;">
            <img src="button1.png" alt="RSS Feed" id="copy-rss-btn" title="Click to copy RSS feed link" style="border: 0; image-rendering: pixelated; cursor: pointer;">
            <div id="copy-feedback" style="font-size: 0.85em; margin-top: 5px; color: #555; min-height: 1.2em;"></div>
          </div>
        `;

        contentBox.innerHTML = html;

        // Attach click events to the post links
        document.querySelectorAll('.post-link').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const postId = e.target.getAttribute('data-id');
            renderPost(posts[postId]);
          });
        });

        // Attach click event directly to the image button for copying
        const copyBtn = document.getElementById('copy-rss-btn');
        const feedback = document.getElementById('copy-feedback');
        
        if (copyBtn) {
          copyBtn.addEventListener('click', () => {
            const feedUrl = new URL('feed.xml', window.location.href).href;

            const showSuccess = () => {
              feedback.textContent = "Copied! Paste it to your own RSS Reader of choice!";
              setTimeout(() => { feedback.textContent = ""; }, 4000);
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(feedUrl).then(showSuccess).catch(() => {
                fallbackCopy(feedUrl, showSuccess, feedback);
              });
            } else {
              fallbackCopy(feedUrl, showSuccess, feedback);
            }
          });
        }
      }

      // Function to render an individual post view with a Back button
      function renderPost(post) {
        contentBox.innerHTML = `
          <button class="contentbox-back-btn" style="margin-bottom: 10px; cursor: pointer;">&larr; Back to Transmissions</button>
          <h2>${post.title}</h2>
          <p><small>${post.date}</small></p>
          <hr style="border: 0; border-top: 1px solid #ccc; margin: 10px 0;">
          <div class="post-body">${post.description}</div>
        `;

        document.querySelector('.contentbox-back-btn').addEventListener('click', () => {
          renderList();
        });
      }

      // Kick it off
      renderList();
    })
    .catch(error => {
      console.error('Error loading feed:', error);
      contentBox.innerHTML = `<h3>Latest Transmissions</h3><p>Could not load feed.xml locally.</p>`;
    });
});

// Helper function to decode HTML entities stored in XML descriptions
function decodeHTML(html) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

// Bulletproof clipboard fallback function
function fallbackCopy(text, onSuccess, feedbackEl) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      onSuccess();
    } else {
      feedbackEl.textContent = "Copy link: " + text;
    }
  } catch (err) {
    feedbackEl.textContent = "Copy link: " + text;
  }
  document.body.removeChild(textarea);
}
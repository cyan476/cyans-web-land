document.addEventListener("DOMContentLoaded", () => {
  const contentBox = document.querySelector('.contentbox');
  if (!contentBox) return;

  // Clear out any old mess/placeholders inside contentbox completely on load
  contentBox.innerHTML = '<div id="rss-feed-root" style="width: 100%;">Loading transmissions...</div>';
  const feedRoot = document.getElementById('rss-feed-root');

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

      function renderList() {
        let html = `
          <div class="transmissions-container" style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
            <h3>Latest Transmissions</h3>
            <ul class="post-list" style="margin: 0; padding-left: 20px;">
        `;
        
        posts.forEach(post => {
          html += `<li style="margin-bottom: 5px;"><a href="#" data-id="${post.id}" class="post-link">${post.title}</a> <small>(${post.date})</small></li>`;
        });
        
        html += `
            </ul>
            <div style="margin-top: 15px; display: flex; flex-direction: column; align-items: center; width: 100%;">
              <img src="button1.png" alt="RSS Feed" id="copy-rss-btn" title="Click to copy RSS feed link" style="border: 0; image-rendering: pixelated; cursor: pointer;">
              <div id="copy-feedback" style="font-size: 0.85em; margin-top: 5px; color: #555; min-height: 1.2em; text-align: center;"></div>
            </div>
          </div>
        `;

        feedRoot.innerHTML = html;

        document.querySelectorAll('.post-link').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const postId = e.target.getAttribute('data-id');
            renderPost(posts[postId]);
          });
        });

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

      function renderPost(post) {
        feedRoot.innerHTML = `
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

      renderList();
    })
    .catch(error => {
      console.error('Error loading feed:', error);
      feedRoot.innerHTML = `<h3>Latest Transmissions</h3><p>Could not load feed.xml locally.</p>`;
    });
});

function decodeHTML(html) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

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
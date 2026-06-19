// App State
let state = {
  allNotes: [],       // Raw data from server
  filteredNotes: [], // Data after search and filter
  selectedUpdate: null, // Currently selected update for tweeting
  searchQuery: '',
  activeFilter: 'all',
  theme: 'dark'
};

// SVG Icons
const icons = {
  copy: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125v-9.75A1.125 1.125 0 0 1 4.875 9.75H8.25m8.25 7.5V9.75M15.75 17.25c0 .621-.504 1.125-1.125 1.125M18 10.5h1.875c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-9.75c-.621 0-1.125-.504-1.125-1.125V18M15 9V5.25L18.75 9H15Z" /></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>`,
  twitter: `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="16" height="16"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  externalLink: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="48" height="48"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>`
};

// DOM Elements
const elements = {
  themeToggle: document.getElementById('theme-toggle'),
  refreshBtn: document.getElementById('refresh-btn'),
  searchInput: document.getElementById('search-input'),
  filterPills: document.getElementById('filter-pills'),
  notesContainer: document.getElementById('notes-container'),
  
  // Composer Drawer Elements
  composerOverlay: document.getElementById('composer-overlay'),
  composerDrawer: document.getElementById('composer-drawer'),
  composerClose: document.getElementById('composer-close'),
  sourceMeta: document.getElementById('source-meta'),
  sourceText: document.getElementById('source-text'),
  tweetTextarea: document.getElementById('tweet-textarea'),
  tweetBtn: document.getElementById('tweet-btn'),
  copyTweetBtn: document.getElementById('copy-tweet-btn'),
  progressCircle: document.querySelector('.progress-ring__circle'),
  charCounterText: document.getElementById('char-counter-text'),
  toastContainer: document.getElementById('toast-container')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupTheme();
  setupEventListeners();
  fetchNotes();
});

// Theme Setup & Toggle
function setupTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  setTheme(savedTheme);
  
  elements.themeToggle.addEventListener('change', () => {
    const newTheme = elements.themeToggle.checked ? 'light' : 'dark';
    setTheme(newTheme);
  });
}

function setTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  elements.themeToggle.checked = (theme === 'light');
}

// Event Listeners Setup
function setupEventListeners() {
  // Refresh Button
  elements.refreshBtn.addEventListener('click', () => {
    fetchNotes(true);
  });
  
  // Export CSV Button
  const exportCsvBtn = document.getElementById('export-csv-btn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportToCSV);
  }
  
  // Search Input (Debounced search)
  let searchTimeout;
  elements.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    state.searchQuery = e.target.value.toLowerCase();
    searchTimeout = setTimeout(filterAndRender, 200);
  });
  
  // Filter pills
  elements.filterPills.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    
    // Toggle active pill styling
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    
    state.activeFilter = pill.dataset.filter;
    filterAndRender();
  });
  
  // Composer Drawer closing
  elements.composerClose.addEventListener('click', closeComposer);
  elements.composerOverlay.addEventListener('click', (e) => {
    if (e.target === elements.composerOverlay) closeComposer();
  });
  
  // Tweet composer text input
  elements.tweetTextarea.addEventListener('input', updateCharCount);
  
  // Copy Tweet action
  elements.copyTweetBtn.addEventListener('click', () => {
    const text = elements.tweetTextarea.value;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Tweet text copied to clipboard!');
    });
  });
  
  // Tweet/Open X Intent Action
  elements.tweetBtn.addEventListener('click', () => {
    const text = elements.tweetTextarea.value;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    closeComposer();
    showToast('Redirected to X (Twitter) Web Intent!');
  });
}

// Toast System
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `${icons.check} <span>${message}</span>`;
  elements.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('toast-fadeout');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3000);
}

// Fetch Notes from API
function fetchNotes(forceRefresh = false) {
  // Set Loading UI State
  elements.refreshBtn.classList.add('loading-state-active');
  elements.refreshBtn.disabled = true;
  renderSkeletons();
  
  const queryParam = forceRefresh ? '?refresh=true' : '';
  fetch(`/api/notes${queryParam}`)
    .then(res => res.json())
    .then(payload => {
      if (payload.status === 'success') {
        state.allNotes = payload.data;
        filterAndRender();
        if (forceRefresh) {
          showToast('Feed refreshed successfully');
        }
      } else {
        throw new Error(payload.message || 'Unknown API Error');
      }
    })
    .catch(err => {
      console.error(err);
      elements.notesContainer.innerHTML = `
        <div class="empty-state">
          ${icons.info}
          <h3>Failed to Fetch Release Notes</h3>
          <p>${err.message}. Please check your internet connection or try again later.</p>
          <button class="btn btn-primary" onclick="fetchNotes(true)" style="margin-top: 1.5rem">Retry Fetch</button>
        </div>
      `;
    })
    .finally(() => {
      elements.refreshBtn.classList.remove('loading-state-active');
      elements.refreshBtn.disabled = false;
    });
}

// Skeletons Loader
function renderSkeletons() {
  let skeletonsHtml = '';
  for (let i = 0; i < 3; i++) {
    skeletonsHtml += `
      <div class="date-group" style="opacity: 1; transform: none;">
        <div class="date-header">
          <div style="width: 150px; height: 24px; background: var(--border-color); border-radius: 4px; animation: pulse 1.5s infinite"></div>
          <div class="date-line"></div>
        </div>
        <div class="updates-grid">
          <div class="update-card" style="pointer-events: none; animation: pulse 1.5s infinite">
            <div class="card-header">
              <div style="width: 80px; height: 20px; background: var(--border-color); border-radius: 4px;"></div>
              <div style="width: 22px; height: 22px; border-radius: 50%; background: var(--border-color);"></div>
            </div>
            <div class="card-body">
              <div style="width: 100%; height: 16px; background: var(--border-color); border-radius: 4px; margin-bottom: 0.5rem"></div>
              <div style="width: 90%; height: 16px; background: var(--border-color); border-radius: 4px; margin-bottom: 0.5rem"></div>
              <div style="width: 40%; height: 16px; background: var(--border-color); border-radius: 4px;"></div>
            </div>
            <div class="card-footer" style="border-top: 1px solid var(--border-color);">
              <div style="width: 120px; height: 14px; background: var(--border-color); border-radius: 4px;"></div>
              <div style="width: 70px; height: 28px; background: var(--border-color); border-radius: 6px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  elements.notesContainer.innerHTML = `
    <style>
      @keyframes pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 0.3; }
      }
    </style>
    ${skeletonsHtml}
  `;
}

// Client Side Filter & Search logic
function filterAndRender() {
  state.filteredNotes = [];
  
  // Outer loop: iterate through days
  state.allNotes.forEach(entry => {
    // Filter updates on this day based on filter rules & search queries
    const matchingUpdates = entry.updates.filter(update => {
      // 1. Filter Check
      const typeLower = update.type.toLowerCase();
      let matchesFilter = false;
      
      if (state.activeFilter === 'all') {
        matchesFilter = true;
      } else if (state.activeFilter === 'feature' && typeLower === 'feature') {
        matchesFilter = true;
      } else if (state.activeFilter === 'announcement' && typeLower === 'announcement') {
        matchesFilter = true;
      } else if (state.activeFilter === 'issue' && typeLower === 'issue') {
        matchesFilter = true;
      } else if (state.activeFilter === 'breaking' && typeLower === 'breaking') {
        matchesFilter = true;
      } else if (state.activeFilter === 'change' && typeLower === 'change') {
        matchesFilter = true;
      }
      
      if (!matchesFilter) return false;
      
      // 2. Search Check
      if (!state.searchQuery) return true;
      
      const inText = update.text_content.toLowerCase().includes(state.searchQuery);
      const inType = update.type.toLowerCase().includes(state.searchQuery);
      const inDate = entry.date.toLowerCase().includes(state.searchQuery);
      
      return inText || inType || inDate;
    });
    
    if (matchingUpdates.length > 0) {
      state.filteredNotes.push({
        ...entry,
        updates: matchingUpdates
      });
    }
  });
  
  renderNotes();
}

// Render Results to UI
function renderNotes() {
  if (state.filteredNotes.length === 0) {
    elements.notesContainer.innerHTML = `
      <div class="empty-state">
        ${icons.info}
        <h3>No matching updates found</h3>
        <p>Try modifying your search text or removing the type filters.</p>
      </div>
    `;
    return;
  }
  
  let notesHtml = '';
  
  state.filteredNotes.forEach((entry, entryIdx) => {
    let updatesHtml = '';
    
    entry.updates.forEach((update) => {
      const typeClass = `badge-${update.type.toLowerCase()}`;
      const isSelected = state.selectedUpdate && state.selectedUpdate.id === update.id;
      
      updatesHtml += `
        <div class="update-card ${isSelected ? 'selected' : ''}" 
             data-id="${update.id}" 
             data-date="${entry.date}"
             data-link="${entry.link}"
             onclick="selectUpdateCard(event, '${update.id}')">
          
          <div class="card-header">
            <span class="type-badge ${typeClass}">${update.type}</span>
            <div class="card-select-indicator">
              ${icons.check}
            </div>
          </div>
          
          <div class="card-body">
            ${update.content_html}
          </div>
          
          <div class="card-footer">
            <div class="card-actions-left">
              <span>BigQuery Release Notes</span>
            </div>
            
            <div class="card-actions-right">
              <button class="btn-card-action" onclick="copyCardText(event, '${update.id}')" title="Copy release note text to clipboard">
                ${icons.copy} Copy Text
              </button>
              <button class="btn-card-action" onclick="copyCardLink(event, '${entry.link}')" title="Copy permanent link to clipboard">
                ${icons.externalLink} Copy Link
              </button>
              <button class="btn-card-action btn-tweet-action" onclick="openTweetDrawer(event, '${update.id}')">
                ${icons.twitter} Tweet
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    notesHtml += `
      <div class="date-group" style="animation-delay: ${entryIdx * 0.05}s">
        <div class="date-header">
          <h2 class="date-title">${entry.date}</h2>
          <div class="date-line"></div>
          <a href="${entry.link}" target="_blank" title="View official release notes for this day" style="color: var(--text-muted); display:flex; align-items:center;" class="btn-icon">
            ${icons.externalLink}
          </a>
        </div>
        <div class="updates-grid">
          ${updatesHtml}
        </div>
      </div>
    `;
  });
  
  elements.notesContainer.innerHTML = notesHtml;
}

// Select Update logic
window.selectUpdateCard = function(event, updateId) {
  // Prevent selecting when clicking links or action buttons inside the card
  if (event.target.closest('a') || event.target.closest('.btn-card-action')) {
    return;
  }
  
  const cardElement = document.querySelector(`.update-card[data-id="${updateId}"]`);
  if (!cardElement) return;
  
  // Find update details
  let foundUpdate = null;
  let foundEntry = null;
  
  for (const entry of state.allNotes) {
    const u = entry.updates.find(item => item.id === updateId);
    if (u) {
      foundUpdate = u;
      foundEntry = entry;
      break;
    }
  }
  
  if (!foundUpdate) return;
  
  // Toggle selection
  if (state.selectedUpdate && state.selectedUpdate.id === updateId) {
    state.selectedUpdate = null;
    cardElement.classList.remove('selected');
  } else {
    // Unselect any currently selected card
    document.querySelectorAll('.update-card.selected').forEach(c => c.classList.remove('selected'));
    
    state.selectedUpdate = {
      ...foundUpdate,
      date: foundEntry.date,
      link: foundEntry.link
    };
    cardElement.classList.add('selected');
  }
};

// Copy feed item permanent URL
window.copyCardLink = function(event, url) {
  event.stopPropagation();
  navigator.clipboard.writeText(url).then(() => {
    showToast('Permanent link copied to clipboard!');
  });
};

// Open the Tweet Composer
window.openTweetDrawer = function(event, updateId) {
  if (event) event.stopPropagation();
  
  // Find update
  let foundUpdate = null;
  let foundEntry = null;
  
  for (const entry of state.allNotes) {
    const u = entry.updates.find(item => item.id === updateId);
    if (u) {
      foundUpdate = u;
      foundEntry = entry;
      break;
    }
  }
  
  if (!foundUpdate) return;
  
  state.selectedUpdate = {
    ...foundUpdate,
    date: foundEntry.date,
    link: foundEntry.link
  };
  
  // Highlight selection in cards list
  document.querySelectorAll('.update-card').forEach(c => {
    if (c.dataset.id === updateId) {
      c.classList.add('selected');
    } else {
      c.classList.remove('selected');
    }
  });
  
  // Prefill Composer drawer UI details
  elements.sourceMeta.textContent = `${foundUpdate.type} — ${foundEntry.date}`;
  elements.sourceText.textContent = foundUpdate.text_content;
  
  // Compose default tweet text
  const typeTag = foundUpdate.type;
  const dateStr = foundEntry.date;
  const linkStr = foundEntry.link;
  
  // Compose clean content snippet, keeping inside Twitter constraints
  // Maximum lengths: type(15) + date(15) + tags(30) + link(23) = 83 chars. We have ~190 characters left for text content.
  let textSnippet = foundUpdate.text_content;
  const urlLen = 23; // Twitter standard
  const metaOverhead = `BigQuery Update [${typeTag}] (${dateStr}): \n\n #BigQuery #GoogleCloud \n\n${linkStr}`;
  const totalLimit = 280;
  
  // Calculate remaining characters for the actual message snippet
  const headerText = `BigQuery [${typeTag}] (${dateStr}): "`;
  const footerText = `"\n\n${linkStr} #BigQuery`;
  
  const overheadLen = headerText.length + urlLen + `\n\n #BigQuery`.length + 4; // safety margins
  const allowedSnippetLen = totalLimit - overheadLen;
  
  if (textSnippet.length > allowedSnippetLen) {
    textSnippet = textSnippet.slice(0, allowedSnippetLen - 3) + '...';
  }
  
  const defaultTweet = `BigQuery [${typeTag}] (${dateStr}):\n"${textSnippet}"\n\n${linkStr} #BigQuery`;
  
  elements.tweetTextarea.value = defaultTweet;
  updateCharCount();
  
  // Slide open drawer
  elements.composerOverlay.classList.add('active');
};

function closeComposer() {
  elements.composerOverlay.classList.remove('active');
}

// Exact Twitter link character counting logic
function getTweetLength(text) {
  // Replace links with a 23 character count placeholder to simulate t.co shortening
  const urlRegex = /https?:\/\/[^\s]+/g;
  let len = text.length;
  const urls = text.match(urlRegex);
  if (urls) {
    for (const url of urls) {
      len = len - url.length + 23;
    }
  }
  return len;
}

// Update Composer UI elements for character progress limits
function updateCharCount() {
  const text = elements.tweetTextarea.value;
  const currentLen = getTweetLength(text);
  const remaining = 280 - currentLen;
  
  elements.charCounterText.textContent = remaining;
  
  // Coloring and selection validation
  if (remaining < 0) {
    elements.charCounterText.className = 'char-counter-text danger';
    elements.tweetBtn.disabled = true;
  } else if (remaining <= 20) {
    elements.charCounterText.className = 'char-counter-text warning';
    elements.tweetBtn.disabled = false;
  } else {
    elements.charCounterText.className = 'char-counter-text';
    elements.tweetBtn.disabled = false;
  }
  
  // Update progress circle indicator (SVG DashOffset)
  // Circumference is 2 * Math.PI * r (r=18) = 113
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  
  elements.progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
  
  let percentage = Math.min(currentLen / 280, 1);
  const offset = circumference - (percentage * circumference);
  elements.progressCircle.style.strokeDashoffset = offset;
  
  // Set stroke color of SVG Circle
  if (remaining < 0) {
    elements.progressCircle.style.stroke = '#e53935'; // Red
  } else if (remaining <= 20) {
    elements.progressCircle.style.stroke = '#fb8c00'; // Orange
  } else {
    elements.progressCircle.style.stroke = '#1d9bf0'; // Twitter Blue
  }
}

// Export to CSV Function
function exportToCSV() {
  if (state.filteredNotes.length === 0) {
    showToast('No notes available to export.');
    return;
  }
  
  // Build CSV rows
  let csvRows = [];
  csvRows.push(['Date', 'Update Type', 'Link', 'Content Text']);
  
  state.filteredNotes.forEach(entry => {
    entry.updates.forEach(update => {
      // Escape quotes by doubling them and wrapping fields in double quotes
      const escapedText = update.text_content.replace(/"/g, '""');
      const escapedDate = entry.date.replace(/"/g, '""');
      const escapedType = update.type.replace(/"/g, '""');
      const escapedLink = entry.link.replace(/"/g, '""');
      
      csvRows.push([
        `"${escapedDate}"`,
        `"${escapedType}"`,
        `"${escapedLink}"`,
        `"${escapedText}"`
      ]);
    });
  });
  
  const csvContent = csvRows.map(row => row.join(',')).join('\n');
  
  // Create a blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `bigquery_release_notes_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Release notes exported to CSV!');
}

// Copy Card text content to clipboard
window.copyCardText = function(event, updateId) {
  event.stopPropagation();
  
  // Find update
  let foundUpdate = null;
  for (const entry of state.allNotes) {
    const u = entry.updates.find(item => item.id === updateId);
    if (u) {
      foundUpdate = u;
      break;
    }
  }
  
  if (!foundUpdate) return;
  
  navigator.clipboard.writeText(foundUpdate.text_content).then(() => {
    showToast('Update text copied to clipboard!');
  });
};

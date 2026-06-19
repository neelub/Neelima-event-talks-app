# BigQuery Release Notes Tracker 📊🐦

A premium, interactive web application to track official Google Cloud BigQuery release notes. It splits daily release bulletins into distinct, selectable update cards, enables real-time search/filtering, and provides a built-in Twitter/X Composer with automatic character counting for instant sharing.

Live Repository: [neelub/Neelima-event-talks-app](https://github.com/neelub/Neelima-event-talks-app)

---

## ✨ Features

- **Granular Update Separation**: Parses the XML feed, splitting daily entries by `<h3>` tags into atomic cards (Features, Announcements, Issues, Changes, Breaking).
- **Caching Orchestration**: Implements a 1-hour in-memory cache to guarantee sub-millisecond page loads, with a **Refresh Feed** button to bypass and update cache.
- **Dynamic Search & Filtering**: Client-side, debounced keyword search combined with color-coded type category filter pills.
- **Twitter/X Composer Side-Drawer**: 
  - Click any card to select/focus.
  - Automatically truncates text and pre-formats the tweet with hashtags and references.
  - Counts characters using Twitter/X's exact link counting behaviour (mapping any link to 23 characters).
  - Radial circular SVG progress ring dynamically changes colors as you reach the 280-character limit.
- **Aesthetic Dual-Theme Layout**: Dark mode (default) and Light mode, utilizing CSS variables and stored in `localStorage`.
- **Skeleton Shimmer Loaders**: Shimmering placeholders are displayed during feed fetches.

---

## 🛠️ Technology Stack

- **Backend**: Python 3, Flask, Requests (HTTP client), BeautifulSoup4 & ElementTree (HTML/XML parsing)
- **Frontend**: Vanilla HTML5, CSS3 (Custom properties, grid, flexbox, transitions), JavaScript (ES6 State Machine, Event Delegation, Clipboard API)

---

## 📂 Directory Structure

```text
bigquery-release-notes-app/
├── app.py                  # Flask server, XML parser & caching
├── templates/
│   └── index.html          # Dashboard HTML structure
├── static/
│   ├── css/
│   │   └── styles.css      # Custom styles, badges, animations & themes
│   └── js/
│       └── app.js          # Client-side routing, filtering & Twitter drawer
├── .gitignore              # Ignored folders (venv, __pycache__, OS metadata)
└── README.md               # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9 or higher
- Git

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone https://github.com/neelub/Neelima-event-talks-app.git
   cd Neelima-event-talks-app
   ```

2. **Set up the Python Virtual Environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install flask requests beautifulsoup4
   ```

4. **Launch the development server**:
   ```bash
   python app.py
   ```

5. **Open the browser**:
   Navigate to [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## 📝 How It Works (Sample Flow)

1. **Fetch**: On launch, the Flask server fetches Google's XML feed from `https://docs.cloud.google.com/feeds/bigquery-release-notes.xml` and caches the structured output.
2. **Interact**: The user enters keywords into the search box or clicks categories (like "Features" or "Issues") to filter cards in real-time.
3. **Select**: Clicking an update selects it, toggles a visual active state, and activates the checkbox indicator.
4. **Tweet**: Clicking **Tweet Update** opens the side drawer. The user edits the text, watches the character counter circle fill up, and clicks **Post to X** to open the Twitter Web Intent window.

---

## 📄 License
This project is open-source and available under the MIT License.

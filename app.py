import os
import time
import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Simple in-memory cache
# Format: { "data": [...], "timestamp": float }
CACHE_DURATION_SEC = 3600  # 1 hour cache
_cache = {
    "data": None,
    "timestamp": 0.0
}

def parse_xml_feed(xml_bytes):
    """
    Parses the Atom XML feed bytes and extracts release entries.
    Splits each entry's content by <h3> headers to isolate individual updates.
    """
    root = ET.fromstring(xml_bytes)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    entries = []
    
    # Track overall indices for easy identification in front-end
    update_id_counter = 0
    
    for entry in root.findall('atom:entry', ns):
        title = entry.find('atom:title', ns)
        date_str = title.text.strip() if title is not None else "Unknown Date"
        
        updated_el = entry.find('atom:updated', ns)
        updated_str = updated_el.text.strip() if updated_el is not None else ""
        
        link_el = entry.find('atom:link[@rel="alternate"]', ns)
        if link_el is None:
            link_el = entry.find('atom:link', ns)
        link = link_el.attrib.get('href', '') if link_el is not None else ""
        
        content_el = entry.find('atom:content', ns)
        content_html = content_el.text if content_el is not None else ""
        
        soup = BeautifulSoup(content_html, 'html.parser')
        
        updates = []
        current_update = None
        
        for element in soup.contents:
            if element.name == 'h3':
                if current_update:
                    updates.append(current_update)
                
                update_id_counter += 1
                current_update = {
                    'id': f"up-{update_id_counter}",
                    'type': element.get_text().strip(),
                    'content_html': '',
                    'text_content': ''
                }
            elif current_update is not None:
                current_update['content_html'] += str(element)
                if hasattr(element, 'get_text'):
                    current_update['text_content'] += element.get_text()
                else:
                    current_update['text_content'] += str(element)
            else:
                # Content before any h3 (e.g. text or paragraphs at the start)
                text = element.get_text().strip() if hasattr(element, 'get_text') else str(element).strip()
                if text:
                    update_id_counter += 1
                    current_update = {
                        'id': f"up-{update_id_counter}",
                        'type': 'Update',
                        'content_html': str(element),
                        'text_content': text
                    }
        
        if current_update:
            updates.append(current_update)
            
        # If no updates were found (e.g. empty or plain text content)
        if not updates and content_html.strip():
            update_id_counter += 1
            updates.append({
                'id': f"up-{update_id_counter}",
                'type': 'Update',
                'content_html': content_html,
                'text_content': soup.get_text()
            })
            
        # Clean up whitespace and format values
        cleaned_updates = []
        for u in updates:
            u['text_content'] = ' '.join(u['text_content'].split()).strip()
            u['content_html'] = u['content_html'].strip()
            # Only append if there is actual content
            if u['text_content'] or u['content_html']:
                cleaned_updates.append(u)
            
        entries.append({
            'date': date_str,
            'updated': updated_str,
            'link': link,
            'updates': cleaned_updates
        })
        
    return entries

def get_release_notes(force_refresh=False):
    """
    Fetches the feed from Google Docs, parses it, and uses cached version if appropriate.
    """
    global _cache
    now = time.time()
    
    # Return cache if valid and not forcing a refresh
    if not force_refresh and _cache["data"] is not None and (now - _cache["timestamp"] < CACHE_DURATION_SEC):
        return _cache["data"], "cache"
        
    try:
        url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        parsed_data = parse_xml_feed(response.content)
        
        # Update cache
        _cache["data"] = parsed_data
        _cache["timestamp"] = now
        return parsed_data, "live"
        
    except Exception as e:
        # Fallback to cache if available on network error
        if _cache["data"] is not None:
            print(f"Network error: {e}. Falling back to cache.")
            return _cache["data"], "fallback_cache"
        raise e

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes')
def api_notes():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    try:
        data, source = get_release_notes(force_refresh=force_refresh)
        return jsonify({
            "status": "success",
            "source": source,
            "timestamp": _cache["timestamp"],
            "data": data
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    # Default local dev port
    app.run(host='127.0.0.1', port=5000, debug=True)

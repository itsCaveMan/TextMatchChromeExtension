# Text Matching Chrome Extension

A barebones Chrome extension that allows you to search for and highlight text on any webpage using a convenient sidebar interface.

## Features

- Search for text on any webpage
- Highlight all matches with visual indicators
- Navigate to the first match automatically
- Clear highlights with one click
- Remembers your last search query
- Works on all websites
- **Sidebar interface** - no more popup interruptions!

## Files Structure

```
TextMatchingChromeExtension/
├── manifest.json       # Extension configuration
├── sidepanel.html      # Extension sidebar interface
├── sidepanel.js        # Sidebar functionality
├── sidepanel.css       # Sidebar styling
├── content.js          # Content script for page interaction
├── background.js       # Background service worker
└── README.md           # This file
```

## Installation

1. **Open Chrome Extensions Page**
   - Go to `chrome://extensions/` in your Chrome browser
   - Or click the three dots menu → More tools → Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to this folder and select it
   - The extension should now appear in your extensions list

4. **Pin the Extension (Optional)**
   - Click the puzzle piece icon in the Chrome toolbar
   - Find "Text Matching Chrome Extension" and click the pin icon

## Usage

1. **Open the Extension Sidebar**
   - Click the extension icon in the Chrome toolbar
   - A sidebar will open on the right side of your browser
   - The sidebar stays open and persists across tab switches

2. **Search for Text**
   - Enter the text you want to find in the search box
   - Click "Search on Page" or press Enter
   - All matches will be highlighted in yellow on the page
   - The page will scroll to the first match

3. **Clear Highlights**
   - Click the "Clear" button to remove all highlights
   - This also clears the search input

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension format)
- **Permissions**: 
  - `activeTab`: Access to the current active tab
  - `storage`: Save search preferences
  - `sidePanel`: Enable sidebar functionality
- **Content Script**: Runs on all URLs to enable text searching
- **Background Script**: Handles extension lifecycle, settings, and sidebar management

## Development

### Key Components

1. **manifest.json**: Defines extension metadata, permissions, and file references
2. **sidepanel.html/js**: Sidebar user interface for entering search terms
3. **content.js**: Injected into web pages to perform text searching and highlighting
4. **background.js**: Service worker for extension lifecycle and sidebar management
5. **sidepanel.css**: Modern, clean styling optimized for sidebar layout

### API Usage

- Chrome Extensions API v3
- Chrome Storage API for persistence
- Chrome Tabs API for communication
- Chrome Runtime API for messaging

## Browser Compatibility

- Chrome 88+
- Chromium-based browsers (Edge, Brave, etc.)

## Future Enhancements

This barebones extension can be extended with:
- Regular expression support
- Case-sensitive search options
- Search history
- Keyboard shortcuts
- Match navigation (next/previous)
- Custom highlight colors
- Search statistics

## License

This is a barebones template for educational purposes. Feel free to modify and extend as needed. 
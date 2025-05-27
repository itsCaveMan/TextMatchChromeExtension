// Background service worker for Text Matching Extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Text Matching Extension installed');
    
    if (details.reason === 'install') {
        // Set default settings
        chrome.storage.local.set({
            'extensionEnabled': true,
            'lastSearch': ''
        });
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('Text Matching Extension started');
});

// Handle action button click to open sidebar
chrome.action.onClicked.addListener(async (tab) => {
    // Open the side panel for the current window
    await chrome.sidePanel.open({ windowId: tab.windowId });
});

// Listen for messages from content scripts or sidepanel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSettings') {
        chrome.storage.local.get(['extensionEnabled'], (result) => {
            sendResponse({ enabled: result.extensionEnabled !== false });
        });
        return true; // Keep message channel open
    }
    
    if (request.action === 'setSettings') {
        chrome.storage.local.set(request.settings, () => {
            sendResponse({ success: true });
        });
        return true;
    }
});

// Handle tab updates (optional - for future features)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Extension is ready to work on this tab
        console.log('Tab loaded:', tab.url);
    }
}); 
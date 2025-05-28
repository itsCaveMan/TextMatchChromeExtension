// Content script for text matching functionality
class TextMatcher {
    constructor() {
        this.highlightClass = 'text-matcher-highlight';
        this.currentHighlights = [];
        this.highlightsByGroup = []; // Store highlights grouped by group index
        this.lastSearchGroups = []; // Store the last search groups
        this.mutationObserver = null;
        this.addStyles();
        this.setupMutationObserver();
    }

    addStyles() {
        // Add CSS for highlighting if not already added
        if (!document.getElementById('text-matcher-styles')) {
            const style = document.createElement('style');
            style.id = 'text-matcher-styles';
            style.textContent = `
                .${this.highlightClass} {
                    background-color: yellow !important;
                    padding: 2px 4px !important;
                    border-radius: 2px !important;
                    box-shadow: 0 0 0 1px orange !important;
                }
                .text-matcher-highlight-0 {
                    background-color: #ff8c00 !important;
                    padding: 2px 4px !important;
                    border-radius: 2px !important;
                    box-shadow: 0 0 0 1px #e67600 !important;
                    color: white !important;
                    font-weight: 500 !important;
                    transition: all 0.3s ease !important;
                    display: inline !important;
                    position: relative !important;
                    z-index: 9999 !important;
                }
                .text-matcher-highlight-1 {
                    background-color: #ffa500 !important;
                    padding: 2px 4px !important;
                    border-radius: 2px !important;
                    box-shadow: 0 0 0 1px #e68900 !important;
                    color: white !important;
                    font-weight: 500 !important;
                    transition: all 0.3s ease !important;
                }
                .text-matcher-highlight-2 {
                    background-color: #ffb84d !important;
                    padding: 2px 4px !important;
                    border-radius: 2px !important;
                    box-shadow: 0 0 0 1px #e69c00 !important;
                    color: black !important;
                    font-weight: 500 !important;
                    transition: all 0.3s ease !important;
                }
                .text-matcher-highlight-3 {
                    background-color: #ffcc66 !important;
                    padding: 2px 4px !important;
                    border-radius: 2px !important;
                    box-shadow: 0 0 0 1px #e6b000 !important;
                    color: black !important;
                    font-weight: 500 !important;
                    transition: all 0.3s ease !important;
                }
                .text-matcher-highlight-4 {
                    background-color: #ffdb80 !important;
                    padding: 2px 4px !important;
                    border-radius: 2px !important;
                    box-shadow: 0 0 0 1px #e6c200 !important;
                    color: black !important;
                    font-weight: 500 !important;
                    transition: all 0.3s ease !important;
                }
                .text-matcher-highlight-5 {
                    background-color: #ffe699 !important;
                    padding: 2px 4px !important;
                    border-radius: 2px !important;
                    box-shadow: 0 0 0 1px #e6d000 !important;
                    color: black !important;
                    font-weight: 500 !important;
                    transition: all 0.3s ease !important;
                }
                .text-matcher-highlight-6 {
                    background-color: #fff0b3 !important;
                    padding: 2px 4px !important;
                    border-radius: 2px !important;
                    box-shadow: 0 0 0 1px #e6dd00 !important;
                    color: black !important;
                    font-weight: 500 !important;
                    transition: all 0.3s ease !important;
                }
                .text-matcher-highlight-7 {
                    background-color: #fff5cc !important;
                    padding: 2px 4px !important;
                    border-radius: 2px !important;
                    box-shadow: 0 0 0 1px #e6e600 !important;
                    color: black !important;
                    font-weight: 500 !important;
                    transition: all 0.3s ease !important;
                }
                .text-matcher-highlight-8 {
                    background-color: #fffae6 !important;
                    padding: 2px 4px !important;
                    border-radius: 2px !important;
                    box-shadow: 0 0 0 1px #e6e600 !important;
                    color: black !important;
                    font-weight: 500 !important;
                    transition: all 0.3s ease !important;
                }
                .text-matcher-highlight-9 {
                    background-color: #ffff99 !important;
                    padding: 2px 4px !important;
                    border-radius: 2px !important;
                    box-shadow: 0 0 0 1px #e6e600 !important;
                    color: black !important;
                    font-weight: 500 !important;
                    transition: all 0.3s ease !important;
                }
                
                /* Hover effect styles */
                .text-matcher-hover-effect {
                    transform: scale(1.05) !important;
                    z-index: 1000 !important;
                    position: relative !important;
                    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3)) !important;
                    animation: pulse-glow 1.5s ease-in-out infinite alternate !important;
                }
                
                @keyframes pulse-glow {
                    0% { 
                        box-shadow: 0 0 5px currentColor !important;
                    }
                    100% { 
                        box-shadow: 0 0 15px currentColor, 0 0 25px currentColor !important;
                    }
                }
                
                /* Dimmed effect for non-hovered highlights */
                .text-matcher-dimmed {
                    opacity: 0.4 !important;
                    filter: brightness(0.7) !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    getHighlightClass(index) {
        // Cycle through the available highlight classes (0-9)
        return `text-matcher-highlight-${index % 10}`;
    }

    // Fuzzy matching using Levenshtein distance
    levenshteinDistance(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        for (let i = 0; i <= m; i++) {
            dp[i][0] = i;
        }
        for (let j = 0; j <= n; j++) {
            dp[0][j] = j;
        }

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                // Make case sensitive comparison
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
                }
            }
        }

        return dp[m][n];
    }

    // Calculate similarity ratio (0 to 1)
    calculateSimilarity(str1, str2) {
        const distance = this.levenshteinDistance(str1, str2);
        const maxLength = Math.max(str1.length, str2.length);
        return maxLength === 0 ? 1 : 1 - (distance / maxLength);
    }

    // Find the best fuzzy match in a text node
    findBestFuzzyMatch(searchText, targetText, minSimilarity = 0.7) {
        // Make case sensitive - remove toLowerCase()
        const normalizedSearch = searchText.trim();
        const normalizedTarget = targetText;
        
        if (!normalizedSearch || !normalizedTarget) {
            return null;
        }

        let bestMatch = null;
        let bestSimilarity = 0;
        const searchLength = normalizedSearch.length;

        // Sliding window approach - check all possible substrings
        for (let i = 0; i <= normalizedTarget.length - searchLength * 0.5; i++) {
            // Try different window sizes (from 50% to 150% of search text length)
            for (let windowSize = Math.floor(searchLength * 0.5); windowSize <= Math.min(searchLength * 1.5, normalizedTarget.length - i); windowSize++) {
                const substring = normalizedTarget.substring(i, i + windowSize);
                const similarity = this.calculateSimilarity(normalizedSearch, substring);
                
                if (similarity > bestSimilarity && similarity >= minSimilarity) {
                    bestSimilarity = similarity;
                    bestMatch = {
                        start: i,
                        end: i + windowSize,
                        text: targetText.substring(i, i + windowSize),
                        similarity: similarity
                    };
                }
            }
        }

        return bestMatch;
    }

    searchAndHighlightGroups(groups) {
        // Store groups for potential reapplication
        this.lastSearchGroups = [...groups];
        
        // Clear previous highlights
        this.clearHighlights();

        if (!groups || groups.length === 0) {
            return { results: [] };
        }

        // Collect all text nodes and build a text map
        const textNodes = [];
        const textMap = [];
        let totalLength = 0;
        
        const collectTextNodes = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                if (node.textContent.trim().length > 0) {
                    textNodes.push(node);
                    textMap.push({
                        node: node,
                        start: totalLength,
                        end: totalLength + node.textContent.length,
                        text: node.textContent
                    });
                    totalLength += node.textContent.length;
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE' && 
                    !node.classList.contains('text-matcher-highlight-0') &&
                    !node.classList.contains('text-matcher-highlight-1') &&
                    !node.classList.contains('text-matcher-highlight-2') &&
                    !node.classList.contains('text-matcher-highlight-3') &&
                    !node.classList.contains('text-matcher-highlight-4') &&
                    !node.classList.contains('text-matcher-highlight-5') &&
                    !node.classList.contains('text-matcher-highlight-6') &&
                    !node.classList.contains('text-matcher-highlight-7') &&
                    !node.classList.contains('text-matcher-highlight-8') &&
                    !node.classList.contains('text-matcher-highlight-9')) {
                    Array.from(node.childNodes).forEach(child => collectTextNodes(child));
                }
            }
        };

        collectTextNodes(document.body);
        
        // Get all text content from the page
        const pageText = textMap.map(tm => tm.text).join('');
        
        const results = groups.map((group, groupIndex) => {
            // Find the best fuzzy match for this group
            const match = this.findBestFuzzyMatch(group, pageText);
            
            if (match) {
                // Store match info with group index
                return {
                    match: match,
                    groupIndex: groupIndex
                };
            }
            
            return { match: null, groupIndex: groupIndex };
        });

        // Apply highlights for all matches
        this.applyHighlights(results, textMap);

        return { results: results };
    }

    applyHighlights(results, textMap) {
        // Find which text nodes contain our matches
        const nodeHighlights = new Map();
        
        results.forEach(result => {
            if (result.match) {
                // Find which text nodes this match spans
                textMap.forEach(tm => {
                    if (result.match.start < tm.end && result.match.end > tm.start) {
                        // Calculate positions relative to this text node
                        const relativeStart = Math.max(0, result.match.start - tm.start);
                        const relativeEnd = Math.min(tm.text.length, result.match.end - tm.start);
                        
                        if (relativeStart < relativeEnd) {
                            if (!nodeHighlights.has(tm.node)) {
                                nodeHighlights.set(tm.node, []);
                            }
                            
                            nodeHighlights.get(tm.node).push({
                                start: relativeStart,
                                end: relativeEnd,
                                text: tm.text.substring(relativeStart, relativeEnd),
                                groupIndex: result.groupIndex,
                                highlightClass: this.getHighlightClass(result.groupIndex)
                            });
                        }
                    }
                });
            }
        });

        // Apply highlights to each text node
        nodeHighlights.forEach((highlights, textNode) => {
            if (!textNode.parentNode) return;

            // Sort highlights by position within this text node
            highlights.sort((a, b) => a.start - b.start);

            const text = textNode.textContent;
            let highlightedHTML = '';
            let lastEnd = 0;

            highlights.forEach(highlight => {
                // Add text before the match
                highlightedHTML += text.slice(lastEnd, highlight.start);
                // Add highlighted match with group index stored as data attribute
                highlightedHTML += `<span class="${highlight.highlightClass}" data-group-index="${highlight.groupIndex}">${highlight.text}</span>`;
                lastEnd = highlight.end;
            });

            // Add remaining text after last match
            highlightedHTML += text.slice(lastEnd);

            // Replace the text node with highlighted content
            const wrapper = document.createElement('div');
            wrapper.innerHTML = highlightedHTML;
            
            const parent = textNode.parentNode;
            while (wrapper.firstChild) {
                const child = wrapper.firstChild;
                parent.insertBefore(child, textNode);
                if (child.classList && Array.from(child.classList).some(cls => cls.startsWith('text-matcher-highlight-'))) {
                    this.currentHighlights.push(child);
                }
            }
            parent.removeChild(textNode);
        });

        // Scroll to first highlight if any found
        if (this.currentHighlights.length > 0) {
            this.currentHighlights[0].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    clearHighlights() {
        this.currentHighlights.forEach(highlight => {
            const parent = highlight.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
                parent.normalize(); // Merge adjacent text nodes
            }
        });
        this.currentHighlights = [];
        this.highlightsByGroup = [];
    }

    // Handle hover effects for groups
    applyHoverEffect(groupIndex) {
        // Remove existing hover effects
        this.removeHoverEffect();
        
        // Apply hover effect to the specified group's highlights
        this.currentHighlights.forEach((highlight) => {
            const actualGroupIndex = parseInt(highlight.getAttribute('data-group-index') || '-1');
            
            if (actualGroupIndex === groupIndex) {
                highlight.classList.add('text-matcher-hover-effect');
            } else {
                highlight.classList.add('text-matcher-dimmed');
            }
        });
    }

    removeHoverEffect() {
        this.currentHighlights.forEach(highlight => {
            highlight.classList.remove('text-matcher-hover-effect');
            highlight.classList.remove('text-matcher-dimmed');
        });
    }

    setupMutationObserver() {
        // Set up mutation observer to detect when DOM content changes
        this.mutationObserver = new MutationObserver((mutations) => {
            let shouldReapplyHighlights = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // Check if our highlights were removed
                    mutation.removedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const highlightElements = node.querySelectorAll('[class*="text-matcher-highlight"]');
                            if (highlightElements.length > 0) {
                                shouldReapplyHighlights = true;
                            }
                        }
                    });
                }
            });
            
            // Reapply highlights if they were removed and we have stored groups
            if (shouldReapplyHighlights && this.lastSearchGroups.length > 0) {
                // Use a timeout to avoid interfering with the DOM mutation
                setTimeout(() => {
                    this.searchAndHighlightGroups(this.lastSearchGroups);
                }, 100);
            }
        });
        
        // Start observing
        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Initialize the TextMatcher
const textMatcher = new TextMatcher();

// Listen for messages from popup/sidebar
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'searchGroups') {
        const result = textMatcher.searchAndHighlightGroups(request.groups);
        sendResponse(result);
    } else if (request.action === 'clear') {
        textMatcher.clearHighlights();
        sendResponse({ success: true });
    } else if (request.action === 'hoverGroup') {
        textMatcher.applyHoverEffect(request.groupIndex);
        sendResponse({ success: true });
    } else if (request.action === 'unhoverGroup') {
        textMatcher.removeHoverEffect();
        sendResponse({ success: true });
    }
    return true; // Indicate that the response is asynchronous
});

// Log that content script is loaded
console.log('Text Matching Extension: Content script loaded'); 
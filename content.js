// Content script for text matching functionality
class TextMatcher {
    constructor() {
        this.highlightClass = 'text-matcher-highlight';
        this.currentHighlights = [];
        this.highlightsByTerm = []; // Store highlights grouped by term index
        this.addStyles();
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

    searchAndHighlightMultiple(queries) {
        // Clear previous highlights
        this.clearHighlights();

        if (!queries || queries.length === 0) {
            return { totalCount: 0, counts: [] };
        }

        let totalCount = 0;
        const counts = [];
        let firstHighlight = null;

        // Collect all text nodes first to avoid DOM mutations during iteration
        const textNodes = [];
        const collectTextNodes = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                textNodes.push(node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Skip script, style elements, and already highlighted content
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

        // Initialize counts array for all queries  
        queries.forEach((_, index) => {
            counts[index] = 0;
        });

        // Track which search terms have already been used (each search term can only highlight once)
        const termHasHighlighted = new Array(queries.length).fill(false);

        // Collect all possible matches across all text nodes first
        const allMatches = [];
        
        textNodes.forEach((textNode, nodeIndex) => {
            if (!textNode.parentNode) return;

            const text = textNode.textContent;

            // Find all matches for all queries in this text node
            queries.forEach((query, queryIndex) => {
                if (!query.trim()) return;

                const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                let match;
                
                while ((match = regex.exec(text)) !== null) {
                    allMatches.push({
                        start: match.index,
                        end: match.index + match[0].length,
                        text: match[0],
                        queryIndex: queryIndex,
                        highlightClass: this.getHighlightClass(queryIndex),
                        textNode: textNode,
                        nodeIndex: nodeIndex,
                        absoluteStart: match.index, // position within this specific text node
                        absoluteEnd: match.index + match[0].length
                    });
                    
                    // Prevent infinite loop for zero-length matches
                    if (match.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }
                }
            });
        });

        // Sort all matches by query index first (search terms in order), then by node order, then by position
        allMatches.sort((a, b) => {
            if (a.queryIndex !== b.queryIndex) {
                return a.queryIndex - b.queryIndex;
            }
            if (a.nodeIndex !== b.nodeIndex) {
                return a.nodeIndex - b.nodeIndex;
            }
            return a.start - b.start;
        });

        // Filter matches: each search term can only highlight once, and no position can be highlighted twice
        const validMatches = [];
        const globalHighlightedRanges = []; // Track all highlighted ranges across all nodes

        allMatches.forEach(match => {
            // Check if this search term has already highlighted something
            if (termHasHighlighted[match.queryIndex]) {
                return; // This search term already highlighted something
            }

            // Check if this position conflicts with any already highlighted range
            const hasConflict = globalHighlightedRanges.some(range => 
                range.textNode === match.textNode && 
                (match.start < range.end && match.end > range.start)
            );

            if (!hasConflict) {
                validMatches.push(match);
                globalHighlightedRanges.push({
                    textNode: match.textNode,
                    start: match.start,
                    end: match.end
                });
                termHasHighlighted[match.queryIndex] = true;
                counts[match.queryIndex] = 1; // Each term can only highlight once
            }
        });

        // Group valid matches by text node for processing
        const matchesByNode = new Map();
        validMatches.forEach(match => {
            if (!matchesByNode.has(match.textNode)) {
                matchesByNode.set(match.textNode, []);
            }
            matchesByNode.get(match.textNode).push(match);
        });

        // Apply highlights to each text node
        matchesByNode.forEach((nodeMatches, textNode) => {
            if (!textNode.parentNode) return;

            // Sort matches by position within this text node
            nodeMatches.sort((a, b) => a.start - b.start);

            const text = textNode.textContent;
            let highlightedHTML = '';
            let lastEnd = 0;

            nodeMatches.forEach(match => {
                // Add text before the match
                highlightedHTML += text.slice(lastEnd, match.start);
                // Add highlighted match with actual term index stored as data attribute
                highlightedHTML += `<span class="${match.highlightClass}" data-term-index="${match.queryIndex}">${match.text}</span>`;
                lastEnd = match.end;
            });

            // Add remaining text after last match
            highlightedHTML += text.slice(lastEnd);

            // Replace the text node with highlighted content if there were changes
            if (highlightedHTML !== text) {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = highlightedHTML;
                
                const parent = textNode.parentNode;
                while (wrapper.firstChild) {
                    const child = wrapper.firstChild;
                    parent.insertBefore(child, textNode);
                    if (child.classList && Array.from(child.classList).some(cls => cls.startsWith('text-matcher-highlight-'))) {
                        this.currentHighlights.push(child);
                        // Store the first highlight for scrolling
                        if (!firstHighlight) {
                            firstHighlight = child;
                        }
                    }
                }
                parent.removeChild(textNode);
            }
        });

        // Calculate total count
        totalCount = counts.reduce((sum, count) => sum + count, 0);

        // Scroll to first highlight if any found
        if (firstHighlight) {
            firstHighlight.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }

        return { totalCount, counts };
    }

    searchAndHighlight(query) {
        // Clear previous highlights
        this.clearHighlights();

        if (!query.trim()) {
            return { count: 0 };
        }

        const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        let count = 0;

        // Function to walk through text nodes
        const walkTextNodes = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                if (regex.test(text)) {
                    const highlightedHTML = text.replace(regex, (match) => {
                        count++;
                        return `<span class="${this.highlightClass}">${match}</span>`;
                    });
                    
                    if (highlightedHTML !== text) {
                        const wrapper = document.createElement('div');
                        wrapper.innerHTML = highlightedHTML;
                        
                        // Replace the text node with highlighted content
                        const parent = node.parentNode;
                        while (wrapper.firstChild) {
                            const child = wrapper.firstChild;
                            parent.insertBefore(child, node);
                            if (child.classList && child.classList.contains(this.highlightClass)) {
                                this.currentHighlights.push(child);
                            }
                        }
                        parent.removeChild(node);
                    }
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Skip script and style elements
                if (node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE') {
                    // Create a copy of child nodes to iterate over
                    const children = Array.from(node.childNodes);
                    children.forEach(child => walkTextNodes(child));
                }
            }
        };

        // Start the search from the document body
        walkTextNodes(document.body);

        // Scroll to first highlight if any found
        if (this.currentHighlights.length > 0) {
            this.currentHighlights[0].scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }

        return { count };
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
        this.highlightsByTerm = [];
    }

    // New method to handle hover effects
    applyHoverEffect(termIndex) {
        // Remove existing hover effects
        this.removeHoverEffect();
        
        // Apply hover effect to the specified term's highlights
        // Since each search term now only highlights once, we need to find the highlight
        // that corresponds to the actual termIndex, not the CSS class index
        this.currentHighlights.forEach((highlight) => {
            const actualTermIndex = this.getActualTermIndexFromHighlight(highlight);
            
            if (actualTermIndex === termIndex) {
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

    getActualTermIndexFromHighlight(highlight) {
        // Get the actual term index stored as a data attribute
        // We'll need to store this when creating highlights
        const termIndex = highlight.getAttribute('data-term-index');
        return termIndex !== null ? parseInt(termIndex) : -1;
    }

    getTermIndexFromHighlight(highlight) {
        // Extract term index from the highlight class name (for backward compatibility)
        const classList = Array.from(highlight.classList);
        const termClass = classList.find(cls => cls.startsWith('text-matcher-highlight-'));
        if (termClass) {
            return parseInt(termClass.split('-').pop());
        }
        return -1;
    }
}

// Initialize the text matcher
const textMatcher = new TextMatcher();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'search') {
        const result = textMatcher.searchAndHighlight(request.query);
        sendResponse(result);
    } else if (request.action === 'searchMultiple') {
        const result = textMatcher.searchAndHighlightMultiple(request.queries);
        sendResponse(result);
    } else if (request.action === 'clear') {
        textMatcher.clearHighlights();
        sendResponse({ success: true });
    } else if (request.action === 'hoverTerm') {
        textMatcher.applyHoverEffect(request.termIndex);
        sendResponse({ success: true });
    } else if (request.action === 'unhoverTerm') {
        textMatcher.removeHoverEffect();
        sendResponse({ success: true });
    }
    
    return true; // Keep the message channel open for async response
});

// Log that content script is loaded
console.log('Text Matching Extension: Content script loaded'); 
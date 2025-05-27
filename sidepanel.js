document.addEventListener('DOMContentLoaded', function() {
    const searchText = document.getElementById('searchText');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyAllBtn = document.getElementById('copyAllBtn');
    const reloadBtn = document.getElementById('reloadBtn');
    const results = document.getElementById('results');
    const searchPreview = document.getElementById('searchPreview');

    // Event listeners
    searchBtn.addEventListener('click', performSearch);
    clearBtn.addEventListener('click', clearSearch);
    copyAllBtn.addEventListener('click', copyAllText);
    reloadBtn.addEventListener('click', reloadExtension);
    
    // Allow Ctrl+Enter to trigger search (Enter alone creates new lines)
    searchText.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            performSearch();
        }
    });

    function splitTextBySpecialCharacters(text) {
        // Split by line breaks and specified special characters only
        // Keep whole sentences intact by not splitting on regular spaces
        const specialChars = /[!"#$%&()*+\-/:;<=>?@[\\\]^_`{|}~±÷×√∞≈≠≤≥∑∏∫∧∨¬⊂⊃∈∉∅$€£¥₩₹₽→←↑↓↔⇐⇒⇔↦\r\n]+/g;
        return text.split(specialChars)
                  .map(str => str.trim())
                  .filter(str => str.length > 0); // Remove empty strings
    }

    function updateSearchPreview(originalText, searchTerms) {
        if (!originalText.trim()) {
            searchPreview.innerHTML = '';
            return;
        }

        let highlightedText = originalText;
        
        if (searchTerms && searchTerms.length > 0) {
            // Create a mapping of all term positions to avoid overlapping highlights
            const termPositions = [];
            
            searchTerms.forEach((term, index) => {
                if (!term.trim()) return;
                
                const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                let match;
                
                while ((match = regex.exec(originalText)) !== null) {
                    termPositions.push({
                        start: match.index,
                        end: match.index + match[0].length,
                        term: match[0],
                        index: index,
                        className: `preview-highlight-${index % 10}`
                    });
                    
                    // Prevent infinite loop for zero-length matches
                    if (match.index === regex.lastIndex) {
                        regex.lastIndex++;
                    }
                }
            });
            
            // Sort by position and remove overlaps (keep first occurrence)
            termPositions.sort((a, b) => a.start - b.start);
            
            const validPositions = [];
            termPositions.forEach(pos => {
                const hasOverlap = validPositions.some(validPos => 
                    pos.start < validPos.end && pos.end > validPos.start
                );
                
                if (!hasOverlap) {
                    validPositions.push(pos);
                }
            });
            
            // Apply highlights in reverse order to maintain string positions
            validPositions.reverse().forEach(pos => {
                const before = highlightedText.substring(0, pos.start);
                const highlighted = `<span class="${pos.className}">${pos.term}</span>`;
                const after = highlightedText.substring(pos.end);
                highlightedText = before + highlighted + after;
            });
        }
        
        searchPreview.innerHTML = highlightedText;
    }

    async function sendHoverMessage(action, termIndex = null) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, {
                action: action,
                termIndex: termIndex
            });
        } catch (error) {
            console.error('Hover message error:', error);
        }
    }

    function addHoverListeners(splitStrings) {
        const listItems = results.querySelectorAll('li');
        listItems.forEach((item, index) => {
            item.addEventListener('mouseenter', () => {
                sendHoverMessage('hoverTerm', index);
            });
            
            item.addEventListener('mouseleave', () => {
                sendHoverMessage('unhoverTerm', index);
            });
            
            // Add event listeners for the buttons in this item
            const removeBtn = item.querySelector('.remove-btn');
            const copyBtn = item.querySelector('.copy-btn');
            
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeSearchTerm(index, splitStrings);
                });
            }
            
            if (copyBtn) {
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const term = splitStrings[index];
                    copySearchTerm(term, copyBtn);
                });
            }
        });
    }

    async function removeSearchTerm(termIndex, currentTerms) {
        // Remove the term at the specified index
        const updatedTerms = currentTerms.filter((_, index) => index !== termIndex);
        
        if (updatedTerms.length === 0) {
            // No terms left, clear everything
            clearSearch();
            return;
        }
        
        // Update the search text to reflect removed terms
        // Use space as separator since we split by all non-letter characters
        const updatedSearchText = updatedTerms.join(' ');
        searchText.value = updatedSearchText;
        
        // Save the updated search text
        chrome.storage.local.set({ lastSearch: updatedSearchText });
        
        try {
            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Send message to content script with updated terms
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'searchMultiple',
                queries: updatedTerms
            });

            if (response && response.totalCount !== undefined) {
                // Update search preview with updated terms
                updateSearchPreview(updatedSearchText, updatedTerms);
                
                // Display updated results
                let resultsHTML = `<div><strong>Search terms (${updatedTerms.length}):</strong></div>`;
                resultsHTML += '<ul>';
                updatedTerms.forEach((term, index) => {
                    const count = response.counts[index] || 0;
                    const colorClass = `color-indicator-${index % 10}`;
                    const isZeroMatch = count === 0;
                    const listItemClass = isZeroMatch ? 'search-term-item zero-matches' : 'search-term-item';
                    
                    resultsHTML += `<li class="${listItemClass}" data-term-index="${index}">
                        <div class="search-term-content">
                            <span class="color-indicator ${colorClass}"></span>
                            <span>${term} - ${count} matches</span>
                        </div>
                        <div class="result-buttons">
                            <button class="copy-btn" title="Copy '${term}' to clipboard">📋</button>
                            <button class="remove-btn" title="Remove '${term}' from search">×</button>
                        </div>
                    </li>`;
                });
                resultsHTML += '</ul>';
                resultsHTML += `<div><strong>Total matches: ${response.totalCount}</strong></div>`;
                
                results.innerHTML = resultsHTML;
                
                // Add hover listeners with updated terms
                addHoverListeners(updatedTerms);
            } else {
                results.textContent = 'Search completed. Check page for highlights.';
            }
        } catch (error) {
            console.error('Remove term error:', error);
            results.textContent = 'Error updating search. Make sure you\'re on a valid webpage.';
        }
    }

    async function performSearch() {
        const query = searchText.value.trim();
        
        if (!query) {
            results.textContent = 'Please enter text to search.';
            return;
        }

        // Split the input text by special characters
        const splitStrings = splitTextBySpecialCharacters(query);
        
        if (splitStrings.length === 0) {
            results.textContent = 'No valid search terms found.';
            return;
        }

        try {
            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Send message to content script with split strings
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'searchMultiple',
                queries: splitStrings
            });

            if (response && response.totalCount !== undefined) {
                // Update search preview with highlights
                updateSearchPreview(query, splitStrings);
                
                // Display split strings and total matches
                let resultsHTML = `<div><strong>Search terms (${splitStrings.length}):</strong></div>`;
                resultsHTML += '<ul>';
                splitStrings.forEach((term, index) => {
                    const count = response.counts[index] || 0;
                    const colorClass = `color-indicator-${index % 10}`;
                    const isZeroMatch = count === 0;
                    const listItemClass = isZeroMatch ? 'search-term-item zero-matches' : 'search-term-item';
                    
                    resultsHTML += `<li class="${listItemClass}" data-term-index="${index}">
                        <div class="search-term-content">
                            <span class="color-indicator ${colorClass}"></span>
                            <span>${term} - ${count} matches</span>
                        </div>
                        <div class="result-buttons">
                            <button class="copy-btn" title="Copy '${term}' to clipboard">📋</button>
                            <button class="remove-btn" title="Remove '${term}' from search">×</button>
                        </div>
                    </li>`;
                });
                resultsHTML += '</ul>';
                resultsHTML += `<div><strong>Total matches: ${response.totalCount}</strong></div>`;
                
                results.innerHTML = resultsHTML;
                
                // Add hover listeners after creating the HTML
                addHoverListeners(splitStrings);
            } else {
                results.textContent = 'Search completed. Check page for highlights.';
            }
        } catch (error) {
            console.error('Search error:', error);
            results.textContent = 'Error performing search. Make sure you\'re on a valid webpage.';
        }
    }

    async function clearSearch() {
        searchText.value = '';
        results.textContent = '';
        searchPreview.innerHTML = '';
        
        try {
            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Send clear message to content script
            await chrome.tabs.sendMessage(tab.id, {
                action: 'clear'
            });
        } catch (error) {
            console.error('Clear error:', error);
        }
    }

    async function reloadExtension() {
        try {
            results.textContent = 'Reloading extension...';
            
            // Use chrome.runtime.reload() which is the proper way to reload extensions
            chrome.runtime.reload();
            
        } catch (error) {
            console.error('Reload error:', error);
            results.textContent = 'Error reloading extension. Try reloading manually from chrome://extensions/';
        }
    }

    // Load saved search text
    chrome.storage.local.get(['lastSearch'], function(result) {
        if (result.lastSearch) {
            searchText.value = result.lastSearch;
        }
    });

    // Save search text when input changes (for sidebar persistence)
    searchText.addEventListener('input', function() {
        if (searchText.value.trim()) {
            chrome.storage.local.set({ lastSearch: searchText.value });
        }
    });

    // Listen for tab changes to update UI accordingly
    if (chrome.tabs && chrome.tabs.onActivated) {
        chrome.tabs.onActivated.addListener(function(activeInfo) {
            // Clear results when switching tabs
            results.textContent = '';
        });
    }

    // Copy all text to clipboard
    async function copyAllText() {
        const text = searchText.value.trim();
        if (!text) {
            showTemporaryMessage(copyAllBtn, 'No text to copy');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            showTemporaryMessage(copyAllBtn, 'Copied!');
        } catch (error) {
            console.error('Copy failed:', error);
            showTemporaryMessage(copyAllBtn, 'Copy failed');
        }
    }

    // Copy individual search term to clipboard
    async function copySearchTerm(term, button) {
        try {
            await navigator.clipboard.writeText(term);
            button.classList.add('copied');
            const originalText = button.textContent;
            button.textContent = '✓';
            
            setTimeout(() => {
                button.classList.remove('copied');
                button.textContent = originalText;
            }, 1000);
        } catch (error) {
            console.error('Copy failed:', error);
            showTemporaryMessage(button, '❌');
        }
    }

    // Show temporary message on button
    function showTemporaryMessage(button, message) {
        const originalText = button.textContent;
        const originalClass = button.className;
        
        button.textContent = message;
        button.className = originalClass + ' copied';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.className = originalClass;
        }, 1500);
    }
}); 
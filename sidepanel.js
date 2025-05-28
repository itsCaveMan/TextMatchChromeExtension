document.addEventListener('DOMContentLoaded', function() {
    const searchText = document.getElementById('searchText');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyAllBtn = document.getElementById('copyAllBtn');
    const reloadBtn = document.getElementById('reloadBtn');
    const results = document.getElementById('results');
    const searchPreview = document.getElementById('searchPreview');
    const splitCharTags = document.getElementById('splitCharTags');
    const newCharInput = document.getElementById('newCharInput');
    const addCharBtn = document.getElementById('addCharBtn');

    // Default split characters with their display names
    const defaultSplitChars = [
        { char: '\n', display: '↵', name: 'New Line', active: true },
        { char: '\r', display: '↵', name: 'Carriage Return', active: true },
        { char: ' ', display: '␣', name: 'Space', active: false },
        { char: '\t', display: '⇥', name: 'Tab', active: false },
        { char: '!', display: '!', name: 'Exclamation', active: true },
        { char: '"', display: '"', name: 'Quote', active: true },
        { char: '#', display: '#', name: 'Hash', active: true },
        { char: '$', display: '$', name: 'Dollar', active: true },
        { char: '%', display: '%', name: 'Percent', active: true },
        { char: '&', display: '&', name: 'Ampersand', active: true },
        { char: '(', display: '(', name: 'Left Paren', active: true },
        { char: ')', display: ')', name: 'Right Paren', active: true },
        { char: '*', display: '*', name: 'Asterisk', active: true },
        { char: '+', display: '+', name: 'Plus', active: true },
        { char: ',', display: ',', name: 'Comma', active: false },
        { char: '-', display: '-', name: 'Dash', active: true },
        { char: '.', display: '.', name: 'Period', active: false },
        { char: '/', display: '/', name: 'Slash', active: true },
        { char: ':', display: ':', name: 'Colon', active: true },
        { char: ';', display: ';', name: 'Semicolon', active: true },
        { char: '<', display: '<', name: 'Less Than', active: true },
        { char: '=', display: '=', name: 'Equals', active: true },
        { char: '>', display: '>', name: 'Greater Than', active: true },
        { char: '?', display: '?', name: 'Question', active: true },
        { char: '@', display: '@', name: 'At Sign', active: true },
        { char: '[', display: '[', name: 'Left Bracket', active: true },
        { char: '\\', display: '\\', name: 'Backslash', active: true },
        { char: ']', display: ']', name: 'Right Bracket', active: true },
        { char: '^', display: '^', name: 'Caret', active: true },
        { char: '_', display: '_', name: 'Underscore', active: true },
        { char: '`', display: '`', name: 'Backtick', active: true },
        { char: '{', display: '{', name: 'Left Brace', active: true },
        { char: '|', display: '|', name: 'Pipe', active: true },
        { char: '}', display: '}', name: 'Right Brace', active: true },
        { char: '~', display: '~', name: 'Tilde', active: true }
    ];

    let splitCharacters = [];

    // Normalize whitespace for better matching (same as content script)
    function normalizeWhitespace(text) {
        return text
            .replace(/\s+/g, ' ')  // Replace multiple whitespace chars with single space
            .trim();               // Remove leading/trailing whitespace
    }

    // Find matches in text with whitespace normalization (same as content script)
    function findNormalizedMatches(searchText, targetText, originalText) {
        const normalizedSearch = normalizeWhitespace(searchText);
        const normalizedTarget = normalizeWhitespace(targetText);
        
        if (!normalizedSearch || !normalizedTarget) {
            return [];
        }

        const matches = [];
        const regex = new RegExp(normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        let match;

        while ((match = regex.exec(normalizedTarget)) !== null) {
            // Now we need to map the normalized position back to the original text position
            const originalMatch = mapNormalizedToOriginal(
                match.index, 
                match.index + match[0].length, 
                originalText, 
                normalizedTarget
            );
            
            if (originalMatch) {
                matches.push({
                    start: originalMatch.start,
                    end: originalMatch.end,
                    text: originalText.slice(originalMatch.start, originalMatch.end)
                });
            }
            
            // Prevent infinite loop for zero-length matches
            if (match.index === regex.lastIndex) {
                regex.lastIndex++;
            }
        }

        return matches;
    }

    // Map positions from normalized text back to original text (same as content script)
    function mapNormalizedToOriginal(normalizedStart, normalizedEnd, originalText, normalizedText) {
        let originalPos = 0;
        let normalizedPos = 0;
        let matchStart = -1;
        let matchEnd = -1;

        while (originalPos < originalText.length && normalizedPos < normalizedText.length) {
            const originalChar = originalText[originalPos];
            const normalizedChar = normalizedText[normalizedPos];

            // Mark the start position when we reach the normalized start
            if (normalizedPos === normalizedStart && matchStart === -1) {
                matchStart = originalPos;
            }

            // If we're in whitespace in the original text
            if (/\s/.test(originalChar)) {
                // Skip consecutive whitespace in original
                while (originalPos < originalText.length && /\s/.test(originalText[originalPos])) {
                    originalPos++;
                }
                // Move one position in normalized (which has single spaces)
                if (normalizedPos < normalizedText.length && normalizedChar === ' ') {
                    normalizedPos++;
                }
            } else {
                // Regular character matching
                if (originalChar.toLowerCase() === normalizedChar.toLowerCase()) {
                    originalPos++;
                    normalizedPos++;
                } else {
                    // Mismatch - this shouldn't happen with proper normalization
                    return null;
                }
            }

            // Mark the end position when we reach the normalized end
            if (normalizedPos === normalizedEnd && matchEnd === -1) {
                matchEnd = originalPos;
                break;
            }
        }

        // Handle case where match ends at the very end
        if (normalizedPos === normalizedEnd && matchEnd === -1) {
            matchEnd = originalPos;
        }

        if (matchStart !== -1 && matchEnd !== -1 && matchStart < matchEnd) {
            return { start: matchStart, end: matchEnd };
        }

        return null;
    }

    // Event listeners
    searchBtn.addEventListener('click', performSearch);
    clearBtn.addEventListener('click', clearSearch);
    copyAllBtn.addEventListener('click', copyAllText);
    reloadBtn.addEventListener('click', reloadExtension);
    addCharBtn.addEventListener('click', addNewSplitChar);
    
    // Allow Ctrl+Enter to trigger search (Enter alone creates new lines)
    searchText.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            performSearch();
        }
    });

    // Allow Enter to add new split character
    newCharInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addNewSplitChar();
        }
    });

    // Update add button state based on input
    newCharInput.addEventListener('input', function() {
        const value = newCharInput.value.trim();
        addCharBtn.disabled = !value || splitCharacters.some(sc => sc.char === value);
    });

    function initializeSplitCharacters() {
        // Load saved split characters or use defaults
        chrome.storage.local.get(['splitCharacters'], function(result) {
            if (result.splitCharacters && Array.isArray(result.splitCharacters)) {
                splitCharacters = result.splitCharacters;
            } else {
                splitCharacters = [...defaultSplitChars];
                saveSplitCharacters();
            }
            renderSplitCharTags();
        });
    }

    function saveSplitCharacters() {
        chrome.storage.local.set({ splitCharacters: splitCharacters });
    }

    function renderSplitCharTags() {
        splitCharTags.innerHTML = '';
        
        splitCharacters.forEach((splitChar, index) => {
            const tag = document.createElement('div');
            tag.className = `split-char-tag ${splitChar.active ? 'active' : ''}`;
            tag.title = `${splitChar.name} - Click to toggle`;
            
            const charDisplay = document.createElement('span');
            charDisplay.className = 'char-display';
            
            // Handle special invisible characters
            if (splitChar.char === '\n' || splitChar.char === '\r') {
                charDisplay.innerHTML = `<span class="invisible-char">${splitChar.display}</span>`;
            } else if (splitChar.char === ' ') {
                charDisplay.innerHTML = `<span class="invisible-char">${splitChar.display}</span>`;
            } else if (splitChar.char === '\t') {
                charDisplay.innerHTML = `<span class="invisible-char">${splitChar.display}</span>`;
            } else {
                charDisplay.textContent = splitChar.display;
            }
            
            const removeBtn = document.createElement('span');
            removeBtn.className = 'remove-char';
            removeBtn.textContent = '×';
            removeBtn.title = `Remove ${splitChar.name}`;
            
            tag.appendChild(charDisplay);
            
            // Only show remove button for custom characters (not defaults)
            const isCustomChar = !defaultSplitChars.some(dc => dc.char === splitChar.char);
            if (isCustomChar) {
                tag.appendChild(removeBtn);
            }
            
            // Toggle active state
            tag.addEventListener('click', function(e) {
                if (e.target === removeBtn) return; // Don't toggle when removing
                splitCharacters[index].active = !splitCharacters[index].active;
                saveSplitCharacters();
                renderSplitCharTags();
            });
            
            // Remove character
            if (isCustomChar) {
                removeBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    splitCharacters.splice(index, 1);
                    saveSplitCharacters();
                    renderSplitCharTags();
                });
            }
            
            splitCharTags.appendChild(tag);
        });
    }

    function addNewSplitChar() {
        const newChar = newCharInput.value.trim();
        if (!newChar) return;
        
        // Check if character already exists
        if (splitCharacters.some(sc => sc.char === newChar)) {
            newCharInput.value = '';
            return;
        }
        
        // Add new character
        const newSplitChar = {
            char: newChar,
            display: newChar,
            name: `Custom: ${newChar}`,
            active: true
        };
        
        splitCharacters.push(newSplitChar);
        saveSplitCharacters();
        renderSplitCharTags();
        newCharInput.value = '';
        addCharBtn.disabled = true;
    }

    function getActiveSplitCharacters() {
        return splitCharacters
            .filter(sc => sc.active)
            .map(sc => sc.char);
    }

    function splitTextBySpecialCharacters(text) {
        const activeChars = getActiveSplitCharacters();
        
        if (activeChars.length === 0) {
            // If no split characters are active, return the whole text as one term
            return [text.trim()].filter(str => str.length > 0);
        }
        
        // Create regex pattern from active characters
        const escapedChars = activeChars.map(char => {
            // Escape special regex characters
            return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        });
        
        const specialChars = new RegExp(`[${escapedChars.join('')}]+`, 'g');
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
                
                // Use normalized matching instead of exact regex matching
                const matches = findNormalizedMatches(term, originalText, originalText);
                
                matches.forEach(match => {
                    termPositions.push({
                        start: match.start,
                        end: match.end,
                        term: match.text,
                        index: index,
                        className: `preview-highlight-${index % 10}`
                    });
                });
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
            // No terms left, clear highlights but keep search text
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                await chrome.tabs.sendMessage(tab.id, { action: 'clear' });
                results.textContent = '';
                updateSearchPreview(searchText.value, []);
            } catch (error) {
                console.error('Clear highlights error:', error);
            }
            return;
        }
        
        try {
            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Send message to content script with updated terms
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'searchMultiple',
                queries: updatedTerms
            });

            if (response && response.totalCount !== undefined) {
                // Update search preview with updated terms (keep original search text)
                updateSearchPreview(searchText.value, updatedTerms);
                
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
                resultsHTML += `<div class="total-matches"><strong>Total matches: ${response.totalCount}</strong></div>`;
                
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
                resultsHTML += `<div class="total-matches"><strong>Total matches: ${response.totalCount}</strong></div>`;
                
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

    // Initialize split characters on load
    initializeSplitCharacters();
}); 
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
        // Remove 'i' flag to make it case sensitive
        const regex = new RegExp(normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
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
                // Regular character matching - make case sensitive
                if (originalChar === normalizedChar) {
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

    // Fuzzy matching using Levenshtein distance
    function levenshteinDistance(str1, str2) {
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
    function calculateSimilarity(str1, str2) {
        const distance = levenshteinDistance(str1, str2);
        const maxLength = Math.max(str1.length, str2.length);
        return maxLength === 0 ? 1 : 1 - (distance / maxLength);
    }

    // Find the best fuzzy match in a text
    function findBestFuzzyMatch(searchText, targetText, minSimilarity = 0.7) {
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
                const similarity = calculateSimilarity(normalizedSearch, substring);
                
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

    // Get text differences between two strings
    function getTextDifferences(original, matched) {
        const originalWords = original.trim().split(/\s+/);
        const matchedWords = matched.trim().split(/\s+/);
        
        const differences = {
            missing: [],
            extra: [],
            modified: []
        };

        // Simple word-based comparison - make case sensitive
        const maxLen = Math.max(originalWords.length, matchedWords.length);
        for (let i = 0; i < maxLen; i++) {
            if (i >= originalWords.length) {
                differences.extra.push(matchedWords[i]);
            } else if (i >= matchedWords.length) {
                differences.missing.push(originalWords[i]);
            } else if (originalWords[i] !== matchedWords[i]) {
                differences.modified.push({
                    original: originalWords[i],
                    matched: matchedWords[i]
                });
            }
        }

        return differences;
    }

    // Create visual diff highlighting character differences
    function createVisualDiff(original, matched) {
        // Make case sensitive - remove toLowerCase()
        const originalChars = original;
        const matchedChars = matched;
        
        // Use dynamic programming to find the longest common subsequence
        const m = original.length;
        const n = matched.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
        
        // Fill the dp table
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                // Make case sensitive comparison
                if (original[i - 1] === matched[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }
        
        // Backtrack to find the diff
        let i = m, j = n;
        const originalDiff = [];
        const matchedDiff = [];
        
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && original[i - 1] === matched[j - 1]) {
                // Characters match
                originalDiff.unshift({ char: original[i - 1], type: 'match' });
                matchedDiff.unshift({ char: matched[j - 1], type: 'match' });
                i--;
                j--;
            } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                // Character only in matched (extra)
                matchedDiff.unshift({ char: matched[j - 1], type: 'extra' });
                j--;
            } else {
                // Character only in original (missing)
                originalDiff.unshift({ char: original[i - 1], type: 'missing' });
                i--;
            }
        }
        
        // Create HTML for visual diff
        let originalHtml = '';
        let matchedHtml = '';
        
        originalDiff.forEach(item => {
            if (item.type === 'match') {
                originalHtml += `<span class="diff-char-match">${escapeHtml(item.char)}</span>`;
            } else if (item.type === 'missing') {
                originalHtml += `<span class="diff-char-missing">${escapeHtml(item.char)}</span>`;
            }
        });
        
        matchedDiff.forEach(item => {
            if (item.type === 'match') {
                matchedHtml += `<span class="diff-char-match">${escapeHtml(item.char)}</span>`;
            } else if (item.type === 'extra') {
                matchedHtml += `<span class="diff-char-extra">${escapeHtml(item.char)}</span>`;
            }
        });
        
        return {
            originalHtml: originalHtml,
            matchedHtml: matchedHtml
        };
    }

    // Escape HTML special characters
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Format differences for display
    function formatDifferences(differences) {
        let html = '<div class="differences">';
        
        if (differences.missing.length > 0) {
            html += `<div class="diff-missing"><strong>Missing:</strong> ${differences.missing.join(', ')}</div>`;
        }
        
        if (differences.extra.length > 0) {
            html += `<div class="diff-extra"><strong>Extra:</strong> ${differences.extra.join(', ')}</div>`;
        }
        
        if (differences.modified.length > 0) {
            html += '<div class="diff-modified"><strong>Modified:</strong> ';
            html += differences.modified.map(mod => `${mod.original} → ${mod.matched}`).join(', ');
            html += '</div>';
        }
        
        if (differences.missing.length === 0 && differences.extra.length === 0 && differences.modified.length === 0) {
            html += '<div class="diff-perfect">Perfect match!</div>';
        }
        
        html += '</div>';
        return html;
    }

    async function sendHoverMessage(action, groupIndex = null) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, {
                action: action,
                groupIndex: groupIndex
            });
        } catch (error) {
            console.error('Hover message error:', error);
        }
    }

    function addHoverListeners(groups) {
        const groupElements = results.querySelectorAll('.group-item');
        groupElements.forEach((item, index) => {
            item.addEventListener('mouseenter', () => {
                sendHoverMessage('hoverGroup', index);
            });
            
            item.addEventListener('mouseleave', () => {
                sendHoverMessage('unhoverGroup', index);
            });
            
            // Add event listeners for the buttons in this item
            const removeBtn = item.querySelector('.remove-btn');
            const copyBtn = item.querySelector('.copy-btn');
            
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeGroup(index, groups);
                });
            }
            
            if (copyBtn) {
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const group = groups[index];
                    copyGroupText(group, copyBtn);
                });
            }
        });
    }

    async function removeGroup(groupIndex, currentGroups) {
        // Remove the group at the specified index
        const updatedGroups = currentGroups.filter((_, index) => index !== groupIndex);
        
        if (updatedGroups.length === 0) {
            // No groups left, clear highlights
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                await chrome.tabs.sendMessage(tab.id, { action: 'clear' });
                results.textContent = '';
            } catch (error) {
                console.error('Clear highlights error:', error);
            }
            return;
        }
        
        // Show loading state
        showLoading();
        
        try {
            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Send message to content script with updated groups
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'searchGroups',
                groups: updatedGroups
            });

            if (response && response.results) {
                displayResults(updatedGroups, response.results);
            }
        } catch (error) {
            console.error('Remove group error:', error);
            results.textContent = 'Error updating search. Make sure you\'re on a valid webpage.';
        }
    }

    function displayResults(groups, searchResults) {
        let resultsHTML = `<div class="groups-header"><strong>Groups (${groups.length}):</strong></div>`;
        resultsHTML += '<div class="groups-container">';
        
        groups.forEach((group, index) => {
            const result = searchResults[index];
            const hasMatch = result && result.match;
            const colorClass = `color-indicator-${index % 10}`;
            const itemClass = hasMatch ? 'group-item has-match' : 'group-item no-match';
            
            resultsHTML += `<div class="${itemClass}" data-group-index="${index}">
                <div class="group-header">
                    <span class="color-indicator ${colorClass}"></span>
                    <span class="group-number">Group ${index + 1}</span>
                    <div class="group-buttons">
                        <button class="copy-btn" title="Copy group text">📋</button>
                        <button class="remove-btn" title="Remove group">×</button>
                    </div>
                </div>
                <div class="group-content">
                    <div class="original-text"><strong>Original:</strong> ${escapeHtml(group)}</div>`;
            
            if (hasMatch) {
                resultsHTML += `<div class="matched-text"><strong>Matched:</strong> ${escapeHtml(result.match.text)}</div>
                    <div class="similarity">Similarity: ${(result.match.similarity * 100).toFixed(1)}%</div>`;
                
                // Add visual diff
                const visualDiff = createVisualDiff(group, result.match.text);
                resultsHTML += `
                    <div class="visual-diff">
                        <div class="visual-diff-label">Visual Comparison:</div>
                        <div style="margin-bottom: 8px;">
                            <strong>Expected:</strong> ${visualDiff.originalHtml}
                        </div>
                        <div>
                            <strong>Found:</strong> ${visualDiff.matchedHtml}
                        </div>
                    </div>`;
                
                const differences = getTextDifferences(group, result.match.text);
                resultsHTML += formatDifferences(differences);
            } else {
                resultsHTML += '<div class="no-match-message">No match found on page</div>';
            }
            
            resultsHTML += '</div></div>';
        });
        
        resultsHTML += '</div>';
        
        const matchedCount = searchResults.filter(r => r && r.match).length;
        resultsHTML += `<div class="summary"><strong>Matched: ${matchedCount} of ${groups.length} groups</strong></div>`;
        
        results.innerHTML = resultsHTML;
        
        // Add hover listeners
        addHoverListeners(groups);
    }

    function showLoading() {
        results.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <div class="loading-text">Searching for matches...</div>
            </div>
        `;
    }

    async function performSearch() {
        const query = searchText.value.trim();
        
        if (!query) {
            results.textContent = 'Please enter text to search.';
            return;
        }

        // Split by new lines to create groups
        const groups = query.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        if (groups.length === 0) {
            results.textContent = 'No valid groups found.';
            return;
        }

        // Show loading state
        showLoading();

        try {
            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Send message to content script with groups
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'searchGroups',
                groups: groups
            });

            if (response && response.results) {
                displayResults(groups, response.results);
            } else {
                results.textContent = 'Search completed. Check page for highlights.';
            }
        } catch (error) {
            console.error('Search error:', error);
            results.textContent = 'Error performing search. Make sure you\'re on a valid webpage.';
        }
    }

    async function clearSearch() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, { action: 'clear' });
            results.textContent = '';
            searchText.value = '';
        } catch (error) {
            console.error('Clear error:', error);
        }
    }

    async function reloadExtension() {
        // Store current search text
        const currentSearchText = searchText.value;
        if (currentSearchText) {
            chrome.storage.local.set({ lastSearchText: currentSearchText });
        }
        
        // Reload the extension
        chrome.runtime.reload();
    }

    async function copyAllText() {
        const text = searchText.value;
        if (!text) {
            showTemporaryMessage(copyAllBtn, 'Nothing to copy!');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(text);
            showTemporaryMessage(copyAllBtn, 'Copied all!');
        } catch (err) {
            console.error('Failed to copy:', err);
            showTemporaryMessage(copyAllBtn, 'Copy failed!');
        }
    }

    async function copyGroupText(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            showTemporaryMessage(button, '✓');
        } catch (err) {
            console.error('Failed to copy:', err);
            showTemporaryMessage(button, '✗');
        }
    }

    function showTemporaryMessage(button, message) {
        const originalText = button.textContent;
        button.textContent = message;
        button.disabled = true;
        
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 1500);
    }

    // Restore last search text if available
    chrome.storage.local.get(['lastSearchText'], function(result) {
        if (result.lastSearchText) {
            searchText.value = result.lastSearchText;
            chrome.storage.local.remove('lastSearchText');
        }
    });

    // Listen for tab changes to update UI accordingly
    if (chrome.tabs && chrome.tabs.onActivated) {
        chrome.tabs.onActivated.addListener(function(activeInfo) {
            // Clear results when switching tabs
            results.textContent = '';
        });
    }
}); 
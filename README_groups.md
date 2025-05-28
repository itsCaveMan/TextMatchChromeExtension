# Text Matching Chrome Extension - Groups Feature

## Overview
This Chrome extension has been updated to support a **groups-based text matching system** with **fuzzy matching capabilities**. This is designed specifically for quality assurance workflows where you need to verify that content from Google Sheets cells appears correctly on webpages.

## Key Changes

### 1. Groups Instead of Split Text
- **Before**: The extension would split your input text by special characters and match each piece individually
- **Now**: Each line in your input creates a separate "group" that represents one cell from your Google Sheets

### 2. Fuzzy Matching
- **Before**: The extension only found exact text matches
- **Now**: The extension uses fuzzy matching (Levenshtein distance algorithm) to find text that is similar but not exactly the same

### 3. Difference Display
- **Before**: Just showed match counts
- **Now**: Shows detailed differences between what you searched for and what was found on the page

### 4. Visual Comparison (NEW!)
- **Character-level highlighting**: See exactly which characters match, are missing, or are extra
- **Color-coded display**: 
  - 🟢 Green background: Matching characters
  - 🔴 Red background with strikethrough: Missing characters
  - 🟢 Bright green background: Extra characters

### 5. Loading Feedback (NEW!)
- **Loading spinner**: Shows while searching for matches
- **Responsive UI**: Clear visual feedback during search operations

## How to Use

1. **Open the Extension**: Click the extension icon and open the side panel

2. **Enter Your Groups**: 
   - Enter your text in the search box
   - Each line represents one group (one cell from Google Sheets)
   - Press `Ctrl+Enter` to search

   Example:
   ```
   Customer Name: John Doe
   Email: john.doe@example.com
   Order Date: January 15, 2024
   Total Amount: $299.99
   ```

3. **View Results**: For each group, you'll see:
   - **Original**: The text you searched for
   - **Matched**: The closest match found on the page (if any)
   - **Similarity**: How similar the match is (70-100%)
   - **Visual Comparison**: Character-by-character diff showing exactly what's different
   - **Differences**: Summary of missing, extra, or modified words

4. **Visual Highlights**: 
   - Each group gets a different color highlight on the webpage
   - Hover over a group in the results to highlight it on the page
   - Groups with no matches are shown in red

5. **Manage Groups**:
   - **Copy**: Click 📋 to copy a group's text
   - **Remove**: Click × to remove a group from the search
   - **Copy All**: Copy all search text at once

## Visual Comparison Examples

The visual comparison shows character-level differences:

**Example 1: Typo**
- Expected: `John Doe` 
- Found: `Jon Doe`
- Visual shows: `Jo[missing: h]n Doe`

**Example 2: Extra Text**
- Expected: `Email: john@example.com`
- Found: `Email: john.doe@example.com`
- Visual shows: `Email: john[extra: .doe]@example.com`

**Example 3: Different Format**
- Expected: `January 15, 2024`
- Found: `Jan 15, 2024`
- Visual shows: `Jan[missing: uary] 15, 2024`

## Fuzzy Matching Examples

The extension will find these as matches:
- `John Doe` → `Jon Doe` (typo)
- `john.doe@example.com` → `john.doe@exmple.com` (typo)
- `+1 (555) 123-4567` → `+1 555 123 4567` (different format)
- `January 15, 2024` → `Jan 15, 2024` (abbreviated)

## Technical Details

- **Minimum Similarity**: 70% (configurable in code)
- **Window Size**: The fuzzy matcher looks for text that's 50-150% the length of your search text
- **Algorithm**: Levenshtein distance for character-level similarity
- **Visual Diff**: Longest Common Subsequence (LCS) algorithm for character-level comparison

## Use Cases

Perfect for:
- QA testing where Google Sheets data should appear on webpages
- Verifying form submissions match expected values
- Checking that product information is displayed correctly
- Finding text that might have minor typos or formatting differences
- Quickly identifying exactly which characters don't match

## Tips

1. **One Item Per Line**: Keep each searchable item on its own line
2. **Be Specific**: More specific text gives better fuzzy matching results
3. **Check Visual Diff**: The character-level highlighting makes it easy to spot small differences
4. **Use Loading Time**: For pages with lots of content, the search may take a moment - the spinner shows it's working
5. **Adjust as Needed**: Remove groups that aren't relevant to focus on what matters 
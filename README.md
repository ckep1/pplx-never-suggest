# Perplexity Never Suggest

A Tampermonkey userscript that hides the search suggestion dropdown and controls widget visibility on Perplexity.ai.

## Why This Script?

Perplexity allows you to disable suggestions and widgets in their settings, but (annoyingly) these settings are only stored locally and often get turned back on and had to be set per browser. This script was created to provide a persistent solution for users who got tired of repeatedly disabling these features.

## Features

- **Hide Search Suggestions**: Removes the dropdown suggestions that appear when typing in the search box with CSS changes to help smooth things over
- **Widget Control**: Option to hide homepage widgets (trending topics, categories, etc.) or keep them visible with caching
- **Menu Preservation**: Keeps important user menus (account, settings, preferences) visible
- **Error Message Cleanup**: Removes "Something went wrong" widget error messages

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Click on `pplx-never-suggest.user.js` in the releases tab and install (or open the downloaded file in the browser) or install via GreasyFork.

## Usage

After installation, the script runs automatically on perplexity.ai. Access settings through the Tampermonkey menu:

1. Click the Tampermonkey extension icon
2. Select "Perplexity Never Suggest" from the menu
3. Toggle options:
   - **Hide Suggestions**: Controls search suggestion dropdown visibility
   - **Hide Widgets**: Controls homepage widget visibility

## Important Notes

### Perplexity's Session-Based Settings
Perplexity's native settings for disabling suggestions and widgets only persist for the current browser session. This script provides a permanent alternative that doesn't reset when you close your browser.

### Widget Caching
When widgets are set to show, the script implements caching to prevent visual issues:
- Widgets are cached when they first load to preserve their content
- This prevents widgets from disappearing when the suggestion box would normally appear
- The caching system helps maintain a more consistent visual experience
- Note: This implementation isn't perfect but works better than no caching

### Browser Compatibility
- Works with Chrome, Firefox, Safari, and other browsers that support Tampermonkey
- Tested on the latest versions of major browsers

## Default Behavior

By default, the script:
- Hides search suggestions
- Hides homepage widgets
- Preserves user account menus and settings
- Applies smart search box rounding

## Troubleshooting

If the script stops working:
1. Check that Tampermonkey is enabled
2. Verify the script is active in the Tampermonkey dashboard
3. Try refreshing the Perplexity page
4. Check browser console for any error messages

## License

MIT License - Feel free to modify and distribute.
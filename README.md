# Perplexity Never Suggest

A Tampermonkey userscript that hides the search suggestion dropdown and controls widget visibility on Perplexity.ai.

## Why This Script?

Perplexity allows you to disable suggestions and widgets in their settings, but (annoyingly) these settings are only stored locally and often get turned back on and had to be set per browser. This script was created to provide a persistent solution for users who got tired of repeatedly disabling these features. May require a refresh after any changes and on the very first load to set the cookies.

## Features

- **Hide Search Suggestions**: Persistently disables the dropdown suggestions using Perplexity's own cookie system
- **Widget Control**: Option to hide homepage widgets (trending topics, categories, etc.) using cookies
- **Discover Interest Box**: Dismisses the discover interest box permanently

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
   - **Hide Discover Interest Box**: Controls the discover interest box

## Important Notes

### Cookie-Based Approach
This script uses Perplexity's own cookie system to control these features:
- `pplx.is-autosuggest-disabled` - Controls search suggestions
- `pplx.homepage-widgets-disabled` - Controls homepage widgets
- `pplx.is-discover-interest-box-dismissed` - Controls the discover interest box

This approach is much more reliable than DOM manipulation and works with Perplexity's native systems.

### Browser Compatibility
- Works with Chrome, Firefox, Safari, and other browsers that support Tampermonkey
- Tested on the latest versions of major browsers

## Default Behavior

By default, the script:
- Hides search suggestions
- Hides homepage widgets
- Dismisses the discover interest box
- Uses Perplexity's native cookie system for persistence

## Troubleshooting

If the script stops working:
1. Check that Tampermonkey is enabled
2. Verify the script is active in the Tampermonkey dashboard
3. Try refreshing the Perplexity page
4. Check browser console for any error messages

## License

MIT License - Feel free to modify and distribute.
// ==UserScript==
// @name         pplx Never Suggest - Hide Perplexity Suggestions & Widgets
// @namespace    https://github.com/ckep1/pplx-never-suggest
// @version      1.0.0
// @description  Hide suggestion dropdown on Perplexity while preserving user menus, smart search box rounding, and simplified widget control (hide by default, show & cache when toggled off).
// @author       Chris Kephart
// @match        https://www.perplexity.ai/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // Default settings - simplified widget control
    const defaultSettings = {
        hideWidgets: true,  // Default to hiding widgets
        hideSuggestions: true
    };

    // Get settings with defaults
    function getSetting(key) {
        return GM_getValue(key, defaultSettings[key]);
    }

    // Save setting
    function setSetting(key, value) {
        GM_setValue(key, value);
        location.reload(); // Reload to apply changes
    }

    // Register menu commands - simplified
    GM_registerMenuCommand(`${getSetting('hideSuggestions') ? '✅' : '❌'} Hide Suggestions`, () => {
        setSetting('hideSuggestions', !getSetting('hideSuggestions'));
    });

    GM_registerMenuCommand(`${getSetting('hideWidgets') ? '✅' : '❌'} Hide Widgets (turn off to show & cache)`, () => {
        setSetting('hideWidgets', !getSetting('hideWidgets'));
    });

    // Get current settings - simplified
    const HIDE_WIDGETS = getSetting('hideWidgets');
    const HIDE_SUGGESTIONS = getSetting('hideSuggestions');
    const SHOW_WIDGETS = !HIDE_WIDGETS; // When not hiding, show and cache widgets

    console.log('Perplexity Script Settings:', { HIDE_WIDGETS, HIDE_SUGGESTIONS, SHOW_WIDGETS });

    // Widget content cache and throttling
    let cachedWidgetContent = null;
    let widgetContainer = null;
    let hasRestoredContent = false;
    let lastDuplicateCheck = 0;
    const DUPLICATE_CHECK_THROTTLE = 1000; // Only check for duplicates once per second

    // Create styles
    const style = document.createElement('style');
    let cssRules = '';

    // Hide suggestions CSS - Updated selectors for new structure
    if (HIDE_SUGGESTIONS) {
        cssRules += `
        /* Hide the suggestions dropdown - Updated selectors */
        div[data-placement="bottom"] {
            display: none !important;
        }

        /* Alternative selector for the suggestion container */
        .flex.min-h-0.min-w-0[data-placement="bottom"] {
            display: none !important;
        }

        /* Hide the outer container with fixed positioning that contains suggestions */
        div[style*="position: fixed"][style*="transform: translate"] div[data-placement="bottom"] {
            display: none !important;
        }

        /* More specific targeting for the suggestion dropdown */
        div.flex[data-placement="bottom"]:has(div[class*="rounded-b-"]) {
            display: none !important;
        }

        /* Hide suggestion items container */
        div[class*="border-t-borderMainDark/10"][class*="mt-[-5px]"][class*="rounded-b-"]:has(div[data-focused]) {
            display: none !important;
        }

        /* Hide individual suggestion items */
        div[data-focused][class*="group"][class*="cursor-pointer"] {
            display: none !important;
        }

        /* Fallback - hide any container that has suggestion-like items */
        div:has(> div[data-focused="none"][class*="cursor-pointer"]) {
            display: none !important;
        }

        /* Hide containers with the specific background colors used by suggestions */
        div[class*="bg-background-50"][class*="dark:bg-offsetDark"]:has(div[data-focused]) {
            display: none !important;
        }

        /* EXEMPTIONS - Keep user menu and other important menus visible */
        /* User menu/sidebar (has user account, preferences, etc.) */
        div[data-placement="top-start"]:has([data-testid*="sidebar"]),
        div[data-placement="top-start"]:has([class*="user"]),
        div[data-placement="top-start"]:has(button:has(img[alt*="avatar"])),
        div:has([data-testid="sidebar-my-account"]),
        div:has([data-testid="sidebar-preferences"]),
        div:has([data-testid="sidebar-settings"]) {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }

        /* Any dropdown that contains account/profile elements */
        div[data-placement]:has([data-testid*="sidebar"]),
        div[data-placement]:has(img[alt*="avatar"]),
        div[data-placement]:has(img[alt*="User avatar"]) {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }

        /* Legacy selectors (keep for compatibility) */
        .dark\\:bg-offsetDark.bg-background.border.dark\\:border-textMain\\/15.border-borderMainDark\\/30.dark\\:shadow-black\\/10.dark\\:shadow-lg.shadow-md.rounded-b-\\[20px\\].mt-\\[-5px\\].shadow-textMain\\/5.dark\\:border-t-textMainDark\\/10.border-t-borderMainDark\\/10 {
            display: none !important;
        }

        /* Hide any other suggestion-related elements */
        [class*="suggestion"],
        [class*="dropdown"][class*="search"],
        [class*="autocomplete"] {
            display: none !important;
        }
        `;
    }

    // Widget control CSS - simplified logic
    if (HIDE_WIDGETS) {
        cssRules += `
        /* Hide homepage widgets completely - Generic selectors for dynamic content */
        .animate-in.fade-in.duration-300,
        .gap-sm.grid.grid-cols-6[style*="grid-template-rows"],
        .gap-sm.mb-md.flex.h-\\[32px\\].flex-row.flex-wrap.justify-center.overflow-hidden,
        a[href*="source=homepage_widget"],
        [class*="grid-cols-6"][style*="grid-template-rows"],
        div:has(> .relative.col-span-2.row-span-1) {
            display: none !important;
        }

        /* Hide individual category buttons - using structural selectors instead of text content */
        .relative.col-span-2.row-span-1,
        .gap-sm.mb-md.flex button[type="button"][class*="bg-offsetPlus"],
        button[class*="bg-offsetPlus"][class*="text-textMain"]:has(div[class*="truncate"]) {
            display: none !important;
        }

        /* Hide widget error messages */
        .mt-lg.absolute.w-full:has(.p-md.flex.w-full.items-center.justify-between.rounded) {
            display: none !important;
        }
        `;
    } else if (SHOW_WIDGETS) {
        cssRules += `
        /* Show widgets always visible with animation reset - Generic selectors */
        .animate-in.fade-in.duration-300,
        .gap-sm.grid.grid-cols-6[style*="grid-template-rows"],
        .gap-sm.mb-md.flex.h-\\[32px\\].flex-row.flex-wrap.justify-center.overflow-hidden {
            display: grid !important;
            opacity: 1 !important;
            visibility: visible !important;
            transform: none !important;
            position: relative !important;
            animation: none !important;
        }

        /* Force category button container to be flex with animation reset */
        .gap-sm.mb-md.flex.h-\\[32px\\].flex-row.flex-wrap.justify-center.overflow-hidden {
            display: flex !important;
            transform: none !important;
            animation: none !important;
        }

        /* Force individual category buttons visible - structural selectors with animation override */
        .relative.col-span-2.row-span-1,
        .gap-sm.mb-md.flex button[type="button"][class*="bg-offsetPlus"] {
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
            transform: none !important;
            animation: none !important;
        }

        /* Force buttons to display inline-flex specifically with animation reset */
        .gap-sm.mb-md.flex button[type="button"][class*="bg-offsetPlus"] {
            display: inline-flex !important;
            transform: none !important;
            animation: none !important;
        }

        /* Reset any animation states that might cause stuck positioning */
        .gap-sm.mb-md.flex button[type="button"][class*="bg-offsetPlus"] *,
        .relative.col-span-2.row-span-1 * {
            transform: none !important;
            opacity: 1 !important;
            animation: none !important;
        }

        /* Force widget container visibility */
        div.animate-in.fade-in.duration-300,
        div.animate-in.fade-in.duration-300 * {
            opacity: 1 !important;
            visibility: visible !important;
        }

        /* Force widget links to be visible */
        a[href*="source=homepage_widget"] {
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
        }

        /* Override any hide/fade animations */
        .animate-in.fade-in.duration-300[style*="display: none"],
        .animate-in.fade-in.duration-300[style*="opacity: 0"] {
            display: grid !important;
            opacity: 1 !important;
        }
        `;
    }

    // Hide "Something went wrong" error messages
    cssRules += `
        /* Hide widget error messages by targeting common patterns */
        .mt-lg.absolute.w-full:has(button[class*="retry" i]) {
            display: none !important;
        }

        /* More specific targeting for error message containers */
        [class*="mt-lg"][class*="absolute"][class*="w-full"] div[class*="p-md"][class*="flex"][class*="w-full"] {
            display: none !important;
        }
    `;

    // Search box rounding CSS - Only apply when suggestions are hidden
    if (HIDE_SUGGESTIONS) {
        cssRules += `
            /* When suggestions are hidden, keep search box fully rounded */
            .bg-background-50.w-full.outline-none.focus\\:outline-none.focus\\:ring-borderMain.flex.items-center.placeholder-textOff.border.focus\\:ring-1.rounded-2xl.dark\\:bg-offsetDark,
            div[class*="bg-background-50"][class*="rounded-2xl"][class*="dark:bg-offsetDark"] {
                border-radius: 1rem !important;
            }

            /* Ensure the inner contenteditable area doesn't override */
            #ask-input,
            div[contenteditable="true"][id="ask-input"] {
                border-radius: 0 !important;
            }

            /* General rounded-2xl override for search contexts */
            .rounded-2xl:has(#ask-input), 
            .rounded-2xl:has([contenteditable="true"]) {
                border-radius: 1rem !important;
            }
        `;
    }

    style.textContent = cssRules;
    document.head.appendChild(style);

    // Function to actively remove suggestion elements (more aggressive approach)
    function removeSuggestionElements() {
        if (!HIDE_SUGGESTIONS) return;

        // Target the new structure more specifically
        const suggestionContainers = document.querySelectorAll('div[data-placement="bottom"]');
        suggestionContainers.forEach(container => {
            if (container.querySelector('div[data-focused]')) {
                container.remove();
                console.log('Removed suggestion container');
            }
        });

        // Remove any fixed positioned containers that contain suggestions
        // BUT exclude user menus and important dropdowns
        const fixedContainers = document.querySelectorAll('div[style*="position: fixed"]');
        fixedContainers.forEach(container => {
            // Check if this is a user menu/sidebar (should be kept)
            const isUserMenu = container.querySelector('[data-testid*="sidebar"]') ||
                              container.querySelector('img[alt*="avatar"]') ||
                              container.querySelector('img[alt*="User avatar"]') ||
                              container.querySelector('[data-placement="top-start"]');
            
            if (!isUserMenu && (container.querySelector('div[data-placement="bottom"]') || 
                container.querySelector('div[data-focused]'))) {
                container.remove();
                console.log('Removed fixed suggestion container');
            }
        });

        // Remove individual suggestion items (but preserve user menu items)
        const suggestionItems = document.querySelectorAll('div[data-focused][class*="cursor-pointer"]');
        suggestionItems.forEach(item => {
            // Check if this item is part of a user menu
            const isUserMenuItem = item.closest('[data-testid*="sidebar"]') ||
                                  item.closest('div:has(img[alt*="avatar"])') ||
                                  item.closest('[data-placement="top-start"]');
            
            if (!isUserMenuItem) {
                const parent = item.closest('div[style*="position: fixed"]') || 
                              item.closest('div[data-placement]');
                if (parent) {
                    parent.remove();
                    console.log('Removed suggestion item parent');
                }
            }
        });
    }

    // Function to cache widget content - wait for animations to complete
    function cacheWidgetContent() {
        // Try both old and new widget container structures
        const container = document.querySelector('.gap-sm.grid.grid-cols-6[style*="grid-template-rows"]') ||
                         document.querySelector('.gap-sm.mb-md.flex.h-\\[32px\\].flex-row.flex-wrap.justify-center.overflow-hidden') ||
                         document.querySelector('.gap-sm.mb-md.flex[class*="h-[32px]"]');
        
        if (container && container.children.length > 0 && !cachedWidgetContent) {
            // Check if widgets are still animating
            const animatingElements = container.querySelectorAll('.animate-in, [style*="transform"], [style*="opacity"]');
            const hasActiveAnimations = Array.from(animatingElements).some(el => {
                const style = window.getComputedStyle(el);
                const transform = style.transform;
                const opacity = style.opacity;
                
                // Check if element is in mid-animation (not at final state)
                return (transform && transform !== 'none' && transform.includes('translate')) ||
                       (opacity && parseFloat(opacity) < 0.99);
            });

            if (hasActiveAnimations) {
                // Wait for animations to complete before caching
                setTimeout(() => cacheWidgetContent(), 500);
                return;
            }

            cachedWidgetContent = container.innerHTML;
            widgetContainer = container;
            console.log('Widget content cached after animations completed:', cachedWidgetContent.length, 'characters');
        }
    }

    // Function to remove duplicate widgets - Fixed structure detection
    function removeDuplicateWidgets() {
        // Throttle duplicate checks to prevent excessive logging
        const now = Date.now();
        if (now - lastDuplicateCheck < DUPLICATE_CHECK_THROTTLE) {
            return;
        }
        lastDuplicateCheck = now;

        if (!hasRestoredContent) return;

        // Try both old and new widget container structures
        const container = document.querySelector('.gap-sm.grid.grid-cols-6[style*="grid-template-rows"]') ||
                         document.querySelector('.gap-sm.mb-md.flex.h-\\[32px\\].flex-row.flex-wrap.justify-center.overflow-hidden') ||
                         document.querySelector('.gap-sm.mb-md.flex[class*="h-[32px]"]');
        
        if (!container) return;

        // Better structure detection - check container classes first
        let widgets, isOldStructure, normalAmount;
        
        if (container.classList.contains('grid') && container.classList.contains('grid-cols-6')) {
            // Old structure - grid-based
            widgets = container.querySelectorAll('.relative.col-span-2.row-span-1');
            isOldStructure = true;
            normalAmount = 3;
        } else if (container.classList.contains('flex') && container.classList.contains('flex-wrap')) {
            // New structure - flex-based with category buttons
            widgets = container.querySelectorAll('button[type="button"][class*="bg-offsetPlus"]');
            isOldStructure = false;
            normalAmount = 5; // Based on your observation
        } else {
            // Fallback detection
            const oldWidgets = container.querySelectorAll('.relative.col-span-2.row-span-1');
            const newWidgets = container.querySelectorAll('button[type="button"][class*="bg-offsetPlus"]');
            
            if (oldWidgets.length > 0) {
                widgets = oldWidgets;
                isOldStructure = true;
                normalAmount = 3;
            } else {
                widgets = newWidgets;
                isOldStructure = false;
                normalAmount = 5;
            }
        }

        // Only run if we actually have excessive widgets
        if (widgets.length <= normalAmount) {
            return; // No duplicates to remove
        }

        console.log(`Found ${widgets.length} ${isOldStructure ? 'old' : 'new'} structure widgets (expected ${normalAmount}), removing duplicates...`);

        // Keep track of unique widget content using more generic identifiers
        const seenWidgets = new Set();
        const widgetsToRemove = [];

        widgets.forEach((widget, index) => {
            let identifier;
            
            if (isOldStructure) {
                // For old structure, check href
                const link = widget.querySelector('a[href*="source=homepage_widget"]');
                identifier = link ? link.getAttribute('href') : `old-widget-${index}`;
            } else {
                // For new structure, use SVG as identifier (more stable than text)
                const svg = widget.querySelector('svg');
                identifier = svg ? svg.outerHTML.substring(0, 50) : `new-widget-${index}`;
            }
            
            if (seenWidgets.has(identifier)) {
                // This is a duplicate, mark for removal
                widgetsToRemove.push(widget);
            } else {
                seenWidgets.add(identifier);
            }
        });

        // Only remove if we actually found duplicates
        if (widgetsToRemove.length > 0) {
            widgetsToRemove.forEach(widget => {
                console.log('Removing duplicate widget');
                widget.remove();
            });
        }

        // Check if we're back to normal amount
        const remainingWidgets = isOldStructure ? 
            container.querySelectorAll('.relative.col-span-2.row-span-1') :
            container.querySelectorAll('button[type="button"][class*="bg-offsetPlus"]');
            
        if (remainingWidgets.length <= normalAmount) {
            // Reset restoration flag as natural widgets are back
            hasRestoredContent = false;
            console.log('Natural widgets restored, clearing restoration flag');
        }
    }

    // Function to restore widget content - reset animations to final state
    function restoreWidgetContent() {
        if (HIDE_WIDGETS || !cachedWidgetContent) return; // Only restore when showing widgets

        // Try both old and new widget container structures
        const container = document.querySelector('.gap-sm.grid.grid-cols-6[style*="grid-template-rows"]') ||
                         document.querySelector('.gap-sm.mb-md.flex.h-\\[32px\\].flex-row.flex-wrap.justify-center.overflow-hidden') ||
                         document.querySelector('.gap-sm.mb-md.flex[class*="h-[32px]"]');
        
        if (container && container.children.length === 0) {
            console.log('Restoring widget content...');
            container.innerHTML = cachedWidgetContent;
            hasRestoredContent = true;

            // Mark restored widgets for identification and fix animations
            const restoredWidgets = container.querySelectorAll(
                '.relative.col-span-2.row-span-1, button[type="button"][class*="bg-offsetPlus"]'
            );
            restoredWidgets.forEach(widget => {
                widget.classList.add('perplexity-script-restored');
                
                // Reset animation states to final position
                resetAnimationState(widget);
            });

            // Re-apply styles to restored content
            const restoredLinks = container.querySelectorAll('a[href*="source=homepage_widget"]');
            restoredLinks.forEach(link => {
                link.style.setProperty('display', 'block', 'important');
                link.style.setProperty('opacity', '1', 'important');
                link.style.setProperty('visibility', 'visible', 'important');
            });

            // For new button structure, ensure buttons are visible and properly positioned
            const restoredButtons = container.querySelectorAll('button[type="button"][class*="bg-offsetPlus"]');
            restoredButtons.forEach(button => {
                button.style.setProperty('display', 'inline-flex', 'important');
                button.style.setProperty('opacity', '1', 'important');
                button.style.setProperty('visibility', 'visible', 'important');
                
                // Reset animation state for buttons too
                resetAnimationState(button);
            });

            console.log('Widget content restored with animation states reset');
        }
    }

    // Helper function to reset animation states to final position
    function resetAnimationState(element) {
        // Remove animation classes that might cause stuck states
        element.classList.remove('animate-in', 'fade-in', 'zoom-in-95', 'duration-300');
        
        // Reset any inline transform styles to final state
        element.style.setProperty('transform', 'none', 'important');
        element.style.setProperty('opacity', '1', 'important');
        element.style.setProperty('visibility', 'visible', 'important');
        
        // Check for any child elements that might have animation styles
        const animatedChildren = element.querySelectorAll('[style*="transform"], [style*="opacity"], .animate-in, .fade-in');
        animatedChildren.forEach(child => {
            child.style.setProperty('transform', 'none', 'important');
            child.style.setProperty('opacity', '1', 'important');
            child.style.setProperty('visibility', 'visible', 'important');
            child.classList.remove('animate-in', 'fade-in', 'zoom-in-95', 'duration-300');
        });
    }

    // Function to clear restored content when natural widgets appear
    function handleNaturalWidgetRestoration() {
        // Try both old and new widget container structures
        const container = document.querySelector('.gap-sm.grid.grid-cols-6[style*="grid-template-rows"]') ||
                         document.querySelector('.gap-sm.mb-md.flex.h-\\[32px\\].flex-row.flex-wrap.justify-center.overflow-hidden') ||
                         document.querySelector('.gap-sm.mb-md.flex[class*="h-[32px]"]');
        
        if (!container) return;

        const restoredWidgets = container.querySelectorAll('.perplexity-script-restored');
        const naturalWidgets = container.querySelectorAll(
            '.relative.col-span-2.row-span-1:not(.perplexity-script-restored), button[type="button"][class*="bg-offsetPlus"]:not(.perplexity-script-restored)'
        );

        // If we have both restored and natural widgets, remove the restored ones
        if (restoredWidgets.length > 0 && naturalWidgets.length > 0) {
            console.log('Natural widgets detected, removing restored widgets...');
            restoredWidgets.forEach(widget => widget.remove());
            hasRestoredContent = false;
        }
    }

    // Aggressive widget visibility enforcement
    function forceWidgetVisibility() {
        if (HIDE_WIDGETS) return; // Only enforce when showing widgets

        // Handle natural widget restoration and duplicates
        handleNaturalWidgetRestoration();
        removeDuplicateWidgets();

        // Only restore if we don't have natural widgets
        // Try both old and new widget container structures
        const container = document.querySelector('.gap-sm.grid.grid-cols-6[style*="grid-template-rows"]') ||
                         document.querySelector('.gap-sm.mb-md.flex.h-\\[32px\\].flex-row.flex-wrap.justify-center.overflow-hidden') ||
                         document.querySelector('.gap-sm.mb-md.flex[class*="h-[32px]"]');
        
        const hasNaturalWidgets = container && container.querySelectorAll(
            '.relative.col-span-2.row-span-1:not(.perplexity-script-restored), button[type="button"][class*="bg-offsetPlus"]:not(.perplexity-script-restored)'
        ).length > 0;

        if (!hasNaturalWidgets) {
            restoreWidgetContent();
        }

        // Force visibility for both old and new widget structures
        const widgetContainers = document.querySelectorAll('.animate-in.fade-in.duration-300, .gap-sm.grid.grid-cols-6[style*="grid-template-rows"], .gap-sm.mb-md.flex[class*="h-[32px]"]');
        const widgetLinks = document.querySelectorAll('a[href*="source=homepage_widget"]');
        const categoryButtons = document.querySelectorAll('.relative.col-span-2.row-span-1 button, .gap-sm.mb-md.flex button[type="button"]');

        widgetContainers.forEach(widget => {
            // Determine if this is a flex container (new structure) or grid (old structure)
            const isFlexContainer = widget.classList.contains('flex-row') || widget.classList.contains('flex-wrap');
            
            // Force display and visibility with animation reset
            widget.style.setProperty('display', isFlexContainer ? 'flex' : 'grid', 'important');
            widget.style.setProperty('opacity', '1', 'important');
            widget.style.setProperty('visibility', 'visible', 'important');
            widget.style.setProperty('transform', 'none', 'important');
            widget.style.setProperty('position', 'relative', 'important');
            widget.style.setProperty('animation', 'none', 'important');

            // Remove any hiding classes or styles
            if (widget.style.display === 'none') {
                widget.style.display = isFlexContainer ? 'flex' : 'grid';
            }
            if (widget.style.opacity === '0') {
                widget.style.opacity = '1';
            }

            // Also force child elements and reset their animations
            const children = widget.querySelectorAll('*');
            children.forEach(child => {
                child.style.setProperty('opacity', '1', 'important');
                child.style.setProperty('visibility', 'visible', 'important');
                child.style.setProperty('transform', 'none', 'important');
                child.style.setProperty('animation', 'none', 'important');
            });
        });

        // Force old widget links visible
        widgetLinks.forEach(link => {
            link.style.setProperty('display', 'block', 'important');
            link.style.setProperty('opacity', '1', 'important');
            link.style.setProperty('visibility', 'visible', 'important');
        });

        // Force new category buttons visible
        categoryButtons.forEach(button => {
            button.style.setProperty('display', 'inline-flex', 'important');
            button.style.setProperty('opacity', '1', 'important');
            button.style.setProperty('visibility', 'visible', 'important');
        });
    }

    // Function to handle error messages and other cleanup
    function hideErrorMessages() {
        // More aggressive error message removal
        const allDivs = document.querySelectorAll('div');
        allDivs.forEach(div => {
            if (div.textContent && div.textContent.includes('Something went wrong')) {
                const errorContainer = div.closest('.mt-lg') || div.closest('[class*="mt-lg"]');
                if (errorContainer) {
                    errorContainer.remove();
                    console.log('Removed error message container');
                }
            }
        });

        // Also target specific error container patterns
        const errorContainers = document.querySelectorAll('.mt-lg.absolute.w-full');
        errorContainers.forEach(container => {
            if (container.textContent && container.textContent.includes('Something went wrong')) {
                container.remove();
                console.log('Removed specific error container');
            }
        });
    }

    // Function to force rounding on search elements - Only when suggestions are hidden
    function forceRounding() {
        // Only apply rounding when suggestions are hidden
        if (!HIDE_SUGGESTIONS) return;
        
        // Target the main search container with the new class structure
        const searchContainers = document.querySelectorAll(
            '.bg-background-50[class*="rounded-2xl"], [class*="rounded-2xl"]:has(#ask-input), [class*="rounded-2xl"]:has([contenteditable="true"])'
        );
        
        searchContainers.forEach(container => {
            if (container.querySelector('#ask-input') || container.querySelector('[contenteditable="true"]')) {
                // Apply full rounding when suggestions are hidden
                container.style.borderRadius = '1rem';
                container.style.setProperty('border-radius', '1rem', 'important');
            }
        });

        // Ensure the inner input area doesn't have its own rounding
        const inputElements = document.querySelectorAll('#ask-input, [contenteditable="true"][id="ask-input"]');
        inputElements.forEach(input => {
            input.style.setProperty('border-radius', '0', 'important');
        });
    }

    // Run functions
    function runAllFunctions() {
        cacheWidgetContent();
        removeSuggestionElements(); // New aggressive suggestion removal
        forceWidgetVisibility();
        hideErrorMessages();
        forceRounding();
    }

    // Run initially with delays to ensure content loads
    setTimeout(runAllFunctions, 100);
    setTimeout(runAllFunctions, 500);
    setTimeout(runAllFunctions, 1000);

    // Use both MutationObserver and setInterval for enforcement - with better throttling
    let lastMutationUpdate = 0;
    const MUTATION_THROTTLE = 500; // Throttle mutation updates to once per 500ms
    
    const observer = new MutationObserver(function(mutations) {
        const now = Date.now();
        if (now - lastMutationUpdate < MUTATION_THROTTLE) {
            return; // Skip if we just processed mutations recently
        }
        
        let shouldUpdate = false;
        let shouldCache = false;

        mutations.forEach(function(mutation) {
            // Only process significant changes, not every small mutation
            if (mutation.addedNodes.length === 0 && mutation.removedNodes.length === 0) {
                return; // Skip attribute-only changes unless they're important
            }

            // Check for removed nodes (widgets being removed)
            mutation.removedNodes.forEach(function(node) {
                if (node.nodeType === 1 && node.querySelector && node.querySelector('a[href*="source=homepage_widget"]')) {
                    console.log('Widget content removed, will restore...');
                    shouldUpdate = true;
                }
            });

            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) {
                    // Check for suggestion elements being added
                    if (HIDE_SUGGESTIONS && (
                        node.getAttribute && node.getAttribute('data-placement') === 'bottom' ||
                        node.querySelector && node.querySelector('div[data-focused]') ||
                        node.classList && node.classList.contains('cursor-pointer')
                    )) {
                        console.log('Suggestion element detected, will remove...');
                        shouldUpdate = true;
                    }

                    // Check for widget elements (both old and new structures) - using structural selectors
                    if (node.classList && (
                        node.classList.contains('animate-in') ||
                        node.classList.contains('grid-cols-6') ||
                        node.classList.contains('flex-wrap') ||
                        node.textContent?.includes('Something went wrong') ||
                        (node.querySelector && (
                            node.querySelector('a[href*="source=homepage_widget"]') ||
                            node.querySelector('.relative.col-span-2.row-span-1') ||
                            node.querySelector('button[class*="bg-offsetPlus"][type="button"]') ||
                            node.matches('.gap-sm.mb-md.flex')
                        ))
                    )) {
                        shouldUpdate = true;
                        shouldCache = true;
                    }
                }
            });

            if (mutation.type === 'attributes' && (mutation.attributeName === 'class' || mutation.attributeName === 'style')) {
                // Only trigger for significant attribute changes
                if (mutation.target.classList && (
                    mutation.target.classList.contains('animate-in') ||
                    mutation.target.classList.contains('grid-cols-6') ||
                    mutation.target.classList.contains('flex-wrap')
                )) {
                    shouldUpdate = true;
                }
            }

            // Check for childList changes in widget container (both old and new structures)
            if (mutation.type === 'childList' && mutation.target.classList &&
                (mutation.target.classList.contains('grid-cols-6') ||
                 mutation.target.classList.contains('flex-wrap') ||
                 mutation.target.matches('.gap-sm.mb-md.flex'))) {
                console.log('Widget container children changed');
                shouldUpdate = true;
                shouldCache = true;
            }
        });

        if (shouldUpdate) {
            lastMutationUpdate = now;
            if (shouldCache) {
                setTimeout(cacheWidgetContent, 10);
            }
            setTimeout(runAllFunctions, 50); // Slight delay to let DOM settle
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
    });

    // Aggressive interval-based enforcement - Reduced frequency
    if (SHOW_WIDGETS) {
        setInterval(() => {
            forceWidgetVisibility();
            // Also periodically check if we need to cache fresh content
            if (!cachedWidgetContent) {
                cacheWidgetContent();
            }
        }, 2000); // Reduced from 300ms to 2 seconds to prevent excessive calls
    }

    // Run suggestion removal and error cleanup - reduced frequency
    setInterval(() => {
        removeSuggestionElements();
        hideErrorMessages();
    }, 2000); // Reduced from 1000ms to 2000ms

    console.log(`Perplexity Userscript loaded - Check Tampermonkey menu for options!`);
})();
// Function to inject CSS to hide the specified elements
function injectStyles() {
    const style = document.createElement('style');
    style.id = 'hide-popup-overlay-styles';
    style.textContent = `
        .popup-overlay.show {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
        }
    `;
    (document.head || document.documentElement).appendChild(style);
}

// Function to handle cases where the class might be toggled or elements added
const hidePopups = () => {
    const popups = document.querySelectorAll('.popup-overlay.show');
    popups.forEach(popup => {
        popup.style.setProperty('display', 'none', 'important');
    });
};

// Initial injection
injectStyles();
hidePopups();

// Use MutationObserver to watch for changes in the DOM
const observer = new MutationObserver((mutations) => {
    // Re-check for elements in case they were added dynamically
    hidePopups();
});

// Start observing the document
observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
});

console.log('Auto Hide Popup Overlay extension is active.');

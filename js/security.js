/**
 * ThinkAround Security Layer
 * Protects content from unauthorized copying while allowing permitted actions (like copying code).
 */

(function() {
  'use strict';

  function initSecurity() {
    // 1. Disable Right-Click
    document.addEventListener('contextmenu', (e) => {
      // Allow right-click on code blocks for potential browser-native actions if needed, 
      // but generally we want to protect the main text.
      if (!e.target.closest('.code-container') && !e.target.closest('pre')) {
        e.preventDefault();
        return false;
      }
    });

    // 2. Disable Keyboard Shortcuts for Inspect/Copy
    document.addEventListener('keydown', (e) => {
      // Disable F12
      if (e.keyCode === 123) {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
      if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+U (View Source)
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+S (Save Page)
      if (e.ctrlKey && e.keyCode === 83) {
        e.preventDefault();
        return false;
      }

      // Disable Ctrl+C (Copy) - EXCEPT on code blocks
      if (e.ctrlKey && e.keyCode === 67) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const container = selection.getRangeAt(0).commonAncestorContainer;
          const element = container.nodeType === 1 ? container : container.parentElement;
          
          if (!element.closest('.code-container') && !element.closest('pre')) {
            e.preventDefault();
            return false;
          }
        }
      }
    });

    // 3. Disable Print Screen (Subtle way, though not 100% reliable)
    document.addEventListener('keyup', (e) => {
      if (e.keyCode === 44) {
        navigator.clipboard.writeText('');
      }
    });

    // 4. Drag & Drop Protection (Prevents dragging text/images to other tabs)
    document.addEventListener('dragstart', (e) => {
      if (!e.target.closest('.code-container') && !e.target.closest('pre')) {
        e.preventDefault();
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSecurity);
  } else {
    initSecurity();
  }
})();

/**
 * Accessibility Module for ThinkAround
 * Handles font scaling, high contrast, and plain text mode.
 */

(function() {
  const STORAGE_KEY = 'quiet-journal-accessibility';
  const defaults = {
    fontScale: 1,
    bwMode: false,
    eyeComfort: false
  };

  let settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(defaults));

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  function applySettings() {
    document.documentElement.style.setProperty('--font-scale', settings.fontScale);
    document.body.classList.toggle('bw-mode', settings.bwMode);
    document.body.classList.toggle('eye-comfort-mode', settings.eyeComfort);
    
    // Update UI elements if menu is open
    const fontValue = document.getElementById('accessibility-font-value');
    if (fontValue) fontValue.textContent = Math.round(settings.fontScale * 100) + '%';
    
    const bwBtn = document.getElementById('accessibility-bw-btn');
    if (bwBtn) bwBtn.classList.toggle('active', settings.bwMode);
    
    const comfortBtn = document.getElementById('accessibility-comfort-btn');
    if (comfortBtn) comfortBtn.classList.toggle('active', settings.eyeComfort);
  }

  function injectMenu() {
    const menuHtml = `
      <div id="accessibility-container">
        <button id="accessibility-toggle" class="accessibility-toggle" title="Accessibility Menu" aria-haspopup="true" aria-expanded="false">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8"></path><path d="M8 12h8"></path></svg>
          <span>Accessibility Options</span>
        </button>
        <div id="accessibility-menu" class="accessibility-menu">
          <h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v8"></path><path d="M8 12h8"></path></svg>
            Accessibility
          </h2>
          
          <div class="accessibility-group">
            <span class="accessibility-label">Font Size</span>
            <div class="accessibility-font-controls">
              <button class="accessibility-font-btn" id="accessibility-font-dec" aria-label="Decrease font size">-</button>
              <span class="accessibility-font-value" id="accessibility-font-value">100%</span>
              <button class="accessibility-font-btn" id="accessibility-font-inc" aria-label="Increase font size">+</button>
            </div>
          </div>

          <div class="accessibility-group">
            <span class="accessibility-label">Visual Modes</span>
            <div class="accessibility-controls">
              <button class="accessibility-btn" id="accessibility-bw-btn">
                Black & White
              </button>
              <button class="accessibility-btn" id="accessibility-comfort-btn">
                Eye Comfort
              </button>
            </div>
          </div>

          <button class="accessibility-btn" style="margin-top: 0.5rem;" id="accessibility-reset">Reset Defaults</button>
        </div>
      </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = menuHtml;
    document.body.appendChild(wrapper.firstElementChild);

    // Event Listeners
    const toggle = document.getElementById('accessibility-toggle');
    const menu = document.getElementById('accessibility-menu');
    const incBtn = document.getElementById('accessibility-font-inc');
    const decBtn = document.getElementById('accessibility-font-dec');
    const bwBtn = document.getElementById('accessibility-bw-btn');
    const comfortBtn = document.getElementById('accessibility-comfort-btn');
    const resetBtn = document.getElementById('accessibility-reset');

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = menu.classList.toggle('is-active');
      toggle.setAttribute('aria-expanded', isActive);
    });

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && e.target !== toggle) {
        menu.classList.remove('is-active');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    incBtn.addEventListener('click', () => {
      if (settings.fontScale < 1.5) {
        settings.fontScale = parseFloat((settings.fontScale + 0.1).toFixed(1));
        applySettings();
        saveSettings();
      }
    });

    decBtn.addEventListener('click', () => {
      if (settings.fontScale > 0.8) {
        settings.fontScale = parseFloat((settings.fontScale - 0.1).toFixed(1));
        applySettings();
        saveSettings();
      }
    });

    bwBtn.addEventListener('click', () => {
      settings.bwMode = !settings.bwMode;
      if (settings.bwMode) settings.eyeComfort = false; // Mutually exclusive
      applySettings();
      saveSettings();
    });

    comfortBtn.addEventListener('click', () => {
      settings.eyeComfort = !settings.eyeComfort;
      if (settings.eyeComfort) settings.bwMode = false; // Mutually exclusive
      applySettings();
      saveSettings();
    });

    resetBtn.addEventListener('click', () => {
      settings = { ...defaults };
      applySettings();
      saveSettings();
    });
  }

  // Init
  window.addEventListener('DOMContentLoaded', () => {
    injectMenu();
    applySettings();
  });
})();

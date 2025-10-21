// js/theme.js
// Unified theme switcher used by every page.
// Usage: include <script src="js/theme.js" defer></script> in every page.
// Each page should include a <link id="theme-link" rel="stylesheet" href="css/style1.css">

(function(){
  const THEME_KEY = 'soul_selected_theme';
  const LEGACY_KEY = 'selectedTheme';
  const themeLink = document.getElementById('theme-link');
  // Prefer data-theme-selector, but fall back to #theme-select for older pages
  const selector = document.querySelectorAll('[data-theme-selector], #theme-select');

  function applyTheme(href){
    if(themeLink && href){
      themeLink.href = href;
      localStorage.setItem(THEME_KEY, href);
    }
  }

  function initSelector(el){
    el.addEventListener('change', (e)=>{
      applyTheme(e.target.value);
      // update all other selectors on page if any
      document.querySelectorAll('[data-theme-selector]').forEach(s => { if(s !== el) s.value = e.target.value; });
    });
  }

  // Init on load
  document.addEventListener('DOMContentLoaded', () => {
    // prefer new key, fall back to legacy
    const saved = localStorage.getItem(THEME_KEY) || localStorage.getItem(LEGACY_KEY);
    if(saved && themeLink) themeLink.href = saved;
    selector.forEach(initSelector);
    // ensure selector value matches
    selector.forEach(s => { if(s && s.value !== (saved||s.value)) s.value = saved || s.value; });
    // if legacy key existed, migrate it to canonical key
    if(!localStorage.getItem(THEME_KEY) && localStorage.getItem(LEGACY_KEY)){
      localStorage.setItem(THEME_KEY, localStorage.getItem(LEGACY_KEY));
    }
  });
})();
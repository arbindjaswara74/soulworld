// js/crisis-listener.js
// Include on every page to redirect to crisis.html if global crisis is active.

(function(){
  // Avoid redirect loop
  const current = location.pathname.split('/').pop();
  if(current === 'crisis.html' || current === 'community.html') return;

  function checkAndRedirect(){
    try {
      const c = JSON.parse(localStorage.getItem('soul_crisis') || 'null');
      if(c && c.active && c.expires > Date.now()){
        location.href = 'crisis.html';
      }
    } catch(e){}
  }

  window.addEventListener('storage', (e) => {
    if(e.key === 'soul_crisis' || e.key === 'soul_event') checkAndRedirect();
  });

  // initial check
  checkAndRedirect();
})();
// public/js/api.js
// Client-side API helper for the public frontend. Prefers same-origin API by default.
(function(){
  const DEFAULT_BASE = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'https://soulworld.onrender.com';
  const API_BASE = window.__API_BASE__ || DEFAULT_BASE;

  function handleJson(res){
    if(!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }

  async function getThoughts(){
    try{
      const res = await fetch(`${API_BASE}/api/thoughts`);
      return await handleJson(res);
    }catch(e){ console.error('[SoulAPI] getThoughts error', e); throw e; }
  }

  async function postThought(payload){
    try{
      const res = await fetch(`${API_BASE}/api/thoughts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {})
      });
      return await handleJson(res);
    }catch(e){ console.error('[SoulAPI] postThought error', e); throw e; }
  }

  // Expose for pages
  window.SoulAPI = { API_BASE, getThoughts, postThought };
})();

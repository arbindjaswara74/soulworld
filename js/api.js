// js/api.js
// Small client-side API helper for SoulWorld. Safe defaults and helpful logging.
(function(){
  const DEFAULT_BASE = 'https://soulworld.onrender.com';
  const API_BASE = window.__API_BASE__ || (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) || DEFAULT_BASE;

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

  async function postThought(content){
    try{
      const res = await fetch(`${API_BASE}/api/thoughts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      return await handleJson(res);
    }catch(e){ console.error('[SoulAPI] postThought error', e); throw e; }
  }

  // Expose for pages
  window.SoulAPI = { API_BASE, getThoughts, postThought };
})();

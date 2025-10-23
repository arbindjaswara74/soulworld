// public/js/upload.js (refactored)
// - Uses window.SoulAPI when available (prefer configured API_BASE)
// - Graceful fallbacks to same-origin endpoints
// - AbortController timeout for fetch
// - Disables form while submitting and provides accessible status updates
// - Basic client-side validation

(function(){
  function $(sel, root=document) { return root.querySelector(sel); }

  document.addEventListener('DOMContentLoaded', ()=>{
    const form = $('#uploadForm');
    if(!form) return;

    const titleEl = $('#title', form);
    const contentEl = $('#content', form);
    const sectionEl = $('#section', form);
    const skipBtn = $('#skipBtn', form);
    const feedback = $('#status', form) || document.createElement('div');
    feedback.id = feedback.id || 'status';
    feedback.setAttribute('aria-live','polite');
    feedback.classList.add('status');
    if(!$('#status', form)) form.appendChild(feedback);

    const submitBtn = form.querySelector("button[type='submit']");

    // helper
    function setStatus(msg, type='info'){
      feedback.textContent = msg;
      feedback.style.color = type === 'success' ? 'lightgreen' : type === 'error' ? '#ff6b6b' : '#9ed7ff';
    }

    // sentiment preview already on page? leave as-is

    // Skip button
    if(skipBtn){
      skipBtn.addEventListener('click', ()=> location.assign('home.html'));
    }

    async function postToApi(payload){
      // prefer window.SoulAPI when present
      if(window.SoulAPI && typeof window.SoulAPI.postThought === 'function'){
        return window.SoulAPI.postThought(payload);
      }

      // fallback to same-origin /api/stories
      const controller = new AbortController();
      const timeout = setTimeout(()=>controller.abort(), 10000);
      try{
        const res = await fetch('/api/stories', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload), signal: controller.signal
        });
        clearTimeout(timeout);
        if(!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      }catch(e){
        clearTimeout(timeout);
        throw e;
      }
    }

    form.addEventListener('submit', async (ev)=>{
      ev.preventDefault();

      const title = titleEl?.value?.trim();
      const content = contentEl?.value?.trim();
      const section = sectionEl?.value || 'leaf';

      if(!title || !content){
        setStatus('Please provide both Title and Thought.', 'error');
        return;
      }

      // disable UI
      if(submitBtn) submitBtn.disabled = true;
      if(skipBtn) skipBtn.disabled = true;
      setStatus('Uploading your thought... ⏳');

      try{
        await postToApi({ title, content, section });
        setStatus('Your thought has been shared! 🌌', 'success');
        form.reset();
        // minor delay so user sees success
        setTimeout(()=> location.assign('home.html'), 1200);
      }catch(err){
        console.error('Upload failed', err);
        const msg = (err && err.message) ? err.message : 'Network error';
        setStatus('Upload failed: ' + msg, 'error');
      }finally{
        if(submitBtn) submitBtn.disabled = false;
        if(skipBtn) skipBtn.disabled = false;
      }
    });
  });
})();


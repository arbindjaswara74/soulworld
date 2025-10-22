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

// public/js/upload.js
// Handles story upload form submission safely and smoothly.

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('uploadForm');
  const titleInput = document.getElementById('title');
  const contentInput = document.getElementById('content');
  const sectionSelect = document.getElementById('section');
  const skipBtn = document.getElementById('skipBtn');
  const status = document.getElementById('status');
  const indicator = document.getElementById('sentimentIndicator');

  if (!form) return; // No form on page
  const submitBtn = form.querySelector("button[type='submit']");

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = titleInput?.value.trim();
    const content = contentInput?.value.trim();
    const section = sectionSelect?.value || 'leaf';

    // Basic client-side validation
    if (!title || !content) {
      showMessage('⚠️ Please fill in both Title and Content fields.', 'error');
      return;
    }

  showMessage('⏳ Uploading your thought... Please wait.', 'info');
  if (submitBtn) submitBtn.disabled = true;

    try {
      // Use AbortController to avoid a permanently hanging fetch
      const controller = new AbortController();
      const signal = controller.signal;
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, section }),
        signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Upload failed');
      }

      // Reset form and show success
      form.reset();
      showMessage('✅ Your thought has been shared! 🌌', 'success');
      if (indicator) {
        indicator.textContent = '💭 Waiting for input...';
        indicator.style.color = '#999';
        contentInput.style.background = '#f0f8ff';
      }
      setTimeout(() => location.assign('home.html'), 1300);
    } catch (err) {
      console.error('Upload error:', err);
      showMessage('❌ Failed to upload: ' + (err.message || 'Network'), 'error');
    }
    finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // Simple sentiment detection
  if (contentInput && indicator && sectionSelect) {
    contentInput.addEventListener('input', () => {
      const text = contentInput.value.trim().toLowerCase();
      if (!text) {
        indicator.textContent = '💭 Waiting for input...';
        indicator.style.color = '#999';
        contentInput.style.background = '#f0f8ff';
        return;
      }

      const happyWords = ['happy','smile','peace','hope','love','good','shine'];
      const sadWords = ['sad','pain','alone','tears','broken','dark','lost','hurt'];

      if (sadWords.some(w => text.includes(w))) {
        indicator.textContent = '💮 Lotus Library (Sad / Emotional)';
        indicator.style.color = '#8e24aa';
        contentInput.style.background = '#e8d0f5';
        sectionSelect.value = 'lotus';
      } else if (happyWords.some(w => text.includes(w))) {
        indicator.textContent = '🌿 Leaf Library (Happy / Moral)';
        indicator.style.color = '#2e7d32';
        contentInput.style.background = '#d0f5d0';
        sectionSelect.value = 'leaf';
      } else {
        indicator.textContent = '💭 Neutral Thought';
        indicator.style.color = '#999';
        contentInput.style.background = '#f0f8ff';
      }
    });
  }

  // Skip button behavior
  if (skipBtn) skipBtn.addEventListener('click', () => window.location.href = 'home.html');

  function showMessage(msg, type) {
    if (!status) {
      console.log(msg);
      return;
    }
    status.textContent = msg;
    status.style.color = type === 'success' ? 'lightgreen' : type === 'error' ? '#ff6b6b' : '#9ed7ff';
  }
});

// js/community.js
// Minimal in-browser anonymous chat + crisis trigger (prototype)
(function(){
  const messagesEl = document.getElementById('messages');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('msgInput');
  if(!messagesEl || !form || !input) return;

  const anonKey = 'soul_session_code';
  if(!sessionStorage.getItem(anonKey)){
    const code = 'Soul#' + Math.random().toString(36).substring(2,8).toUpperCase();
    sessionStorage.setItem(anonKey, code);
  }
  const myCode = sessionStorage.getItem(anonKey);

  const storeKey = 'soul_chat_messages_v1';
  function readStore(){ try { return JSON.parse(localStorage.getItem(storeKey) || '[]'); } catch(e){ return []; } }
  function writeStore(arr){ localStorage.setItem(storeKey, JSON.stringify(arr)); }

  function escapeHtml(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('\n','<br>'); }

  function render(){
    const arr = readStore();
    messagesEl.innerHTML = '';
    arr.slice(-200).forEach(m=>{
      const d = document.createElement('div');
      d.className = 'msg' + (m.code === myCode ? ' own' : '');
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = (m.isDistressed ? 'Anonymous' : (m.code || 'Anonymous')) + ' • ' + new Date(m.ts).toLocaleTimeString();
      d.appendChild(meta);
      const text = document.createElement('div');
      text.innerHTML = escapeHtml(m.text);
      d.appendChild(text);
      messagesEl.appendChild(d);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function pushMessage(text, opts = {}){
    const arr = readStore();
    const msg = {
      id: 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
      text: text,
      ts: Date.now(),
      code: opts.anonymous ? null : myCode,
      isDistressed: !!opts.distressed
    };
    arr.push(msg);
    writeStore(arr);
    localStorage.setItem('soul_event', JSON.stringify({type:'msg', id: msg.id, t:Date.now()}));
    render();
    return msg;
  }

  const crisisWords = ['suicide','die','kill myself','i want to die','end it','hurting myself','hopeless','want to die','cant go on','i cant go on'];

  function detectCrisis(text){
    const s = text.toLowerCase();
    return crisisWords.some(w => s.includes(w));
  }

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const text = input.value.trim();
    if(!text) return;
    if(detectCrisis(text)){
      pushMessage(text, {distressed:true, anonymous:true});
      const expire = Date.now() + (5 * 60 * 1000);
      const crisisObj = { active:true, started:Date.now(), expires:expire, message:text };
      localStorage.setItem('soul_crisis', JSON.stringify(crisisObj));
      localStorage.setItem('soul_event', JSON.stringify({type:'crisis', t:Date.now()}));
      // redirect self
      location.href = 'crisis.html';
      return;
    }
    pushMessage(text, {anonymous:false});
    input.value = '';
  });

  // storage event sync
  window.addEventListener('storage', (e)=>{
    if(!e.key) return;
    if(e.key === storeKey || e.key === 'soul_event') render();
    if(e.key === 'soul_crisis'){
      const crisis = JSON.parse(e.newValue || 'null');
      if(crisis && crisis.active){
        if(location.pathname.indexOf('crisis.html') === -1){
          location.href = 'crisis.html';
        }
      }
    }
  });

  // initial load
  document.addEventListener('DOMContentLoaded', ()=>{
    render();
    try {
      const c = JSON.parse(localStorage.getItem('soul_crisis') || 'null');
      if(c && c.active && c.expires > Date.now()){
        if(location.pathname.indexOf('crisis.html') === -1) location.href = 'crisis.html';
      } else if (c && c.expires <= Date.now()){
        localStorage.removeItem('soul_crisis');
        localStorage.setItem('soul_event', JSON.stringify({type:'crisis_expired', t:Date.now()}));
      }
    } catch(e){}
  });
})();
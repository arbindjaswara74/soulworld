// js/crisis.js
(function(){
  const messagesEl = document.getElementById('crisisMessages');
  const form = document.getElementById('crisisForm');
  const input = document.getElementById('crisisInput');
  const sendBtn = document.getElementById('sendCrisisBtn');
  if(!messagesEl || !form) return;

  const storeKey = 'soul_chat_messages_v1';
  const crisisKey = 'soul_crisis';
  const freezeKey = 'soul_freeze_until';

  function readStore(){ try { return JSON.parse(localStorage.getItem(storeKey) || '[]'); } catch(e){ return []; } }
  function writeStore(arr){ localStorage.setItem(storeKey, JSON.stringify(arr)); }
  function escapeHtml(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('\n','<br>'); }

  function renderMessages(){
    const arr = readStore();
    messagesEl.innerHTML = '';
    arr.slice(-200).forEach(m=>{
      const d = document.createElement('div');
      d.className = 'cmsg';
      const meta = document.createElement('div');
      meta.style.fontSize='12px'; meta.style.fontWeight=700; meta.style.color='#037';
      meta.textContent = (m.isDistressed ? 'Anonymous' : (m.code || 'Someone')) + ' • ' + new Date(m.ts).toLocaleTimeString();
      d.appendChild(meta);
      const txt = document.createElement('div');
      txt.innerHTML = escapeHtml(m.text);
      d.appendChild(txt);
      messagesEl.appendChild(d);
    });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showCrisisBanner(){
    try {
      const c = JSON.parse(localStorage.getItem(crisisKey) || 'null');
      if(!c || !c.active) return;
      if(c.message){
        const arr = readStore();
        const last = arr[arr.length-1];
        if(!last || last.text !== c.message){
          arr.push({ id: 'm_crisis_'+Date.now(), text: c.message, ts: c.started || Date.now(), code: null, isDistressed:true });
          writeStore(arr);
        }
      }
    } catch(e){}
  }

  function setFreeze(seconds){
    const until = Date.now() + (seconds*1000);
    localStorage.setItem(freezeKey, String(until));
    localStorage.setItem('soul_event', JSON.stringify({type:'freeze', t:Date.now(), until}));
    disableSendingUntil(until);
  }

  function disableSendingUntil(untilTs){
    const nowTs = Date.now();
    if(nowTs < untilTs){
      if(sendBtn) { sendBtn.disabled = true; sendBtn.textContent = 'Please wait...'; }
      if(input) input.disabled = true;
      const interval = setInterval(()=>{
        const rem = Math.ceil((untilTs - Date.now())/1000);
        if(rem <= 0){ clearInterval(interval); if(sendBtn){ sendBtn.disabled=false; sendBtn.textContent='Send'; } if(input) input.disabled=false; }
        else { if(sendBtn) sendBtn.textContent = `Wait ${rem}s`; }
      }, 300);
    } else {
      if(sendBtn){ sendBtn.disabled=false; sendBtn.textContent='Send'; }
      if(input) input.disabled=false;
    }
  }

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const text = input.value.trim();
    if(!text) return;
    const anon = sessionStorage.getItem('soul_session_code') || ('Soul#'+Math.random().toString(36).slice(2,8).toUpperCase());
    const arr = readStore();
    arr.push({ id:'m_'+Date.now(), text, ts:Date.now(), code:anon, isDistressed:false });
    writeStore(arr);
    setFreeze(5); // 5 second freeze after each crisis message
    localStorage.setItem('soul_event', JSON.stringify({type:'msg_crisis', t:Date.now()}));
    input.value = '';
    renderMessages();
  });

  window.addEventListener('storage', (e)=>{
    if(!e.key) return;
    if(e.key === storeKey || e.key === 'soul_event') renderMessages();
    if(e.key === crisisKey){
      const c = JSON.parse(e.newValue || 'null');
      if(c && c.active) showCrisisBanner();
      else {
        // crisis ended -> back to community
        setTimeout(()=>{ if(location.pathname.indexOf('crisis.html') !== -1) location.href='community.html'; }, 700);
      }
    }
    if(e.key === freezeKey){
      const until = Number(e.newValue || '0');
      if(until) disableSendingUntil(until);
    }
  });

  (function init(){
    renderMessages();
    showCrisisBanner();
    try {
      const c = JSON.parse(localStorage.getItem(crisisKey) || 'null');
      if(c && c.active){
        if(c.expires <= Date.now()){
          localStorage.removeItem(crisisKey);
          localStorage.setItem('soul_event', JSON.stringify({type:'crisis_expired', t:Date.now()}));
          setTimeout(()=>{ if(location.pathname.indexOf('crisis.html') !== -1) location.href='community.html'; }, 300);
        } else {
          const remain = c.expires - Date.now();
          setTimeout(()=>{ localStorage.removeItem(crisisKey); localStorage.setItem('soul_event', JSON.stringify({type:'crisis_expired', t:Date.now()})); if(location.pathname.indexOf('crisis.html') !== -1) location.href='community.html'; }, remain + 200);
        }
      }
    } catch(e){}
    const freezeUntil = Number(localStorage.getItem(freezeKey) || '0');
    if(freezeUntil) disableSendingUntil(freezeUntil);
  })();
})();
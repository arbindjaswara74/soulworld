(function(){
  document.addEventListener('DOMContentLoaded', ()=>{
    const messagesEl = document.getElementById('messages');
    const form = document.getElementById('chatForm');
    const input = document.getElementById('msgInput');
    if(!messagesEl || !form || !input) return;

    // --- Session Code ---
    const anonKey = 'soul_session_code';
    if(!sessionStorage.getItem(anonKey)){
      const code = 'Soul#' + Math.random().toString(36).substring(2,8).toUpperCase();
      sessionStorage.setItem(anonKey, code);
    }
    const myCode = sessionStorage.getItem(anonKey);

    // --- Socket.io ---
    const socket = io();

    // --- Helper Functions ---
    function escapeHtml(s){
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
    }

    function addMessage(text, own=false){
      const div = document.createElement('div');
      div.className = own ? 'msg own' : 'msg';
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = (own ? 'You' : 'Anonymous') + ' • ' + new Date().toLocaleTimeString();
      div.appendChild(meta);
      const textDiv = document.createElement('div');
      textDiv.innerHTML = escapeHtml(text);
      div.appendChild(textDiv);
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function addInfo(info){
      const div = document.createElement('div');
      div.className = 'msg';
      div.style.fontStyle = 'italic';
      div.textContent = info;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // --- Crisis Detection ---
    const crisisWords = ['suicide','die','kill myself','i want to die','end it','hurting myself','hopeless','want to die','cant go on','i cant go on'];
    function detectCrisis(text){
      const s = text.toLowerCase();
      return crisisWords.some(w => s.includes(w));
    }

    // --- Socket.io Events ---
    socket.on('joined', groupId => addInfo(`You joined group ${groupId}`));
    socket.on('message', msg => addMessage(msg.text, msg.id === socket.id));
    socket.on('typing', () => {
      let indicator = document.getElementById('typingIndicator');
      if(!indicator){
        indicator = document.createElement('div');
        indicator.id = 'typingIndicator';
        indicator.className = 'msg';
        indicator.style.fontStyle = 'italic';
        indicator.textContent = 'Someone is typing...';
        messagesEl.appendChild(indicator);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
    });
    socket.on('stopTyping', () => {
      const indicator = document.getElementById('typingIndicator');
      if(indicator) indicator.remove();
    });

    // --- Join/Leave Notifications ---
    socket.on('userJoined', () => addInfo('A new user has joined your group.'));
    socket.on('userLeft', () => addInfo('A user has left your group.'));

    // --- Typing ---
    let typingTimeout;
    input.addEventListener('input', ()=>{
      socket.emit('typing');
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(()=>socket.emit('stopTyping'), 1000);
    });

    // --- Form Submit ---
    form.addEventListener('submit', e=>{
      e.preventDefault();
      const text = input.value.trim();
      if(!text) return;

      if(detectCrisis(text)){
        addMessage(text,true);
        localStorage.setItem('soul_crisis', JSON.stringify({active:true, started:Date.now(), message:text}));
        location.href='crisis.html';
        return;
      }

      socket.emit('message', text);
      addMessage(text,true);
      input.value='';
      socket.emit('stopTyping');
    });

    // --- Emoji Support ---
    const emojiList = ['😀','😂','😍','😭','😎','👍','🎉','💖','🤔','😴'];
    const emojiBtn = document.createElement('button');
    emojiBtn.type='button';
    emojiBtn.textContent='😊';
    emojiBtn.style.margin='0 4px';
    emojiBtn.addEventListener('click', ()=>{
      const picker = document.createElement('div');
      picker.style.position='absolute';
      picker.style.background='#fff';
      picker.style.border='1px solid #ccc';
      picker.style.padding='4px';
      picker.style.display='flex';
      picker.style.flexWrap='wrap';
      emojiList.forEach(e=>{
        const span = document.createElement('span');
        span.style.cursor='pointer';
        span.style.padding='2px';
        span.textContent=e;
        span.addEventListener('click', ()=>{
          input.value += e;
          picker.remove();
          input.focus();
        });
        picker.appendChild(span);
      });
      document.body.appendChild(picker);
      const rect = input.getBoundingClientRect();
      picker.style.left=rect.left+'px';
      picker.style.top=(rect.top - rect.height - 80)+'px';
    });
    form.insertBefore(emojiBtn,input);

  });
})();

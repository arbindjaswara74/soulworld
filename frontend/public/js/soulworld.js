// js/soulworld.js
// Unified SoulWorld Logic: Theme + Sentiment + Cards + Storage + Live Analyzer

(function(global){
  /* =============================
     🌗 THEME SYSTEM
  ============================= */
  const THEME_KEY = 'soul_selected_theme';
  const themeLink = document.getElementById('theme-link');
  const selectors = document.querySelectorAll('[data-theme-selector]');
  const savedTheme = localStorage.getItem(THEME_KEY);
  if(savedTheme && themeLink) themeLink.href = `css/${savedTheme}.css`;

  selectors.forEach(sel=>{
    sel.addEventListener('click', ()=>{
      const chosen = sel.dataset.themeSelector;
      localStorage.setItem(THEME_KEY, chosen);
      if(themeLink) themeLink.href = `css/${chosen}.css`;
    });
  });

  /* =============================
     💬 SENTIMENT + LANGUAGE FILTER
  ============================= */
  const happyWords = ['joy','love','peace','smile','hope','sunshine','beautiful','kind','grateful','calm'];
  const sadWords = ['pain','sad','cry','hurt','lonely','dark','lost','fear','hate','rage'];
  const moralWords = ['help','truth','justice','respect','honest','forgive','compassion','courage','faith','care'];
  const bannedWords = ['fuck','shit','bitch','bastard','asshole','slut','dumb','screw','hate','kill'];

  function analyzeSentiment(text){
    const lower = text.toLowerCase();
    if(bannedWords.some(w=>lower.includes(w))) return 'banned';
    const happy = happyWords.some(w=>lower.includes(w));
    const moral = moralWords.some(w=>lower.includes(w));
    const sad = sadWords.some(w=>lower.includes(w));
    if(happy || moral) return 'leaf';
    if(sad) return 'lotus';
    return 'lotus'; // neutral or mixed goes to lotus
  }

  /* =============================
     💾 LIBRARY HANDLER
  ============================= */
  function saveToLibrary(text){
    const sentiment = analyzeSentiment(text);
    if(sentiment === 'banned'){
      alert('Your story contains banned words. Please revise it.');
      return;
    }

    const libKey = sentiment === 'leaf' ? 'leafLibrary' : 'lotusLibrary';
    const library = JSON.parse(localStorage.getItem(libKey) || '[]');

    const newItem = {
      id: Date.now(),
      text,
      created: new Date().toISOString(),
      status: 'active'
    };

    library.push(newItem);
    localStorage.setItem(libKey, JSON.stringify(library));
    alert(`Your story was added to the ${sentiment === 'leaf' ? '🌿 Leaf' : '💮 Lotus'} Library!`);
  }

  /* =============================
     🃏 CARD SYSTEM
  ============================= */
  function shuffleArray(arr){
    for(let i = arr.length -1; i>0; i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function render(container, allCards, onClick){
    container.innerHTML = '';
    allCards.forEach(card=>{
      const div = document.createElement('div');
      div.className = 'card';
      div.style.background = `url("${card.backImage}") center/cover no-repeat`;
      div.setAttribute('role','button');
      div.tabIndex = 0;
      div.addEventListener('click', ()=> onClick(card));
      div.addEventListener('keydown', (e)=> { if(e.key==='Enter') onClick(card); });
      container.appendChild(div);
    });
  }

  function initCards({containerId, libraryKey, section, backImage}){
    const container = document.getElementById(containerId);
    if(!container) return;

    const libKey = libraryKey || 'leafLibrary';
    const backImg = backImage || 'images/image6.webp';
    let library = JSON.parse(localStorage.getItem(libKey) || '[]')
                    .filter(c => c.status !== 'deleted');

    let regularCards = library.map(c => ({...c, type:'regular', backImage: backImg}));
    let tryCards = Array.from({length:10}, ()=> ({ id:null, type:'tryAgain', backImage:backImg }));
    let allCards = [...regularCards, ...tryCards];

    if(regularCards.length > 0){
      const idx = Math.floor(Math.random()*regularCards.length);
      regularCards[idx].type = 'golden';
      allCards = [...regularCards, ...tryCards];
    }

    shuffleArray(allCards);

    function adjustVotes(n){
      let v = parseInt(localStorage.getItem('votesToday') || '10',10);
      v = Math.max(0, v + n);
      localStorage.setItem('votesToday', String(v));
    }

    function onClick(card){
      if(card.type === 'tryAgain'){
        adjustVotes(-1);
        alert('Try Again! You lost 1 vote.');
      } else if(card.type === 'golden'){
        adjustVotes(5);
        alert('Golden Card! You gained 5 votes.');
      } else {
        localStorage.setItem('currentCardSection', section || 'leaf');
        localStorage.setItem('currentCardId', card.id);
        location.href = 'readthought.html';
      }
      shuffleArray(allCards);
      render(container, allCards, onClick);
    }

    render(container, allCards, onClick);
  }

  /* =============================
     ⚡ LIVE ANALYZER
  ============================= */
  function attachLiveAnalyzer(inputId, indicatorId){
    const input = document.getElementById(inputId);
    const indicator = document.getElementById(indicatorId);
    if(!input || !indicator) return;

    input.addEventListener('input', ()=>{
      const val = input.value.trim();
      if(!val){
        indicator.textContent = '💭 Waiting...';
        indicator.style.color = '#999';
        return;
      }

      const sentiment = analyzeSentiment(val);
      if(sentiment === 'banned'){
        indicator.textContent = '🚫 Banned words detected';
        indicator.style.color = '#d33';
      } else if(sentiment === 'leaf'){
        indicator.textContent = '🌿 Leaf Library (Happy / Moral)';
        indicator.style.color = '#2e7d32';
      } else {
        indicator.textContent = '💮 Lotus Library (Sad / Emotional)';
        indicator.style.color = '#8e24aa';
      }
    });
  }

  /* =============================
     🌐 EXPORT FUNCTIONS
  ============================= */
  global.SoulWorld = {
    saveToLibrary,
    initCards,
    analyzeSentiment,
    attachLiveAnalyzer
  };

})(window);

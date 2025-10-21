// js/cards.js
// Usage: call initCards({containerId, libraryKey, section, backImage})
// libraryKey = 'leafLibrary' or 'lotusLibrary'

(function(global){
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
      // visually identical back image
      div.style.background = `url("${card.backImage}") center/cover no-repeat`;
      div.setAttribute('role','button');
      div.setAttribute('tabindex','0');
      div.addEventListener('click', ()=> onClick(card));
      div.addEventListener('keydown', (e)=> { if(e.key === 'Enter') onClick(card); });
      container.appendChild(div);
    });
  }

  function initCards(options){
    const container = document.getElementById(options.containerId);
    if(!container) return;
    const libKey = options.libraryKey || 'leafLibrary';
    const backImage = options.backImage || 'images/image6.webp';
    let library = JSON.parse(localStorage.getItem(libKey) || '[]').filter(c => c.status !== 'deleted');

    // Build card pool
    let regularCards = library.map(c => ({...c, type:'regular', backImage}));
    // add tryAgain cards
    let tryCards = Array.from({length:10}, ()=> ({ id: null, type:'tryAgain', backImage }));
    let allCards = [...regularCards, ...tryCards];

    // set one golden among regular if any
    if(regularCards.length>0){
      const idx = Math.floor(Math.random()*regularCards.length);
      regularCards[idx].type = 'golden';
      allCards = [...regularCards, ...tryCards];
    }

    shuffleArray(allCards);
    // click handler
    function onClick(card){
      // if tryAgain
      if(card.type === 'tryAgain'){
        adjustVotes(-1);
        alert('Try Again! You lost 1 vote.');
      } else if(card.type === 'golden'){
        adjustVotes(5);
        alert('Golden card! You gained 5 votes.');
      } else {
        localStorage.setItem('currentCardSection', options.section || 'leaf');
        localStorage.setItem('currentCardId', card.id);
        location.href = 'readthought.html';
      }
      // reshuffle display
      shuffleArray(allCards);
      render(container, allCards, onClick);
    }

    // initial render
    render(container, allCards, onClick);

    // helper
    function adjustVotes(n){
      let v = parseInt(localStorage.getItem('votesToday') || '10',10);
      v = Math.max(0, v + n);
      localStorage.setItem('votesToday', String(v));
    }
  }

  global.SoulCards = { initCards };
})(window);
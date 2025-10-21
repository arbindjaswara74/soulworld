// Robust Leaf deck rendering
const cardsContainer = document.getElementById('cardsContainer');
if (!cardsContainer) {
    console.warn('leaf.js: #cardsContainer not found. Aborting card render.');
} else {
    let library = JSON.parse(localStorage.getItem('leafLibrary') || '[]');
    library = library.filter(card => card && card.status !== 'deleted');

    // Make shallow copies so we don't mutate original storage objects
    let regularCards = library.map(c => ({ ...c }));

    // Add 10 distinct Try Again cards (avoid Array.fill with same object)
    const tryCards = Array.from({ length: 10 }, () => ({ special: 'try' }));

    // Random Golden Leaf among regular
    if (regularCards.length > 0) {
        const randIndex = Math.floor(Math.random() * regularCards.length);
        regularCards[randIndex].special = 'golden';
    }

    let allCards = [...regularCards, ...tryCards];

    // Fisher-Yates shuffle
    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    // Render cards into container using DocumentFragment
    function renderCards() {
        cardsContainer.innerHTML = ''; // simple reset for small counts
        const frag = document.createDocumentFragment();
        allCards.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';
            cardDiv.setAttribute('role', 'button');
            cardDiv.setAttribute('tabindex', '0');

            const img = document.createElement('img');
            img.src = 'images/image2.webp';
            img.alt = 'Card';
            cardDiv.appendChild(img);

            cardDiv.addEventListener('click', () => handleCardClick(card));
            cardDiv.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleCardClick(card); });

            frag.appendChild(cardDiv);
        });
        cardsContainer.appendChild(frag);
    }

    function handleCardClick(card) {
        if (card && card.special === 'try') {
            adjustVotes(-1);
            alert('Try Again! You lost 1 vote.');
        } else if (card && card.special === 'golden') {
            adjustVotes(5);
            alert('Golden Leaf! You gained 5 votes.');
        } else if (card) {
            localStorage.setItem('currentCard', JSON.stringify(card));
            window.location.href = 'card.html?section=leaf';
        }
        shuffleCards();
    }

    function adjustVotes(n) {
        let votes = parseInt(localStorage.getItem('votesToday') || '10', 10);
        if (Number.isNaN(votes)) votes = 10;
        votes = Math.max(votes + n, 0);
        localStorage.setItem('votesToday', String(votes));
    }

    function shuffleCards() {
        shuffleArray(allCards);
        renderCards();
    }

    // Initial render
    shuffleArray(allCards);
    renderCards();
}
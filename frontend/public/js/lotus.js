// If you want to use this as a standalone JS file, remove the HTML and use only JS:

document.addEventListener('DOMContentLoaded', function() {
    const cardsContainer = document.getElementById('cardsContainer');
    let library = JSON.parse(localStorage.getItem('leafLibrary') || '[]');
    library = library.filter(card => card.status !== 'deleted');

    // Prepare cards
    let regularCards = [...library];
    let tryCards = Array.from({length: 10}, () => ({ special: 'try' }));

    // Assign one golden card randomly
    if (regularCards.length > 0) {
        let randIndex = Math.floor(Math.random() * regularCards.length);
        regularCards[randIndex].special = 'golden';
    }

    // Combine all cards
    let allCards = [...regularCards, ...tryCards];

    // Shuffle
    allCards.sort(() => Math.random() - 0.5);

    // Render identical cards
    allCards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';

        // All cards show the same "back" image
        cardDiv.style.background = 'url("images/image6.webp") center/cover no-repeat';

        cardDiv.onclick = () => {
            if(card.special === 'try'){
                adjustVotes(-1);
                alert('Try Again! You lost 1 vote.');
            } else if(card.special === 'golden'){
                adjustVotes(5);
                alert('Golden Leaf! You gained 5 votes.');
            } else {
                localStorage.setItem('currentCard', JSON.stringify(card));
                window.location.href = 'card.html?section=leaf';
            }
            shuffleCards();
        }

        cardsContainer.appendChild(cardDiv);
    });

    // Shuffle cards visually
    function shuffleCards(){
        const container = document.getElementById('cardsContainer');
        for (let i = container.children.length; i >= 0; i--) {
            container.appendChild(container.children[Math.random() * i | 0]);
        }
    }

    // Votes logic
    function adjustVotes(n){
        let votes = parseInt(localStorage.getItem('votesToday') || 10);
        votes = Math.max(votes + n, 0);
        localStorage.setItem('votesToday', votes);
    }
});

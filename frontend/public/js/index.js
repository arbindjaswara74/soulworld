const cardImage = 'images/card_back.webp'; // visually identical

document.getElementById('leafCard').innerHTML = `<img src="${cardImage}" alt="Card">`;
document.getElementById('uploadCard').innerHTML = `<img src="${cardImage}" alt="Card">`;
document.getElementById('lotusCard').innerHTML = `<img src="${cardImage}" alt="Card">`;

// Click actions
document.getElementById('leafCard').onclick = () => { location.href = 'leaf.html'; };
document.getElementById('uploadCard').onclick = () => { location.href = 'upload.html'; };
document.getElementById('lotusCard').onclick = () => { location.href = 'lotus.html'; };
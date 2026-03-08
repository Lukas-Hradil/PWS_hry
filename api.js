const http = require("http");
const fs = require("fs");

const DB = "data.json";

// --- práce s databazi ---
const read = () => {
    try {
        if (!fs.existsSync(DB)) return [];
        const content = fs.readFileSync(DB, "utf8");
        return JSON.parse(content || "[]");
    } catch (e) {
        console.error("Chyba při čtení DB:", e);
        return [];
    }
};

const write = (data) => {
    try {
        fs.writeFileSync(DB, JSON.stringify(data, null, 2), "utf8");
    } catch (e) {
        console.error("Chyba při zápisu do DB:", e);
    }
};

// --- kontrola dat---
const validateData = (data) => {
    if (!data.name || data.name.trim() === "") return false;
    if (!data.genre || data.genre.trim() === "") return false;
    if (typeof data.price !== "number" || data.price < 0) return false;
    if (typeof data.year !== "number" || data.year < 0) return false;
    return true;
};

// --- CSS ---
const cssStyles = `
    body { 
        font-family: 'Segoe UI', sans-serif; 
        background: #f0f2f5; 
        color: #333; 
        margin: 0; 
        padding: 40px; 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        min-height: 100vh; 
    }
    h1 { margin-bottom: 20px; }
    
    .controls-bar { 
        background: white; 
        padding: 20px; 
        border-radius: 15px; 
        margin-bottom: 30px; 
        display: flex; 
        flex-wrap: wrap; 
        gap: 15px; 
        box-shadow: 0 2px 5px rgba(0,0,0,0.05); 
        align-items: center; 
        justify-content: center; 
    }
    .filter-group { display: flex; flex-direction: column; gap: 5px; font-size: 12px; color: #666; width: 200px; }
    input, select { padding: 10px; border-radius: 8px; border: 1px solid #ddd; outline: none; }
    
    #filter-price { 
        -webkit-appearance: none; 
        width: 100%; 
        height: 8px; 
        background: #333; 
        border-radius: 5px; 
        outline: none; 
        margin: 10px 0; 
        padding: 0; 
    }
    #filter-price::-webkit-slider-thumb { 
        -webkit-appearance: none; 
        appearance: none; 
        width: 18px; 
        height: 18px; 
        background: #14b2c7; 
        border-radius: 50%; 
        cursor: pointer; 
        border: none; 
    }
    
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px; max-width: 1200px; }
    .game-card { 
        background: #fff; 
        border-radius: 20px; 
        padding: 20px; 
        display: flex; 
        align-items: center; 
        position: relative; 
        width: 560px; 
        min-height: 220px; 
        box-sizing: border-box; 
        box-shadow: 0 10px 20px rgba(0,0,0,0.05); 
        transition: transform 0.2s; 
        overflow: hidden; 
    }
    .game-card:hover { transform: translateY(-5px); }
    .add { border: 3px dashed #bbb; cursor: pointer; justify-content: center; flex-direction: column; background: #fafafa; text-align: center; }
    .add:hover { background: #f0f0f0; }
    
    .game-image { 
        width: 260px; 
        height: 121px; 
        border-radius: 12px; 
        margin-right: 20px; 
        flex-shrink: 0; 
        object-fit: cover; 
        background: #1b2838; 
        border: 2px solid #000000; 
    }
    .game-image-placeholder { 
        width: 260px; 
        height: 121px; 
        background: #34495e; 
        border-radius: 12px; 
        margin-right: 20px; 
        flex-shrink: 0; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        color: white; 
        font-size: 13px; 
        text-transform: uppercase; 
        border: 2px solid #000000; 
    }
    
    .game-info { flex-grow: 1; min-width: 0; }
    .info-line { 
        background: #f8f9fa; 
        margin: 4px 0; 
        padding: 8px 12px; 
        border-radius: 8px; 
        font-size: 14px; 
        border: 1px solid #eee; 
        white-space: nowrap; 
        overflow: hidden; 
        text-overflow: ellipsis; 
    }
    
    .card-controls { position: absolute; top: 15px; right: 15px; display: flex; gap: 8px; z-index: 10; }
    .edit-btn, .delete-btn { 
        border: none; 
        width: 30px; 
        height: 30px; 
        border-radius: 8px; 
        cursor: pointer; 
        color: white; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
    }
    .edit-btn { background: #0099ff; } 
    .delete-btn { background: #b41200; }
    
    #modal { 
        display: none; 
        position: fixed; 
        inset: 0; 
        background: rgba(0,0,0,0.6); 
        justify-content: center; 
        align-items: center; 
        z-index: 100; 
        backdrop-filter: blur(3px); 
    }
    .modal-content { 
        background: white; 
        padding: 30px; 
        border-radius: 20px; 
        display: flex; 
        flex-direction: column; 
        gap: 12px; 
        width: 320px; 
    }
    .btn-save { 
        background: #09c658; 
        color: white; 
        padding: 12px; 
        border: none; 
        border-radius: 10px; 
        cursor: pointer; 
        font-weight: bold; 
        margin-top: 10px; 
    }

    .detail-body { justify-content: center; }
    .detail-box { 
        background: white; 
        padding: 40px; 
        border-radius: 20px; 
        box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
        max-width: 600px; 
        width: 90%; 
        text-align: center; 
    }
    .detail-box img { width: 100%; border-radius: 15px; border: 2px solid #000; margin-bottom: 20px; }
    .detail-box .info { text-align: left; background: #f8f9fa; padding: 20px; border-radius: 12px; border: 1px solid #eee; }
    .back-btn { 
        display: inline-block; 
        margin-top: 20px; 
        padding: 10px 20px; 
        background: #3498db; 
        color: white; 
        text-decoration: none; 
        border-radius: 8px; 
        font-weight: bold; 
    }
`;

// --- Detail hry ---
const getDetailTemplate = (g) => `
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <title>Hra: ${g.name}</title>
    <link rel="icon" href="https://cdn-icons-png.flaticon.com/512/686/686589.png" type="image/png">
    <style>${cssStyles}</style>
</head>
<body class="detail-body">
    <div class="detail-box">
        <img src="${g.image || ''}" onerror="this.src='https://via.placeholder.com/600x280?text=Logo'">
        <h1>${g.name}</h1>
        <div class="info">
            <p><strong>ID:</strong> ${g.id}</p>
            <p><strong>Žánr:</strong> ${g.genre}</p>
            <p><strong>Cena:</strong> ${g.price} Kč</p>
            <p><strong>Rok vydání:</strong> ${g.year}</p>
        </div>
        <a href="/" class="back-btn">Zpět do knihovny</a>
    </div>
</body>
</html>`;

// --- Knihovna her ---
const getTemplate = (games) => {
    const cards = games.map(g => `
        <div class="game-card" 
             data-name="${g.name.toLowerCase()}" 
             data-genre="${g.genre.toLowerCase()}" 
             data-year="${g.year}" 
             data-price="${g.price}">
            <div class="card-controls">
                <button class="edit-btn" onclick='openModal(${JSON.stringify(g)})'>⚙</button>
                <button class="delete-btn" onclick="del(${g.id})">✖</button>
            </div>
            
            <a href="/item?id=${g.id}" style="text-decoration: none;">
                <img class="game-image" 
                      src="${g.image || ''}" 
                      alt="${g.name}" 
                      onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="game-image-placeholder" style="display: ${g.image ? 'none' : 'flex'};">
                    <span>Logo</span>
                </div>
            </a>
            
            <div class="game-info">
                <div class="info-line"><strong>Jméno:</strong> ${g.name}</div>
                <div class="info-line"><strong>Žánr:</strong> ${g.genre}</div>
                <div class="info-line"><strong>Cena:</strong> ${g.price} Kč</div>
                <div class="info-line"><strong>Rok:</strong> ${g.year}</div>
            </div>
        </div>`).join("");

    return `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
        <meta charset="UTF-8">
        <title>Knihovna her</title>
        <link rel="icon" href="https://cdn-icons-png.flaticon.com/512/686/686589.png" type="image/png">
        <style>${cssStyles}</style>
    </head>
    <body>
        <h1>Herní Knihovna</h1>
        <div class="controls-bar">
            <div class="filter-group"><label>Název</label><input type="text" id="filter-name" placeholder="Zadejte název hry" oninput="applyFilters()"></div>
            <div class="filter-group">
                <label>Žánr</label>
                <select id="filter-genre" onchange="applyFilters()">
                    <option value="">Všechny žánry</option>
                    <option value="rpg">RPG</option>
                    <option value="akce">Akce</option>
                    <option value="strategie">Strategie</option>
                    <option value="sport">Sport</option>
                    <option value="sandbox">Sandbox</option>
                </select>
            </div>
            <div class="filter-group"><label>Rok vydání</label><input type="number" id="filter-year" placeholder="Zadejte rok vydání" min="0" oninput="applyFilters()"></div>
            <div class="filter-group">
                <label>Max. cena: <span id="price-val">2500</span> Kč</label>
                <input type="range" id="filter-price" min="0" max="2500" step="100" value="2500" oninput="applyFilters()">
            </div>
        </div>

        <div class="grid" id="game-grid">
            ${cards}
            <div class="game-card add" onclick="openModal()">
                <span style="font-size: 40px; color: #999;">+</span>
                <p style="color: #666; font-weight: bold;">Přidat novou hru</p>
            </div>
        </div>

        <div id="modal">
            <div class="modal-content">
                <h3 id="m-title" style="margin-top:0">Nová hra</h3>
                <input type="hidden" id="g-id">
                <input type="text" id="name" placeholder="Název hry">
                <input type="text" id="genre" placeholder="Žánr (např. RPG)">
                <input type="number" id="price" placeholder="Cena (Kč)" min="0">
                <input type="number" id="year" placeholder="Rok vydání" min="0">
                <input type="text" id="image" placeholder="URL obrázku (https://...)">
                <button class="btn-save" onclick="save()">Uložit záznam</button>
                <button onclick="closeModal()" style="border:none; background:none; cursor:pointer; color:#999;">Zrušit</button>
            </div>
        </div>

        <script>
            function applyFilters() {
                const nameVal = document.getElementById('filter-name').value.toLowerCase();
                const genreVal = document.getElementById('filter-genre').value.toLowerCase();
                const yearVal = document.getElementById('filter-year').value;
                const priceInput = document.getElementById('filter-price');
                const priceVal = priceInput.value;
                
                const percentage = (priceVal / priceInput.max) * 100;
                priceInput.style.background = \`linear-gradient(to right, #00bcd4 \${percentage}%, #333 \${percentage}%)\`;
                document.getElementById('price-val').innerText = priceVal;
                
                document.querySelectorAll('.game-card:not(.add)').forEach(card => {
                    const matchesName = card.dataset.name.includes(nameVal);
                    const matchesGenre = genreVal === "" || card.dataset.genre === genreVal;
                    const matchesYear = yearVal === "" || card.dataset.year === yearVal;
                    const matchesPrice = Number(card.dataset.price) <= Number(priceVal);
                    
                    card.style.display = (matchesName && matchesGenre && matchesYear && matchesPrice) ? "flex" : "none";
                });
            }
            
            window.onload = applyFilters;

            function openModal(g = {}) {
                document.getElementById('m-title').innerText = g.id ? 'Upravit hru' : 'Nová hra';
                document.getElementById('g-id').value = g.id || '';
                document.getElementById('name').value = g.name || '';
                document.getElementById('genre').value = g.genre || '';
                document.getElementById('price').value = g.price !== undefined ? g.price : '';
                document.getElementById('year').value = g.year || '';
                document.getElementById('image').value = g.image || '';
                
                document.getElementById('modal').style.display = 'flex';
            }
            
            function closeModal() { 
                document.getElementById('modal').style.display = 'none'; 
            }
            
            async function save() {
                const id = document.getElementById('g-id').value;
                const priceStr = document.getElementById('price').value;
                const yearStr = document.getElementById('year').value;
                
                const body = {
                    name: document.getElementById('name').value,
                    genre: document.getElementById('genre').value,
                    price: Number(priceStr),
                    year: Number(yearStr),
                    image: document.getElementById('image').value
                };
                
                // Kontrola, jestli jsou všechna pole vyplněna
                if(!body.name || !body.genre || priceStr === "" || yearStr === "") {
                    return alert('Vyplňte prosím všechna pole (Název, Žánr, Cena, Rok)!');
                }
                
                // Kontrola záporných hodnot
                if(body.price < 0 || body.year < 0) {
                    return alert('Cena a rok nesmí být v mínusu!');
                }
                
                const url = id ? '/edit/' + id : '/items';
                await fetch(url, { method: 'POST', body: JSON.stringify(body) });
                location.reload();
            }
            
            async function del(id) {
                if(confirm('Opravdu chcete tuto hru odstranit?')) {
                    await fetch('/delete/' + id, { method: 'DELETE' });
                    location.reload();
                }
            }
        </script>
    </body>
    </html>`;
};

// --- Server ---
const server = http.createServer((req, res) => {
    let games = read();
    
    // Zobrazení hlavní stránky
    if (req.url === "/" || (req.url === "/items" && req.method === "GET")) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        return res.end(getTemplate(games));
    }

    // Zobrazení detailu hry
    if (req.url.startsWith("/item?id=") && req.method === "GET") {
        const id = req.url.split("=")[1];
        const game = games.find(g => g.id == id);
        if (game) {
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            return res.end(getDetailTemplate(game));
        }
    }

    // Vytvoření nové hry
    if (req.url === "/items" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            const newItem = JSON.parse(body);
            if (!validateData(newItem)) {
                res.writeHead(400); return res.end("Neplatná data");
            }
            newItem.id = games.length > 0 ? Math.max(...games.map(g => Number(g.id))) + 1 : 1;
            games.push(newItem);
            write(games);
            res.writeHead(200); res.end();
        });
        return;
    }

    // Uložení úprav hry
    if (req.url.startsWith("/edit/") && req.method === "POST") {
        const id = req.url.split("/")[2];
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            const updatedItem = JSON.parse(body);
            if (!validateData(updatedItem)) {
                res.writeHead(400); return res.end("Neplatná data");
            }
            const idx = games.findIndex(g => g.id == id);
            if (idx !== -1) games[idx] = { ...updatedItem, id: Number(id) };
            write(games);
            res.writeHead(200); res.end();
        });
        return;
    }

    // Smazání hry
    if (req.url.startsWith("/delete/") && req.method === "DELETE") {
        const id = req.url.split("/")[2];
        games = games.filter(g => g.id != id);
        write(games);
        res.writeHead(200); res.end();
        return;
    }
    
    // Pokud adresa neexistuje
    res.writeHead(404);
    res.end();
});

server.listen(3001, () => {
    console.log("Server běží na http://localhost:3001");
});
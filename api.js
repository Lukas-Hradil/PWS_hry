const http = require("http");
const fs = require("fs");

const DB = "data.json";

// --- POMOCNÉ FUNKCE PRO PRÁCI S DATY ---
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

// --- ŠABLONA HTML ---
const getTemplate = (games) => {
    const cards = games.map(g => `
        <div class="game-card" data-name="${g.name.toLowerCase()}" data-genre="${g.genre.toLowerCase()}">
            <div class="card-controls">
                <button class="edit-btn" onclick='openModal(${JSON.stringify(g)})'>⚙</button>
                <button class="delete-btn" onclick="del(${g.id})">✖</button>
            </div>
            <div class="game-image-placeholder"></div>
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
        <style>
            body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; padding: 40px; display: flex; flex-direction: column; align-items: center; color: #333; }
            .controls-bar { background: white; padding: 20px; border-radius: 15px; margin-bottom: 30px; display: flex; gap: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
            input, select { padding: 10px; border-radius: 8px; border: 1px solid #ddd; outline: none; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px; max-width: 900px; }
            .game-card { background: #fff; border-radius: 20px; padding: 20px; display: flex; align-items: center; position: relative; width: 400px; box-shadow: 0 10px 20px rgba(0,0,0,0.05); transition: transform 0.2s; }
            .game-card:hover { transform: translateY(-5px); }
            .add { border: 3px dashed #bbb; cursor: pointer; justify-content: center; flex-direction: column; background: #fafafa; min-height: 150px; }
            .game-image-placeholder { width: 100px; height: 100px; background: #34495e; border-radius: 15px; margin-right: 20px; flex-shrink: 0; }
            .game-info { flex-grow: 1; }
            .info-line { background: #f8f9fa; margin: 4px 0; padding: 8px 12px; border-radius: 8px; font-size: 14px; border: 1px solid #eee; }
            .card-controls { position: absolute; top: 15px; right: 15px; display: flex; gap: 8px; }
            .edit-btn, .delete-btn { border: none; width: 30px; height: 30px; border-radius: 8px; cursor: pointer; color: white; display: flex; align-items: center; justify-content: center; }
            .edit-btn { background: #3498db; } .delete-btn { background: #e74c3c; }
            #modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); justify-content: center; align-items: center; z-index: 100; backdrop-filter: blur(3px); }
            .modal-content { background: white; padding: 30px; border-radius: 20px; display: flex; flex-direction: column; gap: 12px; width: 320px; }
            .btn-save { background: #2ecc71; color: white; padding: 12px; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; margin-top: 10px; }
        </style>
    </head>
    <body>
        <h1>Herní Knihovna</h1>
        <div class="controls-bar">
            <input type="text" id="filter-name" placeholder="Hledat podle názvu..." oninput="applyFilters()">
            <select id="filter-genre" onchange="applyFilters()">
                <option value="">Všechny žánry</option>
                <option value="rpg">RPG</option>
                <option value="akce">Akce</option>
                <option value="strategie">Strategie</option>
                <option value="sportovní">Sportovní</option>
            </select>
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
                <input type="number" id="price" placeholder="Cena (Kč)">
                <input type="number" id="year" placeholder="Rok vydání">
                <button class="btn-save" onclick="save()">Uložit záznam</button>
                <button onclick="closeModal()" style="border:none; background:none; cursor:pointer; color:#999;">Zrušit</button>
            </div>
        </div>
        <script>
            function applyFilters() {
                const nameVal = document.getElementById('filter-name').value.toLowerCase();
                const genreVal = document.getElementById('filter-genre').value.toLowerCase();
                const cards = document.querySelectorAll('.game-card:not(.add)');
                cards.forEach(card => {
                    const matchesName = card.dataset.name.includes(nameVal);
                    const matchesGenre = genreVal === "" || card.dataset.genre === genreVal;
                    card.style.display = (matchesName && matchesGenre) ? "flex" : "none";
                });
            }
            function openModal(g = {}) {
                document.getElementById('m-title').innerText = g.id ? 'Upravit hru' : 'Nová hra';
                document.getElementById('g-id').value = g.id || '';
                document.getElementById('name').value = g.name || '';
                document.getElementById('genre').value = g.genre || '';
                document.getElementById('price').value = g.price || '';
                document.getElementById('year').value = g.year || '';
                document.getElementById('modal').style.display = 'flex';
            }
            function closeModal() { document.getElementById('modal').style.display = 'none'; }
            async function save() {
                const id = document.getElementById('g-id').value;
                const body = {
                    name: document.getElementById('name').value,
                    genre: document.getElementById('genre').value,
                    price: Number(document.getElementById('price').value),
                    year: Number(document.getElementById('year').value)
                };
                if(!body.name || !body.genre) return alert('Vyplňte prosím název a žánr!');
                const url = id ? '/items/' + id : '/items';
                const method = id ? 'PUT' : 'POST';
                await fetch(url, { method, body: JSON.stringify(body) });
                location.reload();
            }
            async function del(id) {
                if(confirm('Opravdu chcete tuto hru odstranit?')) {
                    await fetch('/items/' + id, { method: 'DELETE' });
                    location.reload();
                }
            }
        </script>
    </body>
    </html>`;
};

// --- HLAVNÍ SERVEROVÝ CYKLUS ---
const server = http.createServer((req, res) => {
    let games = read();

    // Hlavní stránka
    if (req.url === "/" || req.url === "/items" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        return res.end(getTemplate(games));
    }

    // API Logika
    if (req.url.startsWith("/items")) {
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            const id = req.url.split("/")[2];

            if (req.method === "POST") {
                const newItem = JSON.parse(body);
                newItem.id = Date.now();
                games.push(newItem);
            } 
            else if (req.method === "PUT" && id) {
                const idx = games.findIndex(g => g.id == id);
                if (idx !== -1) games[idx] = { ...JSON.parse(body), id: Number(id) };
            } 
            else if (req.method === "DELETE" && id) {
                games = games.filter(g => g.id != id);
            }

            // Uložení změn do JSON souboru
            write(games);
            
            res.writeHead(200);
            res.end();
        });
    }
});

server.listen(3001, () => {
    console.log("Server Aliance běží na http://localhost:3001");
});
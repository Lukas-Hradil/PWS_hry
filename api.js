const http = require("http");
const fs = require("fs");

const DB = "data.json";

const read = () => JSON.parse(fs.readFileSync(DB, "utf8") || "[]");
const write = (data) => fs.writeFileSync(DB, JSON.stringify(data, null, 2));

http.createServer((req, res) => {
    let games = read();

    if (req.url === "/" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });

        const cards = games.map(g => `
            <div class="game-card">
                <div class="card-controls">
                    <button class="edit-btn" onclick='openModal(${JSON.stringify(g)})'>⚙</button>
                    <button class="delete-btn" onclick="del(${g.id})">✖</button>
                </div>
                <div class="game-image-placeholder"></div>
                <div class="game-info">
                    <div class="info-line">Jméno: ${g.name}</div>
                    <div class="info-line">Žánr: ${g.genre}</div>
                    <div class="info-line">Cena: ${g.price} Kč</div>
                    <div class="info-line">Rok: ${g.year}</div>
                </div>
            </div>`).join("");

        return res.end(`
            <style>
                body { font-family: sans-serif; background: #e0e0e0; padding: 40px; display: flex; flex-direction: column; align-items: center; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; max-width: 1000px; }
                .game-card, .add { background: #bdbdbd; border-radius: 25px; padding: 20px; display: flex; align-items: center; position: relative; width: 380px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                .add { border: 3px dashed #999; cursor: pointer; justify-content: center; flex-direction: column; background: #d0d0d0; height: 160px; }
                .game-image-placeholder { width: 110px; height: 110px; background: #444; border-radius: 20px; margin-right: 20px; flex-shrink: 0; }
                .info-line { background: white; margin: 5px 0; padding: 6px 12px; border-radius: 12px; font-weight: bold; font-size: 13px; color: #333; }
                .card-controls { position: absolute; top: 15px; right: 15px; display: flex; gap: 8px; }
                .edit-btn, .delete-btn { border: none; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; color: white; }
                .edit-btn { background: #555; } .delete-btn { background: #333; }
                #modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); justify-content: center; align-items: center; z-index: 10; }
                .modal-content { background: white; padding: 30px; border-radius: 25px; display: flex; flex-direction: column; gap: 10px; width: 300px; }
                input { padding: 12px; border-radius: 10px; border: 1px solid #ddd; }
            </style>

            <h1 style="color: #333;">Knihovna her</h1>
            <div class="grid">
                ${cards}
                <div class="add" onclick="openModal()"><span>+</span><p>Přidat hru</p></div>
            </div>

            <div id="modal">
                <div class="modal-content">
                    <h3 id="m-title">Nová hra</h3>
                    <input type="hidden" id="g-id">
                    <input type="text" id="name" placeholder="Název">
                    <input type="text" id="genre" placeholder="Žánr">
                    <input type="number" id="price" placeholder="Cena">
                    <input type="number" id="year" placeholder="Rok">
                    <button style="background:#3498db; color:white; padding:12px; border:none; border-radius:10px; cursor:pointer; font-weight:bold;" onclick="save()">Uložit</button>
                    <button onclick="document.getElementById('modal').style.display='none'" style="border:none; background:none; cursor:pointer; color:#999; margin-top:5px;">Zavřít</button>
                </div>
            </div>

            <script>
                const modal = document.getElementById('modal');
                function openModal(g = {}) {
                    document.getElementById('m-title').innerText = g.id ? 'Upravit hru' : 'Nová hra';
                    document.getElementById('g-id').value = g.id || '';
                    document.getElementById('name').value = g.name || '';
                    document.getElementById('genre').value = g.genre || '';
                    document.getElementById('price').value = g.price || '';
                    document.getElementById('year').value = g.year || '';
                    modal.style.display = 'flex';
                }
                async function save() {
                    const id = document.getElementById('g-id').value;
                    const body = {
                        name: document.getElementById('name').value,
                        genre: document.getElementById('genre').value,
                        price: Number(document.getElementById('price').value),
                        year: Number(document.getElementById('year').value)
                    };
                    await fetch(id ? '/games/'+id : '/games', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
                    location.reload();
                }
                async function del(id) {
                    if(confirm('Opravdu smazat?')) { await fetch('/games/'+id, { method: 'DELETE' }); location.reload(); }
                }
            </script>`);
    }

    if (req.url.startsWith("/games")) {
        let body = "";
        req.on("data", c => body += c);
        req.on("end", () => {
            const id = req.url.split("/")[2];
            if (req.method === "POST") {
                const n = JSON.parse(body);
                n.id = Date.now();
                games.push(n);
            } else if (req.method === "PUT") {
                const idx = games.findIndex(g => g.id == id);
                if (idx !== -1) games[idx] = { ...JSON.parse(body), id: Number(id) };
            } else if (req.method === "DELETE") {
                games = games.filter(g => g.id != id);
            }
            write(games);
            res.end();
        });
    }
}).listen(3001, () => console.log("Běží na http://localhost:3001"));
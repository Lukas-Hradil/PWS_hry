const http = require("http");
// Vzorová data – pole uživatelů
const users = [
{ id: 1, name: "Tomáš", age: 18 },
{ id: 2, name: "Karel", age: 19 }
];
const server = http.createServer((req, res) => {
// Endpoint GET /users – vrátí všechny uživatele
if (req.url === "/users" && req.method === "GET") {
res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
return res.end(JSON.stringify(users));
}





// Endpoint GET /users/:id – vrátí konkrétního uživatele podle ID
if (req.url.startsWith("/users/") && req.method === "GET") {
const id = Number(req.url.split("/")[2]);
const user = users.find((u) => u.id === id);
if (user) {
res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
return res.end(JSON.stringify(user));
}
// Uživatel nenalezen – 404
res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
return res.end(JSON.stringify({ error: "Uživatel nenalezen" }));
}
// Neznámý endpoint – 404
res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
res.end(JSON.stringify({ error: "Endpoint nenalezen" }));
});
server.listen(3001, () => {
console.log("API běží na http://localhost:3001");
});
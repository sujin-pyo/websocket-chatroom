import express from "express";
import http from "http";
import WebSocket from "ws";
const app = express();

app.set("view engine","pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname +"/public"));
app.get("/", (req, res) => res.render("home"));
// catch all url
app.get("/*", (req, res) => res.redirect("/"));
const handleListen = () => console.log('Listening on ws:localhost:3000')
// starting the http, ws on the same server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const sockets = [];

wss.on("connection", (socket) => {
    sockets.push(socket);
    socket["nickname"] = "Anonymous";
    console.log("Connected to Browser 🤎");
    socket.on("close", () => {console.log("Disconnected from the Broser ❌")});
    socket.on("message", (msg) => {
        const messageString = msg.toString('utf8'); 
        const messageObj = JSON.parse(messageString);
        switch(messageObj.type){
            case "new_message":
                sockets.forEach((aSocket) => aSocket.send(`${socket.nickname}: ${messageObj.payload}`));
            break
            case "nickname":
                socket["nickname"] = messageObj.payload;
        }
        // if(messageObj.type === "new_message"){
        //     sockets.forEach((aSocket) => aSocket.send(messageObj.payload));
        // } else if(messageObj.type ==="nickname"){
        //     console.log(messageObj.payload);
        // }
    });
});
// You can save the information inside the socket!
server.listen(3000, handleListen);
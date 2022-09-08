import express from "express";
import http from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
const app = express();

app.set("view engine","pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname +"/public"));
app.get("/", (req, res) => res.render("home"));
// catch all url
app.get("/*", (req, res) => res.redirect("/"));
const handleListen = () => console.log('Listening on http:localhost:3000')

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer,  {
    cors: {
      origin: ["https://admin.socket.io"],
      credentials: true
    },
  });

  instrument(wsServer, {
    auth: false
  });

function publicRooms(){
    const {
        sockets: {
        adapter: { sids, rooms },
    },
} = wsServer;
const publicRooms =[];
rooms.forEach((_, key)=> {
    if(sids.get(key) === undefined) {
        publicRooms.push(key);
    }
});
return publicRooms;
}

function countRoom(roomName){
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

// ready to receive the conncetion from the BE
wsServer.on("connection",(socket) => {
    socket["nickname"] = "Anony";
    socket.onAny((event) =>{
        console.log(wsServer.sockets.adapter);
        console.log(`Socket Event: ${event}`);
    });
    socket.on("enter_room", (roomName, done) => {
    socket.join(roomName);
    // call the done function from FE
    done(); 
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
    // send message to all sockets
    wsServer.sockets.emit("room_change", publicRooms());
    });
    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => 
            socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
        );
    });
    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());
    });
        
    socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
    });
    socket.on("nickname",(nickname) => (socket["nickname"] = nickname));
});

// const sockets = [];

// wss.on("connection", (socket) => {
//     sockets.push(socket);
//     socket["nickname"] = "Anonymous";
//     console.log("Connected to Browser 🤎");
//     socket.on("close", () => {console.log("Disconnected from the Broser ❌")});
//     socket.on("message", (msg) => {
//         const messageString = msg.toString('utf8'); 
//         const messageObj = JSON.parse(messageString);
//         switch(messageObj.type){
//             case "new_message":
//                 sockets.forEach((aSocket) => aSocket.send(`${socket.nickname}: ${messageObj.payload}`));
//             break
//             case "nickname":
//                 socket["nickname"] = messageObj.payload;
//         }
        // if(messageObj.type === "new_message"){
        //     sockets.forEach((aSocket) => aSocket.send(messageObj.payload));
        // } else if(messageObj.type ==="nickname"){
        //     console.log(messageObj.payload);
//         // }
//     });
// });
// // You can save information in socket
httpServer.listen(3000, handleListen);
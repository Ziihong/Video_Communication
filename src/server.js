import http from "http";
import express from "express";
import {WebSocket} from "ws";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on localhost");

// express는 http만 지원하고, ws는 지원하지 않음.
// http와 ws 둘 다 같은 포트에서 작동하기 위한 과정. http 서버 위에 ws 서버 생성
const server = http.createServer(app);
const ws_server = new WebSocket.Server({server});


// socket 이용하여 frontend와 실시간 소통 가능
// socket -> 연결된 브라우저
ws_server.on("connection", (socket) => {
    console.log("Connected to Browser");

    socket.on("close", ()=>{
        console.log("Disconnected from the Browser");
    })

    socket.on("message", (message) => {
        console.log("browser: ", message.toString()); // message buffer 형식으로 전달됨
    })

    socket.send("hello");
});

server.listen(3000, handleListen);
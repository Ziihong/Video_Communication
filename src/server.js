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


// socket 이용하여 front-end와 실시간 소통 가능
// socket -> 연결된 브라우저
// sockets에는 해당 서버와 연결된 모든 브라우저 추가

const sockets = [];
ws_server.on("connection", (socket) => {
    sockets.push(socket);
    socket["nickname"] = "Anony"; // nickname을 설정하지 않은 익명의 유저를 위해
    console.log("Connected to Browser");

    socket.on("close", ()=>{
        console.log("Disconnected from the Browser");
    })

    socket.on("message", (message) => {
        // console.log("new message: ", message.toString()); // message buffer 형식으로 전달됨
        const parsed = JSON.parse(message);
        switch (parsed.type){
            case "new_message":
                sockets.forEach((browser) => browser.send(`${socket.nickname}: ${parsed.payload}`));
                break;
            case "nickname":
                socket["nickname"] = parsed.payload;
                break;
        }

    })
});

server.listen(3000, handleListen);


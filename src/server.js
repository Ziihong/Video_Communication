import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on localhost");

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on("connection", (socket) => {
    console.log(socket);
    socket.on("enter_room", (msg, done) => {
        console.log(msg.payload);
        setTimeout(() => {
            done("backend call"); // front-end에 있는 함수를 back-end가 실행시킴. 보안 측면에서 중요
        }, 5000)
    })
})

httpServer.listen(3000, handleListen);


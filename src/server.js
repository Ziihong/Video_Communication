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
    socket.on("enter_room", (roomName, done) => {
        socket.join(roomName); // 서로 소통할 수 있는 socket 그룹에 연결
        done();
        socket.to(roomName).emit("new_join"); // 본인 제외한 특정 그룹에게 이벤트 발생
    })
})

httpServer.listen(3000, handleListen);


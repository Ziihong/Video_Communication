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
    socket["nickname"] = "Anon";

    socket.onAny((event) => {
        console.log(`Socket Event: ${event}`); // 어떤 이벤트가 발생했는지 알 수 있음
    });

    // connect
    socket.on("enter_room", (roomName, done) => {
        socket.join(roomName); // 서로 소통할 수 있는 socket 그룹에 연결
        done();
        socket.to(roomName).emit("join", socket.nickname); // 본인 제외한 특정 그룹에게 이벤트 발생
    });
    socket.on("new_message", (roomName, msg, done) => {
        socket.to(roomName).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    })
    socket.on("nickname", (nickname) => socket["nickname"] = nickname);


    // disconnect
    socket.on("disconnecting", () => {
        // socket.rooms -> 해당 socket 그룹에 연결된 socket들을 set 데이터 형태로 저장
        socket.rooms.forEach((room) => socket.to(room).emit("left", socket.nickname));
    });
});

httpServer.listen(3000, handleListen);


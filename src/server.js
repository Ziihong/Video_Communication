import http from "http";
import { Server } from "socket.io";
import express from "express";
import { instrument } from "@socket.io/admin-ui";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on localhost");

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true,
    },
});

instrument(wsServer, {
    auth: false,
});

// adpater는 다른 서버들 사이에 실시간 어플리케이션을 동기화한다.
// adapter는 데이터베이스를 사용해서 서버간의 통신을 한다. 어플리케이션으로 통하는 창문 역할

// sids는 개인방만. rooms는 개인방, 전체방 모두 존재. room id를 socket id에서 찾을 수 있다면 private용 room을 찾은 것이다!
function publicRooms() {
    const sids = wsServer.sockets.adapter.sids;
    const rooms = wsServer.sockets.adapter.rooms;
    const publicRooms = [];
    rooms.forEach((_, key) => {
        if(sids.get(key) === undefined){
            publicRooms.push(key);
        }
    });
    return publicRooms;
}

function countRoom(roomName){
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
    socket["nickname"] = "Anon";

    socket.onAny((event) => {
        console.log(`Socket Event: ${event}`); // 어떤 이벤트가 발생했는지 알 수 있음
    });

    // connect
    socket.on("enter_room", (roomName, done) => {
        socket.join(roomName); // 서로 소통할 수 있는 socket 그룹에 연결
        done();
        socket.to(roomName).emit("join", socket.nickname, countRoom(roomName)); // 메세지를 하나의 socket에만 보냄. 본인 제외한 특정 그룹에게 이벤트 발생.
        wsServer.sockets.emit("room_change", publicRooms()); // 메시지를 모든 socket에 보냄. "disconnect" 이벤트도 동일하게.
    });
    socket.on("new_message", (roomName, msg, done) => {
        socket.to(roomName).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    });
    socket.on("nickname", (nickname) => socket["nickname"] = nickname);

    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());
    });

    // disconnect
    socket.on("disconnecting", () => {
        // socket.rooms -> 해당 socket 그룹에 연결된 socket들을 set 데이터 형태로 저장
        socket.rooms.forEach((room) => socket.to(room).emit("left", socket.nickname, countRoom(room)-1)); // 내가 곧 room을 떠나기 때문에 -1 해줌
    });

});

httpServer.listen(3000, handleListen);


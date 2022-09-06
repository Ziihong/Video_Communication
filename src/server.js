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



// 여태까지 사용한 web socket은 다른 web socket들에게 메시지를 전달하지 않음. 나 -> 서버 -> 나 이렇게 전달 되는 형식.
// 반면, webTRC는 peer-to-peer 형식으로 실시간 소통 가능. 영상과 오디오가 서버를 통해서 전달되는 것이 아니라, peer-peer 직접 전달됨.
// 브라우저는 인터넷에서의 본인의 위치와 settings, configuration, 방화벽이나 라우터가 있는지 등등의 정보를 서버에 전달한다.
// 서버는 전달받은 정보를 다른 브라우저에게 전달하여 브라우저끼리 연결된다.



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

    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer); // 나의 브라우저 정보를 방에 존재하는 다른 유저에게 보내줌
    })

    // disconnect
    socket.on("disconnecting", () => {
        // socket.rooms -> 해당 socket 그룹에 연결된 socket들을 set 데이터 형태로 저장
        socket.rooms.forEach((room) => socket.to(room).emit("left", socket.nickname, countRoom(room)-1)); // 내가 곧 room을 떠나기 때문에 -1 해줌
    });

});

httpServer.listen(3000, handleListen);


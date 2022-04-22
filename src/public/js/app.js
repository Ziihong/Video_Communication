// socket -> 서버로의 연결
const socket = new WebSocket(`ws://${window.location.host}`); // 현재 접속한 페이지의 url 가져오기

socket.addEventListener("open", () => {
    console.log("Connected to Server");
})

socket.addEventListener("message", (message) => {
    console.log("server: ", message.data);
})

socket.addEventListener("close", () =>{
    console.log("Disconnected from Server");
})

setTimeout(() => {
    socket.send("hi");
}
, 5000);
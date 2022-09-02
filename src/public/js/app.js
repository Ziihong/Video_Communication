// io는 자동적으로 back-end socket.io와 연결해주는 함수이다.
const socket = io();

const welcome = document.querySelector("#welcome");
const chatRoom = document.querySelector("#chatRoom");
const roomForm = welcome.querySelector("#room");
const nickForm = welcome.querySelector("#nick");


chatRoom.hidden = true;
let roomName, nickname;

function makeMessage(msg){
    const ul = chatRoom.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = msg;
    ul.append(li);
}

function handleNicknameSubmit(event){
    event.preventDefault();
    const input = welcome.querySelector("#nick input").value;
    socket.emit("nickname", input);
}

function handleMessageSubmit(event){
    event.preventDefault();
    const input = chatRoom.querySelector("#msg input");
    const message = input.value;
    socket.emit("new_message", roomName, message, () => {
        makeMessage(`You: ${message}`);
    });
    input.value = "";
}

function showRoom(){
    welcome.hidden = true;
    chatRoom.hidden = false;

    const h3 = chatRoom.querySelector("h3");
    h3.innerText = `Room ❬ ${roomName} ❭`;

    // const nickForm = chatRoom.querySelector("#nick");
    const msgForm = chatRoom.querySelector("#msg");
    // nickForm.addEventListener("submit", handleNicknameSubmit);
    msgForm.addEventListener("submit", handleMessageSubmit);
}

function handleRoomSubmit(event){
    event.preventDefault();
    roomName = welcome.querySelector("#room input").value;
    // socket.emit(event 이름, 서버로 보내고 싶은 데이터1, 2, 3,,,, 서버에서 호출하는 함수(실행x)-무조건 마지막 인자)
    socket.emit("enter_room", roomName, showRoom);
    roomName.value = "";
}

roomForm.addEventListener("submit", handleRoomSubmit);
nickForm.addEventListener("submit", handleNicknameSubmit);

socket.on("join", (user) => {
    makeMessage(`~~" ${user} " joined~~`);
});

socket.on("left", (user) => {
    makeMessage(`~~" ${user} " left~~`);
});

socket.on("new_message", makeMessage); // == socket.on("new_message", (msg) => makeMessage(msg));
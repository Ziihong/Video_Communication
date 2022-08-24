// io는 자동적으로 back-end socket.io와 연결해주는 함수이다.
const socket = io();

const welcome = document.querySelector("#welcome");
const chatRoom = document.querySelector("#chatRoom");
const form = document.querySelector("form");

chatRoom.hidden = true;
let roomName;

function showRoom(){
    welcome.hidden = true;
    chatRoom.hidden = false;
    const h3 = chatRoom.querySelector("h3");
    h3.innerText = `Room ❬ ${roomName} ❭`;
}

function handleRoomSubmit(event){
    event.preventDefault();
    roomName = form.querySelector("input").value;
    // socket.emit(event 이름, 서버로 보내고 싶은 데이터1, 2, 3,,,, 서버에서 호출하는 함수-무조건 마지막 인자)
    socket.emit("enter_room", roomName, showRoom);
    roomName.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

function makeMessage(msg){
    const ul = chatRoom.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = msg;
    ul.append(li);
}

socket.on("new_join", () => {
    makeMessage("~~Someone joined~~");
})
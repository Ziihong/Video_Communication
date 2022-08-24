// io는 자동적으로 back-end socket.io와 연결해주는 함수이다.
const socket = io();

const welcome = document.querySelector("#welcom");
const form = document.querySelector("form");

function serverDon(msg){
    console.log(`backend: ${msg}`);
}

function handleRoomSubmit(event){
    event.preventDefault();
    const input = form.querySelector("input");
    // socket.emit(event 이름, 서버로 보내고 싶은 데이터1, 2, 3,,,, 서버에서 호출하는 함수-무조건 마지막 인자)
    socket.emit("enter_room", { payload: input.value }, serverDon);
    input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);
// io는 자동적으로 back-end socket.io와 연결해주는 함수이다.
const socket = io();

const welcome = document.querySelector("#welcom");
const form = document.querySelector("form");

function handleRoomSubmit(event){
    event.preventDefault();
    const input = form.querySelector("input");
    // socket.emit(event 이름, 보내고 싶은 payload-Object 전송 가능, 서버에서 호출하는 함수)
    socket.emit("enter_room", { payload: input.value }, () => {
        console.log("server is done!")
    })
    input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);
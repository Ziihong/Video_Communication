// socket -> 서버로의 연결
const socket = new WebSocket(`ws://${window.location.host}`); // 현재 접속한 페이지의 url 가져오기
const messageList = document.querySelector("ul");
const nickForm = document.querySelector("#nick");
const messageForm = document.querySelector("#message");

socket.addEventListener("open", () => {
    console.log("Connected to Server");
});

socket.addEventListener("close", () =>{
    console.log("Disconnected from Server");
});

socket.addEventListener("message", (message) => {
    const li = document.createElement("li");

    // FileReader로 Blob 안 message 읽기
    if(message.data instanceof Blob){
        const reader = new FileReader();
        reader.onload = () => {
            li.innerText = reader.result;
        }
        reader.readAsText(message.data);
    }
    else{
        li.innerText = message.data;
    }
    messageList.append(li);
})


// socket 전송할 때 string만 가능
// 닉네임/메시지 타입과 해당 내용을 json 형태 데이터로 만들고 string으로 변환해주는 함수
function makeMessage(type, payload){
    const msg = {type, payload};
    return JSON.stringify(msg);  // Object -> string
}

function handleNickSubmit(event){
    event.preventDefault();
    const inputNick = nickForm.querySelector("input");
    socket.send(makeMessage("nickname", inputNick.value));
}

function handleMessageSubmit(event){
    event.preventDefault();
    const inputText = messageForm.querySelector("input");
    socket.send(makeMessage("new_message", inputText.value));
    inputText.value = '';
}

nickForm.addEventListener("submit", handleNickSubmit);
messageForm.addEventListener("submit", handleMessageSubmit);
// io는 자동적으로 back-end socket.io와 연결해주는 함수이다.
const socket = io();

const welcome = document.querySelector("#welcome");
const chatRoom = document.querySelector("#chatRoom");
const roomForm = welcome.querySelector("#room");
const nickForm = welcome.querySelector("#nick");
const roomTitle = chatRoom.querySelector("h3");

chatRoom.hidden = true;
let roomName, nickname;

function showRoomTitle(currentCount){
    roomTitle.innerText = `Room ❬ ${roomName} ❭ (${currentCount})`;
}

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

// chatting room 들어간 후, 영상, 음성 call 하는 함수
async function startMedia(){
    welcome.hidden = true;
    chatRoom.hidden = false;

    roomTitle.innerText = `Room ❬ ${roomName} ❭`;

    await getMedia();
    makeConnection();

    const msgForm = chatRoom.querySelector("#msg");
    msgForm.addEventListener("submit", handleMessageSubmit);
}

function handleRoomSubmit(event){
    event.preventDefault();
    roomName = welcome.querySelector("#room input").value;
    // socket.emit(event 이름, 서버로 보내고 싶은 데이터1, 2, 3,,,, 서버에서 호출하는 함수(실행x)-무조건 마지막 인자)
    socket.emit("enter_room", roomName, startMedia);
    roomName.value = "";
}

roomForm.addEventListener("submit", handleRoomSubmit);
nickForm.addEventListener("submit", handleNicknameSubmit);

socket.on("join", async (user, currentCount) => {
    makeMessage(`~~" ${user} " joined~~`);
    showRoomTitle(currentCount);

// 먼저 접속: A   나중에 접속: B
// ------ A만 실행되는 코드 ------ offer 생성하여 B에 전송
    const offer =  await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    socket.emit("offer", offer, roomName);
});

// ------ B에서 실행되는 코드 ------ offer을 전달 받음
socket.on("offer", (offer) => {
    console.log(offer);
})

socket.on("left", (user, currentCount) => {
    makeMessage(`~~" ${user} " left~~`);
    showRoomTitle(currentCount);
});

socket.on("new_message", makeMessage); // == socket.on("new_message", (msg) => makeMessage(msg));

socket.on("room_change", (rooms) => {
    const roomList = welcome.querySelector("ul");
    roomList.innerText = "";
    if(rooms.length === 0){
        return;
    }
    rooms.forEach((room) => {
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    })
});


const videoSection = document.querySelector("#videoSection");
const myFace = videoSection.querySelector("#myFace");
const muteBtn = videoSection.querySelector("#mute");
const cameraBtn = videoSection.querySelector("#camera");
const cameraSelect = videoSection.querySelector("#cameraSelect");

let myStream;
let muted = false;
let cameraOff = false;
let myPeerConnection;

async function getCameras(){
    try{
        // enumerateDevices() => 컴퓨터에 연결되어 있거나 모바일이 가지고 있는 장치의 모든 미디어 장치를 알려줌
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label === camera.label){ // 선택한 카메라로 보여질 수 있도록
                option.selected = true;
            }
            cameraSelect.append(option);
        })
    }catch (e){
        console.log(e);
    }
}

async function getMedia(deviceId) {
    const initialConstrains = { // deviceId 인자 없을 때. 요청한 카메라가 없을 때
        audio: true,
        video: { facingMode: "user"}
    };
    const cameraConstrains = { // deviceId 인자 있을 때. 요청한 카메라가 있을 때
        audio: true,
        video: {deviceId: {exact: deviceId}}
    }

    try{
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstrains : initialConstrains
        );
        myFace.srcObject = myStream;
        await getCameras();

    }catch(e){
        console.log(e);
    }
}

function handleMuteClick(){
    // stream은 track을 제공해줌
    myStream.getAudioTracks().forEach((track) => track.enabled = !track.enabled);
    if(!muted){
        muteBtn.innerText = "UnMute";
        muted = true;
    }else{
        muteBtn.innerText = "Mute";
        muted = false;
    }
}

function handleCameraClick(){
    myStream.getVideoTracks().forEach((track) => track.enabled = !track.enabled);
    if(!cameraOff){
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }else{
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    }
}

function handleCameraChange(){

}


muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);


<!-- RTC Code -->

// 영상, 오디오를 연결을 통해 전달(서버가 전달x) peer-to-peer 연결 안에다가 영상과 오디오를 저장해야함
function makeConnection(){
    // peer-to-peer 연결 생성
    myPeerConnection = new RTCPeerConnection();
    // 양쪽 브라우저에서 카메라와 마이크의 데이터 stream을 받아서 그것들을 연결 안에 저장함
    myStream.getTracks().forEach((track) => {
        myPeerConnection.addTrack(track, myStream);
    })
}
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
async function initCall(){
    welcome.hidden = true;
    chatRoom.hidden = false;

    roomTitle.innerText = `Room ❬ ${roomName} ❭`;

    await getMedia();
    makeConnection();

    const msgForm = chatRoom.querySelector("#msg");
    msgForm.addEventListener("submit", handleMessageSubmit);
}

async function handleRoomSubmit(event){
    event.preventDefault();
    roomName = welcome.querySelector("#room input").value;
    await initCall();
    // socket.emit(event 이름, 서버로 보내고 싶은 데이터1, 2, 3,,,, 서버에서 호출하는 함수(실행x)-무조건 마지막 인자)
    socket.emit("enter_room", roomName);
    roomName.value = "";
}

roomForm.addEventListener("submit", handleRoomSubmit);
nickForm.addEventListener("submit", handleNicknameSubmit);

socket.on("join", async (user, currentCount) => {
    makeMessage(`~~" ${user} " joined~~`);
    showRoomTitle(currentCount);

// 먼저 접속: A   나중에 접속: B
// 1. ------ A만 실행되는 코드 ------ offer 생성하여 B에게 전송
    const offer =  await myPeerConnection.createOffer();
    console.log("sent the offer");
    myPeerConnection.setLocalDescription(offer);
    socket.emit("offer", offer, roomName);
});

// 2. ------ B에서 실행되는 코드 ------ 전달 받은 offer description 설정. answer 생성하여 A에게 전송
socket.on("offer", async (offer) => {
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    console.log("sent the answer");
});

// 3. ------ A만 실행되는 코드 ------ 전달 받은 answer description 설정
socket.on("answer", (answer) => {
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
    // 다른 브라우저로부터 전달 받은 icecandidate 추가함
    myPeerConnection.addIceCandidate(ice);
    console.log("received candidate");
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
    });
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
    };

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

async function handleCameraChange(){
    // 카메라를 바꿀 때마다 새로운 stream 생성 필요
    await getMedia(cameraSelect.value);

    // Sender로 peer에게 보내진 media stream track을 컨트롤 가능
    if(myPeerConnection){
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
            .getSenders()
            .find((sender) => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack); // 카메라 변경후 현재 나의 카메라 화면으로 변경
    }
}


muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);


<!-- RTC Code -->

// 영상, 오디오를 연결을 통해 전달(서버가 전달x) peer-to-peer 연결 안에다가 영상과 오디오를 저장해야함
function makeConnection(){
    // peer-to-peer 연결 생성
    myPeerConnection = new RTCPeerConnection();

    myPeerConnection.addEventListener("icecandidate", handleIce);

    myPeerConnection.addEventListener("addstream", handleAddStream);

    // 양쪽 브라우저에서 카메라와 마이크의 데이터 stream을 받아서 그것들을 연결 안에 저장함
    myStream.getTracks().forEach((track) => {
        myPeerConnection.addTrack(track, myStream);
    })
}

// candidate: webRTC가 원격 장치와 통신을 하기 위해 요구되는 프로토콜과 라우팅에 대해 알려줌. 여러 개의 후보군. 브라우저가 생성.
function handleIce(data){
    // 서버를 통해 icecandidate 다른 브라우저에게 전달
    socket.emit("ice", data.candidate, roomName);
    console.log("sent the candidate");
}

function handleAddStream(data){
    const peerFace = document.querySelector("#peerFace");
    peerFace.srcObject = data.stream;
}
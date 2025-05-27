const socket = io('https://multi-pingpong-293cc4ba4236.herokuapp.com', {
  path: '/socket.io',
  transports: ['websocket'],
});

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreDiv = document.getElementById("score");
const statusDiv = document.getElementById("status");
const readyBtn = document.getElementById("readyBtn");
const chatBox = document.getElementById("chatBox");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");

let player = null;    // {id, side, y, nickname}
let players = {};
let localPlayerY = 200;
let gameStarted = false;

// 채팅 메시지 추가
function addChatMessage(name, message) {
  const div = document.createElement("div");
  div.className = "chat-message";
  const nameSpan = document.createElement("span");
  nameSpan.className = "chat-name";
  nameSpan.textContent = name + ":";
  div.appendChild(nameSpan);
  div.appendChild(document.createTextNode(" " + message));
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

socket.on("init", (data) => {
  player = data;
  players = {};
  players[player.id] = { y: player.y, side: player.side, nickname: player.nickname };
  localPlayerY = player.y;
  updateStatus("게임 대기 중... 두 플레이어 모두 READY를 눌러주세요.");
  readyBtn.disabled = false;
  readyBtn.textContent = "READY";
});

socket.on("full", () => {
  alert("방이 가득 찼습니다.");
});

socket.on("state", (state) => {
  players = { ...state.players };

  // 내 패들 위치 보간 처리
  if (player && players[player.id]) {
    const serverY = players[player.id].y;
    players[player.id].y = localPlayerY; // 내 예측 위치 우선 반영
  }

  draw(state);

  scoreDiv.textContent = `점수: ${state.scores.left} - ${state.scores.right}`;

  if (!state.started) {
    updateStatus("게임 대기 중... 두 플레이어 모두 READY를 눌러주세요.");
    gameStarted = false;
    readyBtn.disabled = false;
    readyBtn.textContent = "READY";
  } else {
    updateStatus("");
    gameStarted = true;
    readyBtn.disabled = true;
    readyBtn.textContent = "게임 중";
  }

  if (state.winner) {
    updateStatus(`게임 종료! 승자: ${state.winner}`);
    gameStarted = false;
    readyBtn.disabled = false;
    readyBtn.textContent = "다시 시작하려면 READY";
  }
});

socket.on("start", () => {
  gameStarted = true;
  updateStatus("");
  readyBtn.disabled = true;
  readyBtn.textContent = "게임 중";
});

socket.on("chat", (data) => {
  addChatMessage(data.name, data.message);
});

function updateStatus(text) {
  statusDiv.textContent = text;
}

// 마우스 움직임 패들 이동
canvas.addEventListener("mousemove", (e) => {
  if (!gameStarted || !player) return;

  const rect = canvas.getBoundingClientRect();
  let y = e.clientY - rect.top;
  y = Math.min(Math.max(y, 50), 350);

  localPlayerY = y;

  socket.emit("move", localPlayerY);
});

// READY 버튼 클릭
readyBtn.addEventListener("click", () => {
  if (!player) return;
  socket.emit("ready");
  readyBtn.disabled = true;
  readyBtn.textContent = "READY 완료!";
});

// 채팅 입력 엔터
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && chatInput.value.trim() !== "") {
    socket.emit("chat", chatInput.value.trim());
    chatInput.value = "";
  }
});

// YOU 라벨을 그리기 위한 helper
function drawYouLabels() {
  const rect = canvas.getBoundingClientRect();

  // 기존에 있던 라벨 제거
  document.querySelectorAll(".you-label").forEach(el => el.remove());

  for (const id in players) {
    if (!players[id]) continue;
    const p = players[id];
    if (id !== player.id) continue;

    let x = p.side === "left" ? rect.left + 10 : rect.left + canvas.width - 20;
    let y = rect.top + p.y;

    const label = document.createElement("div");
    label.className = "you-label";
    label.textContent = "YOU";

    label.style.left = `${x}px`;
    label.style.top = `${y - 10}px`;

    document.body.appendChild(label);
  }
}

// 그리기 함수
function draw(state) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 배경
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 중앙 점선
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 15]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  // 패들 그리기
  for (const id in players) {
    const p = players[id];
    const x = p.side === "left" ? 30 : p.side === "right" ? 570 : null;
    if (!x) continue;

    ctx.fillStyle = id === player.id ? "#0f0" : "#ccc";
    ctx.fillRect(x, p.y - 50, 10, 100);

    // 닉네임
    ctx.fillStyle = "#0f0";
    ctx.font = "16px Arial";
    ctx.textAlign = p.side === "left" ? "right" : "left";
    const nameX = p.side === "left" ? x - 5 : x + 15;
    ctx.fillText(p.nickname, nameX, p.y - 60);
  }

  // YOU 라벨 그리기
  drawYouLabels();

  // 공 그리기
  ctx.fillStyle = "#f00";
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, 10, 0, 2 * Math.PI);
  ctx.fill();
}

const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreDiv = document.getElementById("score");
const statusDiv = document.getElementById("status");
const roleDiv = document.getElementById("role");
const readyBtn = document.getElementById("readyBtn");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const viewerBtn = document.getElementById("viewerBtn");
const messagesDiv = document.getElementById("messages");
const chatInput = document.getElementById("chatInput");

let player = null;
let players = {};
let nicknames = {};
let localPlayerY = 200;
let gameStarted = false;
let viewer = true;

socket.on("init", (data) => {
  player = data;
  viewer = data.side === "viewer";
  updateButtons();
  updateRoleDisplay();
});

socket.on("nicknames", (list) => {
  nicknames = list;
});

socket.on("state", (state) => {
  players = { ...state.players };

  if (player && players[player.id]) {
    const serverY = players[player.id].y ?? localPlayerY;
    players[player.id].y = localPlayerY;
  }

  draw(state);

  scoreDiv.textContent = `점수: ${state.scores.left} - ${state.scores.right}`;

  if (!state.started) {
    statusDiv.textContent = "게임 대기 중... 진영에 입장 후 READY를 눌러주세요.";
  } else {
    statusDiv.textContent = "";
  }

  if (state.winner) {
    statusDiv.textContent = `게임 종료! 승자: ${state.winner}`;
    readyBtn.disabled = false;
    readyBtn.textContent = "다시 시작하려면 READY";
    gameStarted = false;
  }
});

socket.on("start", () => {
  gameStarted = true;
});

socket.on("chat", ({ id, msg }) => {
  const name = nicknames[id] || "익명?";
  const p = document.createElement("div");
  p.textContent = `${name}: ${msg}`;
  messagesDiv.appendChild(p);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

document.addEventListener("mousemove", (e) => {
  if (!gameStarted || viewer || !player || !players[player.id]) return;
  const rect = canvas.getBoundingClientRect();
  const y = e.clientY - rect.top;
  localPlayerY = Math.min(Math.max(y, 50), 350);
  socket.emit("move", localPlayerY);
});

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && chatInput.value.trim()) {
    socket.emit("chat", chatInput.value.trim());
    chatInput.value = "";
  }
});

leftBtn.addEventListener("click", () => socket.emit("joinSide", "left"));
rightBtn.addEventListener("click", () => socket.emit("joinSide", "right"));
viewerBtn.addEventListener("click", () => {
  if (gameStarted) {
    alert("게임 중에는 관전자로 전환할 수 없습니다.");
    return;
  }
  socket.emit("joinSide", "viewer");
});

readyBtn.addEventListener("click", () => {
  socket.emit("ready");
  readyBtn.disabled = true;
  readyBtn.textContent = "READY 완료!";
});

socket.on("sideChanged", (data) => {
  player.side = data.side;
  viewer = data.side === "viewer";
  updateButtons();
  updateRoleDisplay();
});

function updateButtons() {
  readyBtn.disabled = viewer;
  readyBtn.textContent = "READY";
}

function updateRoleDisplay() {
  let roleText = "관전자";
  if (player.side === "left") roleText = "왼쪽 플레이어";
  else if (player.side === "right") roleText = "오른쪽 플레이어";
  roleDiv.textContent = `현재 상태: ${roleText}`;
}

function draw(state) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let id in players) {
    const p = players[id];
    const x = p.side === "left" ? 10 : p.side === "right" ? canvas.width - 20 : null;
    if (x === null) continue;
    ctx.fillStyle = "white";
    ctx.fillRect(x, p.y - 50, 10, 100);

    if (player && id === player.id) {
      ctx.fillStyle = "lime";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("YOU", x, p.y - 60);
      ctx.fillStyle = "white";
    }
  }

  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, 10, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
}

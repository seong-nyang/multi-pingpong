const socket = io('https://multi-pingpong-293cc4ba4236.herokuapp.com', {
  path: '/socket.io',
  transports: ['websocket']
});

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreDiv = document.getElementById("score");
const statusDiv = document.getElementById("status");
const readyBtn = document.getElementById("readyBtn");
const messagesDiv = document.getElementById("messages");
const chatInput = document.getElementById("chatInput");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const viewerBtn = document.getElementById("viewerBtn");

let player = null;
let gameStarted = false;
let localPlayerY = 200;
let players = {};
let nicknames = {};
let side = "viewer";

let nicknameId = localStorage.getItem("nicknameId");
if (!nicknameId) {
  nicknameId = "익명_" + Math.random().toString(36).substring(2, 6).toUpperCase();
  localStorage.setItem("nicknameId", nicknameId);
}
socket.emit("registerNickname", nicknameId);

function updateButtonStates() {
  const buttons = { left: leftBtn, right: rightBtn, viewer: viewerBtn };
  for (let key in buttons) {
    buttons[key].classList.remove("active");
  }
  if (side) {
    buttons[side]?.classList.add("active");
  }
  readyBtn.disabled = !(side === "left" || side === "right");
}

socket.on("init", (data) => {
  player = data;
  side = data.side;
  updateButtonStates();
});

socket.on("nicknames", (list) => {
  nicknames = list;
});

socket.on("state", (state) => {
  players = { ...state.players };
  if (player && players[player.id]) {
    players[player.id].y = localPlayerY;
  }

  draw(state);

  scoreDiv.textContent = `점수: ${state.scores.left} - ${state.scores.right}`;

  if (!state.started) {
    statusDiv.textContent = "게임 대기 중... 플레이어 입장 후 READY를 눌러주세요.";
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
  if (!gameStarted || side === "viewer") return;
  const rect = canvas.getBoundingClientRect();
  const y = e.clientY - rect.top;
  localPlayerY = Math.min(Math.max(y, 50), 350);
  socket.emit("move", localPlayerY);
});

readyBtn.addEventListener("click", () => {
  socket.emit("ready");
  readyBtn.disabled = true;
  readyBtn.textContent = "READY 완료!";
});

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && chatInput.value.trim()) {
    socket.emit("chat", chatInput.value.trim());
    chatInput.value = "";
  }
});

leftBtn.addEventListener("click", () => {
  socket.emit("switch", "left");
});

rightBtn.addEventListener("click", () => {
  socket.emit("switch", "right");
});

viewerBtn.addEventListener("click", () => {
  socket.emit("switch", "viewer");
});

socket.on("side", (newSide) => {
  side = newSide;
  updateButtonStates();
});

function draw(state) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  for (let id in players) {
    const p = players[id];
    const x = p.side === "left" ? 10 : p.side === "right" ? canvas.width - 20 : null;
    if (x === null) continue;
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
  ctx.closePath();
}

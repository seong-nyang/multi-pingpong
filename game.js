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

let player = null;
let gameStarted = false;
let localPlayerY = 200;
let players = {};
let nicknames = {};
let viewer = false;

socket.on("init", (data) => {
  player = data;
  viewer = data.side === "viewer";
  if (viewer) {
    readyBtn.style.display = "none";
  }
});

socket.on("nicknames", (list) => {
  nicknames = list;
});

socket.on("state", (state) => {
  players = { ...state.players };

  if (player && players[player.id]) {
    const serverY = state.players[player.id]?.y ?? localPlayerY;
    players[player.id].y = players[player.id].y
      ? players[player.id].y * 0.8 + serverY * 0.2
      : serverY;

    players[player.id].y = localPlayerY;
  }

  draw(state);

  scoreDiv.textContent = `점수: ${state.scores.left} - ${state.scores.right}`;

  if (!state.started) {
    const playerCount = Object.keys(state.players).length;
    if (playerCount < 2) {
      statusDiv.textContent = "상대를 기다리는 중...";
      readyBtn.disabled = true;
      readyBtn.textContent = "READY";
    } else {
      statusDiv.textContent = "게임 대기 중... 두 플레이어 모두 READY를 눌러주세요.";
      if (!viewer && !gameStarted) {
        readyBtn.disabled = false;
        readyBtn.textContent = "READY";
      }
    }
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
  p.className = "message";
  p.innerHTML = `<strong>${name}</strong>: ${msg}`;
  messagesDiv.appendChild(p);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

document.addEventListener("mousemove", (e) => {
  if (!gameStarted || viewer) return;
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

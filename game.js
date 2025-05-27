const socket = io('https://multi-pingpong-293cc4ba4236.herokuapp.com', {
  path: '/socket.io',
  transports: ['websocket']
});

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreDiv = document.getElementById("score");
const statusDiv = document.getElementById("status");
const readyBtn = document.getElementById("readyBtn");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");

let player = null;
let gameStarted = false;
let isSpectator = false;

let localPlayerY = 200;
let players = {};
let countdown = null;

socket.on("init", (data) => {
  if (data.spectator) {
    isSpectator = true;
    statusDiv.textContent = "관전자 모드입니다.";
    readyBtn.style.display = "none";
  } else {
    player = data;
    players[player.id] = { y: player.y, side: player.side };
  }
});

socket.on("full", () => {
  alert("방이 가득 찼습니다.");
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
    statusDiv.textContent = "게임 대기 중... 두 플레이어 모두 READY를 눌러주세요.";
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

socket.on("countdown", (number) => {
  countdown = number;
  if (number === 0) {
    countdown = null;
  }
});

document.addEventListener("mousemove", (e) => {
  if (!gameStarted || isSpectator) return;

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
  if (e.key === "Enter" && chatInput.value.trim() !== "") {
    socket.emit("chat", chatInput.value.trim());
    chatInput.value = "";
  }
});

socket.on("chat", (msg) => {
  const div = document.createElement("div");
  div.textContent = msg;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on("start", () => {
  gameStarted = true;
});

function draw(state) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  for (let id in players) {
    const p = players[id];
    let x = p.side === "left" ? 10 : canvas.width - 20;
    ctx.fillRect(x, p.y - 50, 10, 100);

    if (player && id === player.id) {
      ctx.font = "16px Arial";
      ctx.fillStyle = "yellow";
      ctx.textAlign = "center";
      ctx.fillText("YOU", x + 5, p.y - 60);
    }
  }

  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, 10, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.closePath();

  if (countdown !== null) {
    ctx.font = "48px Arial";
    ctx.fillStyle = "red";
    ctx.textAlign = "center";
    ctx.fillText(countdown, canvas.width / 2, canvas.height / 2);
  }
}

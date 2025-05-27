const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreDiv = document.getElementById("score");
const statusDiv = document.getElementById("status");
const readyBtn = document.getElementById("readyBtn");

let player = null;
let gameStarted = false;
let localPlayerY = 200;
let players = {};
let nicknames = {};

socket.on("init", (data) => {
  player = data;
  players[player.id] = { y: player.y, side: player.side };
});

socket.on("nicknames", (map) => {
  nicknames = map;
});

socket.on("full", () => {
  alert("방이 가득 찼습니다.");
});

socket.on("state", (state) => {
  players = { ...state.players };

  if (player && players[player.id]) {
    players[player.id].y = localPlayerY;
  }

  draw(state);

  scoreDiv.textContent = `점수: ${state.scores.left} - ${state.scores.right}`;
  statusDiv.textContent = state.started
    ? ""
    : "게임 대기 중... 두 플레이어 모두 READY를 눌러주세요.";

  if (state.winner) {
    statusDiv.textContent = `게임 종료! 승자: ${state.winner}`;
    readyBtn.disabled = false;
    readyBtn.textContent = "다시 시작하려면 READY";
    gameStarted = false;
  }
});

document.addEventListener("mousemove", (e) => {
  if (!gameStarted || !player || player.side === "spectator") return;

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

socket.on("start", () => {
  gameStarted = true;
});

// 채팅 처리
const form = document.getElementById("chatForm");
const input = document.getElementById("chatInput");
const messages = document.getElementById("messages");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value.trim() !== "") {
    socket.emit("chat", input.value);
    input.value = "";
  }
});

socket.on("chat", (data) => {
  const item = document.createElement("div");
  item.textContent = `${data.name}: ${data.message}`;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

function draw(state) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  for (let id in state.players) {
    const p = state.players[id];
    const x = p.side === "left" ? 10 : canvas.width - 20;
    ctx.fillRect(x, p.y - 50, 10, 100);

    // 닉네임 표시
    ctx.font = "12px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(
      id === player?.id ? "YOU" : nicknames[id] || "",
      x + 5,
      p.y - 60
    );
  }

  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, 10, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.closePath();
}

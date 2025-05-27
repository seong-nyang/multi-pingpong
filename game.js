const socket = io('https://multi-pingpong-293cc4ba4236.herokuapp.com', {
  path: '/socket.io',
  transports: ['websocket']
});

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreDiv = document.getElementById("score");
const statusDiv = document.getElementById("status");
const readyBtn = document.getElementById("readyBtn");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatLog = document.getElementById("chatLog");

let player = null;
let gameStarted = false;
let localPlayerY = 200;
let players = {};
let nicknames = {};

socket.on("init", (data) => {
  player = data;
  players[player.id] = { y: player.y, side: player.side };
});

socket.on("full", () => {
  alert("방이 가득 찼습니다.");
});

socket.on("state", (state) => {
  players = { ...state.players };
  nicknames = state.nicknames || {};

  if (player && players[player.id]) {
    const serverY = state.players[player.id]?.y ?? localPlayerY;
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
  if (!gameStarted) return;

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

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = chatInput.value.trim();
  if (msg) socket.emit("chat", msg);
  chatInput.value = "";
});

socket.on("chat", ({ name, message }) => {
  const msgElem = document.createElement("div");
  msgElem.textContent = `${name}: ${message}`;
  chatLog.appendChild(msgElem);
  chatLog.scrollTop = chatLog.scrollHeight;
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

    // YOU 또는 닉네임 표시
    const label = id === player.id ? "YOU" : nicknames[id] || "익명?";
    const textX = p.side === "left" ? x + 15 : x - 60;
    ctx.font = "14px Arial";
    ctx.fillText(label, textX, p.y);
  }

  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.closePath();
}

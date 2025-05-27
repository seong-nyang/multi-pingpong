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

socket.on("init", (data) => {
  player = data;
  players[player.id] = { y: player.y, side: player.side };
  nicknames = data.nicknames;
});

socket.on("full", () => {
  alert("방이 가득 찼습니다.");
});

socket.on("state", (state) => {
  players = { ...state.players };
  nicknames = state.nicknames;

  if (player && players[player.id]) {
    const serverY = players[player.id]?.y ?? localPlayerY;
    players[player.id].y = localPlayerY;
  }

  draw(state);
  scoreDiv.textContent = `점수: ${state.scores.left} - ${state.scores.right}`;
  statusDiv.textContent = state.started ? "" : "게임 대기 중... 두 플레이어 모두 READY를 눌러주세요.";

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

document.addEventListener("mousemove", (e) => {
  if (!gameStarted) return;
  const rect = canvas.getBoundingClientRect();
  localPlayerY = Math.min(Math.max(e.clientY - rect.top, 50), 350);
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

socket.on("chat", ({ nickname, message }) => {
  const div = document.createElement("div");
  div.textContent = `${nickname}: ${message}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

function draw(state) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  for (let id in players) {
    const p = players[id];
    const x = p.side === "left" ? 10 : canvas.width - 20;
    const y = p.y - 50;
    ctx.fillRect(x, y, 10, 100);

    if (player && id === player.id) {
      ctx.font = "12px Arial";
      ctx.fillStyle = "yellow";
      ctx.textAlign = p.side === "left" ? "left" : "right";
      ctx.fillText("YOU", p.side === "left" ? x + 12 : x - 4, y - 5);
      ctx.fillStyle = "white";
    }
  }

  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, 10, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.closePath();
}

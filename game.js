const socket = io('https://multi-pingpong-293cc4ba4236.herokuapp.com', {
  path: '/socket.io',
  transports: ['websocket']
});

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreDiv = document.getElementById("score");
const statusDiv = document.getElementById("status");
const countdownDiv = document.getElementById("countdown");
const readyBtn = document.getElementById("readyBtn");

let player = null;
let localPlayerY = 300;
let players = {};
let gameStarted = false;
let countdown = null;

socket.on("init", (data) => {
  player = data;
  players[player.id] = { y: player.y, side: player.side };
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

  if (state.countdown !== null) {
    countdownDiv.textContent = state.countdown > 0 ? state.countdown : "";
    statusDiv.textContent = "게임 준비 중...";
  } else {
    countdownDiv.textContent = "";
    statusDiv.textContent = state.winner ? `게임 종료! 승자: ${state.winner}` : "";
  }

  if (state.winner) {
    readyBtn.disabled = false;
    readyBtn.textContent = "다시 시작하려면 READY";
    gameStarted = false;
  }

  if (state.started) {
    gameStarted = true;
  }
});

document.addEventListener("mousemove", (e) => {
  if (!gameStarted) return;
  const rect = canvas.getBoundingClientRect();
  const y = e.clientY - rect.top;
  localPlayerY = Math.min(Math.max(y, 60), canvas.height - 60);
  socket.emit("move", localPlayerY);
});

readyBtn.addEventListener("click", () => {
  socket.emit("ready");
  readyBtn.disabled = true;
  readyBtn.textContent = "READY 완료!";
});

function draw(state) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let id in players) {
    const p = players[id];
    const x = p.side === "left" ? 20 : canvas.width - 40;
    ctx.fillStyle = "white";
    ctx.fillRect(x, p.y - 60, 20, 120);

    if (id === player?.id) {
      ctx.fillStyle = "#0f0";
      ctx.font = "16px sans-serif";
      ctx.fillText("YOU", x, p.y - 70);
    }
  }

  const ball = state.ball;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.closePath();
}

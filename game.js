const socket = io('https://multi-pingpong-293cc4ba4236.herokuapp.com', {
  path: '/socket.io',
  transports: ['websocket']
});

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreDiv = document.getElementById("score");
const statusDiv = document.getElementById("status");
const readyBtn = document.getElementById("readyBtn");
const countdownDiv = document.getElementById("countdown");

let player = null;
let localPlayerY = 200;
let players = {};
let gameStarted = false;

socket.on("init", (data) => {
  player = data;
  if (player.side === 'viewer') {
    statusDiv.textContent = '관전자 모드입니다.';
    readyBtn.style.display = 'none';
  }
});

socket.on("state", (state) => {
  players = { ...state.players };

  if (player?.side !== 'viewer' && players[player.id]) {
    players[player.id].y = localPlayerY;
  }

  draw(state);
  scoreDiv.textContent = `점수: ${state.scores.left} - ${state.scores.right}`;

  if (!state.started && !state.winner) {
    statusDiv.textContent = "게임 대기 중...";
  }

  if (state.winner) {
    statusDiv.textContent = `게임 종료! 승자: ${state.winner}`;
    readyBtn.disabled = false;
    readyBtn.textContent = "다시 시작하려면 READY";
    gameStarted = false;
  }
});

socket.on("countdown", (count) => {
  countdownDiv.textContent = count > 0 ? count : '';
});

socket.on("start", () => {
  countdownDiv.textContent = '';
  gameStarted = true;
});

readyBtn.addEventListener("click", () => {
  socket.emit("ready");
  readyBtn.disabled = true;
  readyBtn.textContent = "READY 완료!";
});

document.addEventListener("mousemove", (e) => {
  if (!gameStarted || player?.side === 'viewer') return;

  const rect = canvas.getBoundingClientRect();
  const y = e.clientY - rect.top;
  localPlayerY = Math.min(Math.max(y, 50), 350);
  socket.emit("move", localPlayerY);
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

    if (id === player?.id && player.side !== 'viewer') {
      ctx.fillStyle = "yellow";
      ctx.font = "14px Arial";
      const textX = p.side === "left" ? x : x - 28;
      ctx.fillText("YOU", textX, p.y - 60);
      ctx.fillStyle = "white";
    }
  }

  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, 10, 0, Math.PI * 2);
  ctx.fill();
}


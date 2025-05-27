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
let gameStarted = false;
let isSpectator = false;

let localPlayerY = 200;  // 클라이언트에서 즉시 반영하는 패들 Y
let players = {};        // 서버에서 받은 플레이어 위치

socket.on("init", (data) => {
  player = data;
  isSpectator = data.spectator;
  if (!isSpectator) {
    players[player.id] = { y: player.y, side: player.side };
  }
});

socket.on("full", () => {
  alert("방이 가득 찼습니다.");
});

socket.on("countdown", (number) => {
  countdownDiv.textContent = number > 0 ? number : "";
});

socket.on("state", (state) => {
  // 서버 플레이어 위치 복사
  players = { ...state.players };

  // 내 패들은 클라이언트에서 예측한 위치와 서버 위치를 보간
  if (player && players[player.id]) {
    const serverY = state.players[player.id]?.y ?? localPlayerY;
    // 부드러운 보간 (클라이언트 예측 위치에 가깝게 유지)
    players[player.id].y = players[player.id].y
      ? players[player.id].y * 0.8 + serverY * 0.2
      : serverY;

    // 내 패들 위치는 즉시 반영된 localPlayerY로 업데이트
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
      ctx.fillStyle = "#0f0";
      ctx.textAlign = "center";
      ctx.fillText("YOU", x + 5, p.y - 60);
    }
  }

  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, 10, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.closePath();
}

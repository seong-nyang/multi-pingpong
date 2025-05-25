const socket = io('https://multi-pingpong-293cc4ba4236.herokuapp.com', {
  path: '/socket.io',
  transports: ['websocket']
});

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreDiv = document.getElementById("score");
const statusDiv = document.getElementById("status");
const readyBtn = document.getElementById("readyBtn");

let player = null;
let gameStarted = false;

socket.on("init", (data) => {
  player = data;
});

socket.on("full", () => {
  alert("방이 가득 찼습니다.");
});

socket.on("state", (state) => {
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
  if (!gameStarted) return;
  const rect = canvas.getBoundingClientRect();
  const y = e.clientY - rect.top;
  socket.emit("move", y);
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

  // 배경 검정색
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 플레이어 패들
  ctx.fillStyle = "white";
  for (let id in state.players) {
    const p = state.players[id];
    let x = p.side === "left" ? 10 : canvas.width - 20;
    ctx.fillRect(x, p.y - 50, 10, 100);
  }

  // 공
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, 10, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.closePath();
}

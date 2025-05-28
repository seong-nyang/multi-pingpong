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

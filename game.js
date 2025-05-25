// game.js 주요 부분

let localPlayerY = 200;      // 클라이언트가 즉시 반영하는 패들 y 위치 (예측)
let serverPlayers = {};      // 서버에서 받은 플레이어 위치

// 마우스 움직임 시 즉시 패들 위치 업데이트 및 서버 전송
document.addEventListener("mousemove", (e) => {
  if (!gameStarted) return;

  const rect = canvas.getBoundingClientRect();
  const y = e.clientY - rect.top;
  localPlayerY = Math.min(Math.max(y, 50), 350);

  // 서버에 위치 전송
  socket.emit("move", localPlayerY);
});

// 서버에서 상태 받으면 서버 위치로 보간
socket.on("state", (state) => {
  serverPlayers = state.players;

  // 보간용 보정 - 플레이어 자신의 위치만 클라이언트 예측값과 서버값 중간값으로 처리
  if (player) {
    const serverY = state.players[player.id]?.y ?? localPlayerY;
    // 부드럽게 보간 (0.2 비율)
    players[player.id].y = players[player.id]?.y
      ? players[player.id].y * 0.8 + serverY * 0.2
      : serverY;

    // 자신의 패들 위치만 즉시 반영 localPlayerY 사용
    players[player.id].y = localPlayerY;
  }

  draw(state);

  // 나머지 UI 업데이트 생략...
});

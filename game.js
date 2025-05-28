function draw(state) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  for (let id in state.players) {
    const p = state.players[id];
    const x = p.side === "left" ? 10 : p.side === "right" ? canvas.width - 20 : null;
    if (x === null) continue;
    ctx.fillRect(x, p.y - 50, 10, 100);

    if (player && id === player.id) {
      ctx.fillStyle = "lime";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("YOU", x, p.y - 60);
      ctx.fillStyle = "white";
    }
  }

  // 공
  if (state.started) {
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.closePath();
  }
}

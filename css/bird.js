// bird.js

function drawBird(ctx, x, y) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 20, y - 10);
    ctx.lineTo(x + 40, y);
    ctx.lineTo(x + 20, y + 10);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.fill();
}

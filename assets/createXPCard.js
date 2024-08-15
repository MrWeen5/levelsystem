const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

// Registrar la fuente antes de crear el canvas
registerFont(path.join(__dirname, 'fonts/Inter-Regular.ttf'), { family: 'Inter' });
registerFont(path.join(__dirname, 'fonts/Inter-Bold.ttf'), { family: 'Inter', weight: 'bold' });

async function createXpCard(username, xp, level, nextLevelXP, rank, avatarURL, status) {
    const width = 886;
    const height = 210;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#131212';
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 20);
    ctx.fill();

    const avatar = await loadImage(avatarURL);
    ctx.save();
    ctx.beginPath();
    ctx.arc(97.5, 105.5, 80.5, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 17, 25, 161, 161);
    ctx.restore();

    // Determinar el color del punto de estado según el estado del usuario
    let statusColor;
    switch (status) {
        case 'online':
            statusColor = '#43B581'; // Verde
            break;
        case 'idle':
            statusColor = '#FAA61A'; // Amarillo
            break;
        case 'dnd':
            statusColor = '#F04747'; // Rojo
            break;
        case 'offline':
        case 'invisible':
            statusColor = '#747F8D'; // Gris
            break;
        default:
            statusColor = '#747F8D'; // Por defecto gris si el estado es desconocido
    }

    ctx.fillStyle = statusColor;
    ctx.beginPath();
    ctx.arc(160.5, 158.5, 19.5, 0, Math.PI * 2, true);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 39px Inter';
    ctx.fillText(username, 251, 122);

    ctx.font = '27px Inter';
    ctx.fillText(`${xp}/${nextLevelXP} XP`, 709, 133);

    ctx.fillText(`RANK #${rank}`, 597, 65);

    ctx.fillStyle = '#8A63FF';
    ctx.fillText(`LEVEL ${level}`, 754, 65);

    ctx.fillStyle = '#252A2F';
    ctx.beginPath();
    ctx.roundRect(234, 148, 632, 36, 18);
    ctx.fill();

    const xpPercentage = (xp / nextLevelXP) * 632;

    if (xpPercentage > 0) {
        ctx.fillStyle = '#8A63FF';
        ctx.beginPath();

        if (xpPercentage < 36) {
            ctx.roundRect(234, 148, xpPercentage, 36, { tl: 18, tr: 0, br: 0, bl: 18 });
        } else {
            ctx.roundRect(234, 148, xpPercentage, 36, 18);
        }

        ctx.fill();
    }

    return canvas.toBuffer();
}

module.exports = { createXpCard };

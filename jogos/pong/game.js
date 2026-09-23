const $ = (selector) => document.querySelector(selector);
const params = new URLSearchParams(location.search);
const role = params.get('role') || 'launcher';
const session = params.get('session') || crypto.randomUUID();
const runsGame = role === 'player' && params.get('host') === '1';
const canvas = $('#game-canvas');
const ctx = canvas.getContext('2d');
const channel = new BroadcastChannel(`window-pong:${session}`);

const ui = {
  landing: $('#landing'), game: $('#game'), menu: $('#game-menu'), coordinator: $('#coordinator'),
  status: $('#connection-status'), playerScore: $('#player-score'), botScore: $('#bot-score'),
  start: $('#start-game'), controls: $('#window-controls'), restart: $('#restart-game'), pause: $('#pause-game'),
  addBot: $('#add-bot'), addPlayer: $('#add-player'), addBall: $('#add-ball'), ballMenu: $('#ball-menu'),
};

const game = {
  mode: 'menu', time: 0, score: { player: 0, bot: 0 },
  windows: { bot: false, ball: false },
  world: { left: 0, top: 0, right: 1440, bottom: 900 },
  player: { x: 90, y: 270, w: 120, h: 212 },
  bot: { x: 1080, y: 270, w: 120, h: 212 },
  ball: { x: 620, y: 410, r: 44, vx: 420, vy: 188, style: 'tennis' },
  controls: { up: false, down: false },
};
let last = performance.now();
const manualDrag = { active: false, lastMovement: 0, lastAutoMove: 0, lastTargetX: null, lastTargetY: null, observedX: null, observedY: null };
const ballImages = Object.fromEntries(['tennis', 'soccer', 'baseball', 'eight-ball'].map((style) => {
  const image = new Image(); image.src = `./assets/balls/${style}.png`; return [style, image];
}));

function publish(type, payload = {}) { channel.postMessage({ type, from: role, ...payload }); }
function serialize() { return structuredClone(game); }
function hydrate(state) { Object.assign(game, state); updateScore(); }

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr); canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function setStatus(text, live = false) {
  if (!ui.status) return;
  ui.status.classList.toggle('live', live);
  ui.status.innerHTML = `<i></i> ${text}`;
}

function baseUrl() { return location.href.split('?')[0]; }
function objectUrl(object, host = false) {
  return `${baseUrl()}?role=${object}&session=${session}${host ? '&host=1' : ''}`;
}

function featureString(object) {
  const target = object === 'player' ? game.player : object === 'bot' ? game.bot : game.ball;
  const width = object === 'ball' ? 144 : 120;
  const height = object === 'ball' ? 144 : 280;
  const left = object === 'ball' ? target.x - 72 : target.x;
  const top = object === 'ball' ? target.y - 140 : target.y - 68;
  return `popup=yes,toolbar=no,location=no,menubar=no,status=no,width=${width},height=${height},left=${Math.round(left)},top=${Math.round(top)},resizable=no,scrollbars=no`;
}

function addObject(object) {
  if (object === 'player') {
    // The current player window already is the simulation host; this reasserts its position and focus.
    positionSelf(); window.focus(); return;
  }
  const popup = window.open(objectUrl(object), `window-pong-${object}`, featureString(object));
  if (!popup) {
    setStatus('LIBERE POP-UPS PARA ABRIR A JANELA', false);
    return false;
  }
  game.windows[object] = true;
  maybeStartMatch();
  publish('state', { state: serialize() });
  setStatus(`${object.toUpperCase()} ABERTO`, true);
  try { popup.focus(); } catch (_) {}
  return true;
}

function seedRound(resetScore = false) {
  // The desktop itself is the court: its usable edges are the full play area.
  game.world = { left: 0, top: 0, right: Math.max(900, screen.availWidth), bottom: Math.max(620, screen.availHeight) };
  game.player = { x: game.world.left + 12, y: Math.round((game.world.top + game.world.bottom - 212) / 2), w: 120, h: 212 };
  game.bot = { x: game.world.right - 132, y: Math.round((game.world.top + game.world.bottom - 212) / 2), w: 120, h: 212 };
  game.ball = { x: Math.round((game.world.left + game.world.right) / 2), y: Math.round((game.world.top + game.world.bottom) / 2), r: 44, vx: 420, vy: 188, style: game.ball.style || 'tennis' };
  if (resetScore) game.score = { player: 0, bot: 0 };
  game.mode = game.windows.bot && game.windows.ball ? 'playing' : 'waiting';
  updateScore();
}

function maybeStartMatch() {
  if (game.windows.bot && game.windows.ball && game.mode === 'waiting') {
    game.mode = 'playing';
  }
}

function resetBall(direction) {
  game.ball.x = Math.round((game.world.left + game.world.right) / 2);
  game.ball.y = Math.round((game.world.top + game.world.bottom) / 2);
  game.ball.vx = direction * (420 + 25 * (game.score.player + game.score.bot));
  game.ball.vy = Math.random() > .5 ? 188 : -188;
}

function selectBallStyle(style) {
  game.ball.style = style;
  ui.ballMenu.classList.add('hidden');
  publish('state', { state: serialize() });
  addObject('ball');
}

function togglePause() {
  if (game.mode === 'waiting') return;
  game.mode = game.mode === 'playing' ? 'paused' : 'playing';
  ui.pause.textContent = game.mode === 'paused' ? '▶' : 'Ⅱ';
  ui.pause.title = game.mode === 'paused' ? 'Continuar jogo' : 'Pausar jogo';
  publish('state', { state: serialize() });
}

function collideWith(paddle, movingRight) {
  const b = game.ball;
  const yOverlap = b.y + b.r > paddle.y && b.y - b.r < paddle.y + paddle.h;
  const xOverlap = movingRight
    ? b.x + b.r >= paddle.x && b.x < paddle.x
    : b.x - b.r <= paddle.x + paddle.w && b.x > paddle.x + paddle.w;
  if (!xOverlap || !yOverlap) return false;
  b.vx = (movingRight ? -1 : 1) * Math.abs(b.vx) * 1.025;
  b.vy += ((b.y - (paddle.y + paddle.h / 2)) / (paddle.h / 2)) * 150;
  b.x = movingRight ? paddle.x - b.r - 2 : paddle.x + paddle.w + b.r + 2;
  return true;
}

function updateScore() {
  if (ui.playerScore) ui.playerScore.textContent = String(game.score.player).padStart(2, '0');
  if (ui.botScore) ui.botScore.textContent = String(game.score.bot).padStart(2, '0');
}

function update(dt) {
  if (!runsGame || game.mode !== 'playing') return;
  if (game.controls.up) game.player.y -= 560 * dt;
  if (game.controls.down) game.player.y += 560 * dt;
  game.player.y = Math.max(game.world.top, Math.min(game.world.bottom - game.player.h, game.player.y));
  const botTarget = game.ball.y - game.bot.h / 2;
  game.bot.y += Math.max(-350 * dt, Math.min(350 * dt, botTarget - game.bot.y));
  game.bot.y = Math.max(game.world.top, Math.min(game.world.bottom - game.bot.h, game.bot.y));
  const b = game.ball;
  b.x += b.vx * dt; b.y += b.vy * dt;
  if (b.y - b.r < game.world.top) { b.y = game.world.top + b.r; b.vy = Math.abs(b.vy); }
  if (b.y + b.r > game.world.bottom) { b.y = game.world.bottom - b.r; b.vy = -Math.abs(b.vy); }
  if (b.vx < 0) collideWith(game.player, false); else collideWith(game.bot, true);
  if (b.x < game.world.left - 100) { game.score.bot++; resetBall(1); }
  if (b.x > game.world.right + 100) { game.score.player++; resetBall(-1); }
  game.time += dt; updateScore();
  publish('state', { state: serialize() });
}

function positionSelf() {
  if (role === 'launcher' || game.mode !== 'playing') return;
  const target = role === 'player' ? game.player : role === 'bot' ? game.bot : game.ball;
  const left = role === 'ball' ? target.x - 72 : target.x;
  const top = role === 'ball' ? target.y - 140 : target.y - 68;
  if (runsGame && manualDrag.active) return;
  const nextX = Math.round(left), nextY = Math.round(top);
  if (runsGame && manualDrag.lastTargetX === nextX && manualDrag.lastTargetY === nextY) return;
  try {
    window.moveTo(nextX, nextY);
    if (runsGame) {
      manualDrag.lastAutoMove = performance.now();
      manualDrag.lastTargetX = nextX;
      manualDrag.lastTargetY = nextY;
    }
  } catch (_) {}
}

function observeManualDrag(now) {
  if (!runsGame || game.mode !== 'playing') return;
  const currentX = window.screenX;
  const currentY = window.screenY + 68;
  const wasObserved = manualDrag.observedX !== null;
  const windowMoved = wasObserved && (Math.abs(currentX - manualDrag.observedX) > 4 || Math.abs(currentY - manualDrag.observedY) > 4);
  manualDrag.observedX = currentX; manualDrag.observedY = currentY;
  if (windowMoved && now - manualDrag.lastAutoMove > 90) {
    game.player.y = Math.max(game.world.top, Math.min(game.world.bottom - game.player.h, currentY));
    manualDrag.active = true;
    manualDrag.lastMovement = now;
  }
  if (manualDrag.active && now - manualDrag.lastMovement > 220) manualDrag.active = false;
}

function drawLauncher() {
  ctx.fillStyle = '#0d0e10'; ctx.fillRect(0, 0, innerWidth, innerHeight);
  ctx.strokeStyle = 'rgba(244,242,234,.09)';
  for (let x = 0; x < innerWidth; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, innerHeight); ctx.stroke(); }
  for (let y = 0; y < innerHeight; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(innerWidth, y); ctx.stroke(); }
}

function drawObject() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  if (role === 'player') {
    ctx.fillStyle = '#a7a7a7'; ctx.fillRect(0, 0, innerWidth, innerHeight);
    const centerX = innerWidth / 2, centerY = innerHeight * .34;
    ctx.strokeStyle = 'rgba(13,14,16,.22)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(12, centerY - 38); ctx.lineTo(innerWidth - 12, centerY - 38); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, centerY + 48); ctx.lineTo(innerWidth - 12, centerY + 48); ctx.stroke();
    ctx.fillStyle = 'rgba(13,14,16,.72)'; ctx.textAlign = 'center'; ctx.font = '10px DM Mono'; ctx.fillText('JOGADOR 01', centerX, centerY - 54);
    ctx.font = `bold ${Math.min(34, Math.max(23, innerWidth * .28))}px DM Mono`;
    ctx.fillText(`${String(game.score.player).padStart(2, '0')}—${String(game.score.bot).padStart(2, '0')}`, centerX, centerY + 6);
    ctx.font = '8px DM Mono';
    const instruction = game.mode === 'waiting' ? 'ABRA +E E +● ABAIXO' : 'W / S · ARRASTE';
    ctx.fillText(instruction, centerX, centerY + 31); ctx.textAlign = 'start';
  } else if (role === 'bot') {
    ctx.fillStyle = '#e95032'; ctx.fillRect(0, 0, innerWidth, innerHeight);
  } else {
    // The canvas intentionally remains transparent; only the ball is painted.
    const asset = ballImages[game.ball.style] || ballImages.tennis;
    const size = Math.min(innerWidth, innerHeight) * 1.06;
    if (asset.complete && asset.naturalWidth) ctx.drawImage(asset, (innerWidth - size) / 2, (innerHeight - size) / 2, size, size);
    else { ctx.fillStyle = '#d8ff3e'; ctx.beginPath(); ctx.arc(innerWidth / 2, innerHeight / 2, Math.min(innerWidth, innerHeight) * .48, 0, Math.PI * 2); ctx.fill(); }
  }
}

function render() { if (role === 'launcher') drawLauncher(); else drawObject(); }
function frame(now) { const dt = Math.min(.035, (now - last) / 1000); last = now; observeManualDrag(now); update(dt); positionSelf(); render(); requestAnimationFrame(frame); }

channel.onmessage = ({ data }) => {
  if (data.type === 'state' && !runsGame) hydrate(data.state);
  if (data.type === 'request-state' && runsGame) publish('state', { state: serialize() });
  if (data.type === 'ready' && runsGame && (data.object === 'bot' || data.object === 'ball')) {
    game.windows[data.object] = true;
    maybeStartMatch();
    publish('state', { state: serialize() });
  }
};

function launchGame() {
  seedRound(true);
  const player = window.open(objectUrl('player', true), 'window-pong-player', featureString('player'));
  if (!player) {
    setStatus('POP-UP BLOQUEADO — LIBERE PARA JOGAR', false);
    ui.start.textContent = 'LIBERAR POP-UP ↗';
    return;
  }
  try { player?.focus(); } catch (_) {}
  // A browser may refuse to close a manually opened tab. In that case it is visually retired instead.
  document.body.classList.add('launcher-finished');
  setTimeout(() => window.close(), 120);
}

function setupLauncher() {
  $('#open-game').addEventListener('click', () => { ui.landing.classList.add('hidden'); ui.game.classList.remove('hidden'); resize(); render(); });
  ui.start.addEventListener('click', launchGame);
  $('#sound-toggle').addEventListener('click', (event) => { event.currentTarget.textContent = event.currentTarget.textContent.endsWith('ON') ? 'SOM: OFF' : 'SOM: ON'; });
}

function setupObjectWindow() {
  document.body.classList.add('satellite', `satellite-${role}`);
  document.title = role === 'player' ? 'Window Pong / Você' : role === 'bot' ? 'Window Pong / Adversário' : 'Window Pong / Bola';
  ui.landing.classList.add('hidden'); ui.game.classList.remove('hidden');
  $('.top-ui').classList.add('hidden'); ui.menu.classList.add('hidden'); ui.coordinator.classList.add('hidden');
  if (runsGame) {
    seedRound(true); ui.controls.classList.remove('hidden');
    ui.restart.addEventListener('click', () => { seedRound(true); publish('state', { state: serialize() }); });
    ui.pause.addEventListener('click', togglePause);
    ui.addBot.addEventListener('click', () => addObject('bot'));
    ui.addPlayer.addEventListener('click', () => addObject('player'));
    ui.addBall.addEventListener('click', () => ui.ballMenu.classList.toggle('hidden'));
    ui.ballMenu.querySelectorAll('[data-ball-style]').forEach((button) => button.addEventListener('click', () => selectBallStyle(button.dataset.ballStyle)));
    const setInput = (event, pressed) => {
      const control = ['ArrowUp', 'w', 'W'].includes(event.key) ? 'up' : ['ArrowDown', 's', 'S'].includes(event.key) ? 'down' : null;
      if (!control) return;
      event.preventDefault(); manualDrag.active = false; game.controls[control] = pressed;
    };
    addEventListener('keydown', (event) => setInput(event, true));
    addEventListener('keyup', (event) => setInput(event, false));
    addEventListener('blur', () => { game.controls.up = false; game.controls.down = false; });
    publish('state', { state: serialize() });
  } else {
    publish('ready', { object: role });
    publish('request-state');
  }
}

window.render_game_to_text = () => JSON.stringify({
  coordinateSystem: 'Shared desktop pixels. Each object window positions itself: x moves right, y moves down.',
  role, simulationHost: runsGame, mode: game.mode, windows: game.windows, score: game.score, player: game.player, bot: game.bot, ball: game.ball,
});
window.advanceTime = (ms) => { for (let i = 0; i < Math.max(1, Math.round(ms / (1000 / 60))); i++) update(1 / 60); positionSelf(); render(); };

addEventListener('resize', resize); resize();
if (role === 'launcher') setupLauncher(); else setupObjectWindow();
requestAnimationFrame(frame);

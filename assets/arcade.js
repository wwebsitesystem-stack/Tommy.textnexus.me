(function () {
  "use strict";

  var arcade = document.querySelector("[data-arcade]");
  if (!arcade) return;

  var canvas = arcade.querySelector("canvas");
  var ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  if (!ctx) {
    var fallback = arcade.querySelector("[data-overlay-message]");
    if (fallback) fallback.textContent = "This browser cannot run the tribute course.";
    return;
  }

  function readNumber(name, fallback) {
    var value = parseFloat(arcade.getAttribute("data-" + name));
    return isFinite(value) ? value : fallback;
  }

  var config = {
    version: arcade.getAttribute("data-version") || "Archive",
    speed: Math.max(180, readNumber("speed", 360)),
    gapMin: Math.max(200, readNumber("gap-min", 300)),
    gapMax: Math.max(240, readNumber("gap-max", 430)),
    length: Math.max(2000, readNumber("length", 5600)),
    seed: readNumber("seed", 1),
    accent: arcade.getAttribute("data-accent") || "#ffd76a",
    difficulty: arcade.getAttribute("data-difficulty") || "Normal"
  };

  var PLAYER = 32;
  var PLAYER_X = 92;
  var GRAVITY = 2500;
  var JUMP_VELOCITY = 925;
  var STORAGE_KEY = "tommy-gd-era-best-" + config.version.toLowerCase();

  var overlay = arcade.querySelector("[data-overlay]");
  var overlayTitle = arcade.querySelector("[data-overlay-title]");
  var overlayMessage = arcade.querySelector("[data-overlay-message]");
  var startButton = arcade.querySelector("[data-start]");
  var resetButton = arcade.querySelector("[data-reset]");
  var bestNode = arcade.querySelector("[data-best]");
  var attemptsNode = arcade.querySelector("[data-attempts]");
  var progressNode = arcade.querySelector("[data-progress]");
  var progressBar = arcade.querySelector(".arcade-progress");

  var state = {
    mode: "idle",
    distance: 0,
    jump: 0,
    velocity: 0,
    grounded: true,
    rotation: 0,
    elapsed: 0,
    percent: 0,
    attempts: 0,
    best: readBest(),
    obstacles: [],
    dust: []
  };

  var width = 0;
  var height = 0;
  var groundY = 0;
  var dpr = 1;
  var raf = 0;
  var lastFrame = 0;

  function readBest() {
    try {
      var stored = parseFloat(window.localStorage.getItem(STORAGE_KEY));
      return isFinite(stored) && stored > 0 ? stored : 0;
    } catch (error) {
      return 0;
    }
  }

  function writeBest(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(value));
    } catch (error) {
      /* Storage can be unavailable in private modes. */
    }
  }

  function formatTime(value) {
    return value > 0 ? value.toFixed(1) + "s" : "—";
  }

  function updateStats() {
    if (bestNode) bestNode.textContent = formatTime(state.best);
    if (attemptsNode) attemptsNode.textContent = String(state.attempts);
  }

  function setProgress(percent) {
    state.percent = Math.max(0, Math.min(100, percent));
    if (progressNode) progressNode.style.width = state.percent.toFixed(1) + "%";
    if (progressBar) progressBar.setAttribute("aria-valuenow", String(Math.round(state.percent)));
  }

  function random(seed) {
    var value = seed >>> 0;
    return function () {
      value += 0x6d2b79f5;
      var t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildCourse() {
    var next = random(config.seed * 9973 + 17);
    var obstacles = [];
    var position = 620;

    while (position < config.length - 380) {
      var roll = next();
      var type = roll < 0.56 ? "spike" : roll < 0.8 ? "block" : "double";
      var obstacleWidth = type === "double" ? 54 : type === "block" ? 44 : 30;
      var obstacleHeight = type === "block" ? 46 : 38;
      obstacles.push({
        x: position,
        type: type,
        width: obstacleWidth,
        height: obstacleHeight
      });
      position += config.gapMin + next() * (config.gapMax - config.gapMin);
    }

    return obstacles;
  }

  function colorWithAlpha(hex, alpha) {
    var clean = hex.replace("#", "");
    if (clean.length === 3) {
      clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
    }
    var number = parseInt(clean, 16);
    if (!isFinite(number)) return "rgba(255, 215, 106, " + alpha + ")";
    return (
      "rgba(" +
      ((number >> 16) & 255) +
      ", " +
      ((number >> 8) & 255) +
      ", " +
      (number & 255) +
      ", " +
      alpha +
      ")"
    );
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    width = Math.max(300, rect.width);
    height = Math.max(210, rect.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    groundY = height - 54;
    draw();
  }

  function addDust(amount, strength) {
    for (var i = 0; i < amount; i += 1) {
      state.dust.push({
        x: PLAYER_X + PLAYER / 2 + (Math.random() - 0.5) * 20,
        y: groundY - Math.random() * 5,
        vx: -40 - Math.random() * 100 * strength,
        vy: -20 - Math.random() * 70 * strength,
        life: 0.45 + Math.random() * 0.35,
        age: 0
      });
    }
  }

  function drawBackground() {
    var background = ctx.createLinearGradient(0, 0, 0, height);
    background.addColorStop(0, "#0d0a07");
    background.addColorStop(0.62, "#080604");
    background.addColorStop(1, "#0b0805");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    var glow = ctx.createRadialGradient(
      width * 0.5,
      groundY,
      0,
      width * 0.5,
      groundY,
      width * 0.75
    );
    glow.addColorStop(0, colorWithAlpha(config.accent, 0.1));
    glow.addColorStop(1, colorWithAlpha(config.accent, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    var grid = 64;
    var offset = (state.distance * 0.24) % grid;
    ctx.lineWidth = 1;
    ctx.strokeStyle = colorWithAlpha(config.accent, 0.05);
    ctx.beginPath();
    for (var x = -offset; x < width + grid; x += grid) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, groundY);
    }
    for (var y = groundY - grid; y > 0; y -= grid) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    var parallaxOffset = (state.distance * 0.12) % 240;
    ctx.fillStyle = colorWithAlpha(config.accent, 0.035);
    for (var i = -1; i < width / 240 + 2; i += 1) {
      var barX = i * 240 - parallaxOffset;
      var barHeight = 40 + ((i * 37) % 70);
      ctx.fillRect(barX + 30, groundY - 54 - barHeight, 1, barHeight);
      ctx.fillRect(barX + 52, groundY - 54 - barHeight * 0.65, 1, barHeight * 0.65);
    }

    ctx.fillStyle = "#0c0906";
    ctx.fillRect(0, groundY, width, height - groundY);
    ctx.strokeStyle = colorWithAlpha(config.accent, 0.7);
    ctx.beginPath();
    ctx.moveTo(0, groundY + 0.5);
    ctx.lineTo(width, groundY + 0.5);
    ctx.stroke();

    var tickOffset = state.distance % 34;
    ctx.strokeStyle = colorWithAlpha(config.accent, 0.16);
    ctx.beginPath();
    for (var tick = -tickOffset; tick < width + 34; tick += 34) {
      ctx.moveTo(tick, groundY + 10);
      ctx.lineTo(tick, groundY + 16);
    }
    ctx.stroke();
  }

  function drawFinish() {
    var finishX = PLAYER_X + (config.length - state.distance);
    if (finishX > width + 30) return;

    var top = groundY - 118;
    ctx.fillStyle = colorWithAlpha(config.accent, 0.12);
    ctx.fillRect(finishX, top, 8, groundY - top);
    ctx.fillStyle = config.accent;
    for (var row = 0; row < 9; row += 1) {
      if (row % 2 === 0) ctx.fillRect(finishX, top + row * 13, 8, 13);
    }
    ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillStyle = colorWithAlpha(config.accent, 0.8);
    ctx.textAlign = "center";
    ctx.fillText("FINISH", finishX + 4, top - 10);
    ctx.textAlign = "left";
  }

  function drawSpike(x, baseY, spikeWidth, spikeHeight) {
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x + spikeWidth / 2, baseY - spikeHeight);
    ctx.lineTo(x + spikeWidth, baseY);
    ctx.closePath();
    ctx.fillStyle = colorWithAlpha(config.accent, 0.16);
    ctx.fill();
    ctx.strokeStyle = colorWithAlpha(config.accent, 0.92);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + spikeWidth / 2, baseY - spikeHeight + 7);
    ctx.lineTo(x + spikeWidth - 8, baseY - 3);
    ctx.lineTo(x + 8, baseY - 3);
    ctx.closePath();
    ctx.fillStyle = colorWithAlpha(config.accent, 0.22);
    ctx.fill();
  }

  function drawBlock(x, baseY, blockWidth, blockHeight) {
    ctx.fillStyle = "#141009";
    ctx.fillRect(x, baseY - blockHeight, blockWidth, blockHeight);
    ctx.strokeStyle = colorWithAlpha(config.accent, 0.9);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.75, baseY - blockHeight + 0.75, blockWidth - 1.5, blockHeight - 1.5);
    ctx.fillStyle = colorWithAlpha(config.accent, 0.14);
    ctx.fillRect(x + 7, baseY - blockHeight + 8, blockWidth - 14, 2);
  }

  function drawObstacles() {
    for (var i = 0; i < state.obstacles.length; i += 1) {
      var obstacle = state.obstacles[i];
      var x = PLAYER_X + (obstacle.x - state.distance);
      if (x > width + 80 || x + obstacle.width < -40) continue;
      if (obstacle.type === "block") {
        drawBlock(x, groundY, obstacle.width, obstacle.height);
      } else if (obstacle.type === "double") {
        drawSpike(x, groundY, 26, obstacle.height);
        drawSpike(x + 28, groundY, 26, obstacle.height);
      } else {
        drawSpike(x, groundY, obstacle.width, obstacle.height);
      }
    }
  }

  function drawPlayer() {
    var top = groundY - PLAYER - state.jump;
    var centerX = PLAYER_X + PLAYER / 2;
    var centerY = top + PLAYER / 2;
    var airborne = !state.grounded;

    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(centerX, groundY + 5, 20 - state.jump * 0.04, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(airborne ? state.rotation : 0);

    ctx.fillStyle = "#f6f1e3";
    ctx.fillRect(-PLAYER / 2, -PLAYER / 2, PLAYER, PLAYER);
    ctx.strokeStyle = config.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(-PLAYER / 2 + 1, -PLAYER / 2 + 1, PLAYER - 2, PLAYER - 2);

    ctx.fillStyle = "#080604";
    ctx.fillRect(-7, -6, 5, 5);
    ctx.fillRect(3, -6, 5, 5);
    ctx.fillStyle = colorWithAlpha(config.accent, 0.9);
    ctx.fillRect(-4, 5, 9, 2);

    ctx.restore();
  }

  function drawDust() {
    for (var i = 0; i < state.dust.length; i += 1) {
      var particle = state.dust[i];
      var alpha = Math.max(0, 1 - particle.age / particle.life);
      ctx.fillStyle = colorWithAlpha(config.accent, alpha * 0.5);
      ctx.fillRect(particle.x, particle.y, 2, 2);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    drawBackground();
    drawFinish();
    drawObstacles();
    drawDust();
    drawPlayer();
  }

  function jump() {
    if (state.mode !== "running" || !state.grounded) return;
    state.grounded = false;
    state.velocity = JUMP_VELOCITY;
    addDust(7, 0.8);
  }

  function fail() {
    if (state.mode !== "running") return;
    state.mode = "lost";
    cancelAnimationFrame(raf);
    setProgress((state.distance / config.length) * 100);
    showOverlay("lost");
  }

  function win() {
    if (state.mode !== "running") return;
    state.mode = "won";
    state.elapsed = state.distance / config.speed;
    setProgress(100);
    if (!state.best || state.elapsed < state.best) {
      state.best = state.elapsed;
      writeBest(state.best);
      updateStats();
    }
    cancelAnimationFrame(raf);
    showOverlay("won");
  }

  function update(dt) {
    state.elapsed += dt;
    state.distance += config.speed * dt;

    if (!state.grounded) {
      state.velocity -= GRAVITY * dt;
      state.jump += state.velocity * dt;
      state.rotation += 8.4 * dt;
      if (state.jump <= 0) {
        state.jump = 0;
        state.velocity = 0;
        state.grounded = true;
        state.rotation = Math.round(state.rotation / (Math.PI / 2)) * (Math.PI / 2);
        addDust(6, 0.6);
      }
    }

    for (var i = state.dust.length - 1; i >= 0; i -= 1) {
      var particle = state.dust[i];
      particle.age += dt;
      if (particle.age >= particle.life) {
        state.dust.splice(i, 1);
        continue;
      }
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 180 * dt;
    }

    var playerTop = groundY - PLAYER - state.jump;
    var playerBottom = playerTop + PLAYER;
    var playerLeft = PLAYER_X;
    var playerRight = PLAYER_X + PLAYER;

    for (var j = 0; j < state.obstacles.length; j += 1) {
      var obstacle = state.obstacles[j];
      var screenX = PLAYER_X + (obstacle.x - state.distance);
      if (screenX > playerRight + 40 || screenX + obstacle.width < playerLeft - 40) {
        continue;
      }

      var inset = obstacle.type === "block" ? 0 : obstacle.type === "double" ? 9 : 6;
      var obstacleTop =
        obstacle.type === "block" ? groundY - obstacle.height : groundY - obstacle.height + 12;
      if (
        playerRight > screenX + inset &&
        playerLeft < screenX + obstacle.width - inset &&
        playerBottom > obstacleTop &&
        playerTop < groundY
      ) {
        fail();
        return;
      }
    }

    setProgress((state.distance / config.length) * 100);

    if (state.distance >= config.length) {
      win();
    }
  }

  function frame(time) {
    if (state.mode !== "running") return;
    if (!lastFrame) lastFrame = time;
    var dt = Math.min(0.034, (time - lastFrame) / 1000);
    lastFrame = time;
    update(dt);
    if (state.mode === "running") {
      draw();
      raf = requestAnimationFrame(frame);
    }
  }

  function showOverlay(kind) {
    if (!overlay) return;
    overlay.classList.remove("is-hidden");
    var title = "Run the " + config.version + " course";
    var message = "Clear the line to log a time.";
    var button = "Start run";

    if (kind === "lost") {
      title = "Run ended at " + Math.round(state.percent) + "%";
      message = "The line held. Reset and try the course again.";
      button = "Retry run";
    } else if (kind === "won") {
      title = "Course cleared";
      message =
        "You finished in " +
        state.elapsed.toFixed(1) +
        "s. Best " +
        state.best.toFixed(1) +
        "s on this browser.";
      button = "Run it again";
    } else if (kind === "paused") {
      title = "Run paused";
      message = "The archive will wait. Jump back in when you are ready.";
      button = "Resume run";
    }

    if (overlayTitle) overlayTitle.textContent = title;
    if (overlayMessage) overlayMessage.textContent = message;
    if (startButton) startButton.textContent = button;
  }

  function start() {
    cancelAnimationFrame(raf);
    state.mode = "running";
    state.distance = 0;
    state.jump = 0;
    state.velocity = 0;
    state.grounded = true;
    state.rotation = 0;
    state.elapsed = 0;
    state.percent = 0;
    state.obstacles = buildCourse();
    state.dust = [];
    state.attempts += 1;
    updateStats();
    setProgress(0);
    lastFrame = 0;
    if (overlay) overlay.classList.add("is-hidden");
    draw();
    raf = requestAnimationFrame(frame);
  }

  function resume() {
    if (state.mode !== "paused") return;
    state.mode = "running";
    lastFrame = 0;
    if (overlay) overlay.classList.add("is-hidden");
    raf = requestAnimationFrame(frame);
  }

  function pause() {
    if (state.mode !== "running") return;
    state.mode = "paused";
    cancelAnimationFrame(raf);
    showOverlay("paused");
  }

  if (startButton) {
    startButton.addEventListener("click", function () {
      if (state.mode === "paused") {
        resume();
      } else {
        start();
      }
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", start);
  }

  canvas.addEventListener("pointerdown", function (event) {
    if (state.mode === "running") {
      event.preventDefault();
      jump();
    }
  });

  window.addEventListener("keydown", function (event) {
    if (event.code !== "Space" && event.code !== "ArrowUp" && event.code !== "KeyW") return;
    if (state.mode !== "running") return;
    var target = event.target;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
    event.preventDefault();
    jump();
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pause();
  });

  window.addEventListener("resize", resize);

  // Read-only hook for the archive's own smoke tests and debugging.
  window.__tommyArcade = {
    getConfig: function () {
      return config;
    },
    getState: function () {
      return {
        mode: state.mode,
        distance: state.distance,
        percent: state.percent,
        attempts: state.attempts,
        best: state.best,
        grounded: state.grounded,
        elapsed: state.elapsed,
        obstacles: state.obstacles.slice()
      };
    },
    start: start,
    jump: jump
  };

  updateStats();
  resize();
  showOverlay("idle");
})();

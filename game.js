// ============================================================
// Camper Quest – Vertical Slice Prototype
// Claymation family road trip with foam fights & mild crime
// ============================================================

(() => {
  // ---------- State ----------
  const state = {
    screen: "title",
    playerRole: "sister",
    familySize: 4,
    family: [],
    resources: {
      gas: 80,
      food: 60,
      money: 120,
      morale: 75,
      heat: 0,
      vehicle: 90
    },
    inventory: [
      { id: "foam_gun", name: "Foam Dart Blaster", qty: 1 },
      { id: "darts", name: "Foam Darts", qty: 12 },
      { id: "snacks", name: "Road Snacks", qty: 3 },
      { id: "map", name: "Crumpled Map", qty: 1 }
    ],
    currentDest: null,
    flags: {
      visitedReststop: false,
      stolenCooler: false,
      policeTriggered: false
    }
  };

  // ---------- DOM ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const screens = {
    title: $("#screen-title"),
    family: $("#screen-family"),
    hub: $("#screen-hub"),
    map: $("#screen-map"),
    fps: $("#screen-fps")
  };

  // ---------- Screen Management ----------
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove("active"));
    if (screens[name]) {
      screens[name].classList.add("active");
      state.screen = name;
    }
    if (name === "hub") updateHub();
    if (name === "fps") startFPS();
  }

  // ---------- Family ----------
  function buildFamily() {
    const roles = ["Dad", "Mom", "Younger Brother", "Little Sister", "Cousin", "Baby"];
    state.family = [{ role: state.playerRole, isPlayer: true, name: "You" }];
    for (let i = 1; i < state.familySize; i++) {
      state.family.push({
        role: roles[i - 1] || `Family Member ${i}`,
        isPlayer: false,
        name: roles[i - 1] || `Member ${i}`
      });
    }
  }

  // ---------- Hub ----------
  function updateHub() {
    $("#res-gas").textContent = state.resources.gas;
    $("#res-food").textContent = state.resources.food;
    $("#res-money").textContent = state.resources.money;
    $("#res-morale").textContent = state.resources.morale;
    $("#res-heat").textContent = state.resources.heat;

    const names = state.family.map(f => f.isPlayer ? `You (${f.role})` : f.name).join(", ");
    $("#family-status").textContent = `Family (${state.familySize}): ${names}`;
  }

  function addLog(msg) {
    const log = $("#hub-log");
    log.innerHTML = `<div>${msg}</div>` + log.innerHTML;
  }

  // ---------- Dialogue System ----------
  function showDialogue(speaker, text, choices = []) {
    $("#dialogue-speaker").textContent = speaker;
    $("#dialogue-text").textContent = text;
    const box = $("#dialogue-choices");
    box.innerHTML = "";
    if (choices.length === 0) {
      const btn = document.createElement("button");
      btn.textContent = "Continue";
      btn.onclick = () => hideDialogue();
      box.appendChild(btn);
    } else {
      choices.forEach(c => {
        const btn = document.createElement("button");
        btn.textContent = c.label;
        btn.onclick = () => {
          hideDialogue();
          if (c.action) c.action();
        };
        box.appendChild(btn);
      });
    }
    $("#overlay-dialogue").classList.remove("hidden");
  }

  function hideDialogue() {
    $("#overlay-dialogue").classList.add("hidden");
  }

  // ---------- Inventory ----------
  function openInventory() {
    const list = $("#inventory-list");
    list.innerHTML = "";
    state.inventory.forEach(item => {
      const div = document.createElement("div");
      div.className = "inv-item";
      div.innerHTML = `<span>${item.name}</span><span>×${item.qty}</span>`;
      list.appendChild(div);
    });
    $("#overlay-inventory").classList.remove("hidden");
  }

  function closeInventory() {
    $("#overlay-inventory").classList.add("hidden");
  }

  // ---------- FPS / Raycaster ----------
  const canvas = $("#game-canvas");
  const ctx = canvas.getContext("2d");
  let width, height;

  // Simple map (1 = wall, 0 = empty, 2 = interactable, 3 = door/exit, 4 = NPC, 5 = crime target)
  // Rest Stop layout
  const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,1,1,0,0,0,0,0,1,1,0,0,0,1],
    [1,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1],
    [1,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1], // 2 = cooler (crime)
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,4,0,0,1], // 4 = NPC
    [1,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1],
    [1,0,0,1,1,0,0,0,0,0,1,1,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,3,0,0,0,0,0,0,0,0,1], // 3 = exit back
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ];

  const mapWidth = map[0].length;
  const mapHeight = map.length;
  const tileSize = 64;

  let player = {
    x: 2.5 * tileSize,
    y: 2.5 * tileSize,
    angle: 0,
    fov: Math.PI / 3,
    speed: 2.2,
    turnSpeed: 0.045
  };

  let keys = {};
  let moveX = 0, moveY = 0; // joystick
  let lookDelta = 0;
  let shooting = false;
  let ammo = 12;
  let lastShot = 0;

  // Simple enemies / targets for foam
  let targets = [
    { x: 10.5 * tileSize, y: 7.5 * tileSize, alive: true, type: "rival" }
  ];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function castRay(rayAngle) {
    const sin = Math.sin(rayAngle);
    const cos = Math.cos(rayAngle);
    let dist = 0;
    const step = 2;
    let hit = 0;
    let hitX = 0, hitY = 0;

    while (dist < 600) {
      dist += step;
      const testX = player.x + cos * dist;
      const testY = player.y + sin * dist;
      const mapX = Math.floor(testX / tileSize);
      const mapY = Math.floor(testY / tileSize);

      if (mapX < 0 || mapX >= mapWidth || mapY < 0 || mapY >= mapHeight) {
        hit = 1;
        break;
      }
      const cell = map[mapY][mapX];
      if (cell === 1) {
        hit = 1;
        hitX = testX;
        hitY = testY;
        break;
      }
      if (cell === 2 || cell === 3 || cell === 4 || cell === 5) {
        // soft hit for interactables – still draw as wall-ish but we handle separately
      }
    }
    return { dist, hit, hitX, hitY };
  }

  function renderFPS() {
    // Sky & floor
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, width, height / 2);
    ctx.fillStyle = "#5D4037";
    ctx.fillRect(0, height / 2, width, height / 2);

    const numRays = Math.min(width, 320); // performance
    const rayStep = player.fov / numRays;

    for (let i = 0; i < numRays; i++) {
      const rayAngle = player.angle - player.fov / 2 + rayStep * i;
      const { dist } = castRay(rayAngle);
      const corrected = dist * Math.cos(rayAngle - player.angle);
      const wallHeight = Math.min(height, (tileSize * 280) / (corrected + 0.1));

      const shade = Math.max(40, 200 - corrected * 0.35);
      ctx.fillStyle = `rgb(${shade * 0.6}, ${shade * 0.4}, ${shade * 0.25})`;
      const x = (i / numRays) * width;
      const w = width / numRays + 1;
      ctx.fillRect(x, (height - wallHeight) / 2, w, wallHeight);
    }

    // Simple target sprites (billboard-ish)
    targets.forEach(t => {
      if (!t.alive) return;
      const dx = t.x - player.x;
      const dy = t.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 20 || dist > 500) return;

      let angleTo = Math.atan2(dy, dx) - player.angle;
      while (angleTo > Math.PI) angleTo -= Math.PI * 2;
      while (angleTo < -Math.PI) angleTo += Math.PI * 2;

      if (Math.abs(angleTo) < player.fov / 1.5) {
        const size = Math.min(180, (tileSize * 180) / dist);
        const screenX = width / 2 + (angleTo / player.fov) * width - size / 2;
        const screenY = height / 2 - size / 3;
        ctx.fillStyle = t.type === "rival" ? "#e74c3c" : "#9b59b6";
        ctx.beginPath();
        ctx.arc(screenX + size / 2, screenY + size / 2, size / 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = `${Math.max(12, size / 4)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("Rival", screenX + size / 2, screenY - 4);
      }
    });

    // Crosshair already in HTML
  }

  function updatePlayer(dt) {
    // Joystick movement
    if (moveX !== 0 || moveY !== 0) {
      const moveAngle = player.angle + Math.atan2(moveX, -moveY);
      const speed = player.speed * (dt / 16);
      const newX = player.x + Math.cos(moveAngle) * speed * Math.hypot(moveX, moveY);
      const newY = player.y + Math.sin(moveAngle) * speed * Math.hypot(moveX, moveY);

      const mapX = Math.floor(newX / tileSize);
      const mapY = Math.floor(player.y / tileSize);
      if (map[mapY] && map[mapY][mapX] !== 1) player.x = newX;

      const mapX2 = Math.floor(player.x / tileSize);
      const mapY2 = Math.floor(newY / tileSize);
      if (map[mapY2] && map[mapY2][mapX2] !== 1) player.y = newY;
    }

    // Keyboard fallback
    if (keys["ArrowLeft"] || keys["a"]) player.angle -= player.turnSpeed;
    if (keys["ArrowRight"] || keys["d"]) player.angle += player.turnSpeed;
    if (keys["ArrowUp"] || keys["w"]) {
      player.x += Math.cos(player.angle) * player.speed;
      player.y += Math.sin(player.angle) * player.speed;
    }
    if (keys["ArrowDown"] || keys["s"]) {
      player.x -= Math.cos(player.angle) * player.speed;
      player.y -= Math.sin(player.angle) * player.speed;
    }

    player.angle += lookDelta;
    lookDelta *= 0.7; // dampen
  }

  function tryShoot() {
    const now = performance.now();
    if (now - lastShot < 280 || ammo <= 0) return;
    lastShot = now;
    ammo--;
    $("#ammo-count").textContent = ammo;

    // Hit test against targets
    targets.forEach(t => {
      if (!t.alive) return;
      const dx = t.x - player.x;
      const dy = t.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let angleTo = Math.atan2(dy, dx) - player.angle;
      while (angleTo > Math.PI) angleTo -= Math.PI * 2;
      while (angleTo < -Math.PI) angleTo += Math.PI * 2;

      if (Math.abs(angleTo) < 0.25 && dist < 350) {
        t.alive = false;
        showMessage("Direct hit! Foam everywhere.");
        state.resources.morale = Math.min(100, state.resources.morale + 5);
        setTimeout(() => {
          showDialogue("Rival Camper", "Hey! Watch it with that foam! ...Okay, that was actually pretty fun.", [
            { label: "Offer a truce snack", action: () => {
              state.resources.food = Math.max(0, state.resources.food - 1);
              state.resources.morale = Math.min(100, state.resources.morale + 8);
              showMessage("You shared snacks. Morale up!");
            }},
            { label: "Laugh and walk away", action: () => showMessage("They wipe foam off their face, grumbling.") }
          ]);
        }, 600);
      }
    });

    if (ammo <= 0) showMessage("Out of foam darts!");
  }

  function tryInteract() {
    // Check nearby map cells
    const checkDist = tileSize * 1.4;
    const dirs = [
      [Math.cos(player.angle), Math.sin(player.angle)],
      [Math.cos(player.angle + 0.4), Math.sin(player.angle + 0.4)],
      [Math.cos(player.angle - 0.4), Math.sin(player.angle - 0.4)]
    ];

    for (const [dx, dy] of dirs) {
      const tx = player.x + dx * checkDist;
      const ty = player.y + dy * checkDist;
      const mx = Math.floor(tx / tileSize);
      const my = Math.floor(ty / tileSize);
      if (!map[my] || map[my][mx] === undefined) continue;
      const cell = map[my][mx];

      if (cell === 2) { // Cooler – crime opportunity
        if (state.flags.stolenCooler) {
          showMessage("The cooler is already empty.");
          return;
        }
        showDialogue("Tempting Cooler", "Someone left a fully stocked cooler unattended. The lid is slightly open...", [
          { label: "Leave it alone (good)", action: () => {
            state.resources.morale = Math.min(100, state.resources.morale + 3);
            showMessage("You resist temptation. Mom would be proud.");
          }},
          { label: "Quietly take some snacks (crime)", action: () => {
            state.flags.stolenCooler = true;
            state.resources.food += 8;
            state.resources.heat += 15;
            state.inventory.push({ id: "stolen_soda", name: "Suspicious Soda", qty: 2 });
            showMessage("You grab snacks. Heat increased. Someone might notice...");
            // Chance to trigger police later
            if (Math.random() > 0.4) {
              setTimeout(() => triggerPolice("Someone reported a cooler theft."), 2500);
            }
          }},
          { label: "Foam-tag the cooler as a joke", action: () => {
            state.resources.heat += 5;
            showMessage("You leave a foam signature. Petty, but funny.");
          }}
        ]);
        return;
      }

      if (cell === 3) { // Exit
        showDialogue("Camper", "Head back to the camper?", [
          { label: "Yes, return", action: () => {
            stopFPS();
            showScreen("hub");
            addLog("Returned from the rest stop.");
            if (!state.flags.visitedReststop) {
              state.flags.visitedReststop = true;
              state.resources.morale = Math.min(100, state.resources.morale + 10);
              addLog("Scrapbook: Rest Stop memory added!");
            }
          }},
          { label: "Keep exploring", action: () => {} }
        ]);
        return;
      }

      if (cell === 4) { // NPC
        showDialogue("Rest Stop Regular", "You folks look like you've been on the road a while. Watch out for the campground down the way — things go missing at night.", [
          { label: "Ask about the cooler", action: () => {
            showDialogue("Rest Stop Regular", "That cooler? Belongs to a family from two spots over. They're... particular about their snacks.", [
              { label: "Got it", action: () => {} }
            ]);
          }},
          { label: "Thanks for the tip", action: () => {
            state.resources.morale = Math.min(100, state.resources.morale + 2);
          }}
        ]);
        return;
      }
    }
    showMessage("Nothing to interact with here.");
  }

  function triggerPolice(reason) {
    if (state.flags.policeTriggered) return;
    state.flags.policeTriggered = true;
    showDialogue("Officer Clay", reason + " Mind explaining yourself?", [
      { label: "Talk your way out", action: () => {
        const success = state.resources.morale > 50 || Math.random() > 0.45;
        if (success) {
          state.resources.heat = Math.max(0, state.resources.heat - 10);
          showDialogue("Officer Clay", "Alright... I'll let it slide this time. Keep your foam to yourselves.", [
            { label: "Yes sir", action: () => showMessage("You talked your way out. Heat reduced a bit.") }
          ]);
        } else {
          showDialogue("Officer Clay", "Nice try. That's a fine.", [
            { label: "Pay the fine ($25)", action: () => {
              state.resources.money = Math.max(0, state.resources.money - 25);
              state.resources.heat += 5;
              showMessage("Fine paid. Money down, still a little heat.");
            }}
          ]);
        }
      }},
      { label: "Try to outrun / escape", action: () => {
        const success = Math.random() > 0.5;
        if (success) {
          state.resources.heat += 20;
          showMessage("You bolted back to the camper! Escaped, but Heat is way up.");
          stopFPS();
          showScreen("hub");
          addLog("Escaped a police encounter. Heat is high.");
        } else {
          showDialogue("Officer Clay", "Not so fast!", [
            { label: "Submit to the talking-to", action: () => {
              state.resources.money = Math.max(0, state.resources.money - 40);
              state.resources.morale = Math.max(0, state.resources.morale - 15);
              state.resources.heat += 10;
              showMessage("Caught. Fine + lecture. Morale took a hit.");
            }}
          ]);
        }
      }},
      { label: "Foam fight?!", action: () => {
        state.resources.heat += 30;
        showDialogue("Officer Clay", "Really? Foam darts at an officer?", [
          { label: "Oops... submit", action: () => {
            state.resources.money = Math.max(0, state.resources.money - 50);
            state.resources.morale = Math.max(0, state.resources.morale - 20);
            showMessage("Bad idea. Big fine and very annoyed family later.");
          }}
        ]);
      }},
      { label: "Submit quietly", action: () => {
        state.resources.money = Math.max(0, state.resources.money - 30);
        state.resources.morale = Math.max(0, state.resources.morale - 10);
        showMessage("You take the fine. Lesson learned (maybe).");
      }}
    ]);
  }

  function showMessage(text) {
    const el = $("#message");
    el.textContent = text;
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 2200);
  }

  let fpsRunning = false;
  let lastTime = 0;

  function fpsLoop(time) {
    if (!fpsRunning) return;
    const dt = time - lastTime || 16;
    lastTime = time;
    updatePlayer(dt);
    renderFPS();
    requestAnimationFrame(fpsLoop);
  }

  function startFPS() {
    resize();
    player.x = 2.5 * tileSize;
    player.y = 2.5 * tileSize;
    player.angle = 0;
    ammo = state.inventory.find(i => i.id === "darts")?.qty || 12;
    $("#ammo-count").textContent = ammo;
    targets.forEach(t => t.alive = true);
    fpsRunning = true;
    lastTime = performance.now();
    requestAnimationFrame(fpsLoop);
  }

  function stopFPS() {
    fpsRunning = false;
    // sync ammo back
    const dartItem = state.inventory.find(i => i.id === "darts");
    if (dartItem) dartItem.qty = ammo;
  }

  // ---------- Touch Controls ----------
  function setupTouch() {
    const base = $("#joystick-base");
    const knob = $("#joystick-knob");
    const zone = $("#joystick-zone");
    let active = false;
    let originX = 0, originY = 0;

    function updateKnob(dx, dy) {
      const max = 40;
      const dist = Math.hypot(dx, dy);
      const clamped = Math.min(dist, max);
      const angle = Math.atan2(dy, dx);
      const kx = Math.cos(angle) * clamped;
      const ky = Math.sin(angle) * clamped;
      knob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`;
      moveX = kx / max;
      moveY = ky / max;
    }

    zone.addEventListener("touchstart", (e) => {
      e.preventDefault();
      active = true;
      const t = e.touches[0];
      const rect = base.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
      updateKnob(t.clientX - originX, t.clientY - originY);
    }, { passive: false });

    zone.addEventListener("touchmove", (e) => {
      e.preventDefault();
      if (!active) return;
      const t = e.touches[0];
      updateKnob(t.clientX - originX, t.clientY - originY);
    }, { passive: false });

    zone.addEventListener("touchend", () => {
      active = false;
      knob.style.transform = "translate(-50%, -50%)";
      moveX = 0;
      moveY = 0;
    });

    // Look zone
    const look = $("#look-zone");
    let lookActive = false;
    let lastLookX = 0;

    look.addEventListener("touchstart", (e) => {
      lookActive = true;
      lastLookX = e.touches[0].clientX;
    }, { passive: true });

    look.addEventListener("touchmove", (e) => {
      if (!lookActive) return;
      const x = e.touches[0].clientX;
      lookDelta += (x - lastLookX) * 0.008;
      lastLookX = x;
    }, { passive: true });

    look.addEventListener("touchend", () => { lookActive = false; });

    // Buttons
    $("#btn-shoot").addEventListener("touchstart", (e) => {
      e.preventDefault();
      tryShoot();
    }, { passive: false });

    $("#btn-interact").addEventListener("click", tryInteract);
    $("#btn-inventory").addEventListener("click", openInventory);
  }

  // ---------- Event Listeners ----------
  function setupUI() {
    $("#btn-start").onclick = () => showScreen("family");

    $("#btn-family-done").onclick = () => {
      state.playerRole = $("#player-role").value;
      state.familySize = parseInt($("#family-size").value, 10);
      buildFamily();
      // Scale difficulty lightly
      if (state.familySize >= 5) {
        state.resources.food = 50;
        state.resources.money = 100;
      }
      showScreen("hub");
      addLog("Family packed into the camper. Adventure begins!");
    };

    $("#btn-rest").onclick = () => {
      state.resources.morale = Math.min(100, state.resources.morale + 15);
      state.resources.food = Math.max(0, state.resources.food - 2);
      addLog("Everyone rested. Morale up, a bit of food eaten.");
      updateHub();
    };

    $("#btn-eat").onclick = () => {
      if (state.resources.food < 5) {
        addLog("Not enough food!");
        return;
      }
      state.resources.food -= 5;
      state.resources.morale = Math.min(100, state.resources.morale + 12);
      addLog("Family meal. Spirits lifted.");
      updateHub();
    };

    $("#btn-map").onclick = () => showScreen("map");
    $("#btn-map-back").onclick = () => showScreen("hub");

    $$(".dest-btn").forEach(btn => {
      btn.onclick = () => {
        const dest = btn.dataset.dest;
        state.currentDest = dest;
        // Simple cost
        state.resources.gas = Math.max(0, state.resources.gas - 8);
        state.resources.food = Math.max(0, state.resources.food - 3);

        if (dest === "reststop" || dest === "twine") {
          showScreen("fps");
          addLog(`Arrived at ${btn.textContent}.`);
        } else if (dest === "campground") {
          // Quick campground event
          showDialogue("Shady Campground", "Night falls. You hear rustling near the camper...", [
            { label: "Investigate", action: () => {
              showDialogue("Camper Burglary!", "Someone is trying to get into the storage bay!", [
                { label: "Chase them off with foam", action: () => {
                  state.resources.morale = Math.min(100, state.resources.morale + 5);
                  showMessage("You scare them off with a barrage of foam. Camper safe!");
                  showScreen("hub");
                  addLog("Defended the camper from a nighttime burglary.");
                }},
                { label: "Yell and make noise", action: () => {
                  state.resources.morale = Math.max(0, state.resources.morale - 5);
                  showMessage("They run. A few snacks are missing though.");
                  state.resources.food = Math.max(0, state.resources.food - 4);
                  showScreen("hub");
                }},
                { label: "Hide and hope they leave", action: () => {
                  state.resources.food = Math.max(0, state.resources.food - 10);
                  state.resources.morale = Math.max(0, state.resources.morale - 12);
                  showMessage("They took a good amount of food. Family is shaken.");
                  showScreen("hub");
                }}
              ]);
            }},
            { label: "Stay inside and lock up", action: () => {
              state.resources.morale = Math.max(0, state.resources.morale - 3);
              showMessage("You stay safe. Morning comes without further incident.");
              showScreen("hub");
            }}
          ]);
        }
        updateHub();
      };
    });

    $("#btn-depart").onclick = () => showScreen("map");
    $("#btn-exit-fps").onclick = () => {
      stopFPS();
      showScreen("hub");
    };

    $("#btn-close-inv").onclick = closeInventory;

    // Keyboard
    window.addEventListener("keydown", e => { keys[e.key] = true; });
    window.addEventListener("keyup", e => { keys[e.key] = false; });
    window.addEventListener("resize", () => {
      if (state.screen === "fps") resize();
    });
  }

  // ---------- Init ----------
  setupUI();
  setupTouch();
  showScreen("title");

  console.log("Camper Quest prototype loaded.");
})();

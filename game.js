// Camper Quest – natural dialogue, personalities, more arguments

(() => {
  const state = {
    day: 1,
    dayLabel: "Leaving Home",
    playerRole: "Older Sister",
    playerPersonality: "sarcastic",
    playerHair: "brown",
    playerSkin: "medium",
    playerHeight: "average",
    playerWeight: "average",
    familySize: 4,
    difficulty: "medium", // easy | medium | hard
    playerX: 18, // percent across scene
    playerMoving: false,
    playerTargetX: 18,
    pendingAction: null,
    family: [],
    resources: { gas: 80, food: 55, money: 110, morale: 70, heat: 0 },
    inventory: [
      { id: "bubbles", name: "Bubble Blaster", desc: "Shoots big floating bubbles", qty: 5 },
      { id: "spitballs", name: "Spitball Shooter", desc: "Old-school and annoying", qty: 8 },
      { id: "nunchucks", name: "Foam Nunchucks", desc: "Look cooler than they hit", qty: 1 },
      { id: "gum", name: "Sticky Bubble Gum", desc: "Ends up in hair more than mouths", qty: 4 },
      { id: "snacks", name: "Road Snacks", qty: 3 }
    ],
    flags: {
      coolerTaken: false,
      talkedRusty: 0,
      rivalState: "neutral", // neutral | annoyed | mad | truce
      gumPrank: false,
      policeDone: false,
      visitedRest: false,
      visitedCamp: false,
      visitedDiner: false,
      campIntro: false,
      campLockFixed: false,
      campWarned: false,
      shadyDealt: false,
      shadyMad: false,
      waitressTalks: 0,
      familyTension: 0,
      forestExplored: false,
      foundLocket: false,
      rustyWantsLocket: false,
      locketReturned: false,
      camperNeedsBatteries: false,
      foundBatteries: false,
      batteriesDelivered: false,
      causedForestTrouble: false,
      forestSceneIntro: false,
      foundSpring: false,
      foundMagnet: false,
      foundCap: false,
      foundWire: false,
      camperExploded: false,
      visitedTwin: false,
      visitedBluegrass: false,
      foundTwinJunk: false
    },
    statesVisited: 0,
    currentState: "TN",
    unlockedStates: ["TN"],
    pendingState: null
  };


  const STATE_INFO = {
    TN: { name: "Tennessee", places: [
      { id: "reststop", label: "Rusty's Roadside Rest Stop" },
      { id: "campground", label: "Shady Pines Campground" },
      { id: "diner", label: "Neon Diner & Gift Shop" }
    ]},
    KY: { name: "Kentucky", places: [
      { id: "bluegrass", label: "Bluegrass Welcome Center" },
      { id: "reststop", label: "Rest Area" }
    ]},
    OH: { name: "Ohio", places: [
      { id: "twinlakes", label: "Twin Lakes Overlook" },
      { id: "diner", label: "Lakeside Diner" }
    ]},
    IN: { name: "Indiana", places: [
      { id: "reststop", label: "Cornfield Rest Stop" },
      { id: "campground", label: "Hoosier Campground" }
    ]},
    AL: { name: "Alabama", places: [
      { id: "campground", label: "Pine Campground" },
      { id: "diner", label: "Southern Diner" }
    ]},
    GA: { name: "Georgia", places: [
      { id: "diner", label: "Peach Stand Diner" },
      { id: "reststop", label: "I-75 Rest Stop" }
    ]},
    NC: { name: "North Carolina", places: [
      { id: "campground", label: "Blue Ridge Camp" },
      { id: "twinlakes", label: "Mountain Overlook" }
    ]},
    VA: { name: "Virginia", places: [
      { id: "reststop", label: "Shenandoah Stop" },
      { id: "diner", label: "Valley Diner" }
    ]},
    FL: { name: "Florida", places: [
      { id: "diner", label: "Orange Grove Cafe" },
      { id: "campground", label: "Coastal Camp" }
    ]},
    TX: { name: "Texas", places: [
      { id: "reststop", label: "Big Sky Rest Stop" },
      { id: "diner", label: "BBQ Diner" },
      { id: "campground", label: "Prairie Camp" }
    ]}
  };

  const MAP_STATES = ["TN","KY","OH","IN","AL","GA","NC","VA","FL","TX"];

  function showMap() {
    $("#map-day").textContent = state.day;
    $("#map-state-label").textContent = STATE_INFO[state.currentState]?.name || state.currentState;
    const usa = $("#usa-map");
    const local = $("#local-places");
    usa.innerHTML = "";
    usa.classList.remove("hidden");
    local.classList.add("hidden");
    $("#map-heading").textContent = "USA Road Map";
    $("#map-hint").textContent = "Tap a state to drive there. Your current state shows local places.";

    // Current state button for local places
    const here = document.createElement("button");
    here.className = "btn dest primary";
    here.textContent = "📍 Places in " + (STATE_INFO[state.currentState]?.name || "this state");
    here.onclick = () => showLocalPlaces();
    usa.appendChild(here);

    MAP_STATES.forEach(code => {
      const info = STATE_INFO[code];
      const btn = document.createElement("button");
      const unlocked = state.unlockedStates.includes(code);
      const current = state.currentState === code;
      btn.className = "btn dest state-btn" + (current ? " current-state" : "") + (unlocked ? " unlocked" : "");
      btn.textContent = (current ? "★ " : "") + info.name + (unlocked ? "" : " 🔒");
      btn.onclick = () => {
        if (code === state.currentState) {
          showLocalPlaces();
          return;
        }
        // Drive to new state
        state.pendingState = code;
        change("gas", -6);
        change("food", -2);
        startHighway();
        log("Driving toward " + info.name + "…");
      };
      usa.appendChild(btn);
    });
    show("map");
  }

  function showLocalPlaces() {
    const usa = $("#usa-map");
    const local = $("#local-places");
    usa.classList.add("hidden");
    local.classList.remove("hidden");
    local.innerHTML = "";
    $("#map-heading").textContent = "Places in " + (STATE_INFO[state.currentState]?.name || "");
    $("#map-hint").textContent = "No extra drive needed — you're already here.";
    const places = STATE_INFO[state.currentState]?.places || [];
    places.forEach(p => {
      const btn = document.createElement("button");
      btn.className = "btn dest";
      btn.textContent = p.label;
      btn.onclick = () => {
        change("gas", -3);
        change("food", -2);
        if (Math.random() > 0.5) advanceDay("A short hop across town.");
        goToPlace(p.id);
      };
      local.appendChild(btn);
    });
    const back = document.createElement("button");
    back.className = "btn secondary";
    back.textContent = "← Back to states";
    back.onclick = () => showMap();
    local.appendChild(back);
  }

  function goToPlace(id) {
    if (id === "reststop") { enterReststop(); log("Stopped at a rest stop."); }
    else if (id === "campground") { enterCampground(); }
    else if (id === "diner") { enterDiner(); log("Pulled into a diner."); }
    else if (id === "twinlakes") { enterTwinLakes(); log("Overlook."); }
    else if (id === "bluegrass") { enterBluegrass(); log("Welcome center."); }
    else if (id === "highway") { startHighway(); }
    updateHub();
  }

  const personalities = {
    sarcastic: { label: "Sarcastic", talkBonus: 0 },
    peacemaker: { label: "Peacemaker", talkBonus: 15 },
    troublemaker: { label: "Troublemaker", talkBonus: -10 },
    anxious: { label: "Anxious", talkBonus: 5 },
    optimistic: { label: "Optimistic", talkBonus: 10 },
    grumpy: { label: "Grumpy", talkBonus: -5 },
    quiet: { label: "Quiet", talkBonus: 0 },
    loud: { label: "Loud", talkBonus: -5 }
  };

  const dayLabels = ["", "Leaving Home", "First Stretch", "Getting Settled", "Road Weary", "Deep into the Trip", "Still Going", "Long Haul"];

  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  function show(id) {
    $$(".screen").forEach(el => el.classList.remove("active"));
    const el = document.getElementById("screen-" + id);
    if (el) el.classList.add("active");
    if (id === "hub") updateHub();
    if (id === "map") $("#map-day").textContent = state.day;
  }

  function getOtherRoles(playerRole, count) {
    const pools = {
      "Dad": ["Mom", "Older Sister", "Older Brother", "Younger Brother", "Little Sister", "Cousin"],
      "Mom": ["Dad", "Older Sister", "Older Brother", "Younger Brother", "Little Sister", "Cousin"],
      "Older Sister": ["Mom", "Dad", "Younger Brother", "Little Sister", "Cousin", "Uncle"],
      "Older Brother": ["Mom", "Dad", "Younger Brother", "Little Sister", "Cousin", "Aunt"],
      "Younger Sibling": ["Mom", "Dad", "Older Sister", "Older Brother", "Cousin", "Uncle"]
    };
    const list = pools[playerRole] || pools["Older Sister"];
    return list.slice(0, count);
  }

  function buildFamilySetupUI() {
    const size = parseInt($("#family-size").value, 10);
    const playerRole = $("#player-role").value;
    const container = $("#family-members-setup");
    container.innerHTML = "";
    const roles = getOtherRoles(playerRole, size - 1);
    roles.forEach((role, i) => {
      const div = document.createElement("div");
      div.style.marginTop = "10px";
      div.innerHTML = `
        <label style="font-size:0.9rem">${role} personality:
          <select class="member-personality" data-role="${role}">
            <option value="sarcastic">Sarcastic</option>
            <option value="peacemaker">Peacemaker</option>
            <option value="troublemaker">Troublemaker</option>
            <option value="anxious">Anxious</option>
            <option value="optimistic">Optimistic</option>
            <option value="grumpy">Grumpy</option>
            <option value="quiet">Quiet</option>
            <option value="loud">Loud</option>
          </select>
        </label>`;
      container.appendChild(div);
    });
  }

  function buildFamily() {
    state.playerRole = $("#player-role").value;
    state.playerPersonality = $("#player-personality").value;
    state.playerHair = $("#player-hair").value;
    state.playerSkin = $("#player-skin").value;
    state.playerHeight = $("#player-height").value;
    state.playerWeight = $("#player-weight").value;
    state.familySize = parseInt($("#family-size").value, 10);
    state.family = [{
      name: "You",
      role: state.playerRole,
      personality: state.playerPersonality,
      isPlayer: true
    }];
    const selects = $$(".member-personality");
    selects.forEach((sel) => {
      const role = sel.getAttribute("data-role") || "Family";
      state.family.push({
        name: role,
        role: role,
        personality: sel.value,
        isPlayer: false
      });
    });
    while (state.family.length < state.familySize) {
      state.family.push({ name: "Family", role: "Family", personality: "quiet", isPlayer: false });
    }
  }

  function updateHub() {
    $("#day-num").textContent = state.day;
    $("#day-label").textContent = state.dayLabel;
    $("#res-gas").textContent = state.resources.gas;
    $("#res-food").textContent = state.resources.food;
    $("#res-money").textContent = state.resources.money;
    $("#res-morale").textContent = state.resources.morale;
    $("#res-heat").textContent = state.resources.heat;
    const names = state.family.map(f => f.isPlayer ? `You (${f.role})` : `${f.name} (${personalities[f.personality]?.label || f.personality})`);
    $("#family-line").textContent = names.join(" · ");

    // portraits
    try {
      let box = document.getElementById("family-portraits");
      if (!box) {
        box = document.createElement("div");
        box.id = "family-portraits";
        box.className = "family-portraits";
        const line = $("#family-line");
        if (line && line.parentNode) line.parentNode.insertBefore(box, line);
      }
      box.innerHTML = "";
      state.family.forEach(f => {
        const img = document.createElement("img");
        const src = getFamilyMemberSprite(f);
        img.src = src;
        img.alt = f.name || f.role;
        const label = (f.isPlayer ? "You (" + f.role + ")" : f.name) + " – " + (personalities[f.personality]?.label || f.personality || "");
        img.title = label;
        img.onclick = () => openPortrait(src, label);
        box.appendChild(img);
      });
    } catch (e) { console.warn("portraits", e); }
  }

  function log(msg) {
    const el = $("#hub-log");
    el.innerHTML = `<div>• ${msg}</div>` + el.innerHTML;
  }

  function toast(msg, ms = 2500) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.add("hidden"), ms);
  }

  function openPortrait(src, label) {
    const img = $("#portrait-viewer-img");
    const name = $("#portrait-viewer-name");
    if (img) img.src = src;
    if (name) name.textContent = label || "";
    $("#portrait-viewer").classList.remove("hidden");
  }

  function closePortrait() {
    $("#portrait-viewer").classList.add("hidden");
  }

    function change(key, amount, msg) {
    const max = (key === "morale" || key === "heat") ? 100 : 999;
    state.resources[key] = Math.max(0, Math.min(max, state.resources[key] + amount));
    if (msg) toast(msg);
    updateHub();
  }

  function advanceDay(reason) {
    state.day++;
    state.dayLabel = dayLabels[Math.min(state.day, dayLabels.length - 1)] || `Day ${state.day}`;
    let drain = 3 + Math.floor(state.familySize / 2);
    if (state.difficulty === "hard") drain += 2;
    if (state.difficulty === "easy") drain = Math.max(1, drain - 2);
    change("food", -drain);
    if (state.resources.food < 12) change("morale", -7, "Everyone's getting hungry.");
    if (state.resources.heat > 0) change("heat", -4);
    log(reason || `Day ${state.day}.`);
    updateHub();
    checkLoseConditions();
  }

  function checkLoseConditions() {
    if (state.difficulty === "easy") return;
    if (state.resources.food <= 0 && state.resources.morale <= 10) {
      return gameOver("The family gave up. No food, no morale, no trip.");
    }
    if (state.resources.morale <= 0) {
      return gameOver("Everyone refused to go any farther. Trip over.");
    }
    if (state.difficulty === "hard" && state.resources.gas <= 0 && state.resources.money < 20) {
      return gameOver("Stranded with an empty tank and empty wallet.");
    }
    if (state.flags.camperExploded) {
      return gameOver("The camper is toast. Literally. End of the road.");
    }
  }

  function gameOver(msg) {
    const t = $("#game-over-title");
    const x = $("#game-over-text");
    if (t) t.textContent = "Trip Over";
    if (x) x.textContent = msg;
    $("#game-over").classList.remove("hidden");
  }

  function getArrested(daysLost, reason) {
    hideDialogue();
    clearSprites();
    say("Arrested", reason || "You're in the back of a patrol car. The family is not happy.", [
      { label: "Sit it out", fn: () => {
        for (let i = 0; i < daysLost; i++) advanceDay(i === 0 ? "Lost a day in holding." : "Another day wasted.");
        change("morale", -15);
        change("money", -20);
        change("heat", -Math.min(state.resources.heat, 25));
        state.flags.policeDone = true;
        toast("Released. Heat down, morale wrecked.");
        show("hub");
        log("Arrested. Lost " + daysLost + " day(s).");
        if (state.difficulty === "medium" && daysLost >= 3) {
          // long jail can end medium
          if (state.resources.morale < 20) gameOver("After a long stint in holding, the trip fell apart.");
        }
        if (state.difficulty === "hard" && daysLost >= 2 && state.resources.morale < 25) {
          gameOver("Jail time broke the trip. Everyone wants to go home.");
        }
      }}
    ]);
  }

  function say(speaker, text, choices = []) {
    $("#dlg-speaker").textContent = speaker;
    $("#dlg-text").textContent = text;
    const box = $("#dlg-choices");
    box.innerHTML = "";
    if (!choices.length) {
      const b = document.createElement("button");
      b.textContent = "…";
      b.onclick = hideDialogue;
      box.appendChild(b);
    } else {
      choices.forEach(c => {
        const b = document.createElement("button");
        b.textContent = c.label;
        b.onclick = () => { hideDialogue(); if (c.fn) c.fn(); };
        box.appendChild(b);
      });
    }
    $("#dialogue").classList.remove("hidden");
  }

  function hideDialogue() { $("#dialogue").classList.add("hidden"); }

  function openInv() {
    const list = $("#inv-list");
    list.innerHTML = "";
    state.inventory.forEach(item => {
      if (!item.qty || item.qty <= 0) return;
      const d = document.createElement("div");
      d.className = "inv-item";
      d.innerHTML = "<b>" + item.name + "</b> ×" + item.qty + (item.desc ? "<br><small>" + item.desc + "</small>" : "");
      const usable = ["antenna","gum_trap","chicken_decoy","grabber","patch_kit","chicken","snowglobe"].includes(item.id);
      if (usable) {
        const b = document.createElement("button");
        b.textContent = "Use";
        b.style.marginTop = "6px";
        b.onclick = () => { closeInv(); useSpecialItem(item.id); };
        d.appendChild(b);
      }
      list.appendChild(d);
    });
    $("#inventory").classList.remove("hidden");
  }

  function closeInv() { $("#inventory").classList.add("hidden"); }

  function useSpecialItem(id) {
    if (!hasItem(id)) { toast("Don't have that."); return; }
    if (id === "antenna") {
      useItem("antenna");
      change("morale", 8, "Weird radio chatter, then a useful tip.");
      if (Math.random() > 0.45) change("heat", -4, "Caught a patrol mention. Heat down a bit.");
    } else if (id === "gum_trap") {
      useItem("gum_trap");
      change("heat", -5);
      change("morale", 4, "Gum trap set by the camper door.");
      state.flags.campLockFixed = true;
    } else if (id === "chicken_decoy") {
      useItem("chicken_decoy");
      change("morale", 10, "Chicken decoy deployed. Chaos laughs.");
      change("heat", -2);
    } else if (id === "grabber") {
      useItem("grabber");
      change("money", 8, "Fished change from a grate. +$8");
      change("morale", 3);
    } else if (id === "patch_kit") {
      toast("Saved for engine emergencies (auto-used on breakdown).");
    } else if (id === "chicken") {
      useItem("chicken");
      change("morale", 5, "Squeaky chicken war.");
    } else if (id === "snowglobe") {
      useItem("snowglobe");
      change("morale", 4, "Tiny blizzard. Tiny calm.");
    }
  }

  function hasItem(id) {
    const it = state.inventory.find(i => i.id === id);
    return it && it.qty > 0;
  }
  function useItem(id, n = 1) {
    const it = state.inventory.find(i => i.id === id);
    if (it) it.qty = Math.max(0, it.qty - n);
  }

  // ---------- REST STOP ----------
  function clearSprites() {
    document.querySelectorAll(".scene-sprite").forEach(el => el.remove());
  }

  function addSprite(src, className) {
    const img = document.createElement("img");
    img.src = src;
    img.className = "scene-sprite " + className;
    img.alt = className;
    $("#scene-stage").appendChild(img);
  }

  
  function familyTone() {
    const skin = state.playerSkin || "medium";
    const hair = state.playerHair || "brown";
    if (hair === "red") return "red";
    if (skin === "dark" || hair === "black") return "dark";
    if (skin === "light" || hair === "blond") return "light";
    return "medium";
  }

  function getPlayerSpriteSrc() {
    const role = state.playerRole || "Older Sister";
    const tone = familyTone();
    if (role === "Dad") {
      if (tone === "light") return "player-dad-light.png";
      if (tone === "dark") return "player-dad-dark.png";
      return "player-dad.png";
    }
    if (role === "Mom") {
      if (tone === "dark") return "player-mom-dark.png";
      if (tone === "medium") return "player-mom-medium.png";
      return "player-mom.png";
    }
    if (role === "Older Brother" || role === "Younger Sibling") {
      if (tone === "red") return "player-brother-red.png";
      if (tone === "dark") return "player-brother-dark.png";
      if (tone === "medium") return "player-brother-brown.png";
      return "player-brother.png";
    }
    // sister / default
    if (tone === "red") return "player-sister-red.png";
    if (tone === "dark") return "player-sister-dark.png";
    if (tone === "light") return "player-sister-blond.png";
    return "player-sister.png";
  }

  function getFamilyMemberSprite(member) {
    if (!member || member.isPlayer) return getPlayerSpriteSrc();
    const role = member.role || member.name || "";
    const tone = familyTone();
    if (role === "Dad") {
      if (tone === "light") return "player-dad-light.png";
      if (tone === "dark") return "player-dad-dark.png";
      return "player-dad.png";
    }
    if (role === "Mom") {
      if (tone === "dark") return "player-mom-dark.png";
      if (tone === "medium") return "player-mom-medium.png";
      return "player-mom.png";
    }
    if (role === "Little Sister") {
      return tone === "dark" ? "player-littlesis-dark.png" : "player-littlesis.png";
    }
    if (["Older Brother", "Younger Brother", "Cousin", "Uncle"].includes(role)) {
      if (tone === "red") return "player-brother-red.png";
      if (tone === "dark") return "player-brother-dark.png";
      if (tone === "medium") return "player-brother-brown.png";
      return "player-brother.png";
    }
    if (["Older Sister", "Aunt"].includes(role)) {
      if (tone === "red") return "player-sister-red.png";
      if (tone === "dark") return "player-sister-dark.png";
      if (tone === "light") return "player-sister-blond.png";
      return "player-sister.png";
    }
    if (tone === "dark") return "player-brother-dark.png";
    if (tone === "red") return "player-brother-red.png";
    if (tone === "light") return "player-brother.png";
    return "player-brother-brown.png";
  }

  function ensurePlayerSprite() {
    let p = document.getElementById("player-sprite");
    if (!p) {
      p = document.createElement("img");
      p.id = "player-sprite";
      p.className = "player-sprite";
      $("#scene-stage").appendChild(p);
    }
    p.src = getPlayerSpriteSrc();
    p.classList.remove("tall", "short", "stocky", "slim");
    if (state.playerHeight === "tall") p.classList.add("tall");
    if (state.playerHeight === "short") p.classList.add("short");
    if (state.playerWeight === "stocky") p.classList.add("stocky");
    if (state.playerWeight === "slim") p.classList.add("slim");
    p.style.left = state.playerX + "%";
    return p;
  }

  function ensureWalkLayer() {
    let w = document.getElementById("walk-layer");
    if (!w) {
      w = document.createElement("div");
      w.id = "walk-layer";
      w.className = "walk-layer";
      $("#scene-stage").appendChild(w);
      w.addEventListener("click", onWalkClick);
    }
    return w;
  }

  function onWalkClick(e) {
    if (state.playerMoving) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    // clamp so character stays on screen
    const target = Math.max(8, Math.min(88, xPct));
    movePlayerTo(target, null);
  }


  function offerTrouble(context, extraChoices = []) {
    const base = [
      { label: "Keep it peaceful", fn: () => {} },
      { label: "Mouth off / insult", fn: () => {
        change("heat", 4);
        change("morale", -2, "You made it worse.");
      }},
      { label: "Steal something nearby", fn: () => {
        change("heat", 8);
        change("money", 5);
        change("morale", -3, "Quick sticky fingers. Heat up.");
      }},
      { label: "Pull out a weapon", fn: () => {
        say("You", "What do you use?", [
          { label: "Bubbles", fn: () => {
            if (!hasItem("bubbles")) { toast("No bubbles."); return; }
            useItem("bubbles");
            change("heat", 6);
            change("morale", 3, "Bubbles everywhere.");
          }},
          { label: "Spitballs", fn: () => {
            if (!hasItem("spitballs")) { toast("No spitballs."); return; }
            useItem("spitballs", 2);
            change("heat", 7);
            change("morale", -1, "That escalated.");
          }},
          { label: "Gum in hair / on surface", fn: () => {
            if (!hasItem("gum")) { toast("No gum."); return; }
            useItem("gum");
            change("heat", 5);
            toast("Sticky chaos.");
          }},
          { label: "Never mind", fn: () => {} }
        ]);
      }},
      { label: "Vandalize / make a mess", fn: () => {
        change("heat", 9);
        change("morale", -4, "Someone's going to notice.");
      }}
    ];
    say(context || "Trouble", "How do you want to handle this?", base.concat(extraChoices));
  }

  function movePlayerTo(targetX, onArrive) {
    const p = ensurePlayerSprite();
    state.playerTargetX = targetX;
    state.playerMoving = true;
    state.pendingAction = onArrive || null;
    p.classList.add("walking");

    if (targetX > state.playerX) p.classList.remove("flipped");
    else p.classList.add("flipped");

    const start = state.playerX;
    const dist = Math.abs(targetX - start);
    const duration = Math.max(300, dist * 28);
    const t0 = performance.now();

    function step(now) {
      const t = Math.min(1, (now - t0) / duration);
      const ease = t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t;
      state.playerX = start + (targetX - start) * ease;
      p.style.left = state.playerX + "%";
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        state.playerMoving = false;
        state.playerX = targetX;
        p.style.left = targetX + "%";
        p.classList.remove("walking");
        if (state.pendingAction) {
          const fn = state.pendingAction;
          state.pendingAction = null;
          fn();
        }
      }
    }
    requestAnimationFrame(step);
  }

  function walkThen(actionFn, hotspotLeftPct) {
    // walk near the hotspot then run the action
    const target = Math.max(10, Math.min(85, (hotspotLeftPct || 40) + 6));
    try {
      movePlayerTo(target, actionFn);
    } catch (err) {
      console.warn("walk failed, running action directly", err);
      state.playerMoving = false;
      if (actionFn) actionFn();
    }
  }


  function enterReststop() {
    clearSprites();
    $("#scene-bg").className = "reststop";
    $("#scene-title").textContent = "Rusty's Roadside Rest Stop";
    addSprite("char-rusty.jpg", "rusty");
    addSprite("char-rival-family.jpg", "rival");
    addSprite("obj-cooler.jpg", "cooler");

    const hs = $("#hotspots");
    hs.innerHTML = "";
    const spots = [
      { label: "Rusty", style: "left:4%;bottom:8%;width:28%;height:42%;", important: true, action: talkRusty, x: 12 },
      { label: "⚠️ Cooler", style: "left:60%;bottom:8%;width:26%;height:30%;", important: true, action: examineCooler, x: 68 },
      { label: "Other Family", style: "left:34%;bottom:6%;width:30%;height:42%;", action: talkRival, x: 42 },
      { label: "Vending", style: "left:82%;bottom:28%;width:14%;height:28%;", action: examineVending, x: 80 },
      { label: "Bench", style: "left:2%;top:52%;width:18%;height:12%;", action: examineBench, x: 14 }
    ];
    spots.forEach(h => {
      const el = document.createElement("div");
      el.className = "hotspot" + (h.important ? " important" : "");
      el.style.cssText = h.style;
      el.textContent = h.label;
      el.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (state.playerMoving) return;
        // if already close, interact immediately
        if (Math.abs(state.playerX - h.x) < 14) {
          h.action();
        } else {
          walkThen(h.action, h.x);
        }
      };
      hs.appendChild(el);
    });
    show("scene");
    state.playerX = 18;
    ensureWalkLayer();
    ensurePlayerSprite();
    if (!state.flags.visitedRest) {
      state.flags.visitedRest = true;
      state.statesVisited++;
      setTimeout(() => say("You", "The air smells like hot asphalt and old coffee. Typical.", [
        { label: "Look around", fn: () => toast("Tap people and objects to talk or use them.") }
      ]), 300);
    }
  }

  function talkRusty() {
    state.flags.talkedRusty++;
    if (state.flags.talkedRusty === 1) {
      say("Rusty", "Morning. Or afternoon. I stopped keeping track. Gas is high, coffee's worse. What do you need?", [
        { label: "Just stretching our legs", fn: () => {
          change("morale", 2);
          say("Rusty", "Fair enough. Keep an eye on your stuff. People get sticky fingers around here.");
        }},
        { label: "Any problems I should know about?", fn: () => {
          say("Rusty", "There's a family over by the picnic tables who already argued with two other groups. And somebody keeps opening coolers that aren't theirs.", [
            { label: "I'll keep that in mind", fn: () => change("morale", 3) }
          ]);
        }},
        { label: "You sell any of those bubble things or spitballs?", fn: () => buyFromRusty() }
      ]);
    } else if (state.flags.talkedRusty === 2) {
      if (hasItem("locket") && !state.flags.locketReturned) {
        say("Rusty", "You again— hold on. That locket. Where'd you get that?", [
          { label: "Found it in the woods near a campground", fn: () => {
            useItem("locket");
            state.flags.locketReturned = true;
            change("morale", 6);
            change("money", 15, "Rusty presses a worn $15 into your hand.");
            toast("Side quest done: Returned the locket");
            say("Rusty", "Belonged to my sister. Lost it years ago on a trip. Thank you.", [
              { label: "Glad it found its way back", fn: () => {} }
            ]);
          }},
          { label: "None of your business", fn: () => {
            change("morale", -2);
            state.flags.rustyWantsLocket = true;
          }}
        ]);
        return;
      }
      say("Rusty", "You again. Still here?", [
        { label: "Yeah, just checking things", fn: () => say("Rusty", "Don't check too hard. Last person who 'checked' something walked off with a whole cooler.") },
        { label: "Has the other family calmed down?", fn: () => {
          if (state.flags.rivalState === "truce") say("Rusty", "Surprisingly, yes. Whatever you said worked.");
          else say("Rusty", "No. They're still circling like hawks.");
        }},
        { label: "You ever lose anything important?", fn: () => {
          state.flags.rustyWantsLocket = true;
          say("Rusty", "A locket. Years ago. If you ever see one in the dirt out on the road… I'd want to know.", [
            { label: "I'll watch for it", fn: () => toast("Side quest: Find a lost locket") }
          ]);
        }}
      ]);
    } else {
      const lines = [
        ["Rusty", "If you're looking for the world's largest ball of twine, it's still forty miles east. And still not worth it."],
        ["Rusty", "Ranger came by earlier asking about missing snacks. You wouldn't know anything about that, would you?"],
        ["Rusty", "I used to like this job. Then the highway got busier and the people got weirder."]
      ];
      const pick = lines[Math.floor(Math.random() * lines.length)];
      say(pick[0], pick[1], [
        { label: "See you around", fn: () => {} },
        { label: "Buy something", fn: () => buyFromRusty() }
      ]);
    }
  }

  function buyFromRusty() {
    say("Rusty", "I can sell you extra bubble mix for twelve bucks or a pack of spitballs for eight.", [
      { label: "Bubbles ($12)", fn: () => {
        if (state.resources.money >= 12) {
          change("money", -12);
          state.inventory.find(i => i.id === "bubbles").qty += 3;
          toast("Got more bubble mix.");
        } else toast("You don't have enough.");
      }},
      { label: "Spitballs ($8)", fn: () => {
        if (state.resources.money >= 8) {
          change("money", -8);
          state.inventory.find(i => i.id === "spitballs").qty += 6;
          toast("Spitball pack added.");
        } else toast("You don't have enough.");
      }},
      { label: "Never mind", fn: () => {} }
    ]);
  }

  function examineCooler() {
    if (state.flags.coolerTaken) {
      say("Cooler", "Empty. Just a puddle and a note that says 'Hendersons – seriously?'", [
        { label: "Leave it", fn: () => {} }
      ]);
      return;
    }
    say("Cooler", "The lid is cracked open. Inside: sodas, a couple sandwiches, and a bag of chips that look expensive. Sharpie on the side says HENDERSONS – DO NOT TOUCH.", [
      { label: "Close the lid and walk away", fn: () => {
        change("morale", 5, "You left it alone.");
        state.flags.familyTension = Math.max(0, state.flags.familyTension - 1);
      }},
      { label: "Take the food", fn: () => {
        state.flags.coolerTaken = true;
        change("food", 11);
        change("heat", 18, "You took their food. That might come back around.");
        state.inventory.push({ id: "stolen_chips", name: "Someone Else's Chips", qty: 1 });
        state.flags.familyTension += 1;
        setTimeout(() => { if (!state.flags.policeDone && state.resources.heat >= 15) triggerPolice(); }, 2200);
      }},
      { label: "Stick gum on the handle", fn: () => {
        if (!hasItem("gum")) { toast("You're out of gum."); return; }
        useItem("gum");
        change("heat", 5, "You left a sticky surprise.");
        state.flags.gumPrank = true;
      }}
    ]);
  }

  function talkRival() {
    if (state.flags.rivalState === "truce") {
      say("Other Parent", "We're good. Just try not to park in the shade next time.", [
        { label: "Will do", fn: () => {} }
      ]);
      return;
    }
    if (state.flags.rivalState === "mad") {
      say("Other Parent", "Oh, look who it is. Still got something to say?", [
        { label: "I was out of line earlier", fn: () => tryPeace() },
        { label: "You started it", fn: () => escalateRival() },
        { label: "Pull out something from the bag", fn: () => chooseWeapon() }
      ]);
      return;
    }
    // neutral or annoyed
    say("Other Parent", "We've been sitting here an hour. Your camper is blocking the only decent shade left.", [
      { label: "Sorry — we'll move when we can", fn: () => {
        change("morale", 3);
        state.flags.rivalState = "annoyed";
        say("Other Parent", "Appreciate it. It's been a long drive for us too.");
      }},
      { label: "We got here first", fn: () => {
        state.flags.rivalState = "mad";
        say("Other Parent", "That so? You want to make this a whole thing?", [
          { label: "Let's just drop it", fn: () => tryPeace() },
          { label: "Yeah, maybe I do", fn: () => escalateRival() }
        ]);
      }},
      { label: "Offer them some of our snacks", fn: () => {
        if (state.resources.food < 6) { toast("You barely have enough for yourselves."); return; }
        change("food", -6);
        state.flags.rivalState = "truce";
        change("morale", 9, "They take the snacks and ease up.");
      }}
    ]);
  }

  function tryPeace() {
    const bonus = personalities[state.playerPersonality]?.talkBonus || 0;
    const success = (state.resources.morale + bonus) > 55 || Math.random() > 0.4;
    if (success) {
      state.flags.rivalState = "truce";
      change("morale", 7, "You smoothed it over.");
    } else {
      change("morale", -5, "They didn't want to hear it.");
      state.flags.rivalState = "mad";
    }
  }

  function escalateRival() {
    state.flags.rivalState = "mad";
    change("morale", -4);
    say("Other Parent", "Alright. What's it gonna be then?", [
      { label: "Talk it out", fn: () => tryPeace() },
      { label: "Grab something from your bag", fn: () => chooseWeapon() },
      { label: "Walk away", fn: () => change("morale", -3, "You leave them fuming.") }
    ]);
  }

  function chooseWeapon() {
    say("You", "What do you pull out?", [
      { label: "Bubble Blaster", fn: () => useWeapon("bubbles") },
      { label: "Spitball Shooter", fn: () => useWeapon("spitballs") },
      { label: "Foam Nunchucks", fn: () => useWeapon("nunchucks") },
      { label: "Bubble Gum", fn: () => useWeapon("gum") },
      { label: "Actually, never mind", fn: () => tryPeace() }
    ]);
  }

  function useWeapon(id) {
    if (id !== "nunchucks" && !hasItem(id)) { toast("You're out of that."); return; }
    if (id !== "nunchucks") useItem(id);

    if (id === "bubbles") {
      say("Other Kid", "Those are huge! They're just floating away!", [
        { label: "Hard to stay mad after that", fn: () => {
          state.flags.rivalState = "truce";
          change("morale", 10, "The bubbles broke the tension.");
        }}
      ]);
    } else if (id === "spitballs") {
      say("Other Parent", "Did you seriously just shoot a spitball at me?", [
        { label: "It was an accident", fn: () => {
          change("heat", 6);
          change("morale", -3, "They don't believe you.");
          state.flags.rivalState = "mad";
        }},
        { label: "Yeah I did", fn: () => {
          change("heat", 9);
          change("morale", -6);
          state.flags.rivalState = "mad";
          toast("That made everything worse.");
        }}
      ]);
    } else if (id === "nunchucks") {
      say("Other Parent", "Are those foam? You look like you're about to trip over yourself.", [
        { label: "Try a spin anyway", fn: () => {
          if (Math.random() > 0.45) {
            state.flags.rivalState = "truce";
            change("morale", 8, "Somehow it worked. They're laughing.");
          } else {
            change("morale", -8, "You nearly hit yourself. They laugh for a different reason.");
            state.flags.rivalState = "mad";
          }
        }}
      ]);
    } else if (id === "gum") {
      say("Other Kid", "There's gum in my hair! Who does that?!", [
        { label: "Help get it out", fn: () => {
          change("morale", 2);
          state.flags.rivalState = "annoyed";
          toast("You help a little. They're still annoyed.");
        }},
        { label: "Shrug", fn: () => {
          change("heat", 7);
          change("morale", -4);
          state.flags.rivalState = "mad";
        }}
      ]);
    }
  }

  function examineVending() {
    say("Vending Machine", "Half the buttons are sold out. What's left looks like it's been there since last summer.", [
      { label: "Buy a soda ($3)", fn: () => {
        if (state.resources.money >= 3) {
          change("money", -3);
          change("food", 2, "Warm soda. Better than nothing.");
        } else toast("Not enough money.");
      }},
      { label: "Give it a shove", fn: () => {
        if (Math.random() > 0.5) {
          change("food", 2, "Something fell. Lucky.");
        } else {
          change("heat", 3, "It beeps. You step back.");
        }
      }},
      { label: "Walk away", fn: () => {} }
    ]);
  }

  function examineBench() {
    const extra = state.flags.gumPrank ? " There's already gum stuck under one corner." : "";
    say("Bench", "Weathered wood, carved initials, a few bird droppings." + extra, [
      { label: "Sit down a minute", fn: () => change("morale", 3, "A short break helps.") },
      { label: "Keep moving", fn: () => {} }
    ]);
  }

  function triggerPolice() {
    if (state.flags.policeDone) return;
    state.flags.policeDone = true;
    say("Ranger", "We've had reports of people helping themselves to coolers that aren't theirs. Anybody want to clear that up?", [
      { label: "We didn't take anything", fn: () => {
        const bonus = personalities[state.playerPersonality]?.talkBonus || 0;
        if (state.resources.morale + bonus > 58 || state.flags.talkedRusty > 0) {
          change("heat", -12, "He seems to believe you.");
        } else {
          change("money", -28);
          change("heat", 4, "He writes a fine anyway.");
        }
      }},
      { label: "It was already open", fn: () => {
        change("heat", 6);
        change("money", -22, "Weak excuse. Still a fine.");
      }},
      { label: "Just pay and leave", fn: () => {
        change("money", -32);
        change("morale", -8, "You pay. Nobody's happy about it.");
      }}
    ]);
  }

  // ---------- CAMPGROUND ----------
  function enterCampground() {
    if (!state.flags.visitedCamp) { state.flags.visitedCamp = true; state.statesVisited++; }
    clearSprites();
    $("#scene-bg").className = "campground";
    $("#scene-title").textContent = "Shady Pines Campground";
    // Use rival-family figure as a stand-in "shady" silhouette until dedicated art
    if (!state.flags.shadyDealt) {
      addSprite("char-shady.jpg", "shady");
    }
    const hs = $("#hotspots");
    hs.innerHTML = "";
    const spots = [
      { label: "Your Camper", style: "left:55%;bottom:12%;width:28%;height:36%;", important: true, action: campCamper, x: 62 },
      { label: "Campfire", style: "left:22%;bottom:18%;width:22%;height:24%;", action: campFire, x: 28 },
      { label: "Shady Guy", style: "left:8%;bottom:14%;width:20%;height:38%;", important: true, action: campShady, x: 14 },
      { label: "Trees", style: "left:78%;bottom:20%;width:18%;height:40%;", action: campTrees, x: 80 },
      { label: "Path", style: "left:40%;bottom:4%;width:20%;height:14%;", action: campPath, x: 45 }
    ];
    spots.forEach(h => {
      const el = document.createElement("div");
      el.className = "hotspot" + (h.important ? " important" : "");
      el.style.cssText = h.style;
      el.textContent = h.label;
      el.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (state.playerMoving) return;
        if (Math.abs(state.playerX - h.x) < 14) h.action();
        else walkThen(h.action, h.x);
      };
      hs.appendChild(el);
    });
    show("scene");
    state.playerX = 50;
    ensureWalkLayer();
    ensurePlayerSprite();
    if (!state.flags.campIntro) {
      state.flags.campIntro = true;
      setTimeout(() => say("You", "The campground is quieter than it should be. One of the other campers is watching your site a little too carefully.", [
        { label: "Look around", fn: () => toast("Tap the glowing spots. Yellow ones matter more.") }
      ]), 350);
    }
  }

  function campCamper() {
    say("Your Camper", "The storage latch looks scratched. Someone has been testing it.", [
      { label: "Check the lock", fn: () => {
        if (state.flags.campLockFixed) {
          say("You", "Still solid. Good.");
        } else {
          say("You", "It's loose. You tighten it with a coin.", [
            { label: "Done", fn: () => {
              state.flags.campLockFixed = true;
              change("morale", 3, "A little safer now.");
            }}
          ]);
        }
      }},
      { label: "Sit inside and wait", fn: () => {
        change("morale", -2);
        toast("Long quiet minutes pass.");
      }},
      { label: "Leave the site for now", fn: () => {} }
    ]);
  }

  function campFire() {
    say("Campfire", "A low fire is going at the next site over. Two people are talking in low voices.", [
      { label: "Join them politely", fn: () => {
        if (state.flags.batteriesDelivered) {
          say("Camper", "Thanks again for those batteries. Radio works. We owe you one.", [
            { label: "Anytime", fn: () => change("morale", 2) }
          ]);
          return;
        }
        if (hasItem("batteries") && state.flags.camperNeedsBatteries) {
          say("Camper", "Wait — are those AA batteries? Our radio died. Any chance we could take them?", [
            { label: "Give them the batteries", fn: () => {
              useItem("batteries");
              state.flags.batteriesDelivered = true;
              change("morale", 8, "They light up. Literally.");
              change("money", 5, "They insist on five bucks.");
              toast("Side quest done: Batteries delivered");
            }},
            { label: "Not right now", fn: () => {} }
          ]);
          return;
        }
        say("Camper", "Evening. You with the painted van? Saw a guy circling your lot earlier. Hood up.", [
          { label: "Thanks for the warning", fn: () => {
            change("morale", 3);
            state.flags.campWarned = true;
            state.flags.camperNeedsBatteries = true;
            say("Camper", "If you find spare AA batteries out there, we could use them. Radio's dead.", [
              { label: "I'll keep an eye out", fn: () => toast("Side quest: Find AA batteries for the campers") }
            ]);
          }},
          { label: "Ask who it was", fn: () => {
            state.flags.campWarned = true;
            state.flags.camperNeedsBatteries = true;
            say("Camper", "Thin, hood up, hangs by the trees. Also — our radio died. Need AA batteries if you see any.", [
              { label: "Got it", fn: () => change("morale", 2) }
            ]);
          }}
        ]);
      }},
      { label: "Listen from a distance", fn: () => {
        say("You", "Talk about missing coolers, a ranger, and a dead radio.", [
          { label: "Interesting", fn: () => {
            state.flags.camperNeedsBatteries = true;
            change("morale", 1);
          }}
        ]);
      }},
      { label: "Cause trouble at their fire", fn: () => {
        say("You", "Bad idea… or is it?", [
          { label: "Kick dirt at the fire", fn: () => {
            change("heat", 8);
            change("morale", -6, "They shout. You leave fast.");
            state.flags.causedForestTrouble = true;
          }},
          { label: "Never mind", fn: () => {} }
        ]);
      }},
      { label: "Walk away", fn: () => {} }
    ]);
  }

  function campShady() {
    if (state.flags.shadyDealt) {
      say("Shady Guy", "What? I'm just walking. Leave me alone.", [
        { label: "Back off", fn: () => {} }
      ]);
      return;
    }
    say("Shady Guy", "Nice camper. You folks travel light? Storage look full from here.", [
      { label: "Keep walking. Not interested.", fn: () => {
        change("morale", 2);
        toast("He watches you leave.");
      }},
      { label: "Why are you hanging around our site?", fn: () => {
        say("Shady Guy", "Public ground. I can stand where I want.", [
          { label: "Ask him to move along", fn: () => {
            const bonus = personalities[state.playerPersonality]?.talkBonus || 0;
            if (state.resources.morale + bonus > 55) {
              state.flags.shadyDealt = true;
              change("morale", 5, "He shrugs and drifts off.");
            } else {
              change("heat", 3);
              change("morale", -3, "He smirks and stays put.");
            }
          }},
          { label: "Threaten him with bubbles / spitballs", fn: () => chooseCampWeapon() },
          { label: "Drop it", fn: () => {} }
        ]);
      }},
      { label: "Offer him a snack to go away", fn: () => {
        if (state.resources.food < 4) { toast("Not enough food."); return; }
        change("food", -4);
        state.flags.shadyDealt = true;
        change("morale", 3, "He takes it and leaves. For now.");
      }},
      { label: "Pull out gear", fn: () => chooseCampWeapon() }
    ]);
  }

  function chooseCampWeapon() {
    say("You", "What do you reach for?", [
      { label: "Bubble Blaster", fn: () => {
        if (!hasItem("bubbles")) { toast("Out of bubbles."); return; }
        useItem("bubbles");
        state.flags.shadyDealt = true;
        change("morale", 6, "Giant bubbles. He swears and leaves.");
        change("heat", 2);
      }},
      { label: "Spitball Shooter", fn: () => {
        if (!hasItem("spitballs")) { toast("Out of spitballs."); return; }
        useItem("spitballs", 2);
        change("heat", 5);
        change("morale", -2, "He wipes his face. Now he's angry.");
        state.flags.shadyMad = true;
      }},
      { label: "Foam Nunchucks", fn: () => {
        state.flags.shadyDealt = true;
        change("morale", 4, "He laughs, then leaves anyway.");
      }},
      { label: "Never mind", fn: () => {} }
    ]);
  }

  function campTrees() {
    say("Trees", "The pines are thick. Something moved between the trunks a second ago.", [
      { label: "Call out", fn: () => {
        say("You", "Nobody answers. A branch snaps farther in.", [
          { label: "Go back to the fire", fn: () => {} },
          { label: "Wait and watch", fn: () => {
            if (state.flags.shadyDealt) change("morale", 2, "Nothing else moves.");
            else change("morale", -4, "You feel watched the whole way back.");
          }}
        ]);
      }},
      { label: "Go into the forest", fn: () => enterForest() },
      { label: "Cause some trouble", fn: () => forestTrouble() },
      { label: "Don't go in", fn: () => change("morale", 1, "Smart.") }
    ]);
  }

  function enterForest() {
    state.flags.forestExplored = true;
    clearSprites();
    $("#scene-bg").className = "forest";
    $("#scene-title").textContent = "Deep Woods";
    if (!state.flags.shadyDealt) addSprite("char-shady.jpg", "shady");
    const hs = $("#hotspots");
    hs.innerHTML = "";
    const spots = [
      { label: "Root Hollow", style: "left:10%;bottom:16%;width:22%;height:28%;", important: true, action: forestHollow, x: 16 },
      { label: "Fallen Log", style: "left:38%;bottom:12%;width:24%;height:24%;", important: true, action: forestLog, x: 44 },
      { label: "Clearing", style: "left:65%;bottom:18%;width:22%;height:30%;", action: forestClearing, x: 70 },
      { label: "Strange Noise", style: "left:20%;top:20%;width:24%;height:18%;", action: forestNoise, x: 28 },
      { label: "Back to Camp", style: "left:42%;bottom:2%;width:20%;height:12%;", action: () => enterCampground(), x: 50 }
    ];
    spots.forEach(h => {
      const el = document.createElement("div");
      el.className = "hotspot" + (h.important ? " important" : "");
      el.style.cssText = h.style;
      el.textContent = h.label;
      el.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (state.playerMoving) return;
        if (Math.abs(state.playerX - h.x) < 16) h.action();
        else walkThen(h.action, h.x);
      };
      hs.appendChild(el);
    });
    show("scene");
    state.playerX = 50;
    ensureWalkLayer();
    ensurePlayerSprite();
    if (!state.flags.forestSceneIntro) {
      state.flags.forestSceneIntro = true;
      setTimeout(() => say("Deep Woods", "The trail disappears under needles. Your light only reaches so far.", [
        { label: "Look around", fn: () => toast("Tap spots to search. Yellow ones matter.") }
      ]), 300);
    }
  }

  function forestHollow() {
    say("Root Hollow", "Metal glints under a thick root.", [
      { label: "Dig it out", fn: () => {
        if (!state.flags.foundLocket) {
          state.flags.foundLocket = true;
          addOrStack({ id: "locket", name: "Tarnished Locket", desc: "Old photo inside. Someone might want this back.", qty: 1 });
          change("morale", 3);
          toast("Found: Tarnished Locket");
        } else if (!state.flags.foundSpring) {
          state.flags.foundSpring = true;
          addOrStack({ id: "spring", name: "Rusty Spring", desc: "Boing", qty: 1 });
          toast("Found: Rusty Spring");
        } else {
          toast("Nothing else here.");
        }
      }},
      { label: "Leave it", fn: () => {} }
    ]);
  }

  function forestLog() {
    say("Fallen Log", "A plastic pack is wedged under the log.", [
      { label: "Pull it free", fn: () => {
        if (!state.flags.foundBatteries) {
          state.flags.foundBatteries = true;
          addOrStack({ id: "batteries", name: "AA Batteries", desc: "Still good. Useful for someone.", qty: 1 });
          toast("Found: AA Batteries");
        } else if (!state.flags.foundMagnet) {
          state.flags.foundMagnet = true;
          addOrStack({ id: "magnet", name: "Fridge Magnet", desc: "Weak but earnest", qty: 1 });
          toast("Found: Fridge Magnet");
        } else {
          toast("Already cleaned out.");
        }
      }},
      { label: "Kick the log (trouble)", fn: () => {
        change("heat", 3);
        change("morale", -2, "Something skitters away. Loud.");
        state.flags.causedForestTrouble = true;
      }},
      { label: "Leave it", fn: () => {} }
    ]);
  }

  function forestClearing() {
    say("Clearing", "An old fire ring. Cold. Someone camped here recently.", [
      { label: "Search the ashes", fn: () => {
        if (!state.flags.foundCap) {
          state.flags.foundCap = true;
          addOrStack({ id: "bottle_cap", name: "Bottle Cap", desc: "Lucky? Probably not.", qty: 1 });
          toast("Found: Bottle Cap");
        } else toast("Just ash.");
      }},
      { label: "Sit and listen", fn: () => change("morale", 2, "Quiet. Almost peaceful.") },
      { label: "Cause trouble", fn: () => {
        change("heat", 4);
        state.flags.causedForestTrouble = true;
        toast("You knock over the ring. Pointless, but loud.");
      }}
    ]);
  }

  function forestNoise() {
    say("Strange Noise", "Twigs snap. Closer than you like.", [
      { label: "Call out", fn: () => {
        if (!state.flags.shadyDealt) {
          say("???", "…keep walking, tourist.", [
            { label: "Back off", fn: () => change("morale", -3) },
            { label: "Chase them", fn: () => {
              change("morale", -6);
              change("heat", 5);
              state.flags.causedForestTrouble = true;
              toast("You lose them in the dark.");
            }}
          ]);
        } else {
          change("morale", 1, "Just a deer. Or you tell yourself that.");
        }
      }},
      { label: "Hide and watch", fn: () => {
        change("morale", -2);
        if (!state.flags.foundWire) {
          state.flags.foundWire = true;
          addOrStack({ id: "wire", name: "Scrap Wire", desc: "Conducts bad ideas", qty: 1 });
          toast("Found scrap wire near a stump while hiding.");
        }
      }},
      { label: "Get out", fn: () => {} }
    ]);
  }

  function forestTrouble() {
    say("You", "You could make some noise. Scare people. Or worse.", [
      { label: "Throw spitballs into the dark", fn: () => {
        if (!hasItem("spitballs")) { toast("No spitballs left."); return; }
        useItem("spitballs", 2);
        change("heat", 6);
        change("morale", -2, "Something yelps. Then silence.");
        state.flags.causedForestTrouble = true;
      }},
      { label: "Shout and bang on trees", fn: () => {
        change("heat", 5);
        change("morale", -3, "Lights flick on at other sites. A dog starts barking.");
        state.flags.causedForestTrouble = true;
      }},
      { label: "Leave sticky gum on a trail marker", fn: () => {
        if (!hasItem("gum")) { toast("No gum left."); return; }
        useItem("gum");
        change("heat", 3);
        toast("Petty. Effective. Heat up a little.");
        state.flags.causedForestTrouble = true;
      }},
      { label: "Never mind", fn: () => {} }
    ]);
  }

  function campPath() {
    say("Camp Path", "The dirt path leads toward the restrooms and the front gate.", [
      { label: "Walk toward the gate", fn: () => {
        say("Near the Gate", "A ranger truck is parked with the lights off. Someone is writing in a notebook.", [
          { label: "Say hello", fn: () => {
            say("Ranger", "Keep your sites locked. We've had theft reports two nights running.", [
              { label: "We will", fn: () => { state.flags.campWarned = true; change("morale", 2); } },
              { label: "Cause trouble", fn: () => rangerTrouble() }
            ]);
          }},
          { label: "Cause trouble with the ranger", fn: () => rangerTrouble() },
          { label: "Avoid them", fn: () => {
            if (state.resources.heat > 10) change("heat", 2, "You feel like they noticed you.");
            else toast("You loop back quietly.");
          }}
        ]);
      }},
      { label: "Stay near your site", fn: () => {} }
    ]);
  }

  function rangerTrouble() {
    say("Ranger", "Excuse me?", [
      { label: "Mouth off", fn: () => {
        change("heat", 10);
        say("Ranger", "That's enough. Hands where I can see them.", [
          { label: "Talk your way out", fn: () => {
            const bonus = personalities[state.playerPersonality]?.talkBonus || 0;
            if (state.difficulty === "easy" || (state.resources.morale + bonus > 60 && Math.random() > 0.4)) {
              change("heat", 5);
              change("morale", -4, "You talk fast. They let you walk with a warning.");
            } else {
              getArrested(1, "You talked too much. Overnight in the county holding cell.");
            }
          }},
          { label: "Try to run", fn: () => {
            if (state.difficulty === "easy" || Math.random() > 0.55) {
              change("heat", 12);
              change("morale", -6, "You make it back to the camper. Barely.");
            } else {
              getArrested(1, "You didn't make it far. One day in holding.");
            }
          }},
          { label: "Submit", fn: () => getArrested(1, "You go quietly. One day gone.") }
        ]);
      }},
      { label: "Throw spitballs / bubbles", fn: () => {
        change("heat", 20);
        getArrested(state.difficulty === "hard" ? 2 : 1, "Assaulting a ranger with toys. Bold. Stupid. Arrested.");
      }},
      { label: "Back down", fn: () => change("morale", -1) }
    ]);
  }

  // ---------- DINER ----------
  function enterDiner() {
    if (!state.flags.visitedDiner) { state.flags.visitedDiner = true; state.statesVisited++; }
    clearSprites();
    $("#scene-bg").className = "diner";
    $("#scene-title").textContent = "Neon Diner";
    addSprite("char-waitress.jpg", "waitress");
    const hs = $("#hotspots");
    hs.innerHTML = "";
    const spots = [
      { label: "Waitress", style: "left:8%;bottom:6%;width:32%;height:50%;", important: true, action: talkWaitress, x: 16 },
      { label: "Gift Shelf", style: "left:58%;bottom:20%;width:24%;height:26%;", action: examineGifts, x: 65 },
      { label: "Jukebox", style: "left:6%;top:42%;width:18%;height:20%;", action: examineJukebox, x: 12 },
      { label: "Guy at Counter", style: "left:42%;bottom:18%;width:22%;height:28%;", important: true, action: talkCounter, x: 48 }
    ];
    spots.forEach(h => {
      const el = document.createElement("div");
      el.className = "hotspot" + (h.important ? " important" : "");
      el.style.cssText = h.style;
      el.textContent = h.label;
      el.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (state.playerMoving) return;
        if (Math.abs(state.playerX - h.x) < 14) h.action();
        else walkThen(h.action, h.x);
      };
      hs.appendChild(el);
    });
    show("scene");
    state.playerX = 30;
    ensureWalkLayer();
    ensurePlayerSprite();
  }

  function talkWaitress() {
    state.flags.waitressTalks++;
    if (state.flags.waitressTalks === 1) {
      say("Waitress", "You look like you've been in a car too long. What can I get you?", [
        { label: "Food for everyone ($18)", fn: () => {
          if (state.resources.money >= 18) {
            change("money", -18);
            change("food", 14);
            change("morale", 11, "Actual hot food. Big improvement.");
          } else toast("You can't cover the whole table.");
        }},
        { label: "Just coffee ($3)", fn: () => {
          if (state.resources.money >= 3) {
            change("money", -3);
            change("morale", 3, "Coffee helps a little.");
          }
        }},
        { label: "Cause trouble", fn: () => offerTrouble("Waitress") },
        { label: "How's the road look from here?", fn: () => {
          say("Waitress", "Quiet until the campground. Rangers have been checking coolers and bags more than usual this week.", [
            { label: "Good to know", fn: () => change("morale", 2) }
          ]);
        }}
      ]);
    } else {
      say("Waitress", "Back already? Pie's still available if you want it.", [
        { label: "Slice of pie ($5)", fn: () => {
          if (state.resources.money >= 5) {
            change("money", -5);
            change("food", 3);
            change("morale", 5, "Pie was worth it.");
          }
        }},
        { label: "We're good", fn: () => {} }
      ]);
    }
  }

  function examineGifts() {
    say("Gift Shelf", "Keychains, snow globes, duct tape, wire, a rubber chicken in sunglasses, and a bag of random junk.", [
      { label: "Buy rubber chicken ($7)", fn: () => buyJunk("chicken", "Rubber Chicken", "Squeaks. Maybe useful?", 7, 4) },
      { label: "Buy duct tape ($4)", fn: () => buyJunk("duct_tape", "Duct Tape", "Holds the universe together", 4, 1) },
      { label: "Buy scrap wire ($3)", fn: () => buyJunk("wire", "Scrap Wire", "Conducts bad ideas", 3, 0) },
      { label: "Buy keychain ($2)", fn: () => buyJunk("keychain", "State Keychain", "Tiny souvenir", 2, 2) },
      { label: "Buy snow globe ($5)", fn: () => buyJunk("snowglobe", "Snow Globe", "Shakes. Doesn't help driving.", 5, 3) },
      { label: "Buy mystery junk bag ($6)", fn: () => {
        if (state.resources.money < 6) { toast("Not enough money."); return; }
        change("money", -6);
        const pool = [
          { id: "bottle_cap", name: "Bottle Cap", desc: "Lucky? Probably not.", qty: 1 },
          { id: "spring", name: "Rusty Spring", desc: "Boing", qty: 1 },
          { id: "magnet", name: "Fridge Magnet", desc: "Weak but earnest", qty: 1 },
          { id: "duct_tape", name: "Duct Tape", desc: "Holds the universe together", qty: 1 }
        ];
        const item = pool[Math.floor(Math.random() * pool.length)];
        addOrStack(item);
        change("morale", 2, "Got: " + item.name);
      }},
      { label: "Cause trouble / steal junk", fn: () => offerTrouble("Gift Shelf", [
        { label: "Pocket something without paying", fn: () => {
          change("heat", 12);
          addOrStack({ id: "keychain", name: "State Keychain", desc: "Stolen", qty: 1 });
          toast("Stolen keychain. Heat way up.");
        }}
      ])},
      { label: "Leave it", fn: () => {} }
    ]);
  }

  function buyJunk(id, name, desc, cost, moraleGain) {
    if (state.resources.money < cost) { toast("Not enough money."); return; }
    change("money", -cost);
    addOrStack({ id, name, desc, qty: 1 });
    if (moraleGain) change("morale", moraleGain, "Bought: " + name);
    else toast("Bought: " + name);
  }

  function addOrStack(item) {
    const existing = state.inventory.find(i => i.id === item.id);
    if (existing) existing.qty += (item.qty || 1);
    else state.inventory.push({ ...item });
  }

  function openCraft() {
    const recipes = [
      {
        name: "Slapdash Antenna",
        need: ["wire", "duct_tape"],
        result: { id: "antenna", name: "Slapdash Antenna", desc: "Picks up weird radio stations", qty: 1 },
        effect: () => change("morale", 5, "Built a slapdash antenna.")
      },
      {
        name: "Gum Trap",
        need: ["gum", "spring"],
        result: { id: "gum_trap", name: "Gum Trap", desc: "Sticky surprise for prowlers", qty: 1 },
        effect: () => change("morale", 3, "Crafted a gum trap.")
      },
      {
        name: "Chicken Decoy",
        need: ["chicken", "keychain"],
        result: { id: "chicken_decoy", name: "Chicken Decoy", desc: "Distracts people. Somehow.", qty: 1 },
        effect: () => change("morale", 6, "The decoy is ridiculous. Perfect.")
      },
      {
        name: "Magnet Grabber",
        need: ["magnet", "wire"],
        result: { id: "grabber", name: "Magnet Grabber", desc: "Pulls metal out of storm drains", qty: 1 },
        effect: () => change("morale", 4, "Built a magnet grabber.")
      },
      {
        name: "Emergency Patch Kit",
        need: ["duct_tape", "bottle_cap"],
        result: { id: "patch_kit", name: "Emergency Patch Kit", desc: "Might save the camper once", qty: 1 },
        effect: () => change("morale", 2, "Patch kit ready.")
      }
    ];
    const choices = recipes.map(r => ({
      label: r.name + " [" + r.need.join(" + ") + "]",
      fn: () => tryCraft(r)
    }));
    choices.push({ label: "Never mind", fn: () => {} });
    say("Workbench", "Dump the junk on the table. What are you trying to build?", choices);
  }

  function tryCraft(recipe) {
    for (const id of recipe.need) {
      if (!hasItem(id)) {
        toast("Missing: " + id.replace(/_/g, " "));
        return;
      }
    }
    recipe.need.forEach(id => useItem(id));
    addOrStack(recipe.result);
    recipe.effect();
    toast("Built: " + recipe.result.name);
  }

  function examineJukebox() {
    say("Jukebox", "Three songs, all from the late seventies. The buttons stick.", [
      { label: "Play one ($1)", fn: () => {
        if (state.resources.money >= 1) {
          change("money", -1);
          change("morale", 5, "It's bad. It's perfect.");
        }
      }},
      { label: "Cause trouble", fn: () => offerTrouble("Jukebox", [
        { label: "Smash the buttons", fn: () => {
          change("heat", 10);
          change("morale", -5, "The whole diner stares.");
        }}
      ])},
      { label: "Don't bother", fn: () => {} }
    ]);
  }

  function talkCounter() {
    if (state.resources.heat >= 15 || state.flags.coolerTaken) {
      say("Guy at Counter", "You match a description I heard. Painted camper. Family. Someone's been asking around.", [
        { label: "Who's been asking?", fn: () => {
          say("Guy at Counter", "Didn't catch a name. Thin guy, kept his hood up. Said he might stop by Shady Pines.", [
            { label: "Great.", fn: () => change("morale", -3) }
          ]);
        }},
        { label: "You've got the wrong people", fn: () => {
          change("heat", 3);
          toast("He doesn't look convinced.");
        }},
        { label: "Finish your coffee and leave us alone", fn: () => {
          change("morale", -2);
          change("heat", 2);
        }}
      ]);
      return;
    }
    say("Guy at Counter", "You folks with the big painted camper? Saw a ranger asking about a cooler earlier.", [
      { label: "Thanks for the heads-up", fn: () => change("morale", 2) },
      { label: "We don't know anything about that", fn: () => {
        toast("He just nods and goes back to his coffee.");
      }},
      { label: "You hear a lot for someone drinking alone", fn: () => {
        say("Guy at Counter", "People talk. I listen. That's all.", [
          { label: "Fair enough", fn: () => {} }
        ]);
      }}
    ]);
  }

  // ---------- FAMILY TALK (many variations) ----------
  function talkFamily() {
    const playerP = state.playerPersonality;
    const others = state.family.filter(f => !f.isPlayer);
    if (!others.length) {
      say("You", "It's quiet. Too quiet.", [{ label: "…", fn: () => {} }]);
      return;
    }

    // Never pick the player's own role as speaker
    const pickOther = (preferredRoles) => {
      const match = others.filter(f => preferredRoles.includes(f.role) || preferredRoles.includes(f.name));
      if (match.length) return match[Math.floor(Math.random() * match.length)];
      return others[Math.floor(Math.random() * others.length)];
    };

    const someone = others[Math.floor(Math.random() * others.length)];
    const mapPerson = pickOther(["Dad", "Mom", "Older Sister", "Older Brother"]);
    const snackPerson = pickOther(["Mom", "Dad", "Older Sister"]);
    const musicPerson = pickOther(["Younger Brother", "Little Sister", "Older Brother", "Older Sister", "Cousin"]);

    const scenes = [
      {
        speaker: someone.name,
        text: someone.personality === "grumpy"
          ? "We've been in this thing for hours. My legs are numb."
          : someone.personality === "loud"
          ? "Can we stop soon? I need to run around or I'm gonna lose it."
          : "How much longer until the next stop?",
        choices: [
          { label: "We'll stop soon", fn: () => change("morale", 3) },
          { label: "Stop complaining", fn: () => {
            change("morale", -5);
            state.flags.familyTension += 1;
            toast("That didn't help.");
          }},
          { label: "Suggest a game or song", fn: () => change("morale", 6, "Distraction works for a while.") }
        ]
      },
      {
        speaker: mapPerson.name,
        text: "I think if we take the next exit we can cut twenty minutes off. The map says so.",
        choices: [
          { label: "Let's try it", fn: () => {
            if (Math.random() > 0.5) {
              change("gas", 3, "Shortcut actually helped.");
            } else {
              change("gas", -5, "It added time. Of course it did.");
              change("morale", -3);
            }
          }},
          { label: "Stay on the main road", fn: () => change("morale", 1) },
          { label: "Argue about the map", fn: () => {
            change("morale", -6);
            state.flags.familyTension += 1;
            toast("Map argument. Great.");
          }}
        ]
      },
      {
        speaker: snackPerson.name,
        text: "Has anyone seen the good snacks? The ones we were supposed to save?",
        choices: [
          { label: "I think someone already ate them", fn: () => {
            change("morale", -4);
            state.flags.familyTension += 1;
          }},
          { label: "They're still in the back", fn: () => change("morale", 2) },
          { label: "Blame somebody else", fn: () => {
            change("morale", -5);
            toast("Now two people are upset.");
          }}
        ]
      },
      {
        speaker: someone.name,
        text: "Remember when we used to take normal vacations? With planes?",
        choices: [
          { label: "This is more memorable", fn: () => change("morale", 4) },
          { label: "Yeah… this is a lot", fn: () => change("morale", -2) },
          { label: "At least we're together", fn: () => {
            change("morale", 7, "That landed better than expected.");
            state.flags.familyTension = Math.max(0, state.flags.familyTension - 1);
          }}
        ]
      },
      {
        speaker: musicPerson.name,
        text: "If I have to listen to that same playlist one more time I'm walking the rest of the way.",
        choices: [
          { label: "Change the music", fn: () => change("morale", 5) },
          { label: "My trip, my rules", fn: () => {
            change("morale", -6);
            state.flags.familyTension += 1;
          }},
          { label: "Let them pick the next three songs", fn: () => change("morale", 6, "Bribery works.") }
        ]
      }
    ];

    if (playerP === "troublemaker" && Math.random() > 0.6) {
      scenes.push({
        speaker: "You",
        text: "You could start something just to break the boredom.",
        choices: [
          { label: "Start a harmless argument on purpose", fn: () => {
            change("morale", -3);
            state.flags.familyTension += 1;
            toast("You poked the bear.");
          }},
          { label: "Suggest using the Bubble Blaster later", fn: () => change("morale", 4) },
          { label: "Leave it alone", fn: () => {} }
        ]
      });
    }

    const scene = scenes[Math.floor(Math.random() * scenes.length)];
    say(scene.speaker, scene.text, scene.choices);
  }



  function enterTwinLakes() {
    if (!state.flags.visitedTwin) { state.flags.visitedTwin = true; state.statesVisited++; }
    clearSprites();
    $("#scene-bg").className = "twinlakes";
    $("#scene-title").textContent = "Twin Lakes Overlook";
    const hs = $("#hotspots");
    hs.innerHTML = "";
    const spots = [
      { label: "Fence", style: "left:40%;bottom:18%;width:30%;height:22%;", action: () => say("Fence", "Two lakes glitter below. Someone carved initials into the rail.", [
        { label: "Add yours", fn: () => change("morale", 3, "Tourist ritual complete.") },
        { label: "Cause trouble", fn: () => offerTrouble("Overlook fence") }
      ]), x: 50 },
      { label: "Trail", style: "left:8%;bottom:12%;width:24%;height:28%;", important: true, action: () => {
        say("Trail", "A short path drops toward the water.", [
          { label: "Go halfway", fn: () => {
            if (!state.flags.foundTwinJunk) {
              state.flags.foundTwinJunk = true;
              addOrStack({ id: "bottle_cap", name: "Bottle Cap", desc: "Lucky? Probably not.", qty: 1 });
              toast("Found a bottle cap in the dirt.");
            }
            change("morale", 2);
          }},
          { label: "Cause trouble", fn: () => offerTrouble("Lakeside trail") }
        ]);
      }, x: 16 },
      { label: "Photo Spot", style: "left:68%;bottom:20%;width:24%;height:26%;", action: () => {
        say("Photo Spot", "The family argues about who stands in front.", [
          { label: "Take the picture", fn: () => change("morale", 6, "One decent group photo.") },
          { label: "Cause trouble", fn: () => offerTrouble("Photo spot") }
        ]);
      }, x: 75 }
    ];
    spots.forEach(h => {
      const el = document.createElement("div");
      el.className = "hotspot" + (h.important ? " important" : "");
      el.style.cssText = h.style;
      el.textContent = h.label;
      el.onclick = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (state.playerMoving) return;
        if (Math.abs(state.playerX - h.x) < 16) h.action();
        else walkThen(h.action, h.x);
      };
      hs.appendChild(el);
    });
    show("scene");
    state.playerX = 50;
    ensureWalkLayer();
    ensurePlayerSprite();
  }

  function enterBluegrass() {
    if (!state.flags.visitedBluegrass) { state.flags.visitedBluegrass = true; state.statesVisited++; }
    clearSprites();
    $("#scene-bg").className = "reststop";
    $("#scene-title").textContent = "Bluegrass Welcome Center";
    addSprite("char-rusty.jpg", "rusty");
    const hs = $("#hotspots");
    hs.innerHTML = "";
    const spots = [
      { label: "Attendant", style: "left:12%;bottom:8%;width:28%;height:48%;", important: true, action: () => {
        say("Attendant", "Welcome to Kentucky. Maps are free. Coffee is not.", [
          { label: "Take a map", fn: () => change("morale", 2, "You now own a crumpled state map.") },
          { label: "Buy coffee ($2)", fn: () => {
            if (state.resources.money >= 2) { change("money", -2); change("morale", 4); }
          }},
          { label: "Cause trouble", fn: () => offerTrouble("Welcome Center") }
        ]);
      }, x: 20 },
      { label: "Brochure Wall", style: "left:55%;bottom:22%;width:26%;height:30%;", action: () => {
        say("Brochures", "Caves, horses, fried everything.", [
          { label: "Grab a few", fn: () => change("morale", 1) },
          { label: "Cause trouble", fn: () => offerTrouble("Brochure wall") }
        ]);
      }, x: 62 },
      { label: "Parking Lot", style: "left:40%;bottom:4%;width:24%;height:14%;", action: () => {
        say("Lot", "Someone left a cooler unattended by a sedan.", [
          { label: "Leave it alone", fn: () => {} },
          { label: "Cause trouble / steal snacks", fn: () => {
            change("heat", 10);
            change("food", 6);
            change("morale", -3, "You shouldn't have. But the chips are good.");
          }}
        ]);
      }, x: 48 }
    ];
    spots.forEach(h => {
      const el = document.createElement("div");
      el.className = "hotspot" + (h.important ? " important" : "");
      el.style.cssText = h.style;
      el.textContent = h.label;
      el.onclick = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (state.playerMoving) return;
        if (Math.abs(state.playerX - h.x) < 16) h.action();
        else walkThen(h.action, h.x);
      };
      hs.appendChild(el);
    });
    show("scene");
    state.playerX = 30;
    ensureWalkLayer();
    ensurePlayerSprite();
  }

  // ---------- DRIVING MINI-GAME ----------
  const drive = {
    running: false,
    raf: null,
    lane: 1, // 0 left 1 mid 2 right
    speed: 40,
    boosting: false,
    braking: false,
    dist: 0,
    goal: 12, // miles
    obstacles: [],
    cops: [],
    roadOffset: 0,
    lastSpawn: 0,
    crashed: false
  };

  function startHighway() {
    show("drive");
    const canvas = $("#drive-canvas");
    const resize = () => {
      canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
      canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1);
    };
    resize();
    drive.running = true;
    drive.lane = 1;
    drive.speed = 40;
    drive.boosting = false;
    drive.braking = false;
    drive.dist = 0;
    drive.timeLeft = state.difficulty === "hard" ? 60 : (state.difficulty === "easy" ? 10 : 20);
    drive.duration = drive.timeLeft;
    drive.maxHits = state.difficulty === "hard" ? 1 : (state.difficulty === "easy" ? 3 : 2);
    drive.hits = 0;
    drive.obstacles = [];
    drive.cops = [];
    drive.roadOffset = 0;
    drive.lastSpawn = 0;
    drive.crashed = false;
    bindDriveControls();
    const loop = (t) => {
      if (!drive.running) return;
      updateDrive(t);
      drawDrive(canvas);
      drive.raf = requestAnimationFrame(loop);
    };
    drive.raf = requestAnimationFrame(loop);
  }

  function stopDrive() {
    drive.running = false;
    if (drive.raf) cancelAnimationFrame(drive.raf);
  }

  function bindDriveControls() {
    const stage = $("#drive-stage");
    const canvas = $("#drive-canvas");
    let startX = null;
    const onStart = (x) => { startX = x; };
    const onMove = (x) => {
      if (startX == null) return;
      const dx = x - startX;
      if (dx > 40) { drive.lane = Math.min(2, drive.lane + 1); startX = x; }
      if (dx < -40) { drive.lane = Math.max(0, drive.lane - 1); startX = x; }
    };
    const onEnd = () => { startX = null; };
    stage.ontouchstart = (e) => { onStart(e.touches[0].clientX); };
    stage.ontouchmove = (e) => { e.preventDefault(); onMove(e.touches[0].clientX); };
    stage.ontouchend = onEnd;
    stage.onmousedown = (e) => { onStart(e.clientX); };
    stage.onmousemove = (e) => { if (e.buttons) onMove(e.clientX); };
    stage.onmouseup = onEnd;

    $("#btn-boost").onpointerdown = () => { drive.boosting = true; };
    $("#btn-boost").onpointerup = () => { drive.boosting = false; };
    $("#btn-boost").onpointerleave = () => { drive.boosting = false; };
    $("#btn-brake").onpointerdown = () => { drive.braking = true; };
    $("#btn-brake").onpointerup = () => { drive.braking = false; };
    $("#btn-brake").onpointerleave = () => { drive.braking = false; };
    $("#btn-drive-exit").onclick = () => {
      stopDrive();
      change("gas", -5);
      show("hub");
      log("Pulled off the highway early.");
    };
  }

  let driveLastT = 0;
  function updateDrive(t) {
    if (!driveLastT) driveLastT = t;
    const dt = Math.min(0.05, (t - driveLastT) / 1000);
    driveLastT = t;

    let target = 45;
    if (drive.boosting) target = 90;
    if (drive.braking) target = 18;
    drive.speed += (target - drive.speed) * Math.min(1, dt * 3);

    const move = drive.speed * dt * 0.08;
    drive.dist += move;
    drive.roadOffset += drive.speed * dt * 8;

    // spawn
    drive.lastSpawn += dt;
    const rate = state.difficulty === "hard" ? 0.35 : (state.difficulty === "easy" ? 0.9 : 0.55);
    if (drive.lastSpawn > rate) {
      drive.lastSpawn = 0;
      // more obstacles
      const n = state.difficulty === "hard" ? 2 : 1;
      for (let i = 0; i < n; i++) {
        if (Math.random() > 0.25) {
          const types = ["cone", "car", "debris", "car"];
          drive.obstacles.push({
            lane: Math.floor(Math.random() * 3),
            y: -0.08 - Math.random() * 0.12,
            type: types[Math.floor(Math.random() * types.length)]
          });
        }
      }
      if (Math.random() > 0.7) {
        drive.cops.push({ lane: Math.floor(Math.random() * 3), y: -0.15, seen: false });
      }
    }

    const scroll = drive.speed * dt * 0.35;
    drive.obstacles.forEach(o => o.y += scroll * 0.02);
    drive.cops.forEach(c => c.y += scroll * 0.02);
    drive.obstacles = drive.obstacles.filter(o => o.y < 1.2);
    drive.cops = drive.cops.filter(c => c.y < 1.2);

    // collisions
    drive.obstacles.forEach(o => {
      if (o.hit) return;
      if (o.lane === drive.lane && o.y > 0.72 && o.y < 0.92) {
        o.hit = true;
        drive.hits++;
        change("morale", -4);
        change("gas", -2);
        toast("Hit! (" + drive.hits + "/" + drive.maxHits + ")");
        drive.speed *= 0.5;
        if (drive.hits >= drive.maxHits) {
          stopDrive();
          change("morale", -8, "Too many crashes. Drive failed.");
          change("gas", -5);
          show("hub");
          log("Failed the drive after " + drive.hits + " hits.");
          say("Crash Out", "You pull over. The family is rattled. Try the drive again from the map.", [
            { label: "Back to camper", fn: () => {} }
          ]);
          return;
        }
      }
    });
    drive.cops.forEach(c => {
      if (c.lane === drive.lane && c.y > 0.7 && c.y < 0.95) {
        if (drive.speed > 55 && !drive.braking) {
          change("heat", 8);
          toast("Cop clocked you speeding!");
          c.y = 2;
          if (state.resources.heat > 40 && state.difficulty !== "easy") {
            stopDrive();
            getArrested(1, "Highway patrol pulled you over. Lost a day.");
            return;
          }
        } else if (drive.braking) {
          toast("You slowed for the patrol. Smart.");
          c.y = 2;
        }
      }
    });

    drive.timeLeft = Math.max(0, drive.timeLeft - dt);
    $("#drive-speed").textContent = "Speed " + Math.round(drive.speed);
    $("#drive-dist").textContent = Math.ceil(drive.timeLeft) + "s · hits " + drive.hits + "/" + drive.maxHits;
    $("#drive-heat").textContent = "🚨 " + state.resources.heat;

    if (drive.timeLeft <= 0) {
      stopDrive();
      change("gas", state.difficulty === "hard" ? -18 : -10);
      change("morale", 6, "Made it through the highway stretch.");
      if (state.pendingState) {
        state.currentState = state.pendingState;
        if (!state.unlockedStates.includes(state.pendingState)) {
          state.unlockedStates.push(state.pendingState);
          state.statesVisited++;
        }
        const name = STATE_INFO[state.pendingState]?.name || state.pendingState;
        log("Arrived in " + name + "!");
        state.pendingState = null;
        show("hub");
        say("Welcome", "You made it to " + name + ". Check the map for places to explore.", [
          { label: "Open map", fn: () => showMap() },
          { label: "Stay in camper", fn: () => {} }
        ]);
      } else {
        state.flags.visitedTwin = true;
        show("hub");
        log("Cleared the highway run.");
        say("Road Clear", "You finish the stretch in one piece.", [
          { label: "OK", fn: () => {} }
        ]);
      }
    }
  }

  function drawDrive(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = "#3d5c3d";
    ctx.fillRect(0, 0, w, h);
    // road
    const roadW = w * 0.55;
    const roadX = (w - roadW) / 2;
    ctx.fillStyle = "#444";
    ctx.fillRect(roadX, 0, roadW, h);
    // lanes
    ctx.strokeStyle = "#ccc";
    ctx.setLineDash([h * 0.04, h * 0.05]);
    ctx.lineWidth = 3;
    ctx.lineDashOffset = -drive.roadOffset % 80;
    for (let i = 1; i <= 2; i++) {
      const x = roadX + (roadW / 3) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // obstacles
    const laneW = roadW / 3;
    drive.obstacles.forEach(o => {
      const x = roadX + o.lane * laneW + laneW * 0.2;
      const y = o.y * h;
      ctx.fillStyle = o.type === "cone" ? "#e67e22" : (o.type === "debris" ? "#7f8c8d" : "#2980b9");
      const oh = o.type === "cone" ? h * 0.06 : h * 0.09;
      ctx.fillRect(x, y, laneW * 0.55, oh);
    });
    drive.cops.forEach(c => {
      const x = roadX + c.lane * laneW + laneW * 0.15;
      const y = c.y * h;
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(x, y, laneW * 0.7, h * 0.09);
      ctx.fillStyle = "#3498db";
      ctx.fillRect(x, y, laneW * 0.7, h * 0.02);
    });
    // player car
    const px = roadX + drive.lane * laneW + laneW * 0.15;
    const py = h * 0.78;
    ctx.fillStyle = "#f0b429";
    ctx.fillRect(px, py, laneW * 0.7, h * 0.12);
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(px + laneW * 0.1, py + h * 0.02, laneW * 0.5, h * 0.04);
  }


  // ---------- WIRE UP ----------
  function init() {
    $("#family-size").addEventListener("change", buildFamilySetupUI);
    $("#player-role").addEventListener("change", buildFamilySetupUI);
    buildFamilySetupUI();

    $("#btn-start").onclick = () => show("family");
    const skipBtn = $("#btn-family-skip");
    if (skipBtn) skipBtn.onclick = () => {
      // random quick start
      const roles = ["Older Sister","Older Brother","Mom","Dad","Younger Sibling"];
      const hairs = ["brown","blond","black","red"];
      const skins = ["light","medium","tan","dark"];
      const pers = Object.keys(personalities);
      $("#player-role").value = roles[Math.floor(Math.random()*roles.length)];
      $("#player-hair").value = hairs[Math.floor(Math.random()*hairs.length)];
      $("#player-skin").value = skins[Math.floor(Math.random()*skins.length)];
      $("#player-personality").value = pers[Math.floor(Math.random()*pers.length)];
      $("#family-size").value = "4";
      buildFamilySetupUI();
      buildFamily();
      const d = $("#difficulty") && $("#difficulty").value;
      if (!d) { alert("Choose a difficulty first."); return; }
      state.difficulty = d;
      if (state.difficulty === "easy") {
        state.resources = { gas: 100, food: 80, money: 150, morale: 85, heat: 0 };
      } else if (state.difficulty === "hard") {
        state.resources = { gas: 55, food: 40, money: 70, morale: 55, heat: 0 };
      }
      show("hub");
      log("Skipped setup. Random family. Day 1. (" + d + ")");
    };

    $("#btn-family-done").onclick = () => {
      try {
        const diffEl = $("#difficulty");
        if (!diffEl || !diffEl.value) {
          alert("Choose a difficulty before you hit the road.");
          return;
        }
        buildFamily();
        state.playerOutfit = ($("#player-outfit") && $("#player-outfit").value) || "casual";
        state.familyName = ($("#family-name") && $("#family-name").value) || "";
        state.difficulty = diffEl.value;
        if (state.difficulty === "easy") {
          state.resources.food = 80;
          state.resources.money = 150;
          state.resources.gas = 100;
          state.resources.morale = 85;
        } else if (state.difficulty === "hard") {
          state.resources.food = 40;
          state.resources.money = 70;
          state.resources.gas = 55;
          state.resources.morale = 55;
        } else if (state.familySize >= 5) {
          state.resources.food = 48;
          state.resources.money = 95;
        }
        show("hub");
        log("Everyone's in. Day 1. (" + state.difficulty + ")");
      } catch (err) {
        console.error(err);
        alert("Something went wrong starting the trip. Try again.");
      }
    };

    const craftBtn = $("#btn-craft");
    if (craftBtn) craftBtn.onclick = openCraft;

    const restart = $("#btn-restart");
    if (restart) restart.onclick = () => location.reload();

    $("#btn-rest").onclick = () => {
      change("morale", 12);
      change("food", -3);
      log("Rested.");
      // Camper trouble on medium/hard
      if (state.difficulty !== "easy" && state.resources.heat >= 30 && Math.random() > 0.75) {
        if (hasItem("patch_kit")) {
          useItem("patch_kit");
          toast("Something sparked near the engine. Patch kit saved you.");
        } else if (state.difficulty === "hard" && Math.random() > 0.5) {
          state.flags.camperExploded = true;
          checkLoseConditions();
          return;
        } else {
          change("gas", -15);
          change("morale", -10, "Engine trouble overnight. Lost gas.");
        }
      }
      if (Math.random() > 0.65) advanceDay("Night passes.");
    };

    $("#btn-eat").onclick = () => {
      if (state.resources.food < 7) { toast("Not enough food."); return; }
      change("food", -7);
      change("morale", 13, "Everyone eats. Mood improves.");
      state.flags.familyTension = Math.max(0, state.flags.familyTension - 1);
      log("Ate together.");
    };

    $("#btn-talk-family").onclick = talkFamily;
    $("#btn-weapons").onclick = openInv;
    $("#btn-depart").onclick = () => showMap();
    $("#btn-map-back").onclick = () => show("hub");

    // destinations built dynamically in showMap()

    $("#btn-leave").onclick = () => {
      const onCamp = $("#scene-bg") && $("#scene-bg").classList.contains("campground");
      clearSprites();
      if (onCamp && !state.flags.shadyDealt && !state.flags.campLockFixed && Math.random() > 0.45) {
        change("food", -7);
        change("morale", -8, "Something got into the storage overnight.");
        log("Lost food at the campground.");
        state.flags.shadyDealt = true;
      } else {
        log("Back at the camper.");
      }
      show("hub");
    };

    $("#btn-inventory").onclick = openInv;
    $("#btn-close-inv").onclick = closeInv;
    const cp = $("#btn-close-portrait");
    if (cp) cp.onclick = closePortrait;
    const pv = $("#portrait-viewer");
    if (pv) pv.addEventListener("click", (e) => { if (e.target === pv) closePortrait(); });
  }

  init();
})();

// Camper Quest – natural dialogue, personalities, more arguments

(() => {
  const state = {
    day: 1,
    dayLabel: "Leaving Home",
    playerRole: "Older Sister",
    playerPersonality: "sarcastic",
    playerHair: "brown",
    playerSkin: "medium",
    playerBuild: "average",
    familySize: 4,
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
      waitressTalks: 0,
      familyTension: 0
    },
    statesVisited: 0
  };

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
            <option value="grumpy">Grumpy</option>
            <option value="optimistic">Optimistic</option>
            <option value="quiet">Quiet</option>
            <option value="loud">Loud</option>
            <option value="troublemaker">Troublemaker</option>
            <option value="peacemaker">Peacemaker</option>
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
    state.playerBuild = $("#player-build").value;
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
      if (f.isPlayer) img.src = getPlayerSpriteSrc();
      else if (f.role === "Dad" || f.name === "Dad") img.src = "portrait-dad.jpg";
      else if (f.role === "Mom" || f.name === "Mom") img.src = "portrait-mom.jpg";
      else img.src = getPlayerSpriteSrc(); // fallback
      img.alt = f.name || f.role;
      img.title = (f.isPlayer ? "You" : f.name) + " – " + (personalities[f.personality]?.label || "");
      box.appendChild(img);
    });
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

  function change(key, amount, msg) {
    const max = (key === "morale" || key === "heat") ? 100 : 999;
    state.resources[key] = Math.max(0, Math.min(max, state.resources[key] + amount));
    if (msg) toast(msg);
    updateHub();
  }

  function advanceDay(reason) {
    state.day++;
    state.dayLabel = dayLabels[Math.min(state.day, dayLabels.length - 1)] || `Day ${state.day}`;
    const drain = 3 + Math.floor(state.familySize / 2);
    change("food", -drain);
    if (state.resources.food < 12) change("morale", -7, "Everyone's getting hungry.");
    if (state.resources.heat > 0) change("heat", -4);
    log(reason || `Day ${state.day}.`);
    updateHub();
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
      const d = document.createElement("div");
      d.className = "inv-item";
      d.innerHTML = `<span><b>${item.name}</b>${item.desc ? `<br><small style="opacity:.7">${item.desc}</small>` : ""}</span><span>×${item.qty}</span>`;
      list.appendChild(d);
    });
    $("#inventory").classList.remove("hidden");
  }

  function closeInv() { $("#inventory").classList.add("hidden"); }

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

  
  function getPlayerSpriteSrc() {
    const role = state.playerRole;
    if (role === "Dad") return "player-dad.jpg";
    if (role === "Mom") return "player-mom.jpg";
    if (role === "Older Brother" || role === "Younger Sibling") return "player-brother.jpg";
    return "player-sister.jpg";
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
    p.classList.remove("tall", "short", "stocky");
    if (state.playerBuild === "tall") p.classList.add("tall");
    if (state.playerBuild === "short") p.classList.add("short");
    if (state.playerBuild === "stocky") p.classList.add("stocky");
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

  function movePlayerTo(targetX, onArrive) {
    const p = ensurePlayerSprite();
    state.playerTargetX = targetX;
    state.playerMoving = true;
    state.pendingAction = onArrive || null;

    // face direction
    if (targetX > state.playerX) p.classList.remove("flipped");
    else p.classList.add("flipped");

    const start = state.playerX;
    const dist = Math.abs(targetX - start);
    const duration = Math.max(300, dist * 28); // ms
    const t0 = performance.now();

    function step(now) {
      const t = Math.min(1, (now - t0) / duration);
      // ease
      const ease = t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t;
      state.playerX = start + (targetX - start) * ease;
      p.style.left = state.playerX + "%";
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        state.playerMoving = false;
        state.playerX = targetX;
        p.style.left = targetX + "%";
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
    const target = Math.max(10, Math.min(85, hotspotLeftPct + 6));
    movePlayerTo(target, actionFn);
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
        e.stopPropagation();
        if (state.playerMoving) return;
        walkThen(h.action, h.x);
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
      say("Rusty", "You again. Still here?", [
        { label: "Yeah, just checking things", fn: () => say("Rusty", "Don't check too hard. Last person who 'checked' something walked off with a whole cooler.") },
        { label: "Has the other family calmed down?", fn: () => {
          if (state.flags.rivalState === "truce") say("Rusty", "Surprisingly, yes. Whatever you said worked.");
          else say("Rusty", "No. They're still circling like hawks.");
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
    $("#hotspots").innerHTML = "";
    show("scene");
    say("Shady Pines", "It's getting dark. Your camper is under the trees. Something scrapes near the back storage door.", [
      { label: "Go check", fn: () => {
        say("Behind the Camper", "Someone's trying the latch on the storage compartment.", [
          { label: "Yell at them", fn: () => {
            change("morale", 4, "They take off running.");
            log("Ran off a prowler at the campground.");
            show("hub");
          }},
          { label: "Hit them with bubbles", fn: () => {
            if (hasItem("bubbles")) {
              useItem("bubbles");
              change("morale", 7, "Big bubbles. They panic and run.");
              log("Bubbles handled the situation.");
            } else {
              change("food", -5, "No bubbles left. They got into the snacks.");
            }
            show("hub");
          }},
          { label: "Stay quiet and watch", fn: () => {
            change("food", -9);
            change("morale", -10, "They took food and left. Everyone's on edge.");
            log("Lost supplies overnight.");
            show("hub");
          }}
        ]);
      }},
      { label: "Lock everything and stay inside", fn: () => {
        change("morale", -2);
        log("Stayed locked in. Quiet night.");
        show("hub");
      }}
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
    [
      { label: "Waitress", style: "left:8%;bottom:6%;width:32%;height:50%;", important: true, action: talkWaitress },
      { label: "Gift Shelf", style: "left:58%;bottom:20%;width:24%;height:26%;", action: examineGifts },
      { label: "Jukebox", style: "left:6%;top:42%;width:18%;height:20%;", action: examineJukebox },
      { label: "Guy at Counter", style: "left:42%;bottom:18%;width:20%;height:24%;", action: talkCounter }
    ].forEach(h => {
      const el = document.createElement("div");
      el.className = "hotspot" + (h.important ? " important" : "");
      el.style.cssText = h.style;
      el.textContent = h.label;
      el.onclick = h.action;
      hs.appendChild(el);
    });
    show("scene");
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
    say("Gift Shelf", "Keychains, snow globes, and a rubber chicken in sunglasses.", [
      { label: "Buy the chicken ($7)", fn: () => {
        if (state.resources.money >= 7) {
          change("money", -7);
          state.inventory.push({ id: "chicken", name: "Rubber Chicken", desc: "No practical use", qty: 1 });
          change("morale", 4, "Someone in the family already loves it.");
        }
      }},
      { label: "Leave it", fn: () => {} }
    ]);
  }

  function examineJukebox() {
    say("Jukebox", "Three songs, all from the late seventies. The buttons stick.", [
      { label: "Play one ($1)", fn: () => {
        if (state.resources.money >= 1) {
          change("money", -1);
          change("morale", 5, "It's bad. It's perfect.");
        }
      }},
      { label: "Don't bother", fn: () => {} }
    ]);
  }

  function talkCounter() {
    say("Guy at Counter", "You folks with the big painted camper? Saw a ranger asking about a cooler earlier.", [
      { label: "Thanks for the heads-up", fn: () => change("morale", 2) },
      { label: "We don't know anything about that", fn: () => {
        if (state.flags.coolerTaken) change("heat", 2);
        toast("He just nods and goes back to his coffee.");
      }}
    ]);
  }

  // ---------- FAMILY TALK (many variations) ----------
  function talkFamily() {
    const playerP = state.playerPersonality;
    const others = state.family.filter(f => !f.isPlayer);
    const someone = others[Math.floor(Math.random() * others.length)] || { name: "Someone", personality: "quiet" };

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
        speaker: "Dad",
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
            toast("Map argument achieved.");
          }}
        ]
      },
      {
        speaker: "Mom",
        text: "Has anyone seen the good snacks? The ones I specifically said to save?",
        choices: [
          { label: "I think someone already ate them", fn: () => {
            change("morale", -4);
            state.flags.familyTension += 1;
          }},
          { label: "They're still in the back", fn: () => change("morale", 2) },
          { label: "Blame the youngest", fn: () => {
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
        speaker: "Younger Brother",
        text: "If I have to listen to that same playlist one more time I'm walking the rest of the way.",
        choices: [
          { label: "Change the music", fn: () => change("morale", 5) },
          { label: "It's my car, my rules", fn: () => {
            change("morale", -6);
            state.flags.familyTension += 1;
          }},
          { label: "Let him pick the next three songs", fn: () => change("morale", 6, "Bribery works.") }
        ]
      }
    ];

    // personality-flavored player options sometimes
    if (playerP === "troublemaker" && Math.random() > 0.6) {
      scenes.push({
        speaker: "You",
        text: "You could start something just to break the boredom.",
        choices: [
          { label: "Start a harmless argument on purpose", fn: () => {
            change("morale", -3);
            state.flags.familyTension += 1;
            toast("You poked the bear. It's awake now.");
          }},
          { label: "Suggest using the Bubble Blaster later", fn: () => change("morale", 4) },
          { label: "Leave it alone", fn: () => {} }
        ]
      });
    }

    const scene = scenes[Math.floor(Math.random() * scenes.length)];
    say(scene.speaker, scene.text, scene.choices);
  }

  // ---------- WIRE UP ----------
  function init() {
    $("#family-size").addEventListener("change", buildFamilySetupUI);
    $("#player-role").addEventListener("change", buildFamilySetupUI);
    buildFamilySetupUI();

    $("#btn-start").onclick = () => show("family");

    $("#btn-family-done").onclick = () => {
      buildFamily();
      if (state.familySize >= 5) {
        state.resources.food = 48;
        state.resources.money = 95;
      }
      show("hub");
      log("Everyone's in. Day 1.");
    };

    $("#btn-rest").onclick = () => {
      change("morale", 12);
      change("food", -3);
      log("Rested.");
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
    $("#btn-depart").onclick = () => show("map");
    $("#btn-map-back").onclick = () => show("hub");

    $$(".dest").forEach(btn => {
      btn.onclick = () => {
        const dest = btn.dataset.dest;
        change("gas", -8);
        change("food", -3 - Math.floor(state.familySize / 3));
        if (Math.random() > 0.35) advanceDay("Miles go by.");

        if (dest === "reststop") { enterReststop(); log("Stopped at Rusty's."); }
        else if (dest === "campground") { enterCampground(); }
        else if (dest === "diner") { enterDiner(); log("Pulled into the diner."); }
        updateHub();
      };
    });

    $("#btn-leave").onclick = () => {
      clearSprites();
      show("hub");
      log("Back at the camper.");
    };

    $("#btn-inventory").onclick = openInv;
    $("#btn-close-inv").onclick = closeInv;
  }

  init();
})();

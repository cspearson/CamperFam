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
      causedForestTrouble: false
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

  
  function familyTone() {
    // Shared family look from player choices
    const skin = state.playerSkin || "medium";
    const hair = state.playerHair || "brown";
    if (skin === "dark" || hair === "black") return "dark";
    if (skin === "light" || hair === "blond") return "light";
    if (hair === "red") return "light";
    return "medium"; // brown/tan/medium
  }

  function getPlayerSpriteSrc() {
    const role = state.playerRole || "Older Sister";
    const tone = familyTone();
    if (role === "Dad") return tone === "light" ? "player-dad-light.jpg" : "player-dad.jpg";
    if (role === "Mom") return (tone === "medium" || tone === "dark") ? "player-mom-medium.jpg" : "player-mom.jpg";
    if (role === "Older Brother" || role === "Younger Sibling") {
      if (tone === "dark") return "player-brother-dark.jpg";
      if (tone === "medium") return "player-brother-brown.jpg";
      return "player-brother.jpg";
    }
    if (tone === "dark") return "player-sister-dark.jpg";
    if (tone === "light") return "player-sister-blond.jpg";
    return "player-sister.jpg";
  }

  function getFamilyMemberSprite(member) {
    if (!member || member.isPlayer) return getPlayerSpriteSrc();
    const role = member.role || member.name || "";
    const tone = familyTone();
    // Same tone as player so the whole family matches
    if (role === "Dad") return tone === "light" ? "player-dad-light.jpg" : "player-dad.jpg";
    if (role === "Mom") return (tone === "medium" || tone === "dark") ? "player-mom-medium.jpg" : "player-mom.jpg";
    if (role === "Little Sister") return "player-littlesis.jpg";
    if (["Older Brother", "Younger Brother", "Cousin", "Uncle"].includes(role)) {
      if (tone === "dark") return "player-brother-dark.jpg";
      if (tone === "medium") return "player-brother-brown.jpg";
      return "player-brother.jpg";
    }
    if (["Older Sister", "Aunt"].includes(role)) {
      if (tone === "dark") return "player-sister-dark.jpg";
      if (tone === "light") return "player-sister-blond.jpg";
      return "player-sister.jpg";
    }
    if (tone === "dark") return "player-brother-dark.jpg";
    if (tone === "light") return "player-brother.jpg";
    return "player-brother-brown.jpg";
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
    say("Deep in the Pines", "The path narrows. Your flashlight catches something metallic under a root.", [
      { label: "Pick it up", fn: () => {
        if (!state.flags.foundLocket) {
          state.flags.foundLocket = true;
          state.inventory.push({ id: "locket", name: "Tarnished Locket", desc: "Old photo inside. Someone might want this back.", qty: 1 });
          change("morale", 3, "You pocket a tarnished locket.");
          toast("Item found: Tarnished Locket");
        } else {
          toast("You've already searched here.");
        }
        say("Forest", "Farther in, a fallen log hides a small plastic pack.", [
          { label: "Check the pack", fn: () => {
            if (!state.flags.foundBatteries) {
              state.flags.foundBatteries = true;
              state.inventory.push({ id: "batteries", name: "AA Batteries", desc: "Still good. Useful for someone.", qty: 1 });
              toast("Item found: AA Batteries");
            }
            say("Forest", "That's enough exploring for now.", [
              { label: "Head back", fn: () => {} }
            ]);
          }},
          { label: "Leave it", fn: () => {} }
        ]);
      }},
      { label: "Keep walking deeper", fn: () => {
        say("Forest", "You push farther than you should. A figure shifts between trees — then it's gone.", [
          { label: "Get out of here", fn: () => {
            change("morale", -5, "Your heart is still racing.");
            if (!state.flags.shadyDealt) change("heat", 2);
          }},
          { label: "Chase it", fn: () => {
            change("morale", -8);
            change("heat", 4, "You trip, scramble up, and run back to camp.");
            state.flags.causedForestTrouble = true;
          }}
        ]);
      }},
      { label: "Turn back", fn: () => {} }
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
              { label: "We will", fn: () => { state.flags.campWarned = true; change("morale", 2); } }
            ]);
          }},
          { label: "Avoid them", fn: () => {
            if (state.resources.heat > 10) change("heat", 2, "You feel like they noticed you.");
            else toast("You loop back quietly.");
          }}
        ]);
      }},
      { label: "Stay near your site", fn: () => {} }
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

  // ---------- WIRE UP ----------
  function init() {
    $("#family-size").addEventListener("change", buildFamilySetupUI);
    $("#player-role").addEventListener("change", buildFamilySetupUI);
    buildFamilySetupUI();

    $("#btn-start").onclick = () => show("family");

    $("#btn-family-done").onclick = () => {
      try {
        buildFamily();
        if (state.familySize >= 5) {
          state.resources.food = 48;
          state.resources.money = 95;
        }
        show("hub");
        log("Everyone's in. Day 1.");
      } catch (err) {
        console.error(err);
        alert("Something went wrong starting the trip. Try again.");
      }
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

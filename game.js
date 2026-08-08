// Camper Quest – Point & Click
// Dialogue-driven consequences • Multiple silly weapons • Day progression

(() => {
  const state = {
    day: 1,
    dayLabel: "Leaving Home",
    playerRole: "Older Sister",
    familySize: 4,
    family: [],
    resources: { gas: 80, food: 55, money: 110, morale: 70, heat: 0 },
    inventory: [
      { id: "bubbles", name: "Bubble Blaster", desc: "Giant floating bubbles", qty: 5 },
      { id: "spitballs", name: "Spitball Shooter", desc: "Classic schoolyard ammo", qty: 8 },
      { id: "nunchucks", name: "Foam Nunchucks", desc: "Look cooler than they are", qty: 1 },
      { id: "gum", name: "Sticky Bubble Gum", desc: "Perfect for hair emergencies", qty: 4 },
      { id: "snacks", name: "Road Snacks", qty: 3 }
    ],
    flags: {
      coolerTaken: false,
      talkedRusty: false,
      rivalMad: false,
      rivalTruce: false,
      gumInHair: false,
      policeDone: false,
      visitedRest: false,
      visitedCamp: false,
      visitedDiner: false,
      familyMood: "normal" // normal | happy | grumpy | chaotic
    },
    statesVisited: 0
  };

  const dayLabels = [
    "", "Leaving Home", "First Stretch", "Getting Settled", "Road Weary",
    "Halfway Vibes", "Deep into the Trip", "Almost Legendary", "Final Push"
  ];

  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  function show(id) {
    $$(".screen").forEach(el => el.classList.remove("active"));
    const el = document.getElementById("screen-" + id);
    if (el) el.classList.add("active");
    if (id === "hub") updateHub();
    if (id === "map") $("#map-day").textContent = state.day;
  }

  function buildFamily() {
    const others = ["Dad", "Mom", "Younger Brother", "Little Sister", "Cousin", "Baby"];
    state.family = [{ name: "You", role: state.playerRole, isPlayer: true }];
    for (let i = 1; i < state.familySize; i++) {
      state.family.push({ name: others[i-1] || "Family", role: others[i-1], isPlayer: false });
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
    $("#family-line").textContent = "Family: " + state.family.map(f => f.isPlayer ? `You (${f.role})` : f.name).join(", ");
  }

  function log(msg) {
    const el = $("#hub-log");
    el.innerHTML = `<div>• ${msg}</div>` + el.innerHTML;
  }

  function toast(msg, ms = 2600) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.add("hidden"), ms);
  }

  function changeResource(key, amount, reason) {
    state.resources[key] = Math.max(0, Math.min(key === "morale" || key === "heat" ? 100 : 999, state.resources[key] + amount));
    if (reason) toast(reason);
    updateHub();
  }

  function advanceDay(reason) {
    state.day++;
    state.dayLabel = dayLabels[Math.min(state.day, dayLabels.length - 1)] || `Day ${state.day}`;
    // Daily drain
    const foodDrain = 3 + Math.floor(state.familySize / 2);
    changeResource("food", -foodDrain);
    if (state.resources.food < 10) changeResource("morale", -8, "Running low on food… family is grumpy.");
    if (state.resources.heat > 0) changeResource("heat", -3); // heat cools a bit each day
    log(reason || `Day ${state.day} begins.`);
    updateHub();
  }

  // ---------- Dialogue ----------
  function say(speaker, text, choices = []) {
    $("#dlg-speaker").textContent = speaker;
    $("#dlg-text").textContent = text;
    const box = $("#dlg-choices");
    box.innerHTML = "";
    if (choices.length === 0) {
      const b = document.createElement("button");
      b.textContent = "…";
      b.onclick = () => hideDialogue();
      box.appendChild(b);
    } else {
      choices.forEach(c => {
        const b = document.createElement("button");
        b.textContent = c.label;
        b.onclick = () => {
          hideDialogue();
          if (c.fn) c.fn();
        };
        box.appendChild(b);
      });
    }
    $("#dialogue").classList.remove("hidden");
  }

  function hideDialogue() {
    $("#dialogue").classList.add("hidden");
  }

  // ---------- Inventory ----------
  function openInv() {
    const list = $("#inv-list");
    list.innerHTML = "";
    state.inventory.forEach(item => {
      const d = document.createElement("div");
      d.className = "inv-item";
      d.innerHTML = `<span><b>${item.name}</b>${item.desc ? `<br><small style="opacity:0.7">${item.desc}</small>` : ""}</span><span>×${item.qty}</span>`;
      list.appendChild(d);
    });
    $("#inventory").classList.remove("hidden");
  }

  function closeInv() {
    $("#inventory").classList.add("hidden");
  }

  function hasItem(id) {
    const it = state.inventory.find(i => i.id === id);
    return it && it.qty > 0;
  }

  function useItem(id, amount = 1) {
    const it = state.inventory.find(i => i.id === id);
    if (it) it.qty = Math.max(0, it.qty - amount);
  }

  // ---------- Rest Stop Scene ----------
  function enterReststop() {
    $("#scene-bg").className = "reststop";
    $("#scene-title").textContent = "Rusty's Roadside Rest Stop";
    const hs = $("#hotspots");
    hs.innerHTML = "";

    const spots = [
      { id: "rusty", label: "Rusty", style: "left:10%; bottom:20%; width:24%; height:30%;", important: true, action: talkRusty },
      { id: "cooler", label: "⚠️ Cooler", style: "left:55%; bottom:18%; width:26%; height:24%;", important: true, action: examineCooler },
      { id: "rival", label: "Rival Family", style: "left:35%; bottom:16%; width:22%; height:28%;", action: talkRival },
      { id: "vending", label: "Vending", style: "left:78%; bottom:26%; width:16%; height:32%;", action: examineVending },
      { id: "bench", label: "Bench", style: "left:5%; top:48%; width:20%; height:14%;", action: examineBench }
    ];

    spots.forEach(h => {
      const el = document.createElement("div");
      el.className = "hotspot" + (h.important ? " important" : "");
      el.style.cssText = h.style;
      el.textContent = h.label;
      el.onclick = h.action;
      hs.appendChild(el);
    });
    show("scene");

    if (!state.flags.visitedRest) {
      state.flags.visitedRest = true;
      state.statesVisited++;
      setTimeout(() => {
        say("You", "Another rest stop. The air smells like asphalt and questionable hot dogs.", [
          { label: "Explore", fn: () => toast("Tap the glowing spots. Yellow ones are important.") }
        ]);
      }, 350);
    }
  }

  function talkRusty() {
    if (state.flags.talkedRusty) {
      const lines = [
        { t: "Still here? Don't make me call the ranger again.", choices: [
          { label: "We're leaving soon", fn: () => changeResource("morale", 2) },
          { label: "Any gossip?", fn: () => say("Rusty", "The Hendersons are still mad about their cooler. And someone keeps putting gum on the benches.") }
        ]},
        { t: "You look like trouble. Or tired. Maybe both.", choices: [
          { label: "Just tired", fn: () => changeResource("morale", 3, "Rusty almost smiles.") },
          { label: "Definitely trouble", fn: () => changeResource("heat", 4, "Rusty narrows his eyes.") }
        ]}
      ];
      const pick = lines[Math.floor(Math.random() * lines.length)];
      say("Rusty", pick.t, pick.choices);
      return;
    }
    state.flags.talkedRusty = true;
    say("Rusty", "Welcome to Rusty's. Coffee is burnt, gas is expensive, and the ball of twine is forty miles that way. What do you want?", [
      { label: "Just looking around", fn: () => {
        changeResource("morale", 2);
        say("Rusty", "Look all you want. Touch nothing that isn't yours.", [
          { label: "Got it", fn: () => {} }
        ]);
      }},
      { label: "Any trouble around here?", fn: () => {
        say("Rusty", "There's a rival family parked over there. And people keep raiding coolers. I called the ranger twice this week.", [
          { label: "Thanks for the warning", fn: () => changeResource("morale", 4, "Useful info. Morale up.") }
        ]);
      }},
      { label: "Sell me anything useful?", fn: () => {
        say("Rusty", "I got extra bubble solution for $12, or a pack of spitballs for $8.", [
          { label: "Buy bubbles ($12)", fn: () => {
            if (state.resources.money >= 12) {
              changeResource("money", -12);
              useItem("bubbles", -3); // add
              const b = state.inventory.find(i => i.id === "bubbles");
              if (b) b.qty += 3;
              toast("Bought more bubbles.");
            } else toast("Not enough money.");
          }},
          { label: "Buy spitballs ($8)", fn: () => {
            if (state.resources.money >= 8) {
              changeResource("money", -8);
              const s = state.inventory.find(i => i.id === "spitballs");
              if (s) s.qty += 6;
              toast("Spitball ammo acquired.");
            } else toast("Not enough money.");
          }},
          { label: "Never mind", fn: () => {} }
        ]);
      }}
    ]);
  }

  function examineCooler() {
    if (state.flags.coolerTaken) {
      say("Empty Cooler", "Just melted ice and a sad sticky note that says 'Hendersons were here'.", [
        { label: "Walk away", fn: () => {} }
      ]);
      return;
    }
    say("⚠️ Unattended Cooler", "Big cooler, lid half-open. Sodas, sandwiches, and a bag of fancy chips. A name is written on the side: HENDERSONS – HANDS OFF.", [
      { label: "Leave it alone (honest)", fn: () => {
        changeResource("morale", 6, "You did the right thing. Family notices.");
        state.flags.familyMood = "happy";
      }},
      { label: "Take the snacks (crime)", fn: () => {
        state.flags.coolerTaken = true;
        changeResource("food", 12);
        changeResource("heat", 20, "You stole the cooler contents. Heat is rising fast.");
        state.inventory.push({ id: "stolen_chips", name: "Stolen Fancy Chips", qty: 1 });
        state.flags.familyMood = "chaotic";
        // Police chance
        setTimeout(() => {
          if (!state.flags.policeDone && state.resources.heat >= 15) triggerPolice();
        }, 2000);
      }},
      { label: "Put gum on the handle as a prank", fn: () => {
        if (!hasItem("gum")) { toast("No bubble gum left."); return; }
        useItem("gum");
        changeResource("heat", 6, "You stuck gum on the cooler. Petty, but funny.");
        state.flags.gumInHair = true; // reused flag for prank
        toast("Sticky prank complete.");
      }}
    ]);
  }

  function talkRival() {
    if (state.flags.rivalTruce) {
      say("Rival Kid", "We're good. Just don't steal our shade again.", [
        { label: "Peace", fn: () => {} }
      ]);
      return;
    }
    if (state.flags.rivalMad) {
      say("Rival Parent", "You again? We still haven't forgotten.", [
        { label: "Try to apologize", fn: () => tryMakePeace() },
        { label: "Pull out a weapon", fn: () => chooseWeapon() },
        { label: "Walk away", fn: () => changeResource("morale", -3) }
      ]);
      return;
    }
    say("Rival Parent", "This shade is ours today. Your big colorful camper is blocking the good spot.", [
      { label: "Apologize and offer snacks", fn: () => {
        if (state.resources.food >= 6) {
          changeResource("food", -6);
          state.flags.rivalTruce = true;
          changeResource("morale", 10, "Truce achieved with snacks. Morale rises.");
        } else {
          toast("Not enough food to share.");
          state.flags.rivalMad = true;
        }
      }},
      { label: "Argue back", fn: () => {
        state.flags.rivalMad = true;
        say("Rival Parent", "Oh, you want to go there?", [
          { label: "Talk your way out", fn: () => tryMakePeace() },
          { label: "Choose a silly weapon", fn: () => chooseWeapon() }
        ]);
      }},
      { label: "Ignore them and leave", fn: () => {
        changeResource("morale", -4, "They mutter as you walk off.");
        state.flags.rivalMad = true;
      }}
    ]);
  }

  function tryMakePeace() {
    const success = state.resources.morale > 50 || Math.random() > 0.45;
    if (success) {
      state.flags.rivalTruce = true;
      state.flags.rivalMad = false;
      changeResource("morale", 8, "You talked it out. Respect +1.");
    } else {
      changeResource("morale", -6, "They didn't buy it. Still mad.");
      changeResource("heat", 3);
    }
  }

  function chooseWeapon() {
    say("You", "What do you reach for?", [
      { label: "Bubble Blaster – giant floating bubbles", fn: () => useWeapon("bubbles") },
      { label: "Spitball Shooter", fn: () => useWeapon("spitballs") },
      { label: "Foam Nunchucks", fn: () => useWeapon("nunchucks") },
      { label: "Sticky Bubble Gum (aim for hair)", fn: () => useWeapon("gum") },
      { label: "Never mind – talk instead", fn: () => tryMakePeace() }
    ]);
  }

  function useWeapon(id) {
    if (!hasItem(id) && id !== "nunchucks") {
      toast("You're out of that!");
      return;
    }
    if (id !== "nunchucks") useItem(id);

    if (id === "bubbles") {
      say("Rival Kid", "Whoa—those bubbles are huge! They're floating everywhere!", [
        { label: "Laugh it off", fn: () => {
          state.flags.rivalTruce = true;
          state.flags.rivalMad = false;
          changeResource("morale", 12, "Bubbles win. Everyone cracks up.");
        }}
      ]);
    } else if (id === "spitballs") {
      say("Rival Parent", "Did you just spitball me?! This means war… or at least a stern talking-to.", [
        { label: "Apologize quickly", fn: () => {
          changeResource("morale", -2);
          changeResource("heat", 5, "Spitballs escalate things. Heat up.");
          state.flags.rivalMad = true;
        }},
        { label: "Double down", fn: () => {
          changeResource("heat", 10);
          changeResource("morale", -5, "Chaos. Family is embarrassed.");
          state.flags.rivalMad = true;
        }}
      ]);
    } else if (id === "nunchucks") {
      say("Rival Parent", "Are those… foam nunchucks? You look ridiculous.", [
        { label: "Strike a cool pose anyway", fn: () => {
          const win = Math.random() > 0.5;
          if (win) {
            state.flags.rivalTruce = true;
            changeResource("morale", 9, "Somehow the pose worked. They back off laughing.");
          } else {
            changeResource("morale", -7, "You trip over your own nunchucks. Dignity lost.");
            state.flags.rivalMad = true;
          }
        }}
      ]);
    } else if (id === "gum") {
      say("Rival Kid", "Hey! There's gum in my hair!!", [
        { label: "Pretend it wasn't you", fn: () => {
          changeResource("heat", 8, "Gum-in-hair is a classic. Heat +8.");
          state.flags.gumInHair = true;
          state.flags.rivalMad = true;
        }},
        { label: "Help them get it out (kind of)", fn: () => {
          changeResource("morale", 5, "You help a little. They still glare.");
          state.flags.rivalMad = true;
        }}
      ]);
    }
  }

  function examineVending() {
    say("Vending Machine", "Mostly empty. There's warm soda and something labeled 'Meat Stick???'.", [
      { label: "Buy soda ($3)", fn: () => {
        if (state.resources.money >= 3) {
          changeResource("money", -3);
          changeResource("food", 2, "Warm soda obtained.");
        } else toast("Broke.");
      }},
      { label: "Shake it", fn: () => {
        if (Math.random() > 0.55) {
          changeResource("food", 2, "A snack dropped!");
        } else {
          changeResource("heat", 4, "It beeps angrily. You look suspicious.");
        }
      }},
      { label: "Leave", fn: () => {} }
    ]);
  }

  function examineBench() {
    const gumText = state.flags.gumInHair
      ? "There's already gum stuck under this bench. Looks familiar."
      : "A normal wooden bench with years of carved initials.";
    say("Bench", gumText, [
      { label: "Sit for a minute", fn: () => changeResource("morale", 3, "A short rest helps.") },
      { label: "Move on", fn: () => {} }
    ]);
  }

  function triggerPolice() {
    if (state.flags.policeDone) return;
    state.flags.policeDone = true;
    say("Ranger Dale", "We've had complaints about cooler theft and general nonsense. Anyone want to explain themselves?", [
      { label: "Talk your way out honestly", fn: () => {
        const success = state.resources.morale > 55 || state.flags.talkedRusty;
        if (success) {
          changeResource("heat", -15, "Ranger believes you… mostly. Heat drops.");
        } else {
          changeResource("money", -30);
          changeResource("heat", 5, "Fine issued. $30 lighter.");
        }
      }},
      { label: "Blame the rival family", fn: () => {
        changeResource("heat", 8);
        changeResource("morale", -4, "Ranger doesn't buy it. You look worse.");
        changeResource("money", -20);
      }},
      { label: "Stay quiet and pay", fn: () => {
        changeResource("money", -35);
        changeResource("morale", -10, "Quiet payment. Family is quiet too… in a bad way.");
      }},
      { label: "Distract with bubbles", fn: () => {
        if (hasItem("bubbles")) {
          useItem("bubbles");
          changeResource("heat", 12, "Bubbles everywhere. Ranger is not amused. Heat up.");
          changeResource("money", -25);
        } else toast("No bubbles left.");
      }}
    ]);
  }

  // ---------- Campground ----------
  function enterCampground() {
    if (!state.flags.visitedCamp) {
      state.flags.visitedCamp = true;
      state.statesVisited++;
    }
    say("Shady Pines Campground", "The sun is going down. Your camper is parked under the trees. You hear rustling near the back storage.", [
      { label: "Investigate the noise", fn: () => {
        say("Possible Burglary", "Someone is fiddling with the storage latch!", [
          { label: "Yell loudly", fn: () => {
            changeResource("morale", 5, "They bolt. Camper safe.");
            log("Scared off a campground prowler.");
            show("hub");
          }},
          { label: "Use Bubble Blaster", fn: () => {
            if (hasItem("bubbles")) {
              useItem("bubbles");
              changeResource("morale", 9, "Giant bubbles startle the thief into running.");
              log("Bubbles saved the camper.");
            } else {
              changeResource("food", -6, "No bubbles. They got some food.");
            }
            show("hub");
          }},
          { label: "Spitball ambush", fn: () => {
            if (hasItem("spitballs")) {
              useItem("spitballs", 2);
              changeResource("morale", 6, "Spitball barrage! Thief flees in confusion.");
            } else changeResource("food", -5);
            show("hub");
          }},
          { label: "Hide and stay quiet", fn: () => {
            changeResource("food", -10);
            changeResource("morale", -12, "They took food. Family feels unsafe.");
            log("Lost supplies in a quiet burglary.");
            show("hub");
          }}
        ]);
      }},
      { label: "Lock up and stay inside", fn: () => {
        changeResource("morale", -2);
        toast("Safe night. A little tense.");
        log("Played it safe at campground.");
        show("hub");
      }}
    ]);
  }

  // ---------- Diner ----------
  function enterDiner() {
    if (!state.flags.visitedDiner) {
      state.flags.visitedDiner = true;
      state.statesVisited++;
    }
    $("#scene-bg").className = "diner";
    $("#scene-title").textContent = "Neon Diner & Gift Shop";
    const hs = $("#hotspots");
    hs.innerHTML = "";

    const spots = [
      { label: "Waitress", style: "left:20%; bottom:22%; width:22%; height:28%;", important: true, action: talkWaitress },
      { label: "Gift Shelf", style: "left:60%; bottom:20%; width:24%; height:26%;", action: examineGifts },
      { label: "Jukebox", style: "left:8%; top:42%; width:18%; height:20%;", action: examineJukebox },
      { label: "Other Diners", style: "left:42%; bottom:18%; width:20%; height:24%;", action: talkDiners }
    ];
    spots.forEach(h => {
      const el = document.createElement("div");
      el.className = "hotspot" + (h.important ? " important" : "");
      el.style.cssText = h.style;
      el.textContent = h.label;
      el.onclick = h.action;
      hs.appendChild(el);
    });
    show("scene");
    toast("Neon lights buzz. Coffee smells strong.");
  }

  function talkWaitress() {
    say("Waitress Dot", "What'll it be, hon? Menu's short: burgers, pie, and regret.", [
      { label: "Order food for the family ($18)", fn: () => {
        if (state.resources.money >= 18) {
          changeResource("money", -18);
          changeResource("food", 15);
          changeResource("morale", 12, "Real food! Family cheers.");
          state.flags.familyMood = "happy";
        } else toast("Not enough cash.");
      }},
      { label: "Just coffee ($3)", fn: () => {
        if (state.resources.money >= 3) {
          changeResource("money", -3);
          changeResource("morale", 4, "Coffee helps a little.");
        }
      }},
      { label: "Ask about the road ahead", fn: () => {
        say("Waitress Dot", "Next stretch is quiet until the big campground. Watch for rangers if you've been… creative.", [
          { label: "Thanks", fn: () => changeResource("morale", 3) }
        ]);
      }}
    ]);
  }

  function examineGifts() {
    say("Gift Shelf", "Snow globes, keychains, and a rubber chicken wearing sunglasses.", [
      { label: "Buy rubber chicken ($7)", fn: () => {
        if (state.resources.money >= 7) {
          changeResource("money", -7);
          state.inventory.push({ id: "chicken", name: "Rubber Chicken", desc: "For reasons", qty: 1 });
          changeResource("morale", 5, "Why did you buy this? Family laughs.");
        }
      }},
      { label: "Leave it", fn: () => {} }
    ]);
  }

  function examineJukebox() {
    say("Jukebox", "It only plays three songs, all from 1978.", [
      { label: "Play something anyway ($1)", fn: () => {
        if (state.resources.money >= 1) {
          changeResource("money", -1);
          changeResource("morale", 6, "Terrible song. Perfect for the trip.");
        }
      }},
      { label: "Skip", fn: () => {} }
    ]);
  }

  function talkDiners() {
    say("Local at Counter", "You folks look like you've been on the road a while. Saw a ranger car earlier… they seemed annoyed.", [
      { label: "Thanks for the tip", fn: () => changeResource("morale", 2) },
      { label: "Offer a spitball truce", fn: () => {
        if (hasItem("spitballs")) {
          useItem("spitballs");
          changeResource("morale", 4, "They chuckle and accept the weird peace offering.");
        } else toast("No spitballs.");
      }}
    ]);
  }

  // ---------- Family talk ----------
  function talkFamily() {
    const moods = {
      normal: [
        "Dad is studying the map like it holds ancient secrets.",
        "Someone is already bored and kicking the seat.",
        "The snacks are being negotiated again."
      ],
      happy: [
        "Everyone is humming the same terrible song.",
        "Little one is drawing the camper in a notebook.",
        "Mom says this might actually be fun."
      ],
      grumpy: [
        "Silence. The dangerous kind.",
        "Someone muttered 'are we there yet' for the twelfth time.",
        "The last bag of chips is being guarded fiercely."
      ],
      chaotic: [
        "An argument about who lost the good marker is ongoing.",
        "Someone is practicing nunchuck moves in the aisle.",
        "Bubble solution was spilled earlier. It's still sticky."
      ]
    };
    const list = moods[state.flags.familyMood] || moods.normal;
    const line = list[Math.floor(Math.random() * list.length)];
    say("Family", line, [
      { label: "Encourage them", fn: () => {
        changeResource("morale", 5, "A little encouragement helps.");
        if (state.flags.familyMood === "grumpy") state.flags.familyMood = "normal";
      }},
      { label: "Start a silly argument on purpose", fn: () => {
        changeResource("morale", -4);
        state.flags.familyMood = "chaotic";
        toast("You poked the bear. Chaos rises.");
      }},
      { label: "Suggest using the Bubble Blaster later", fn: () => {
        changeResource("morale", 3);
        toast("They like that idea.");
      }}
    ]);
  }

  // ---------- Init & Buttons ----------
  function init() {
    $("#btn-start").onclick = () => show("family");

    $("#btn-family-done").onclick = () => {
      state.playerRole = $("#player-role").value;
      state.familySize = parseInt($("#family-size").value, 10);
      buildFamily();
      if (state.familySize >= 5) {
        state.resources.food = 48;
        state.resources.money = 95;
      }
      show("hub");
      log("Family packed. Day 1 begins.");
    };

    $("#btn-rest").onclick = () => {
      changeResource("morale", 14);
      changeResource("food", -3);
      log("Rested. Morale up, some food eaten.");
      if (Math.random() > 0.7) advanceDay("A quiet night passes.");
    };

    $("#btn-eat").onclick = () => {
      if (state.resources.food < 7) { toast("Not enough food."); return; }
      changeResource("food", -7);
      changeResource("morale", 15, "Good meal. Spirits lifted.");
      state.flags.familyMood = "happy";
      log("Family ate together.");
    };

    $("#btn-talk-family").onclick = talkFamily;
    $("#btn-weapons").onclick = openInv;
    $("#btn-depart").onclick = () => show("map");
    $("#btn-map-back").onclick = () => show("hub");

    $$(".dest").forEach(btn => {
      btn.onclick = () => {
        const dest = btn.dataset.dest;
        changeResource("gas", -8);
        changeResource("food", -4);
        // Travel always advances time a bit
        if (Math.random() > 0.4) advanceDay("The road rolls on…");

        if (dest === "reststop") {
          enterReststop();
          log("Arrived at Rusty's Rest Stop.");
        } else if (dest === "campground") {
          enterCampground();
        } else if (dest === "diner") {
          enterDiner();
          log("Pulled into the Neon Diner.");
        }
        updateHub();
      };
    });

    $("#btn-leave").onclick = () => {
      show("hub");
      log("Returned to the camper.");
      if (state.statesVisited >= 2 && state.day < 3) {
        toast("You're making progress. Keep going.");
      }
    };

    $("#btn-inventory").onclick = openInv;
    $("#btn-close-inv").onclick = closeInv;
  }

  init();
})();

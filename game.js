// Camper Quest – Point & Click Prototype
// Dialogue-driven, Monkey Island style, big floating bubbles

(() => {
  const state = {
    playerRole: "Older Sister",
    familySize: 4,
    family: [],
    resources: { gas: 80, food: 55, money: 110, morale: 70, heat: 0 },
    inventory: [
      { id: "bubbler", name: "Bubble Blaster", qty: 1 },
      { id: "bubbles", name: "Big Bubble Solution", qty: 6 },
      { id: "snacks", name: "Road Snacks", qty: 3 },
      { id: "map", name: "Crumpled Road Map", qty: 1 }
    ],
    flags: {
      coolerTaken: false,
      talkedToRusty: false,
      rivalConvinced: false,
      policeDone: false,
      visitedReststop: false
    }
  };

  const $ = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);

  // ---------- Screens ----------
  function show(id) {
    $$(".screen").forEach(el => el.classList.remove("active"));
    const el = document.getElementById("screen-" + id);
    if (el) el.classList.add("active");
    if (id === "hub") updateHub();
  }

  // ---------- Family ----------
  function buildFamily() {
    const others = ["Dad", "Mom", "Younger Brother", "Little Sister", "Cousin", "Baby"];
    state.family = [{ name: "You", role: state.playerRole, isPlayer: true }];
    for (let i = 1; i < state.familySize; i++) {
      state.family.push({ name: others[i-1] || "Family", role: others[i-1], isPlayer: false });
    }
  }

  // ---------- Hub ----------
  function updateHub() {
    $("#res-gas").textContent = state.resources.gas;
    $("#res-food").textContent = state.resources.food;
    $("#res-money").textContent = state.resources.money;
    $("#res-morale").textContent = state.resources.morale;
    $("#res-heat").textContent = state.resources.heat;
    $("#family-line").textContent = "Family: " + state.family.map(f => f.isPlayer ? `You (${f.role})` : f.name).join(", ");
  }

  function log(msg) {
    const el = $("#hub-log");
    el.innerHTML = `<div>${msg}</div>` + el.innerHTML;
  }

  function toast(msg, ms = 2400) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    setTimeout(() => t.classList.add("hidden"), ms);
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
      d.innerHTML = `<span>${item.name}</span><span>×${item.qty}</span>`;
      list.appendChild(d);
    });
    $("#inventory").classList.remove("hidden");
  }

  function closeInv() {
    $("#inventory").classList.add("hidden");
  }

  // ---------- Point & Click Scene: Rusty's Rest Stop ----------
  const reststopHotspots = [
    {
      id: "rusty",
      label: "Rusty",
      style: "left:12%; bottom:22%; width:22%; height:28%;",
      important: true,
      action: talkRusty
    },
    {
      id: "cooler",
      label: "Cooler",
      style: "left:58%; bottom:20%; width:24%; height:22%;",
      important: true,
      action: examineCooler
    },
    {
      id: "rival",
      label: "Rival Family",
      style: "left:38%; bottom:18%; width:20%; height:26%;",
      action: talkRival
    },
    {
      id: "vending",
      label: "Vending Machine",
      style: "left:78%; bottom:28%; width:16%; height:30%;",
      action: examineVending
    },
    {
      id: "sign",
      label: "Weird Sign",
      style: "left:5%; top:38%; width:18%; height:16%;",
      action: examineSign
    }
  ];

  function enterReststop() {
    $("#scene-bg").className = "reststop";
    $("#scene-title").textContent = "Rusty's Roadside Rest Stop";
    const hs = $("#hotspots");
    hs.innerHTML = "";
    reststopHotspots.forEach(h => {
      const el = document.createElement("div");
      el.className = "hotspot" + (h.important ? " important" : "");
      el.style.cssText = h.style;
      el.textContent = h.label;
      el.onclick = h.action;
      hs.appendChild(el);
    });
    show("scene");
    if (!state.flags.visitedReststop) {
      setTimeout(() => {
        say("You", "This place looks like every rest stop in America… only weirder.", [
          { label: "Look around", fn: () => toast("Tap the glowing spots to explore and talk.") }
        ]);
      }, 400);
    }
  }

  // --- Interactions ---
  function talkRusty() {
    if (state.flags.talkedToRusty) {
      say("Rusty", "You again? Don't cause trouble. I already called the ranger once today.", [
        { label: "We'll be good", fn: () => {} },
        { label: "Any tips?", fn: () => say("Rusty", "Keep an eye on that cooler over there. People get sticky fingers around here.") }
      ]);
      return;
    }
    state.flags.talkedToRusty = true;
    say("Rusty", "Welcome to Rusty's. Gas is overpriced, coffee is worse, and the ball of twine is exactly as disappointing as you'd expect.", [
      { label: "Nice place…", fn: () => say("Rusty", "It's a living. Watch your belongings.") },
      { label: "Seen anything strange?", fn: () => {
        say("Rusty", "A rival camper family showed up earlier. They're eyeing everything. And someone keeps messing with the cooler.", [
          { label: "Thanks for the heads-up", fn: () => { state.resources.morale = Math.min(100, state.resources.morale + 3); } }
        ]);
      }},
      { label: "Got any bubble solution for sale?", fn: () => {
        if (state.resources.money >= 15) {
          state.resources.money -= 15;
          const b = state.inventory.find(i => i.id === "bubbles");
          if (b) b.qty += 4;
          toast("Bought more bubble solution (-$15)");
        } else {
          say("Rusty", "You're short. Come back when you have cash.");
        }
      }}
    ]);
  }

  function examineCooler() {
    if (state.flags.coolerTaken) {
      say("Cooler", "It's empty now. Only a few melting ice cubes left.", [
        { label: "Walk away", fn: () => {} }
      ]);
      return;
    }
    say("Unattended Cooler", "A big cooler sits here with the lid cracked open. Inside: sodas, sandwiches, and a fancy-looking bag of chips. No one is watching…", [
      { label: "Leave it alone", fn: () => {
        state.resources.morale = Math.min(100, state.resources.morale + 4);
        toast("You resist. Morale up a little.");
      }},
      { label: "Take some snacks (crime)", fn: () => {
        state.flags.coolerTaken = true;
        state.resources.food += 10;
        state.resources.heat += 18;
        state.inventory.push({ id: "stolen_chips", name: "Suspicious Chips", qty: 1 });
        toast("You grab the goods. Heat is rising…");
        // Higher chance of police
        setTimeout(() => {
          if (!state.flags.policeDone && state.resources.heat > 10) {
            triggerPolice();
          }
        }, 1800);
      }},
      { label: "Look closer first", fn: () => {
        say("Cooler", "There's a name written on the side in marker: 'Property of the Hendersons – DO NOT TOUCH'.", [
          { label: "Still take it", fn: () => {
            state.flags.coolerTaken = true;
            state.resources.food += 10;
            state.resources.heat += 22;
            toast("Bold move. Heat went up more.");
            setTimeout(triggerPolice, 1600);
          }},
          { label: "Close the lid and leave", fn: () => toast("You close it quietly.") }
        ]);
      }}
    ]);
  }

  function talkRival() {
    if (state.flags.rivalConvinced) {
      say("Rival Kid", "Okay okay, we get it. No more trouble.", [
        { label: "Good", fn: () => {} }
      ]);
      return;
    }
    say("Rival Parent", "This is our rest stop today. Your camper is blocking the good shade.", [
      { label: "Sorry, we'll move later", fn: () => {
        state.resources.morale = Math.min(100, state.resources.morale + 2);
        toast("They seem slightly less annoyed.");
      }},
      { label: "We were here first", fn: () => startArgument() },
      { label: "Offer them snacks to calm down", fn: () => {
        if (state.resources.food >= 5) {
          state.resources.food -= 5;
          state.flags.rivalConvinced = true;
          state.resources.morale = Math.min(100, state.resources.morale + 8);
          say("Rival Parent", "…Fine. Truce. Those chips better be good.", [
            { label: "Enjoy", fn: () => toast("Argument avoided. Morale up.") }
          ]);
        } else {
          toast("Not enough food to share.");
        }
      }}
    ]);
  }

  function startArgument() {
    say("Rival Parent", "Oh yeah? You want to settle this the old-fashioned way?", [
      { label: "Talk it out calmly", fn: () => {
        const success = state.resources.morale > 55 || Math.random() > 0.4;
        if (success) {
          state.flags.rivalConvinced = true;
          say("Rival Parent", "Alright… maybe we're both tired. Just don't block the shade again.", [
            { label: "Deal", fn: () => {
              state.resources.morale = Math.min(100, state.resources.morale + 6);
              toast("You won the argument with words.");
            }}
          ]);
        } else {
          say("Rival Parent", "Nice try. We're still taking the shade.", [
            { label: "Whatever", fn: () => { state.resources.morale = Math.max(0, state.resources.morale - 6); } }
          ]);
        }
      }},
      { label: "Pull out the Bubble Blaster", fn: () => bubbleConfrontation() },
      { label: "Walk away", fn: () => {
        state.resources.morale = Math.max(0, state.resources.morale - 4);
        toast("You back down. A little dignity lost.");
      }}
    ]);
  }

  function bubbleConfrontation() {
    say("You", "You raise the Bubble Blaster. Huge shiny bubbles start floating between you and the rival family.", [
      { label: "Aim for comedy – big harmless bubbles", fn: () => {
        state.flags.rivalConvinced = true;
        say("Rival Kid", "Whoa! Those are huge! …Okay that was actually cool.", [
          { label: "Truce?", fn: () => {
            state.resources.morale = Math.min(100, state.resources.morale + 10);
            const b = state.inventory.find(i => i.id === "bubbles");
            if (b) b.qty = Math.max(0, b.qty - 1);
            toast("Bubbles win the day. Everyone laughs a little.");
          }}
        ]);
      }},
      { label: "Try to intimidate with bubbles", fn: () => {
        say("Rival Parent", "Really? Bubbles? That's your big move?", [
          { label: "Switch to talking", fn: () => {
            state.resources.morale = Math.max(0, state.resources.morale - 3);
            toast("Intimidation failed. You look a bit silly.");
          }}
        ]);
      }}
    ]);
  }

  function examineVending() {
    say("Vending Machine", "It takes cards and cash. Most of the slots are empty except for some mystery meat sticks and warm soda.", [
      { label: "Buy a soda ($3)", fn: () => {
        if (state.resources.money >= 3) {
          state.resources.money -= 3;
          state.resources.food += 2;
          toast("Warm soda acquired.");
        } else toast("Not enough money.");
      }},
      { label: "Kick it gently", fn: () => {
        if (Math.random() > 0.6) {
          state.resources.food += 1;
          toast("A snack fell out!");
        } else {
          state.resources.heat += 3;
          toast("Nothing. And now it looks like you were trying to break it.");
        }
      }},
      { label: "Leave it", fn: () => {} }
    ]);
  }

  function examineSign() {
    say("Weird Sign", "\"World's 3rd Largest Ball of Twine – Only 40 miles! Also: Beware of aggressive geese.\"", [
      { label: "Noted", fn: () => toast("You make a mental note about the geese.") }
    ]);
  }

  function triggerPolice() {
    if (state.flags.policeDone) return;
    state.flags.policeDone = true;
    say("Ranger Dale", "Hold up. We've had reports of cooler theft in this exact spot. Anyone want to tell me what happened?", [
      { label: "Talk your way out", fn: () => {
        const good = state.resources.morale > 50 || state.flags.talkedToRusty;
        if (good) {
          state.resources.heat = Math.max(0, state.resources.heat - 12);
          say("Ranger Dale", "Alright… I'll take your word for it this time. Keep your hands to yourselves.", [
            { label: "Yes sir", fn: () => toast("You talked your way out. Heat dropped a bit.") }
          ]);
        } else {
          say("Ranger Dale", "Not buying it. That's a fine.", [
            { label: "Pay $30 fine", fn: () => {
              state.resources.money = Math.max(0, state.resources.money - 30);
              state.resources.heat += 5;
              toast("Fine paid.");
            }}
          ]);
        }
      }},
      { label: "Blame the rival family", fn: () => {
        state.resources.heat += 8;
        say("Ranger Dale", "Nice try. I've heard that one before.", [
          { label: "Pay the fine", fn: () => {
            state.resources.money = Math.max(0, state.resources.money - 25);
            toast("Still got fined.");
          }}
        ]);
      }},
      { label: "Stay quiet / submit", fn: () => {
        state.resources.money = Math.max(0, state.resources.money - 35);
        state.resources.morale = Math.max(0, state.resources.morale - 8);
        toast("You take the fine quietly. Morale down.");
      }}
    ]);
  }

  // ---------- Campground (simple for now) ----------
  function enterCampground() {
    say("Shady Pines Campground", "Night is falling. Your camper is parked. You hear rustling near the storage bay…", [
      { label: "Go check it out", fn: () => {
        say("Camper Burglary!", "Someone is trying to open the back compartment!", [
          { label: "Yell and scare them off", fn: () => {
            state.resources.morale = Math.min(100, state.resources.morale + 4);
            toast("They run. Camper is safe.");
            show("hub");
            log("Stopped a campground burglary.");
          }},
          { label: "Use big bubbles to startle them", fn: () => {
            const b = state.inventory.find(i => i.id === "bubbles");
            if (b && b.qty > 0) {
              b.qty--;
              state.resources.morale = Math.min(100, state.resources.morale + 8);
              toast("Giant bubbles everywhere. Thief panics and flees.");
            } else {
              toast("No bubble solution left!");
            }
            show("hub");
            log("Used bubbles to stop a burglary.");
          }},
          { label: "Hide and hope they leave", fn: () => {
            state.resources.food = Math.max(0, state.resources.food - 8);
            state.resources.morale = Math.max(0, state.resources.morale - 10);
            toast("They took some food. Family is rattled.");
            show("hub");
          }}
        ]);
      }},
      { label: "Lock everything and stay inside", fn: () => {
        toast("You stay safe inside. Morning comes quietly.");
        show("hub");
        log("Played it safe at the campground.");
      }}
    ]);
  }

  // ---------- Wire up UI ----------
  function init() {
    $("#btn-start").onclick = () => show("family");

    $("#btn-family-done").onclick = () => {
      state.playerRole = $("#player-role").value;
      state.familySize = parseInt($("#family-size").value, 10);
      buildFamily();
      if (state.familySize >= 5) {
        state.resources.food = 45;
        state.resources.money = 95;
      }
      show("hub");
      log("Family loaded into the camper. Let the questionable decisions begin.");
    };

    $("#btn-rest").onclick = () => {
      state.resources.morale = Math.min(100, state.resources.morale + 12);
      state.resources.food = Math.max(0, state.resources.food - 2);
      log("Everyone rested.");
      updateHub();
    };

    $("#btn-eat").onclick = () => {
      if (state.resources.food < 6) { toast("Not enough food."); return; }
      state.resources.food -= 6;
      state.resources.morale = Math.min(100, state.resources.morale + 14);
      log("Family meal. Spirits lifted.");
      updateHub();
    };

    $("#btn-talk-family").onclick = () => {
      const lines = [
        "Dad starts explaining a 'better route' that will definitely take longer.",
        "Someone complains about the last rest stop bathroom.",
        "The younger ones are already arguing over who gets the window seat next.",
        "Mom asks if anyone has seen the good snacks."
      ];
      say("Family", lines[Math.floor(Math.random() * lines.length)], [
        { label: "Listen patiently", fn: () => { state.resources.morale = Math.min(100, state.resources.morale + 3); } },
        { label: "Change the subject", fn: () => {} }
      ]);
    };

    $("#btn-depart").onclick = () => show("map");
    $("#btn-map-back").onclick = () => show("hub");

    $$(".dest").forEach(btn => {
      btn.onclick = () => {
        const dest = btn.dataset.dest;
        state.resources.gas = Math.max(0, state.resources.gas - 7);
        state.resources.food = Math.max(0, state.resources.food - 3);
        updateHub();

        if (dest === "reststop") {
          state.flags.visitedReststop = true;
          enterReststop();
          log("Arrived at Rusty's Roadside Rest Stop.");
        } else {
          enterCampground();
        }
      };
    });

    $("#btn-leave").onclick = () => {
      show("hub");
      log("Back at the camper.");
      if (state.flags.visitedReststop) {
        log("Scrapbook updated: Rest Stop visit.");
      }
    };

    $("#btn-inventory").onclick = openInv;
    $("#btn-close-inv").onclick = closeInv;
  }

  init();
})();

/*
    This code is injected to the page in order to 
    access functions/variables of the page context.
    https://stackoverflow.com/a/9517879

    NOTE: manifest.json must include:
    "web_accessible_resources": ["injected.js"],
*/

const AUTO_SYNC_SLEEP_TIME = 1000; // in milliseconds
const SYNC_SERVER_ADDRESS = "http://127.0.0.1:5000";

const asm_edit = document.getElementById("asm_edit");

function addPlayer(nextLetter, index, code) {
  triggerSrc("p" + nextLetter, index); // index must be 1 or 2
  asm_edit.value = code;
  asm_edit.dispatchEvent(new Event("input"));
}

function getSelectedCodeId() {
  let srcSelectors = document.querySelectorAll('[name="src_select"]'); // All with "name" set to "src_select" exactly.
  for (let element of srcSelectors) {
    if (element.checked) {
      return element.id;
    }
  }
}

function setSelectedCode(selectedCodeId) {
  let srcSelector = document.getElementById(selectedCodeId);
  if (!srcSelector) {
    srcSelector = document.querySelectorAll('[name="src_select"]')[0];
  }
  srcSelector.click();
}

function saveCurrentCodes() {
  let selectedCodeId = getSelectedCodeId();

  let playersCodes = {};
  for (let letter of g_usedLetters) {
    let playerLabel = "p" + letter;
    let playerName = document.getElementById("player_name_lbl_" + playerLabel)
      .textContent;
    for (let i = 1; i <= 2; i++) {
      triggerSrc(playerLabel, i);
      if (asm_edit.value != "") {
        playersCodes[playerName + i] = asm_edit.value;
      }
    }
  }

  let zombiesCodes = {};
  for (let num of g_usedZnums) {
    let zombieLabel = "z" + num;
    triggerSrc(zombieLabel, 1);
    if (asm_edit.value != "") {
      zombiesCodes[zombieLabel] = asm_edit.value;
    }
  }

  // send the current codes to the content script
  document.dispatchEvent(
    new CustomEvent("save_current_codes", {
      detail: { playersCodes, zombiesCodes },
    })
  );

  setSelectedCode(selectedCodeId);
}

function asciiAdd(letter, val) {
  return String.fromCharCode(letter.charCodeAt(0) + val);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function updatePlayersCodes(playersCodes) {
  if (playersCodes === null || Object.keys(playersCodes).length === 0) {
    return;
  }

  let selectedCodeId = getSelectedCodeId();
  removeAllPlayers();

  let nextLetter = "A";
  let alreadyAddedPlayers = [];
  for (let [playerName, playerCode] of Object.entries(playersCodes)) {
    if (alreadyAddedPlayers.includes(playerName)) {
      continue;
    }

    let partnerName = playerName.slice(0, playerName.length - 1) + "2";
    let hasAPartner =
      playerName[playerName.length - 1] == "1" && partnerName in playersCodes;
    let groupName = hasAPartner
      ? playerName.slice(0, playerName.length - 1)
      : playerName;

    addPlayerPanel_as(groupName, hasAPartner);
    addPlayer(nextLetter, 1, playerCode);
    if (hasAPartner) {
      addPlayer(nextLetter, 2, playersCodes[partnerName]);
      alreadyAddedPlayers.push(partnerName);
    }
    nextLetter = asciiAdd(nextLetter, 1);
  }

  setSelectedCode(selectedCodeId);
}

function updateZombiessCodes(zombiesCodes) {
  let selectedCodeId = getSelectedCodeId();

  removeAllZombies(); // this function sets g_nextZombNum to 1
  for (let [zombieLabel, zombieCode] of Object.entries(zombiesCodes)) {
    addZombieCode_as("Zombie " + g_nextZombNum); // this function increments g_nextZombNum

    triggerSrc("z" + (g_nextZombNum - 1), 1);
    asm_edit.value = zombieCode;
    asm_edit.dispatchEvent(new Event("input"));
  }

  setSelectedCode(selectedCodeId);
}

function loadLastCodes(lastCodes) {
  if (prevDebug) {
    return; // can't update the codes while debugging
  }
  updatePlayersCodes(lastCodes.playersCodes);
  updateZombiessCodes(lastCodes.zombiesCodes);
}

async function fetchData(url) {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    document.dispatchEvent(new CustomEvent("fetch_data_error"));
    return null;
  }
}

let runAutoSync = true;
async function autoSync() {
  let playersCodes = {};
  let firstSync = true; // always update the codes at the first time

  while (runAutoSync && playersCodes !== null) {
    await sleep(AUTO_SYNC_SLEEP_TIME);

    if (prevDebug) {
      continue; // can't update the codes while debugging
    }

    let codesStatus = await fetchData(`${SYNC_SERVER_ADDRESS}/codes_status`);
    if (firstSync || (codesStatus !== null && codesStatus.modified)) {
      // only update the codes if they were modified
      playersCodes = await fetchData(`${SYNC_SERVER_ADDRESS}/all_codes`);
      updatePlayersCodes(playersCodes);
      firstSync = false;
    }
  }
}

document.addEventListener("toggle_sync_event", (e) => {
  runAutoSync = e.detail.auto_sync;
  if (e.detail.auto_sync) {
    autoSync();
  }
});

document.addEventListener("load_last_codes", (e) => {
  loadLastCodes(e.detail);
});

let oldTriggerDebug = triggerDebug;
// override the triggerDebug function (from corewars8086_js)
triggerDebug = () => {
  if (!prevDebug) {
    // only save when start debug
    saveCurrentCodes();
  }
  oldTriggerDebug();
};

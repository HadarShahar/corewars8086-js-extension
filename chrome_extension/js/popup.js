chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
  let url = tabs[0].url;

  if (url == "https://shooshx.github.io/corewars8086_js/war/page.html") {
    document.getElementById("container_div").style.display = "block";
  } else {
    document.getElementById("wrong_page_div").style.display = "block";
  }
});

chrome.storage.local.get(["auto_sync"], (result) => {
  auto_sync_switch.checked = result.auto_sync;
});

const auto_sync_switch = document.getElementById("auto_sync_switch");
auto_sync_switch.addEventListener("click", () => {
  chrome.storage.local.set({
    auto_sync: auto_sync_switch.checked,
    server_is_running: true,
  });
});

const load_last_codes_button = document.getElementById(
  "load_last_codes_button"
);
load_last_codes_button.addEventListener("click", () => {
  chrome.storage.local.get(["last_codes"], (result) => {
    msgToContentScript({ last_codes: result.last_codes });
  });
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if ("server_is_running" in changes) {
    checkServer();
  }
});

function checkServer() {
  const error_div = document.getElementById("error_div");
  chrome.storage.local.get(["server_is_running"], (result) => {
    if (result.server_is_running) {
      error_div.style.display = "none";
    } else {
      error_div.style.display = "block";
      auto_sync_switch.checked = false;
      // if the server is not running, auto_sync is impossible
      chrome.storage.local.set({ auto_sync: false });
    }
  });
}

function msgToContentScript(message) {
  chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
    let activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, message);
  });
}

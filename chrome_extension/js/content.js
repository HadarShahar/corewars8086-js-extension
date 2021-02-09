let s = document.createElement("script");
s.src = chrome.runtime.getURL("js/injected.js");
s.onload = function () {
  this.remove();
  checkAutoSync(); // call it after finish loading the script, so its event listener will be ready
};
(document.head || document.documentElement).appendChild(s);

// receive message from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if ("last_codes" in request) {
    // send message to the injected script
    document.dispatchEvent(
      new CustomEvent("load_last_codes", {
        detail: request.last_codes,
      })
    );
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if ("auto_sync" in changes) {
    dispatchToggleSyncEvent(changes.auto_sync.newValue);
  }
});

document.addEventListener("fetch_data_error", (e) => {
  console.log("fetch_data_error");
  chrome.storage.sync.set({ auto_sync: false, server_is_running: false });
});

document.addEventListener("save_current_codes", (e) => {
  console.log("saving current codes:", e.detail);
  chrome.storage.sync.set({ last_codes: e.detail });
});

function checkAutoSync() {
  chrome.storage.sync.get(["auto_sync"], (result) => {
    dispatchToggleSyncEvent(result.auto_sync);
  });
}

function dispatchToggleSyncEvent(value) {
  document.dispatchEvent(
    new CustomEvent("toggle_sync_event", {
      detail: { auto_sync: value },
    })
  );
}

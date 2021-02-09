# corewars8086-js-extension

A chrome extension that synchronizes [corewars8086_js](https://github.com/shooshx/corewars8086_js/) with your local files using a local server.

## Setup

### Extension setup:

1. Open the Extension Management page by navigating to chrome://extensions.
2. Enable Developer Mode by clicking the toggle switch next to Developer mode.
3. Click the LOAD UNPACKED button and select the extension directory.

### Local server setup:

1. Install the requirements for the local sever (pip install -r requirements.txt).
2. Run: "python sync_server.py path_to_asm_files"
   (you can omit path_to_asm_files if you want to synchronize corewars8086_js with the current directory).

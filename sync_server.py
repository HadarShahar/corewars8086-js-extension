"""
    By Hadar Shahar.

    Local server that synchronizes https://github.com/shooshx/corewars8086_js/ 
    with your local files at PATH_TO_ASM_FILES (using the chrome extension I built).
    
    PATH_TO_ASM_FILES can be controlled by argv[1] if it's supplied, 
    otherwise it's the current directory.
"""
import os
import re
import sys
import glob
from flask import Flask, jsonify
from flask_cors import CORS

# if not supplied, use the current directory (empty string)
PATH_TO_ASM_FILES = sys.argv[1] if len(sys.argv) == 2 else ''
FILES_SUFFIX = '.asm'
MATCHING_FILES = os.path.join(PATH_TO_ASM_FILES, f'*{FILES_SUFFIX}')
NASM_INCLUDE_PATTERN = r'%include "(.*?)"'  # '?' for non-greedy

app = Flask(__name__)
# add the header Access-Control-Allow-Origin: *
# to allow the extension to access the response
CORS(app)

# the files that were sent to the client and their most recent modification time
sent_codes_mtime: [str, int] = {}


def include_files(asm_code: str) -> (str, list):
    included_filenames = []

    # include all the related files
    match = re.search(NASM_INCLUDE_PATTERN, asm_code)
    while match:
        # take the first captured group (without any argument, it will show the full match)
        included_filename = match.group(1)
        included_filepath = os.path.join(PATH_TO_ASM_FILES, included_filename)
        if not os.path.isfile(included_filepath):
            break

        start, end = match.span()
        with open(included_filepath, 'r') as included_f:
            asm_code = asm_code[:start] + \
                included_f.read() + asm_code[end:]
        included_filenames.append(included_filename)
        match = re.search(NASM_INCLUDE_PATTERN, asm_code)

    return asm_code, included_filenames


def read_code(filepath: str) -> (str, list):
    with open(filepath, 'r') as f:
        return include_files(f.read())


def get_player_name(filepath: str) -> str:
    return os.path.basename(filepath)[:-len(FILES_SUFFIX)]


def get_players_codes() -> dict:
    response = {}
    included_filenames = []

    for filepath in glob.glob(MATCHING_FILES):
        player_name = get_player_name(filepath)
        response[player_name], included = read_code(filepath)
        included_filenames += included
        sent_codes_mtime[player_name] = os.stat(filepath).st_mtime

    # remove files that have been included several times
    # becaue they are probably not separate players
    for filename in included_filenames:
        player_name = get_player_name(filename)
        if player_name in response:
            del response[player_name]

    return response


def file_was_modified(filepath: str) -> bool:
    player_name = get_player_name(filepath)
    return sent_codes_mtime.get(player_name, None) != os.stat(filepath).st_mtime


@ app.route('/all_codes')
def all_codes():
    return get_players_codes()


# @app.route('/changed_codes')
# def changed_codes():
#     return get_players_codes(file_was_modified)


@ app.route('/codes_status')
def codes_status():
    modified = any(file_was_modified(filepath)
                   for filepath in glob.glob(MATCHING_FILES))
    return {'modified': modified}


if __name__ == '__main__':
    app.run(debug=True)

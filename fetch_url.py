#!/usr/bin/python3

import json
import sys

BASE_URL = "https://cloud.timeedit.net/liu/web/schema"


def parse_arguments():
    if len(sys.argv) < 2:
        sys.exit(1)

    query = sys.argv[1].split('/')[-1]

    if not query:
        sys.exit(1)

    room = query.split('=')[1].split('&')[0]

    if not room:
        print('<p class="error" id="short-course"></p>')
        sys.exit(1)

    return room


def fetch_json():
    """
    Read the JSON file room-objects.json using json.loads"""
    try:
        with open('room-objects.json', 'r') as file:
            data = json.load(file)
    except FileNotFoundError:
        print('<p class="error" id="file-not-found"></p>')
        sys.exit(1)
    except json.JSONDecodeError:
        print('<p class="error" id="json-decode-error"></p>')
        sys.exit(1)

    return data

def fetch_url(url):
#    &fe=23.US,Valla
    pass


def generate_url(data):
    room_object_dict = {record['values'].strip(): record['identVirtual'] for record in data['records']}

    with open('room_object_dict.json', 'w') as file:
        json.dump(room_object_dict, file)

    # for room_name, object_id in room_object_dict.items():
    #     period = "0.m%2C1.m" # 0.m=now, 1.m=now+1min
    #     time_edit_url = f"{BASE_URL}/ri.html?part=t&sid=3&p={period}&objects={object_id}"

    #     # print(
    #     #     f'<div id="roomUrlDiv"><a href="{time_edit_url}">{room_name}</a></div>')

def main():
    print("Content-Type: text/html\n")

    room = parse_arguments()
    data = fetch_json()
    generate_url(data)

if __name__ == "__main__":
    main()

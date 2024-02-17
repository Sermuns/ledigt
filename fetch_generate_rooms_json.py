import requests
import json

HOUSES = ["A-huset", "B-huset", "C-huset", "D-huset", "E-huset",
          "Fysikhuset", "I-huset", "Key", "Studenthuset", "Tema-huset"]

rooms = []

for house in HOUSES:
    url = f"https://cloud.timeedit.net/liu/web/schema/objects.json?l=sv_SE&search_text=&types=195&sid=3&fe=11.Grupprum,26.{house}"
    response = requests.get(url)

    # Check if the request was successful
    if response.status_code == 200:
        responseData = response.json()
        for record in responseData['records']:
            room = {"name": record['values'].strip(
            ), "id": record['identVirtual'], "house": house}
            rooms.append(room)

    else:
        print(
            f"Failed to fetch data from {url}. Status code: {response.status_code}")

with open('rooms.json', 'w') as file:
    json.dump(rooms, file)

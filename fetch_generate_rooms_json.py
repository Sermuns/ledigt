import requests
import json

HOUSES = ["a-huset", "b-huset", "c-huset", "d-huset", "e-huset",
          "fysikhuset", "i-huset%252c%25201%2520%2526%25202", "key", "studenthuset", "tema-huset"]

TYPES = ["Grupprum", "Platt%20sal"]

rooms = []

for house in HOUSES:
    url = f"https://cloud.timeedit.net/liu/web/schema/objects.json?l=sv_SE&search_text=&types=195&sid=3&fe=11.{','.join(TYPES)}&fe=26.{house}"
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

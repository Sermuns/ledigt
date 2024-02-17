async function fetchRoomIdDict() {
    try {
        const response = await fetch("room_object_dict.json")
        const data = await response.json()
        return data
    } catch (error) {
        console.error("Error:", error)
    }
}

async function main() {
    const rooms = await fetchRoomIdDict()
    const results = document.getElementById("results")
    Object.entries(rooms).forEach(([name, id]) => {
        const nameElem = document.createElement("div");
        nameElem.textContent = name;
        results.appendChild(nameElem);
        const idElem = document.createElement("div");
        idElem.textContent = id;
        results.appendChild(idElem);
    });
}

window.onload = main

function toggleAllCheckbox() {
    const all = document.querySelector("#hus-title input[type=checkbox]")
    const checkboxes = document.querySelectorAll("#hus-selection input[type=checkbox]")
    checkboxes.forEach(checkbox => checkbox.checked = all.checked)
}

function visuallyUpdateAllCheckbox() {
    const all = document.querySelector("#hus-title input[type=checkbox]")
    const checkboxes = document.querySelectorAll("#hus-selection input[type=checkbox]")
    const checked = Array.from(checkboxes).filter(checkbox => checkbox.checked)

    if (checked.length === checkboxes.length) {
        all.checked = true
        all.indeterminate = false;
    } else if (checked.length === 0) {
        all.checked = false
        all.indeterminate = false;
    }
    else {
        all.checked = false
        all.indeterminate = true;
    }
}
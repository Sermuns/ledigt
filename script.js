let totalRooms, results, all, checkboxes, availableRooms, bookedRooms, selectedRooms, selectedHouses, loading
window.onload = init

function showLoading() {
    checkboxes.forEach(checkbox => checkbox.disabled = true)
    all.disabled = true
    // Start loading animation
    let lineCount = 0;
    loading = setInterval(() => {
        lineCount = (lineCount + 1) % 4;
        let line = "";
        switch (lineCount) {
            case 0:
                line = "|";
                break;
            case 1:
                line = "/";
                break;
            case 2:
                line = "—";
                break;
            case 3:
                line = "\\";
                break;
        }
        results.innerHTML = `${line} Vänta lite, söker på TimeEdit ${line}`;
    }, 200);
}

function hideLoading() {
    clearInterval(loading);
    results.innerHTML = "";
    checkboxes.forEach(checkbox => checkbox.disabled = false)
    all.disabled = false
}

/**
 * Fetch the HTML response from TimeEdit and display the results
 * Initialise variables
 */
async function init() {
    results = document.getElementById("results")
    all = document.querySelector("#hus-title input[type=checkbox]")
    checkboxes = document.querySelectorAll("#hus-selection input[type=checkbox]")

    showLoading()

    totalRooms = await loadTotalRooms()
    bookedRooms = getBookedRooms(await fetchBookingDocument())
    availableRooms = totalRooms.filter(room => !bookedRooms.has(room.name));

    hideLoading(loading);

    all.checked = true
    all.click()
}

async function loadTotalRooms() {
    try {
        const response = await fetch("rooms.json")
        const data = await response.json()
        return data
    } catch (error) {
        console.error("Error loading objects from JSON:", error)
    }
}

function updateResults() {
    results.innerHTML = ""
    selectedRooms.forEach(room => {
        const roomDiv = document.createElement("div")
        roomDiv.textContent = room.name
        results.appendChild(roomDiv)
    })
}

function updateSelection() {
    selectedHouses = []
    checkboxes.forEach(checkbox => {
        if (!checkbox.checked) return
        const house = checkbox.parentElement.textContent.trim()
        selectedHouses.push(house)
    })

    selectedRooms = availableRooms.filter(room => selectedHouses.includes(room.house))

    updateResults()
}


/**
 * Fetch the HTML response from TimeEdit
 * @returns {Promise<Document>} The HTML response from TimeEdit
 */
async function fetchBookingDocument() {
    const BASE_URL = "https://cloud.timeedit.net/liu/web/schema/ri.html"
    const parser = new DOMParser()
    let objects = totalRooms.map(room => room.id).join(",")
    const url = `${BASE_URL}?part=t&sid=3&p=0.m%2C1.m&objects=${objects}`
    console.log(url)
    try {
        const response = await fetch(url)
        const timeEditDocument = parser.parseFromString(await response.text(), "text/html")
        return timeEditDocument
    }
    catch (error) {
        console.error("Error fetching bookings:", error)
    }
}

/**
 * Parse the HTML response from TimeEdit and return the booked rooms
 * @param {Document} timeEditDocument The HTML response from TimeEdit
 * @returns {Set<String>} A set of booked rooms
 */
function getBookedRooms(timeEditDocument) {
    const booked = new Set();
    let lokalColIndex;
    timeEditDocument.querySelectorAll("tr").forEach(row => {
        // header rows
        if (!lokalColIndex) {
            [...row.children].forEach((cell, index) => {
                if (cell.textContent.trim() === "Lokal") {
                    lokalColIndex = index
                }
            })
            return
        }

        const rooms = row.children[lokalColIndex].textContent.trim().split(" ");

        if (rooms == "") return; // skip bookings without rooms

        rooms.forEach(room => booked.add(room));
    })
    return booked;
}



// -- VISUAL FUNCTIONS --

function toggleAllCheckbox() {
    checkboxes.forEach(checkbox => checkbox.checked = all.checked)
}

function visuallyUpdateAllCheckbox() {
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
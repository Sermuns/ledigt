let totalRooms, results, all, checkboxes, availableRooms, bookedRooms, selectedRooms, selectedHouses, loading
window.onload = init

// for debugging
//const debugNow = new Date(2024, 2, 1, 12, 12, 0, 0)

/**
 * Initialize variables and fetch the data
 * Fetch the HTML response from TimeEdit and display the results
 */
async function init() {
    results = document.getElementById("results")
    all = document.querySelector("#hus-title input[type=checkbox]")
    checkboxes = document.querySelectorAll("#hus-selection input[type=checkbox]")
    startClock()

    showLoading()

    totalRooms = await loadTotalRooms()
    bookedRooms = getBookedRooms(await fetchBookingDocument())
    availableRooms = totalRooms.filter(room => !bookedRooms.has(room.name));

    hideLoading(loading);

    updateSelection()
}

/**
 * Get the current time
 * if debugNow is set, use that time instead
 */
function getNow(){
    if (typeof debugNow !== 'undefined') return debugNow
    return new Date()
}

function updateClock(clock){
    clock.textContent = getNow().toLocaleTimeString('sv-SE')
}

function startClock() {
    const topbar = document.getElementById("topbar")
    const clock = document.getElementById("clock")
    clock.id = "clock"
    topbar.appendChild(clock)
    updateClock(clock)
    setInterval(() => {
        updateClock(clock)
    }, 1000)
}

function showLoading() {
    checkboxes.forEach(checkbox => checkbox.disabled = true)
    all.disabled = true
    // Start loading animation
    const loadingElement = document.createElement("p")
    loadingElement.style.gridColumn = "1 / -1" // span all columns
    results.appendChild(loadingElement)
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
        loadingElement.textContent = `${line} Vänta lite, söker på TimeEdit ${line}`;
    }, 150);
}

function hideLoading() {
    clearInterval(loading);
    results.innerHTML = "";
    checkboxes.forEach(checkbox => checkbox.disabled = false)
    all.disabled = false
}


/**
 * Fetch the total rooms from the JSON file 
 * @returns {Promise<Array>} The total rooms from the JSON file
 */
async function loadTotalRooms() {
    try {
        const response = await fetch("rooms.json")
        const data = await response.json()
        return data
    } catch (error) {
        console.error("Error loading objects from JSON:", error)
    }
}

/**
 * Enable or disable house selections based on availability
 */
function disableUnavailableSelections() {
    checkboxes.forEach(checkbox => {
        const house = checkbox.id
        const booked = !totalRooms.some(room => room.house === house && !bookedRooms.has(room.name))
        checkbox.disabled = booked
        checkbox.parentElement.classList = booked ? "unavailable" : "available"
    })
}

/**
 * Show selected rooms in the DOM
 */
function updateResults() {
    results.innerHTML = ""
    selectedRooms.forEach(room => {
        const roomDiv = document.createElement("div")
        roomDiv.textContent = room.name
        results.appendChild(roomDiv)
    })
}

/**
 * Update the selectedRooms array based on the selected houses
 * then call updateResults
 */
function updateSelection() {
    // update selectedHouses from the checkboxes
    selectedHouses = []
    checkboxes.forEach(checkbox => {
        if (!checkbox.checked) return
        const house = checkbox.id.trim()
        selectedHouses.push(house)
    })

    // update selectedRooms from the selectedHouses
    selectedRooms = availableRooms.filter(room => selectedHouses.includes(room.house));
    disableUnavailableSelections()
    updateResults()
}


/**
 * Fetch the HTML response from TimeEdit
 * @returns {Promise<Document>} The HTML response from TimeEdit
 */
async function fetchBookingDocument() {
    const BASE_URL = "https://cloud.timeedit.net/liu/web/schema/ri.html"
    const PERIOD = `-5.h,10.m`.replace(/,/g, "%2C")
    const parser = new DOMParser()
    const objects = totalRooms.map(room => room.id).join(",")
    const url = `${BASE_URL}?part=t&sid=3&p=${PERIOD}&objects=${objects}`
    console.log((url))

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
    const columnHeaders = timeEditDocument.querySelector(".columnheaders")
    const lokalColIndex = [...columnHeaders.children].findIndex(cell => cell.textContent.trim() === "Lokal")
    timeEditDocument.querySelectorAll("tr.rr.clickable2").forEach(row => {

        const rooms = row.children[lokalColIndex].textContent.trim().split(" ");

        if (rooms == "") return; // skip bookings without rooms

        rooms.forEach(room => booked.add(room));
    })
    return booked;
}



// -- VISUAL FUNCTIONS --

/**
 * Make all checkboxes follow the all checkbox
 */
function toggleAllCheckbox() {
    checkboxes.forEach(checkbox => {
        if (checkbox.disabled) return
        checkbox.checked = all.checked
    })
}

/**
 * Make the all checkbox follow the checkboxes
 */
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
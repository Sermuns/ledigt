let totalRooms, results, all, checkboxes, availableRooms, selectedRooms, selectedHouses, loading

window.onload = init

/**
 * Initialize variables and fetch the data
 * Fetch the HTML response from TimeEdit and display the results
 */
async function init() {
    results = document.getElementById("results")
    all = document.querySelector("#hus-title input[type=checkbox]")
    checkboxes = document.querySelectorAll("#hus-selection input[type=checkbox]")

    showClock()

    showLoading()

    const totalRooms = await loadTotalRooms() // load from local JSON file

    availableRooms = await getAvailableRooms(totalRooms) // possibly fetch from TimeEdit

    hideLoading(loading);

    updateSelection()
}

/**
 * Fetch the available rooms from TimeEdit
 * If the data is cached, use the cached data
 * @returns {Promise<Array>} The available rooms from TimeEdit
 */
async function getAvailableRooms(totalRooms) {
    // try to use cache first
    const cachedAvailableRooms = getCached();
    if (cachedAvailableRooms) return cachedAvailableRooms;

    // fetch from TimeEdit
    const bookingDocument = await fetchBookingDocument(totalRooms);
    const booked = getBookedRooms(bookingDocument);
    const available = totalRooms.filter(room => !booked.has(room.name))
    cache(available)
    return available;
}

/**
 * update the clock in the top right corner
 */
function showClock() {
    const clock = document.getElementById("clock")
    const now = new Date()
    const options = { hour: '2-digit', minute: '2-digit' };
    clock.textContent = now.toLocaleTimeString('sv-SE', options)
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
 * if all rooms in house is booked, disable the checkbox
 */
function disableUnavailableCheckboxes() {
    checkboxes.forEach(checkbox => {
        const house = checkbox.id
        // check if availablerooms contains a single room from the house
        const booked = !availableRooms.some(room => room.house === house)
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
    disableUnavailableCheckboxes()
    updateResults()
}

/**
 * Return cached
 * 1. it exists
 * 2. it is not older than specified time
 */
function getCached() {
    const TOO_OLD = 60000 // 1 minute

    // anything cached?
    const availableRooms = localStorage.getItem("availableRooms")
    if (!availableRooms) return null

    // too old?
    const cacheTime = localStorage.getItem("cacheTime")
    if (!cacheTime || Date.now() - cacheTime > TOO_OLD) return null

    // Parse the JSON string back into an object
    return JSON.parse(availableRooms)
}

/**
 * Store the booked rooms and the time of caching
 */
function cache(availableRooms) {
    localStorage.setItem("availableRooms", JSON.stringify(availableRooms))
    localStorage.setItem("cacheTime", Date.now())
}

/**
 * Check localStorage for cached data, otherwise fetch the data from TimeEdit
 * @returns {Promise<Document>} The HTML response from TimeEdit
 */
async function fetchBookingDocument(totalRooms) {
    const BASE_URL = "https://cloud.timeedit.net/liu/web/schema/ri.html"
    const PERIOD = `0.m,1.m`.replace(/,/g, "%2C")
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
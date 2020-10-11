// file that allows for indexDB to be used

//variable for db connection
let db

//establishes connection to indexDB
const request = indexedDB.open('budget_tracker', 1)

// emits if db version changes
request.onupgradeneeded = function(event) {
    const db = event.target.result
    db.createObjectStore('new_budget', { autoIncrement: true })
}

//uploads offline budget changes in request successful
request.onsuccess = function(event) {
    db = event.target.result
    if (navigator.onLine) {
        uploadBudget()
    }
}

//if there is an error send error corde
request.onerror = function(event) {
    console.log(event.target.errorCode)
}

//saves budget changes if there is no internet connection
function saveRecord(record) {
    const transaction = db.transaction(['new_budget'], 'readwrite')
    const budgetObjectStore = transaction.objectStore('new_budget')
    budgetObjectStore.add(record)
}

//posts budget changes when connection is reestablished
function uploadBudget() {
    const transaction = db.transaction(['new_budget'], 'readwrite')
    const budgetObjectStore = transaction.objectStore('new_budget')
    const getAll = budgetObjectStore.getAll()
    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(() => {
                    const transaction = db.transaction(['new_budget'], 'readwrite')
                    const budgetObjectStore = transaction.objectStore('new_budget')
                    budgetObjectStore.clear()
                })
                .catch(err => {
                    console.log(err)
                })
        }
    }
}

//listens for app coming back online
window.addEventListener('online', uploadBudget)
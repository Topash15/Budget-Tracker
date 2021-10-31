// variable for indexedDb connection
let db;

const request = indexedDB.open('budget_tracker', 1);

// runs when db version changes
request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_budgetTransaction', { autoIncrement: true });
}

// runs when successful
request.onsuccess = function(event) {
    db = event.target.result;

    // if app is online, upload transaction
    if (navigator.onLine) {
        uploadTransaction();
    }
}

// console logs error
request.onerror = function(event) {
    console.log(event.target.errorCode)
}

// saves transaction to local indexedDb if no internet connection
function saveRecord(record) {
    // open transaction with database
    // has read and write permissions
    const transaction = db.transaction(['new_budgetTransaction'], 'readwrite');

    // access object store for 'new_transaction'
    const transactionObjectStore = transaction.objectStore('new_budgetTransaction');

    // add record to store with add method
    transactionObjectStore.add(record)
}

// uploads transactions from local DB to server DB
function uploadTransaction(){
    console.log('uploading transaction')
    // open a transaction on your db
    const transaction = db.transaction(['new_budgetTransaction'], 'readwrite');

    // access your object store
    const transactionObjectStore = transaction.objectStore('new_budgetTransaction');

    // get all records from store and set to a variable
    const getAll = transactionObjectStore.getAll();

    // upon a successfull getAll(), run this function
    getAll.onsuccess = function (){
        // if there was a data in indexedDb's store, send to api server
        if (getAll.result.length > 0){
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open one more transaction
                const transaction = db.transaction(['new_budgetTransaction'], 'readwrite');
                // access the new_transaction object store
                const transactionObjectStore = transaction.objectStore('new_budgetTransaction');
                // clear all items in your store
                transactionObjectStore.clear();

                alert('All saved transactions has been submitted');
            })
            .catch(err => {
                console.log(err)
            })
        }
    }
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction)
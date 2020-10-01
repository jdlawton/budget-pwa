//create variable to hold db connection
let db;

//establish a connection to IndexedDB database called 'budget_pwa' and set it to version 1
const request = indexedDB.open('budget_pwa', 1);

//this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
    //save a reference to the database
    const db = event.target.result;
    //create an object store (table) called `offline_actions`, set it to have an auto incrementing primary key of sorts
    db.createObjectStore('offline_actions', {autoIncrement: true});
};

//on a successful
request.onsuccess = function(event) {
    //when db is successfully created with its object store (from onupgradeneeded event above) 
    //or simply established a connection, save reference to db in global variable
    db = event.target.result;

    //check if app is online, if yes, run uploadActions() function to send all local db data to api
    if (navigator.onLine) {
        //we haven't created this yet, but we will soon, so let's comment it out for now
        uploadActions();
    }
};

request.onerror = function(event) {
    //log error here
    console.log(event.target.errorCode);
};

//This function will be executed if we attempte to submit a new transaction and there's no internet connection
function saveRecord(record) {
    //open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['offline_actions'], 'readwrite');

    //access the object store for `offline_actions`
    const actionsObjectStore = transaction.objectStore('offline_actions');

    //add record to your store with add method
    actionsObjectStore.add(record);
};

//This function will upload all of the transactions stored in IndexedDB when the application is back online
function uploadActions() {
    //open a transaction to the database
    const transaction = db.transaction(['offline_actions'], 'readwrite');

    //access your object store
    const actionsObjectStore = transaction.objectStore('offline_actions');

    //get all records from store and set to a variable
    const getAll = actionsObjectStore.getAll();

    //upon a successful .getAll() execution, run this function
    getAll.onsuccess = function() {
        //if there was data in indexedDB's store, let's send it to the api server
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
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    //open one more transaction
                    const transaction = db.transaction(['offline_actions'], 'readwrite');
                    //access the offline_actions object store
                    const actionsObjectStore = transaction.objectStore('offline_actions');
                    //clear all items in your store
                    actionsObjectStore.clear();

                    alert('All saved transactions have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
};

//listen for app coming back online
window.addEventListener('online', uploadActions);
//this file contains the code for dealing with the IndexedDB. If the app goes offline, this database will allow the user to continue
//making deposits and withdrawals while offline. When the app comes online, the transactions will automatically be uploaded to the server.

//variable used to reference the database
let db;

//establish a connection to IndexedDB database called 'budget_pwa' and set it to version 1
const request = indexedDB.open('budget_pwa', 1);

//this event will trigger when the database is first created, or when the version changes
request.onupgradeneeded = function(event) {
    const db = event.target.result; //this is a locally scoped variable, not the same as the db variable above.
    //create an object store and, set it to auto increment
    db.createObjectStore('offline_actions', {autoIncrement: true});
};

//this function triggers either when the above onupgradeneeded function triggers or when a connection
//to an existing database is established
request.onsuccess = function(event) {
    //saves database reference to the global db variable
    db = event.target.result;

    //check if app is online, if yes, run uploadActions() function to send all local db data to api
    if (navigator.onLine) {
        uploadActions();
    }
};

request.onerror = function(event) {
    //console log any errors with the database
    console.log(event.target.errorCode);
};

//this function will be executed if we attempte to submit a new transaction and there's no internet connection
function saveRecord(record) {
    //open a connection to the db, access the object store, and use the .add method to add the record to the IndexedDB.
    const transaction = db.transaction(['offline_actions'], 'readwrite');
    const actionsObjectStore = transaction.objectStore('offline_actions');
    actionsObjectStore.add(record);
};

//This function will upload all of the transactions stored in IndexedDB when the application is back online
function uploadActions() {
    const transaction = db.transaction(['offline_actions'], 'readwrite');
    const actionsObjectStore = transaction.objectStore('offline_actions');

    //get all records from store and set to a variable
    const getAll = actionsObjectStore.getAll();

    //upon a successful .getAll() execution, run this function
    getAll.onsuccess = function() {
        //if there was data in indexedDB's store, use the bulk upload route to send it all to the server
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
                    //open a connection to the db, access the object store, and then clear out any
                    //data in the IndexedDB since those pending transactions have just been uploaded
                    const transaction = db.transaction(['offline_actions'], 'readwrite');
                    const actionsObjectStore = transaction.objectStore('offline_actions');
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
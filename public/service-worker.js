
//create the cache name using a prefix and version variable.
//This is setup this way to allow the app to find/delete other caches
//starting with APP_PREFIX so they can be deleted when necessary
const APP_PREFIX = 'budget-pwa-';
const VERSION = 'v1'
const CACHE_NAME = APP_PREFIX + VERSION;

//caching all of the files in '/public', as well as '/' and '/api/transaction'
//to allow all relevant information to display when the application is offline
const FILES_TO_CACHE = [
    '/',
    './index.html',
    './js/index.js',
    './js/idb.js',
    './css/styles.css',
    './icons/icon-72x72.png',
    './icons/icon-96x96.png',
    './icons/icon-128x128.png',
    './icons/icon-144x144.png',
    './icons/icon-152x152.png',
    './icons/icon-192x192.png',
    './icons/icon-384x384.png',
    './icons/icon-512x512.png',
    '/api/transaction'
]

//code to install the service worker in the browser
self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            //console.log('installing cache : ' + CACHE_NAME)
            return cache.addAll(FILES_TO_CACHE) //adds all of the files in the above array to the cache
        })
    )
})

//code to activate the service worker
self.addEventListener('activate', function(e) {
    e.waitUntil(
      //get a list of all cache names, save any that start with APP_PREFIX to an array
      //this allows the service worker to function if there were multiple caches where
      //this app was being hosted.
      caches.keys().then(function(keyList) {
        let cacheKeeplist = keyList.filter(function(key) {
          return key.indexOf(APP_PREFIX);
        });
        cacheKeeplist.push(CACHE_NAME); //also push the CACHE_NAME we defined above to the array
  
        //deletes all old versions of the cache
        return Promise.all(
          keyList.map(function(key, i) {
            if (cacheKeeplist.indexOf(key) === -1) {
              //console.log('deleting cache : ' + keyList[i]);
              return caches.delete(keyList[i]);
            }
          })
        );
      })
    );
  });

  //this event listener listens for fetch requests to the server, checks to see if the information
  //being requested is already cached. If it is, it responds with the info from the cache, if it 
  //has not been cached, it sends the fetch request on to the server like normal.
  self.addEventListener('fetch', function (e) {
      //console.log('fetch request : ' + e.request.url)
      e.respondWith(
          caches.match(e.request).then(function (request) {
              if (request) {
                  //console.log('responding with cache: ' + e.request.url);
                  return request;
              } else {
                  //console.log('file is not cached, fetching: ' + e.request.url);
                  return fetch(e.request);
              }
          })
      );
  });
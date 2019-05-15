var admin = require('firebase-admin');
let config = require('../common/configurations');

let serviceAccountKey = config.serviceAccountKey;


let initializeFirebaseDb = () => {  
    var serviceAccount = require(serviceAccountKey);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    
    var db = admin.firestore();
  
    return db;
}

module.exports = {
    initializeFirebaseDb: initializeFirebaseDb
}
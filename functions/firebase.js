const admin = require("firebase-admin")
const serviceAccount = require("../serviceAccount.json");

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "coverstory-fd82e.appspot.com"
});

const db = admin.firestore(app)
const storage = admin.storage(app)

module.exports = {
  db, storage
}
const admin = require("firebase-admin");
const express = require("express");

const router = express.Router();

module.exports = db => {
  router.post("/", (req, res) => {
    db.collection("users")
      .where("firstName", "==", "Minhh")
      .get()
      .then(snapshot => {
        res.send({
          success: true,
          docs: snapshot.docs.map(doc => doc.id)
        });
      });
  });
  return router;
};

const express = require("express");

const router = express.Router();

// Get availabilities
module.exports = db => {
  router.post("/", (req, res) => {
    res.set("Cache-Control", "public, max-age=300, s-maxage=600");

    console.log(req.body);

    const availabilities = db.collection("availabilities");
    const users = db.collection("users");

    const { action } = req.body;

    if (action === "get availabilities") {
      availabilities.get().then(snapshot => {
        res.send({
          success: true,
          availabilities: snapshot.docs.map(doc => doc.data())
        });
      });
    }
  });

  return router;
};

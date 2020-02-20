const express = require("express");

const router = express.Router();

// home page
router.get("/", (req, res) => {
  res.render("index", { title: "doc4you-backend" });
});

module.exports = router;

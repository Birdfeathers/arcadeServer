const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send({ response: "I am alive" }).status(200);
});

const usersRouter = require('./users');
router.use('/users', usersRouter);

module.exports = router;
const express = require("express");
const router = express.Router();
// create logs for everything
const morgan = require('morgan');
router.use(morgan('dev'));
const { getUserById } = require('../db/index');

router.use(async (req, res, next) => {
  const prefix = "Bearer ";
  const auth = req.header('Authorization');

  // goes onto the next function if auth is falsey
  if (!auth) {
      next();
  } else if (auth.startsWith(prefix)) { // verifies the token if "auth" starts with "Bearer"
      const token = auth.slice(prefix.length);

      try {
          const { id } = await jwt.verify(token, JWT_SECRET);

          if (id) {
              req.user = await getUserById(id);
              next();
          }
      } catch (error) {
          next(error)
      }
  } else {
      next(`Authorization token must start with ${ prefix }`)
  }
})

router.get("/", (req, res) => {
  res.send({ response: "I am alive" }).status(200);
});

const usersRouter = require('./users');
router.use('/users', usersRouter);

module.exports = router;
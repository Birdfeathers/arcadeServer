function requireUser(req, res, next) {
    if (!req.user) {
        console.log("message here")
        next({
            name: "MissingUserError",
            message: "You must be logged in to perform this action"
          });
    }
    next();
}


module.exports = {requireUser};
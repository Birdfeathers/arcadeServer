const express= require('express');
const jwt = require('jsonwebtoken');
const usersRouter = express.Router();
const {
    createUser,
    getUserByUsername,
    getUserById,
    checkLogin,
    getAllUsers,
    changeUserPassword}
= require('../db/index');

const {requireUser} = require('./utils');

// registration/ create new user
usersRouter.post('/register', async(req, res, next) => {
    const {username, password} = req.body;
    try{
        const userCheck = await getUserByUsername(username); //check if the username already exists
        if(userCheck) {
            throw new Error('A user by that name already exists');
        }
        const user = await createUser(req.body);
        const token = jwt.sign({id: user.id, username: user.username}, process.env.JWT_SECRET);
        user.token = token; 
        res.send(user); 


    } catch(error){
        next(error);
    }
})


// login the user
usersRouter.post('/login', async (req, res, next) => {
    const {username, password} = req.body;
    try{
        if (!username || !password) {
            throw Error("Please supply both a username and password");
        }
        const user = await checkLogin(req.body);
        if (!user) throw Error('Your username or password is incorrect!');
        const token = jwt.sign({id: user.id, username: user.username}, process.env.JWT_SECRET);
        res.send({
            message: 'successful login',
            token: token,
            username: username
        });
    } catch(error){
        next(error);
    }
})

// get all the users
usersRouter.get('/all', async (req, res , next) => {
    try {
        const users = await getAllUsers();
        res.send(users);
    } catch (error) {
        next(error)
    } 
})

// change the user password
usersRouter.patch('/password', async (req, res, next) => {
    try{
        const patchedUser = await changeUserPassword({id: req.user.id, password: req.body.password});
        res.send(patchedUser);
    } catch(error){
        console.log(error);
        next(error);
    }
})

module.exports = usersRouter;

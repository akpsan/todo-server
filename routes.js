import Router from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { TodoModel, UserModel, BoardModel } from "./models.js";
import {
    getUserDetailsFromToken,
    isAuthenticated,
    verifyOAuth,
} from "./utils.js";
import { AUTH_METHODS, USER_TYPES } from "./constants.js";

const router = new Router();

router.get("/", (req, res) => {
    res.send("Hello World!");
});

router.get("/todos", isAuthenticated, (req, res) => {
    const { id } = getUserDetailsFromToken(req.headers.authorization);
    console.log("searching for", id);
    TodoModel.find({ owner_id: id }, function (err, todos) {
        if (err) return res.sendStatus(500);
        res.send(todos);
    });
});

router.get("/todos/:id", isAuthenticated, (req, res) => {
    const { id } = req.params;
    TodoModel.find({ id: id }, function (err, todo) {
        if (err) return res.sendStatus(500);
        res.send(todo);
    });
});

router.post("/todos/:id", isAuthenticated, (req, res) => {
    const { id } = req.params;
    // const { id: ownerId } = getUserDetailsFromToken(req.headers.authorization);
    TodoModel.findByIdAndUpdate(id, req.body, { new: true }, (err, todo) => {
        if (err) return res.sendStatus(500);
        return res.send(todo);
    });
});

router.post("/todos", isAuthenticated, (req, res) => {
    const { title = "Empty todo" } = req.body;
    const { id: ownerId } = getUserDetailsFromToken(req.headers.authorization);
    let newTodo = new TodoModel({
        title,
        dueAt: new Date(),
        owner_id: ownerId,
    });
    console.log(newTodo.owner_id);
    newTodo.save(function (err, todo) {
        if (err) return res.sendStatus(500);
        res.send(todo);
    });
});

router.post("/signup", (req, res) => {
    const { email, username, password } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    const newUser = new UserModel({ email, username, password: hash });
    newUser.save(function (err, user) {
        if (err) return res.sendStatus(500);
        const token = jwt.sign(
            { username: user.username, id: user._id, role: user.role },
            process.env.MY_SERVER_SECRET,
            {
                expiresIn: "7d",
            }
        );
        res.send(token);
    });
});

router.post("/login", async (req, res) => {
    const {
        email,
        password,
        method = AUTH_METHODS.INTERNAL,
        oAuthToken = null,
    } = req.body;
    console.log("Auth method", method);
    try {
        if (method === AUTH_METHODS.INTERNAL) {
            UserModel.findOne({ email: email }, (err, user) => {
                if (err) {
					console.log("Cannot get user with email", email)
                    return res.sendStatus(500);
                } else if (!user) {
					console.log("User is not valid")
					return res.sendStatus(500);
				} else {
                    const isAuthenticated = bcrypt.compareSync(
                        password,
                        user.password
                    );
                    if (isAuthenticated) {
                        const token = jwt.sign(
                            {
                                username: user.username,
                                id: user._id,
                                role: user.role,
                            },
                            process.env.MY_SERVER_SECRET,
                            {
                                expiresIn: "7d",
                            }
                        );
                        return res.send({ token });
                    } else {
                        console.log("Attempt to authenticate failed. [1]");
                        return res.sendStatus(401);
                    }
                }
            });
        } else if (method === AUTH_METHODS.OAUTH && oAuthToken) {
            const token = await verifyOAuth(oAuthToken);
            if (token.userid) {
                const OAuthEmail = token.payload.email;
                UserModel.findOne({ email: OAuthEmail }, (err, user) => {
                    if (err) {
                        console.log("Cannot get user", OAuthEmail);
                        res.send(500);
                    } else if (!user) {
                        console.log("New user, signing up.");
                        const gUser = new UserModel({
                            email: OAuthEmail,
                            username: token.payload.given_name,
							userType: USER_TYPES.OAUTH_USER,
							password: "",
                        });
                        gUser.save(function (error, result) {
                            if (error) {
                                console.log('save error', error);
                            } else if (result) {
                                const jwToken = jwt.sign(
                                    {
                                        username: result.username,
                                        id: result._id,
                                        role: result.role,
                                        email: result.email,
                                        userType: result.userType,
                                    },
                                    process.env.MY_SERVER_SECRET,
                                    {
                                        expiresIn: "7d",
                                    }
                                );
                                return res.send({ token: jwToken });
                            }
                            return res.sendStatus(500);
                        });
                    } else {
                        console.log("Existing user, loggin in.");
                        const jwToken = jwt.sign(
                            {
                                username: user.username,
                                id: user._id,
                                role: user.role,
                            },
                            process.env.MY_SERVER_SECRET,
                            {
                                expiresIn: "7d",
                            }
                        );
                        return res.send({ token: jwToken });
                    }
                });
            } else {
				console.log("OAuth Verification failed.");
				return res.sendStatus(500);
			}
        } else {
			console.log("Invalid auth method.");
			return res.sendStatus(500);
		}
    } catch (e) {
		console.log("Error while authenticating.")
        console.log(e);
        return res.sendStatus(500);
    }
});

// Helper fns

export default router;

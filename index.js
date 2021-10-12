require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");

const app = express();
const port = 3002;

app.use(morgan("dev"));
app.use(express.json());
app.use(cors());

/**
 * DB Stuff
 * Mongoose
 */

//Import the mongoose module
const mongoose = require("mongoose");

//Set up default mongoose connection
const mongoDB = process.env.MONGO_DB_URL;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

//Get the default connection
const db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Schemas
const Schema = mongoose.Schema;

const TodoModelSchema = new Schema({
  id: Schema.Types.ObjectId,
  dueAt: Date,
  title: { type: String, minLength: 1, maxLength: 15, required: true },
  completed: { type: Boolean, default: false },
});

const UserModelSchema = new Schema({
  id: Schema.Types.ObjectId,
  email: { type: String, minLength: 4, maxLength: 15, required: true },
  username: { type: String, minLength: 4, maxLength: 15, required: true },
  password: { type: String, minLength: 8, maxLength: 128, required: true },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
});

const BoardModelSchema = new Schema({
  id: Schema.Types.ObjectId,
  title: { type: String, minLength: 4, maxLength: 15, required: true },
  todos: [{ type: Schema.Types.ObjectId, ref: "TodoModel" }],
});

// Models
const TodoModel = mongoose.model("TodoModel", TodoModelSchema);
const UserModel = mongoose.model("UserModel", UserModelSchema);
const BoardModel = mongoose.model("BoardModel", BoardModelSchema);

// Validators
UserModelSchema.path("email").validate(async (v) => {
  const regex = new RegExp(/[a-z0-9._%+-]+@[a-z0-9.-]+.[a-z]{2,3}/g);
  const isEmailValid = regex.test(v);
  if (!isEmailValid) {
    throw new Error("Invalid Email.");
  }
  const count = await UserModel.count({ email: v });
  if (count > 0) {
    throw new Error("This email has already been used.");
  }
  return true;
}, "Email is not valid");

/**
 * Routes
 *
 */

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/todos", (req, res) => {
  TodoModel.find({}, function (err, todos) {
    if (err) return res.status(500).send(err);
    res.send(todos);
  });
});

app.get("/todos/:id", (req, res) => {
  const { id } = req.params;
  TodoModel.find({ id: id }, function (err, todo) {
    if (err) return res.status(500).send(err);
    res.send(todo);
  });
});

app.post("/todos/:id", (req, res) => {
  const { id } = req.params;
  TodoModel.findByIdAndUpdate(id, req.body, { new: true }, (err, todo) => {
    if (err) return res.status(500).send(err);
    return res.send(todo);
  });
});

app.post("/todos", (req, res) => {
  const { title = "Empty todo" } = req.body;
  let newTodo = new TodoModel({
    title,
    dueAt: new Date(),
  });
  newTodo.save(function (err) {
    if (err) return res.status(500).send(err);
    res.status(200).send("Created");
  });
});

app.post("/signup", (req, res) => {
  const { email, username, password } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  const newUser = new UserModel({ email, username, password: hash });
  newUser.save(function (err, user) {
    if (err) return res.status(500).send(err);
    const token = jwt.sign(
      { username: user.name, id: user._id, role: user.role },
      process.env.MY_SERVER_SECRET,
      {
        expiresIn: "7d",
      }
    );
    res.status(200).send(token);
  });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  UserModel.findOne({ email: email }, (err, user) => {
    if (err) {
      return res.status(500).send(err);
    }
    const isAuthenticated = bcrypt.compareSync(password, user.password);
    if (isAuthenticated) {
      const token = jwt.sign({ ...user }, process.env.MY_SERVER_SECRET, {
        expiresIn: "7d",
      });
      res.status(200).send(token);
    } else {
      console.log("Attempt to authenticate failed.");
      res.status(401).send("");
    }
  });
});

app.listen(port, () => {
  console.log(`Todo app listening at http://localhost:${port}`);
});

require("dotenv").config();
const express = require("express");
const app = express();
const port = 3002;

app.use(express.json());

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

const Schema = mongoose.Schema;

const TodoModalSchema = new Schema({
  id: Schema.Types.ObjectId,
  dueAt: Date,
  title: { type: String, minLength: 1, maxLength: 15, required: true },
  completed: Boolean,
});

var TodoModal = mongoose.model("TodoModal", TodoModalSchema);

/**
 * Routes
 * There is only two routes / and /todos
 */

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/todos", (req, res) => {
  TodoModal.find({}, function (err, todos) {
    if (err) return res.status(500).send(err);
    res.send(todos);
  });
});

app.get("/todos/:id", (req, res) => {
  const { id } = req.params;
  TodoModal.find({ id: id }, function (err, todo) {
    if (err) return res.status(500).send(err);
    res.send(todo);
  });
});

app.post("/todos/:id", (req, res) => {
  const { id } = req.params;
  TodoModal.findByIdAndUpdate(id, req.body, { new: true }, (err, todo) => {
    if (err) return res.status(500).send(err);
    return res.send(todo);
  });
});

app.post("/todos", (req, res) => {
  console.log(req.body);
  const { title = "Empty todo" } = req.body;
  let newTodo = new TodoModal({
    title,
    dueAt: new Date(),
  });
  newTodo.save(function (err) {
    if (err) return res.status(500).send(err);
    res.status(200).send("Created");
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

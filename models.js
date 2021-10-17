"use strict";
import mongoose from "mongoose";
import {
  TodoModelSchema,
  UserModelSchema,
  BoardModelSchema,
} from "./schema.js";

export const TodoModel = mongoose.model("TodoModel", TodoModelSchema);
export const UserModel = mongoose.model("UserModel", UserModelSchema);
export const BoardModel = mongoose.model("BoardModel", BoardModelSchema);

export default { TodoModel, UserModel, BoardModel };

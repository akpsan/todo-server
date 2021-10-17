"use strict";
import mongoose from "mongoose";
import { USER_TYPES } from "./constants.js";

const Schema = mongoose.Schema;

export const TodoModelSchema = new Schema({
    id: Schema.Types.ObjectId,
    dueAt: Date,
    title: { type: String, minLength: 1, maxLength: 15, required: true },
    completed: { type: Boolean, default: false },
    owner_id: { type: Schema.Types.ObjectId, ref: "UserModel" },
});

export const UserModelSchema = new Schema({
    id: Schema.Types.ObjectId,
    email: {
        type: String,
        minLength: 4,
        maxLength: 25,
        required: true,
        unique: true,
        validate: [
            function (value) {
                const regex = new RegExp(
                    /[a-z0-9._%+-]+@[a-z0-9.-]+.[a-z]{2,3}/g
                );
                const isEmailValid = regex.test(value);
                if (!isEmailValid) {
                    throw new Error("Invalid Email.");
                }
                return true;
            },
        ],
    },
    username: { type: String, minLength: 4, maxLength: 15, required: true },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    userType: {
        type: String,
        enum: [USER_TYPES.INTERNAL_USER, USER_TYPES.OAUTH_USER],
        default: USER_TYPES.INTERNAL_USER,
    },
    password: {
        type: String,
        validate: [
            function (value) {
                if (this.userType === USER_TYPES.INTERNAL_USER) {
                    return (
                        !value &&
                        value.toString().length > 8 &&
                        value.toString().length < 16
                    );
                } else if (this.userType === USER_TYPES.OAUTH_USER) {
                    return true;
                }
                return false;
            },
        ],
    },
});

export const BoardModelSchema = new Schema({
    id: Schema.Types.ObjectId,
    title: { type: String, minLength: 4, maxLength: 15, required: true },
    todos: [{ type: Schema.Types.ObjectId, ref: "TodoModel" }],
});

// Validators
UserModelSchema.path("email").validate(async (v) => {}, "Email is not valid");

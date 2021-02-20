const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const UserSchema = mongoose.Schema({
    email: {
        type: String, required: true, unique: true
    },
    password: {
        type: String, requierd: true
    },
    phone: {
        type: String, required: true
    },
    name: {
        type: String, required: true
    },
    surname: {
        type: String, required: true
    },
    roles: {
        type: [String], requierd: true
    },
    verified: {
        type: Boolean, required: true
    }
});

UserSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', UserSchema);
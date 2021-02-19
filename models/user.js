const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
    email: {
        type: String, required: true
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


});

module.exports = mongoose.model('User', UserSchema);
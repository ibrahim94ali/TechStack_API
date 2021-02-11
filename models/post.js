const mongoose = require("mongoose");

const PostSchema = mongoose.Schema({
    title: {
        type: String, required: true
    },
    owner: {
        type: String, required: true
    },
    link: {
        type: String, requierd: true
    },
    techId: {
        type: String, requierd: true
    },
    date: {
        type: String, requierd: true
    }
});

module.exports = mongoose.model('Post', PostSchema);
const mongoose = require("mongoose");

const TechSchema = mongoose.Schema({
    name: {type: String, required: true}
});

module.exports = mongoose.model('Technology', TechSchema);
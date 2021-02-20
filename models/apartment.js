const mongoose = require("mongoose");

const ApartmentSchema = mongoose.Schema({
    title: {
        type: String, required: true
    },
    details: {
        type: String, required: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId, ref: "User", required: true
    },
    date: {
        type: String, requierd: true
    },
    geolocation: {
        type: [Number], required: true
    },
    address: {
        type: String, required: true
    },
    city: {
        type: String, required: true
    },
    price: {
        type: Number, requierd: true
    },
    type: {
        type: String, required: true
    },
    photos: {
        type: [String], requierd: true
    },
    msquare: {
        type: Number, required: true
    },
    roomCount: {
        type: Number, requierd: true
    }
});

module.exports = mongoose.model('Apartment', ApartmentSchema);
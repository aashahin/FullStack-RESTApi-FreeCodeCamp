const {Schema, model} = require('mongoose');

const StockSchema = new Schema({
    symbol: {type: String, required: true},
    likes: {type: [String], default: []}
});

module.exports = model('Stock', StockSchema);
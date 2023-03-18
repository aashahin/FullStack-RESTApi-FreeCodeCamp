"use strict";
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const Stock = require("../model");

async function createStock(stock, like, ip) {
  const newStock = new Stock({ symbol: stock, likes: like ? [ip] : [] });
  await newStock.save();
  return newStock;
}

async function findStock(stock) {
  return await Stock.findOne({ symbol: stock }).exec();
}
async function saveStock(stock, like, ip) {
  let saved = {};
  const foundStock = await findStock(stock);
  if (!foundStock) {
    const createSaved = await createStock(stock, like, ip);
    return (saved = createSaved);
  } else {
    if (like && !foundStock.likes.includes(ip)) {
      foundStock.likes.push(ip);
      await foundStock.save();
    }
    return (saved = foundStock);
  }
}

async function getStock(stock) {
  const response = await fetch(
    `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`
  );
  const { symbol, latestPrice } = await response.json();
  return { symbol, latestPrice };
}

module.exports = function (app) {
  app.route("/api/stock-prices").get(async function (req, res) {
    const { stock, like } = req.query;
    if (Array.isArray(stock)) {
      const { symbol, latestPrice } = await getStock(stock[0]);
      const { symbol: symbol2, latestPrice: latestPrice2 } = await getStock(
        stock[1]
      );

      const firstStock = await saveStock(stock[0], like, req.ip);
      const secondStock = await saveStock(stock[1], like, req.ip);

      let stockData = [];
      if (!symbol) {
        stockData.push({
          rel_likes: firstStock.likes.length - secondStock.likes.length,
        });
      } else {
        stockData.push({
          stock: symbol,
          price: latestPrice,
          rel_likes: firstStock.likes.length - secondStock.likes.length,
        });
      }
      if (!symbol2) {
        stockData.push({ rel_likes: secondStock.likes.length - firstStock.likes.length });
      }else{
        stockData.push({
          stock: symbol2,
          price: latestPrice2,
          rel_likes: secondStock.likes.length - firstStock.likes.length,
        });
      }
      return res.json({ stockData });
    }
    const { symbol, latestPrice } = await getStock(stock);
    if (!symbol) {
      return res.json({ stockData: { likes: like ? 1 : 0 } });
    }
    const oneStock = await saveStock(symbol, like, req.ip);
    console.log(oneStock);
    res.json({
      stockData: {
        stock: symbol,
        price: latestPrice,
        likes: oneStock.likes.length,
      },
    });
  });
};

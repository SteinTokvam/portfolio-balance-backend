var express = require("express");
const res = require("express/lib/response");
var createError = require("http-errors");
var router = express.Router();

const satoshiDivider = 100000000;

function mapWalletData(data) {
  return data.txs.map((walletTransaction) => {
    return {
      transactionKey: walletTransaction.hash,
      cost: -1, //Trenger å finne fra et api ellerno
      name: "BTC",
      type: setType(walletTransaction, data),
      date: new Date(walletTransaction.time * 1000).toISOString(),
      equityPrice: -1, //Trenger å finne fra et api ellerno
      e24Key: "",
      equityShare: Math.abs(walletTransaction.result / satoshiDivider),
      equityType: "Cryptocurrency",
      fee: walletTransaction.fee / satoshiDivider,
    };
  });
}

function setType(walletTransaction, walletObject) {
  if (
    walletTransaction.out.filter((out) => out.addr === walletObject.address)
      .length > 0
  ) {
    return "DEPOSIT";
  }
  return "WITHDRAWAL";
}

router.post("/transactions", function (req, res, next) {
  const { walletAddr } = req.body;
  fetch(`https://blockchain.info/rawaddr/${walletAddr}`)
    .then((res) => res.json())
    .then((walletData) => {
      const transactions = mapWalletData(walletData);
      res.send(transactions);
    });
});

router.post("/balance", function (req, res, next) {
  const { walletAddr, accountKey } = req.body;
  fetch(`https://blockchain.info/rawaddr/${walletAddr}`)
    .then((res) => res.json())
    .then((walletData) => {
      console.log(walletData.final_balance);
      const balance = walletData.final_balance / satoshiDivider;
      const holding = {
        name: "BTC",
        accountKey: accountKey,
        equityShare: balance,
        equityType: "Cryptocurrency",
        value: -1,
        goalPercentage: 0,
        yield: -1,
      };

      res.send(holding);
    });
});

module.exports = router;

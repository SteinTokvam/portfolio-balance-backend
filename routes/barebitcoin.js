var express = require("express");
const res = require("express/lib/response");
var createError = require("http-errors");
var router = express.Router();

function setType(type) {
  switch (type) {
    case "FIAT_DEPOSIT":
    case "BTC_DEPOSIT":
      return "DEPOSIT";
    case "FIAT_WITHDRAWAL":
    case "BTC_WITHDRAWAL":
      return "WITHDRAWAL";
    case "BTC_BUY":
      return "BUY";
    case "BTC_BONUS":
      return "YIELD";
    case "BTC_SELL":
      return "SELL";
    default:
      return type;
  }
}

function setEquityShare(item) {
  if (item.type === "BTC_BUY") {
    return parseFloat(item.inAmount);
  } else if (item.type === "BTC_SELL") {
    return parseFloat(item.outAmount);
  } else if (item.type === "BTC_WITHDRAWAL") {
    return parseFloat(item.outAmount);
  } else if (item.type === "BTC_DEPOSIT") {
    return parseFloat(item.inAmount);
  } else if (item.type === "BTC_BONUS") {
    return parseFloat(item.inAmount);
  }
}

function setFeeAmount(item) {
  if (item.type === "BTC_WITHDRAWAL") {
    return parseFloat(parseFloat(item.feeAmount * item.rateMarket).toFixed(2));
  }
  return item.feeAmount !== "" ? parseFloat(item.feeAmount) : 0;
}

function setCost(item) {
  if (item.type === "BTC_WITHDRAWAL") {
    return parseFloat(parseFloat(item.outAmount * item.rateMarket).toFixed(2));
  } else if (item.type === "BTC_DEPOSIT") {
    return parseFloat(parseFloat(item.inAmount * item.rateMarket).toFixed(2));
  } else if (item.type === "BTC_BUY") {
    return parseFloat(parseFloat(item.outAmount).toFixed(2));
  } else if (item.type === "BTC_BONUS") {
    return parseFloat(
      (parseFloat(item.rateMarket) * parseFloat(item.inAmount)).toFixed(2)
    );
  }
  return parseFloat(item.inAmount);
}

function getPrice(onlyPrice) {
  return fetch("https://barebitcoin.no/connect/bb.v1alpha.BBService/Price", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((response) => (onlyPrice ? response.midBtcnok : response));
}

function getPnl(accessKey) {
  return fetch("https://barebitcoin.no/connect/bb.pnl.v1.PnlService/LatestPNL?connect=v1&encoding=json&message=%7B%7D", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessKey}`,
    },
  })
    .then((response) => response.json())
    .then((response) => response.pnlAllAccounts.filter((item) => item.account));
}

function getTransactions(accessKey, accountKey) {
  return fetch("https://api.bb.no/export/transactions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessKey}`,
    },
  })
    .then((response) => response.json())
    .then((response) => {
      if (response.error) {
        res.status(500).send(response);
        return;
      }
      return response
        .filter((item) => item.inCurrency !== "NOK")
        .map((item) => {
          const accountName = item.accountId === "acc_01J631DK3N56K40P6NC1HZXWBQ" ? "Barn" : "Hovedkonto";
          const limit = item.subType ? ` - ${item.subType}` : "";
          return {
            transactionKey: item.id,
            accountKey,
            cost: setCost(item),
            name:
              item.type === "BTC_WITHDRAWAL"
                ? `${accountName} - (${item.outCurrency}${limit})`
                : `${accountName} - (${item.inCurrency}${limit})`,
            type: setType(item.type),
            date: item.createTime,
            equityPrice: parseFloat(item.rateMarket),
            e24Key: "",
            equityShare: setEquityShare(item),
            equityType: "Cryptocurrency",
            fee: setFeeAmount(item),
          };
        });
    });
}

router.get("/price", function (req, res, next) {
  getPrice(false).then((response) => res.send(response));
});

router.post("/balance", function (req, res, next) {
  const { accessKey, accountKey } = req.body;
  if (accessKey === undefined) {
    return next(
      createError(400, "Missing required fields accessKey or accountKey")
    );
  }
  fetch("https://api.bb.no/export/balance", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessKey}`,
    },
  })
    .then((response) => response.json())
    .then((response) => {
      getPrice(true).then((price) => {
        getPnl(accessKey).then((pnl) => {
          const holdings = response.bitcoinAccounts
              .map((account) => {
                const currentValue = price * parseFloat(account.balanceBitcoin);
                const yield = parseInt(pnl.filter(item => item.account === account.id)[0].holdings.pnlAbsolute)
                return {
                  name: `${account.name} - (BTC)`,
                  accountKey: accountKey,
                  equityShare: parseFloat(account.balanceBitcoin),
                  equityType: "Cryptocurrency",
                  value: currentValue,
                  goalPercentage: 0,
                  yield,
                };
              })
              holdings.push({
                name: `Kontanter - (NOK)`,
                  accountKey: accountKey,
                  equityShare: 1,
                  equityType: "Cryptocurrency",
                  value: parseInt(response.balanceNok),
                  goalPercentage: 0,
                  yield: 0,
              })
          res.send(holdings);
        });
      });
    });
});

router.post("/transactions", function (req, res, next) {
  const { accessKey, accountKey } = req.body;
  if (accessKey === undefined) {
    return next(createError(400, "Missing required fields accessKey"));
  }
  getTransactions(accessKey, accountKey).then((transactions) => {
    res.send(transactions);
  });
});

router.post("/yield", function (req, res, next) {
  const { accessKey } = req.body;
  if (accessKey === undefined) {
    return next(createError(400, "Missing required fields accessKey"));
  }
  fetch(
    "https://barebitcoin.no/connect/bb.pnl.v1.PnlService/BitcoinHoldings?connect=v1&encoding=json&message=%7B%22accountId%22%3A%22acc_01HQ1MA420JN3NB2G7GWKQCPV2%22%7D",
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessKey}`,
      },
    }
  )
    .then((response) => response.json())
    .then((response) => {
      res.send({yield: response.allTime[response.allTime.length - 1].pnlAbsolute});
    });
});

module.exports = router;

var express = require('express');
const res = require('express/lib/response');
var createError = require('http-errors');
var router = express.Router();

async function login(userId, pw) {
    return fetch('https://fundingpartner.no/api/v2/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ApplicantUsername: userId,
            ApplicantPassword: pw
        })
    }).then(res => res.json()).then(data => data.token);
}

router.post('/transactions', function (req, res, next) {
    const { userId, pw, accountKey } = req.body
    if (userId === undefined || pw === undefined) {
        return next(createError(400, 'Missing required fields userId or pw'))
    }
    login(userId, pw)
    .then(token => {
        fetch('https://fundingpartner.no/api/v2/transactions-unified?startDate=2018-01-01&endDate=2024-11-29&lastILTID=&lastIFTID=', {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `token=${token}`
            }
        }).then(res => res.json()).then(data => {
            const filteredTransactions = data.message.payload.transList
            .filter(item => item.classification !== "depositDomestic" // innskudd til klientkonto
                || item.classification !== "withdrawalRequestedByUser"  // manuelt uttak
                || item.classification !== "withdrawalDomesticForced" // automatisk uttak
            )

            const convertedTransactions = filteredTransactions.map(item => {
                const transactions = []
                if(item.principal !== null && item.principal !== 0) {
                    transactions.push(
                        {
                            transactionKey: `${item.id}_principal`,
                            accountKey,
                            cost: -item.principal,
                            name: `${item.borrowerName} - (${item.loanId})`,
                            type: "SELL",
                            date: item.transactionDate,
                            equityPrice: 1,
                            e24Key: "",
                            equityShare: 1,
                            equityType: "Loan",
                            fee: 0
                        }
                    )
                }
                if(item.netInterest !== null) {
                    transactions.push(
                        {
                            transactionKey: `${item.id}_interest`,
                            accountKey,
                            cost: item.netInterest,
                            name: `${item.borrowerName} - (${item.loanId})`,
                            type: "INTEREST",
                            date: item.transactionDate,
                            equityPrice: 1,
                            e24Key: "",
                            equityShare: 1,
                            equityType: "Loan",
                            fee: 0
                        }
                    )
                }
                if(item.classification === "withdrawalActiveLoan") {
                    transactions.push(
                        {
                            transactionKey: `${item.id}_buy`,
                            accountKey,
                            cost: Math.abs(item.amount),
                            name: `${item.borrowerName} - (${item.loanId})`,
                            type: "BUY",
                            date: item.transactionDate,
                            equityPrice: 1,
                            e24Key: "",
                            equityShare: 1,
                            equityType: "Loan",
                            fee: 0
                        }
                    )
                }

                return transactions
            })
            res.send(convertedTransactions.flat())
        })
    });
})

module.exports = router;
// api/update-terminal-price.js

// Using global memory store
global.terminalDb = global.terminalDb || {};

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 1. POS Terminal Updates the active balance state
    if (req.method === 'POST') {
        const { merchant, amount, provider } = req.body;
        if (!merchant) return res.status(400).json({ error: 'Missing Merchant parameters' });

        global.terminalDb[merchant] = {
            amount: parseFloat(amount) || 0,
            provider: provider || 'evc',
            time: new Date().toISOString()
        };
        return res.status(200).json({ success: true });
    }

    // 2. Customer Scans Fixed QR -> Auto-dials USSD
    if (req.method === 'GET') {
        const { merchant } = req.query;
        if (!merchant) return res.status(400).send('Invalid Terminal Configuration');

        const liveSession = global.terminalDb[merchant];
        if (!liveSession || liveSession.amount <= 0) {
            return res.status(200).send(`
                <body style="font-family:sans-serif; text-align:center; padding:50px; background:#F8FAFC;">
                    <div style="background:white; max-width:300px; margin:0 auto; padding:30px; border-radius:20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                        <h2 style="color:#EF4444; margin-bottom:10px;">No Active Order</h2>
                        <p style="color:#64748B; font-size:14px;">Please ask the cashier to complete your order totals first.</p>
                    </div>
                </body>
            `);
        }

        let dialString = `tel:*789*${merchant}*${liveSession.amount}#`;
        if (liveSession.provider === 'edahab') {
            dialString = `tel:*113*146136*${liveSession.amount}#`;
        } else if (liveSession.provider === 'jeeb') {
            dialString = `tel:*818*${merchant}*${liveSession.amount}#`;
        } else if (liveSession.provider === 'premier') {
            dialString = `tel:*355*${merchant}*${liveSession.amount}#`;
        }

        // Wipe session
        global.terminalDb[merchant] = { amount: 0, provider: 'evc' };

        return res.redirect(dialString);
    }
    return res.status(405).end();
};


        return res.redirect(dialString);

    }

    return res.status(405).end();

}

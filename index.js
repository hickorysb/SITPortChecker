const express = require('express');
const fetch = require('fetch');
const https = require('https');
const fs = require('fs');
const zlib = require('zlib');
const { Telnet } = require('telnet-client');
const config = JSON.parse(fs.readFileSync('config.json'));
const credentials = {key: fs.readFileSync(config.keyPath), cert: fs.readFileSync(config.certPath)};
const app = express();
const port = 8443;
const httpsServer = https.createServer(credentials, app)

app.use(express.json());

app.get('/ip', (req, res) => {
    res.send(req.headers['x-forwarded-for'] || req.ip)
})

app.post('/checkports', async (req, res) => {
    var ip = req.headers['x-forwarded-for'] || req.ip
    const connection = new Telnet()
    fetch.fetchUrl('http://' + ip.toString() + ":" + (req.body.akiPort || 6969) + "/launcher/ping", {
        disableDecoding: true,
        outputEncoding: false
    }, async function(error, meta, body)
    {
        if (error == null) {
            let relayWebSocketSuccess = false;
            let natWebSocketSuccess = false;
            let akiSuccess = false;
            let akiPort = req.body.akiPort || "6969";
            let natPort = req.body.natPort || "6971";
            let relayPort = req.body.relayPort || "6970"
            let params = {
                host: ip,
                port: req.body.relayPort || 6970,
                negotiationMandatory: false,
                timeout: 500
            };

            try {
                await connection.connect(params);
                relayWebSocketSuccess = true;
                await connection.end();
            }
            catch (e) {
                console.log(e)
            }

            params.port = req.body.natPort || 6971;

            try {
                await connection.connect(params);
                natWebSocketSuccess = true;
                await connection.end();
            }
            catch {}

            if(zlib.inflateSync(body).toString() == "\"pong!\"") {
                akiSuccess = true;
            }

            res.send(JSON.stringify({akiSuccess: akiSuccess, natSuccess: natWebSocketSuccess, relaySuccess: relayWebSocketSuccess, portsUsed: {
                akiPort: akiPort,
                relayPort: relayPort,
                natPort: natPort
            }, ipAddress: ip}));
        } else {
            res.send(error)
        }
    });
});

httpsServer.listen(port, "127.0.0.1");
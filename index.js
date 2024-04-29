const express = require('express');
const https = require('https');
const fs = require('fs')
const config = JSON.parse(fs.readFileSync('config.json'))
const credentials = {key: fs.readFileSync(), cert: fs.readFileSync()}
const app = express()
const port = 8443

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port)
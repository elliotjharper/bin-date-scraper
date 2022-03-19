import express from 'express';
import { readFileSync } from 'fs';
import * as https from 'https';
//const express: core.Express = require('express');

export function startServer() {
    const app = express();
    const port = 443;

    app.post('/alexa/next-bin-date', (req, res) => {
        console.log('request hit');
    });

    https
        .createServer(
            {
                key: readFileSync('./certs/privkey.pem'),
                cert: readFileSync('./certs/fullchain.pem'),
            },
            app
        )
        .listen(port);

    console.log(`App listening on port: ${port}`);
}

startServer();

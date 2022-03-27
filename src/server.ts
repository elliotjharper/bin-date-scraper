import bodyParser from 'body-parser';
import express from 'express';
import { readFileSync } from 'fs';
import * as https from 'https';
import { binSkill } from './alexa-bin-skill';
import { verifyAlexaRequest } from './verify-alexa-request';
//const express: core.Express = require('express');

export function startServer() {
    const app = express();
    const port = 443;

    app.use(bodyParser.json());

    app.post('/alexa/next-bin-date', async (req, res) => {
        console.log('alexa request received');

        try {
            await verifyAlexaRequest(JSON.stringify(req.body), req.headers);
        } catch (err) {
            console.log('alexa request verify errored');
            console.dir(err);
            return res.status(400).send();
        }

        try {
            const alexaResponse = await binSkill.invoke(req.body);
            res.status(200).send(alexaResponse);
        } catch (err) {
            console.log('alexa error whilst generating response');
            console.dir(err);
            return res.status(500).send();
        }
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

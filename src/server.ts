import bodyParser from 'body-parser';
import express from 'express';
import { promises as fsPromises } from 'fs';
import * as https from 'https';
import { binSkill } from './alexa-bin-skill';
import { verifyAlexaRequest } from './verify-alexa-request';
//const express: core.Express = require('express');

export async function startServer() {
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

    const privateKey = await fsPromises.readFile('./certs/privkey.pem', 'utf8');
    const fullChainKey = await fsPromises.readFile('./certs/fullchain.pem', 'utf8');

    https
        .createServer(
            {
                key: privateKey,
                cert: fullChainKey,
            },
            app
        )
        .listen(port);

    console.log(`App listening on port: ${port}`);
}

startServer();

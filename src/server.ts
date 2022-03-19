import { HandlerInput, RequestHandler, SkillBuilders } from 'ask-sdk-core';
import { SkillRequestSignatureVerifier, TimestampVerifier } from 'ask-sdk-express-adapter';
import { Response } from 'ask-sdk-model';
import bodyParser from 'body-parser';
import { format } from 'date-fns';
import express from 'express';
import { readFileSync } from 'fs';
import { IncomingHttpHeaders } from 'http';
import * as https from 'https';
import { getCachedBinData } from './get-next-bin-date';
//const express: core.Express = require('express');

const demoRequestHandler: RequestHandler = {
    canHandle(handlerInput: HandlerInput): boolean {
        return true;
    },
    handle(handlerInput: HandlerInput): Response {
        return handlerInput.responseBuilder.speak('Test').getResponse();
    },
};

const binDateRequestHandler: RequestHandler = {
    canHandle(handlerInput: HandlerInput): boolean {
        return true;
    },
    async handle(handlerInput: HandlerInput): Promise<Response> {
        const binData = await getCachedBinData();

        const formattedDate = format(binData.wasteDate, `eeee 'the' do 'of' LLLL`);
        // const formattedDate = format(binData.wasteDate, 'eeee');

        return handlerInput.responseBuilder
            .speak(`${binData.wasteType} on ${formattedDate}`)
            .getResponse();
    },
};

// see docs: https://developer.amazon.com/en-US/docs/alexa/alexa-skills-kit-sdk-for-nodejs/host-web-service.html
const skillBuilder = SkillBuilders.custom();
skillBuilder.addRequestHandlers(binDateRequestHandler);
const skill = skillBuilder.create();

async function verifyAlexaRequest(bodyText: string, headers: IncomingHttpHeaders): Promise<void> {
    await new SkillRequestSignatureVerifier().verify(bodyText, headers);
    await new TimestampVerifier().verify(bodyText);
}

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
            const alexaResponse = await skill.invoke(req.body);
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

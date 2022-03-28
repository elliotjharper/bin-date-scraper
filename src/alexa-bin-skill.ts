import {
    DefaultApiClient,
    getIntentName,
    getRequestType,
    HandlerInput,
    RequestHandler,
    SkillBuilders,
} from 'ask-sdk-core';
import { CustomSkill } from 'ask-sdk-core/dist/skill/CustomSkill';
import { Response, services } from 'ask-sdk-model';
import { format, formatDistanceToNow } from 'date-fns';
import { getCachedBinData, isCacheReady } from './get-next-bin-date';

const sessionEndedRequestType = 'SessionEndedRequest';

const demoRequestHandler: RequestHandler = {
    canHandle(handlerInput: HandlerInput): boolean {
        return true;
    },
    handle(handlerInput: HandlerInput): Response {
        return handlerInput.responseBuilder.speak('Test').getResponse();
    },
};

const sessionEndedHandler: RequestHandler = {
    canHandle(handlerInput: HandlerInput): boolean {
        const requestType = getRequestType(handlerInput.requestEnvelope);

        return requestType === sessionEndedRequestType;
    },
    handle(handlerInput: HandlerInput): Response {
        return handlerInput.responseBuilder.speak('Bin Calendar Session Ended').getResponse();
    },
};

function sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
}

async function speakInterimMessage(handlerInput: HandlerInput, message: string) {
    const requestId = handlerInput.requestEnvelope.request.requestId;

    const progressiveResponseDirective: services.directive.SendDirectiveRequest = {
        header: {
            requestId,
        },
        directive: {
            type: 'VoicePlayer.Speak',
            speech: message,
        },
    };

    const serviceClient = handlerInput.serviceClientFactory!.getDirectiveServiceClient();
    await serviceClient.enqueue(progressiveResponseDirective);
}

const binDateRequestHandler: RequestHandler = {
    canHandle(handlerInput: HandlerInput): boolean {
        console.log(`Alexa request received.`);

        const requestType = getRequestType(handlerInput.requestEnvelope);
        console.log(`Alexa request type: ${requestType}.`);

        if (requestType === sessionEndedRequestType) {
            return false;
        }

        try {
            const requestIntent = getIntentName(handlerInput.requestEnvelope);
            console.log(`Alexa intent: ${requestIntent}.`);
        } catch (err) {
            //
        }

        return true;
    },
    async handle(handlerInput: HandlerInput): Promise<Response> {
        const wasCacheReady = isCacheReady();
        const binDataPromise = getCachedBinData();

        if (!wasCacheReady) {
            await speakInterimMessage(handlerInput, 'Bin data is not ready yet. Please wait.');

            await sleep(6000);

            const promptMessage = 'Bin data ready. Would you like me to read it now?';
            return handlerInput.responseBuilder
                .speak(promptMessage)
                .reprompt(promptMessage)
                .getResponse();
        } else {
            if (handlerInput.requestEnvelope.request.type !== 'LaunchRequest') {
                // user was told data is ready and prompted if we should read it
                // just in case we are still waiting for a moment acknowledge that their verbal
                // response was accepted
                await speakInterimMessage(handlerInput, 'Okay, reading bin data now.');
            }

            const binData = await binDataPromise;

            const formattedDate = format(binData.wasteDate, `eeee 'the' do 'of' LLLL`);
            // const formattedDate = format(binData.wasteDate, 'eeee');

            const daysUntilCollection = formatDistanceToNow(binData.wasteDate);

            return handlerInput.responseBuilder
                .speak(
                    `Next bin collection is, ${binData.wasteType}, in ${daysUntilCollection}, on ${formattedDate}`
                )
                .getResponse();
        }
    },
};

// see docs: https://developer.amazon.com/en-US/docs/alexa/alexa-skills-kit-sdk-for-nodejs/host-web-service.html
export const binSkill: CustomSkill = SkillBuilders.custom()
    .addRequestHandlers(binDateRequestHandler, sessionEndedHandler)
    .withApiClient(new DefaultApiClient())
    .create();

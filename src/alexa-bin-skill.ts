import { HandlerInput, RequestHandler, SkillBuilders } from 'ask-sdk-core';
import { CustomSkill } from 'ask-sdk-core/dist/skill/CustomSkill';
import { Response } from 'ask-sdk-model';
import { format } from 'date-fns';
import { getCachedBinData } from './get-next-bin-date';

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
        const requestEnvelope = handlerInput.requestEnvelope;

        /*
        const progressiveResponseDirective = {
        };        
        handlerInput.serviceClientFactory?.getDirectiveServiceClient().enqueue(progressiveResponseDirective, requestEnvelope)
        */

        const binData = await getCachedBinData();

        const formattedDate = format(binData.wasteDate, `eeee 'the' do 'of' LLLL`);
        // const formattedDate = format(binData.wasteDate, 'eeee');

        return handlerInput.responseBuilder
            .speak(`${binData.wasteType} on ${formattedDate}`)
            .getResponse();
    },
};

// see docs: https://developer.amazon.com/en-US/docs/alexa/alexa-skills-kit-sdk-for-nodejs/host-web-service.html
export const binSkill: CustomSkill = SkillBuilders.custom()
    .addRequestHandlers(binDateRequestHandler)
    .create();

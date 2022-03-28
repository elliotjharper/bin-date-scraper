import { DefaultApiClient, HandlerInput, RequestHandler, SkillBuilders } from 'ask-sdk-core';
import { CustomSkill } from 'ask-sdk-core/dist/skill/CustomSkill';
import { Response, services } from 'ask-sdk-model';
import { format } from 'date-fns';
import { getCachedBinData, isCacheReady } from './get-next-bin-date';

const demoRequestHandler: RequestHandler = {
    canHandle(handlerInput: HandlerInput): boolean {
        return true;
    },
    handle(handlerInput: HandlerInput): Response {
        return handlerInput.responseBuilder.speak('Test').getResponse();
    },
};

function sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
}

const binDateRequestHandler: RequestHandler = {
    canHandle(handlerInput: HandlerInput): boolean {
        return true;
    },
    async handle(handlerInput: HandlerInput): Promise<Response> {
        const binDataPromise = getCachedBinData();

        if (!isCacheReady()) {
            const requestId = handlerInput.requestEnvelope.request.requestId;

            const progressiveResponseDirective: services.directive.SendDirectiveRequest = {
                header: {
                    requestId,
                },
                directive: {
                    type: 'VoicePlayer.Speak',
                    speech: 'Bin data is not ready, this may timeout.',
                },
            };

            const serviceClient = handlerInput.serviceClientFactory!.getDirectiveServiceClient();
            await serviceClient.enqueue(progressiveResponseDirective);
        }

        const binData = await binDataPromise;

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
    .withApiClient(new DefaultApiClient())
    .create();

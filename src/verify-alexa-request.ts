import { SkillRequestSignatureVerifier, TimestampVerifier } from 'ask-sdk-express-adapter';
import { IncomingHttpHeaders } from 'http';

export async function verifyAlexaRequest(
    bodyText: string,
    headers: IncomingHttpHeaders
): Promise<void> {
    await new SkillRequestSignatureVerifier().verify(bodyText, headers);
    await new TimestampVerifier().verify(bodyText);
}

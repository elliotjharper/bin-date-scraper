import { format } from 'date-fns';
import { Page, PuppeteerNode } from 'puppeteer';
import { houseNumber, postCode } from './inputs';

const puppeteer: PuppeteerNode = require('puppeteer');

const startPageUrl =
    'https://www.testvalley.gov.uk/wasteandrecycling/when-are-my-bins-collected/look-up-my-bin-collection-days';

function logCurrentPageUrl(page: Page): void {
    //console.log(`Current URL: ${page.url()}`);
}

async function testItOut() {
    const browser = await puppeteer.launch({
        // headless: false,
        // defaultViewport: null,
    });

    console.log('Loading start page...');
    const page = await browser.newPage();
    await page.goto(startPageUrl);
    console.log('Loading start page...DONE');
    logCurrentPageUrl(page);

    console.log('Enter post code into input...');
    await page.waitForSelector('input#P153_POST_CODE', { visible: true });
    await page.type('input#P153_POST_CODE', postCode);
    console.log('Enter post code into input...DONE');

    console.log('Submit post code...');
    await page.waitForSelector('button[title="Search"]');
    await page.click('button[title="Search"]');
    console.log('Submit post code...DONE');

    await page.waitForNavigation();

    console.log('Select house number...');
    const [targetOption] = await page.$x(
        `//*[@id="P153_UPRN"]/option[contains(text(), "${houseNumber}")]`
    );
    await targetOption.evaluate((targetOptionActual) => {
        (targetOptionActual as HTMLOptionElement).selected = true;
    });
    console.log('Select house number...DONE');

    console.log('Submit house number...');
    const [goButton] = await page.$x(
        '//span[contains(@class, "t-Button-label")][contains(text(), "Go")]/..'
    );
    await goButton.click();
    console.log('Submit house number...DONE');

    await page.waitForNetworkIdle();

    // get the two tables: ul#CollectionDay_report li
    const wasteListItems = await page.$$('ul#CollectionDay_report li');
    let wasteData: { wasteDate: Date; wasteType: string }[] = [];
    for (let wasteListItem of wasteListItems) {
        const [, usefulCellHandle] = await wasteListItem.$$('td');

        // get the waste type
        const wasteTypeSpan = await usefulCellHandle.$('span');
        const wasteType = await wasteTypeSpan!.evaluate(
            (wasteTypeSpanElement) => wasteTypeSpanElement.innerHTML
        );

        // get the date
        const [dateElement] = await wasteListItem.$x('.//p[contains(@style, "padding-left:55px")]');
        const wasteDateText = await dateElement.evaluate(
            (actualDateElement) => actualDateElement.innerHTML
        );
        const wasteDate = new Date(wasteDateText);

        wasteData.push({
            wasteType,
            wasteDate,
        });
    }

    wasteData.sort((a, b) => (a.wasteDate > b.wasteDate ? 1 : -1));
    //console.log(JSON.stringify(wasteData));

    //await page.screenshot({ path: 'example.png' });

    console.log(
        `Next collection is: [${wasteData[0].wasteType}] on [${format(
            wasteData[0].wasteDate,
            'iii do MMM'
        )}]`
    );

    await browser.close();
}

(async () => {
    await testItOut();
})();

import puppeteer from 'puppeteer';
import {handelStepFive, handleStepFour, handleStepOneCompany, handleStepThree, handleStepTwo} from '@src/puppeteer/steps';

export async function mainPuppeteer() {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--start-maximized',
    ],
    defaultViewport: null,
  });
  const page = await browser.newPage();

  await page.goto('https://login-e-uslugi.mvr.bg/Account/Login', {});

  page.setDefaultNavigationTimeout(0);

  const targetEls = await page.$$('body > div.layout-wrapper > main > div.main-wrapper.section-wrapper.section-wrapper--margins.fixed-content-width > div.page-wrapper > div > div > div:nth-child(3) > section:nth-child(1) > a > div > div > div > h3');
  for (const target of targetEls) {
    const iHtml = await page.evaluate(el => el.innerHTML, target);
    if (iHtml.trim() === 'Вход с КЕП') {
      await target.click();

      await page.waitForNavigation({waitUntil: 'networkidle0'});

      await page.goto('https://e-uslugi.mvr.bg/services/applicationProcesses/371');

      break;
    }
  }

  await page.waitForSelector('#ARTICLE-CONTENT > div.alert.alert-info > button');

  await page.locator('#COOKIE_ACCEPT').click();

  await page.locator('#ARTICLE-CONTENT > div.alert.alert-info > button').click();

  await handleStepOneCompany(page);

  await handleStepThree(page);

  await handleStepFour(page);

  await handelStepFive(page);

  await handleStepTwo(page);

  await page.waitForSelector('#ARTICLE-CONTENT > div > h2');

  await page?.screenshot({
    path: 'mvr.jpeg',
  });
}
import puppeteer, {Page} from 'puppeteer';
import pathLib from 'path';
import {handleStepFour, handleStepThree, handleStepOnePerson, handleStepOneCompany, handleStepTwo, handleStepFive, kepLogin} from '@src/puppeteer/steps';
import {IEntry} from '@src/models/Entry';
import {goToLink, RepresentativeValues} from '@src/common/misc';
import ExecutorService from '@src/services/ExecutorService';
import fs from 'fs-extra';

export async function mainPuppeteer(entry: IEntry) {
  const screenshotPaths: string[] = [];

  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        '--start-maximized',
      ],
      defaultViewport: null,
    });

    const page = await browser.newPage();

    await page.goto(goToLink, {});

    page.setDefaultNavigationTimeout(0);

    await kepLogin(page);

    await page.waitForSelector('#ARTICLE-CONTENT > div.alert.alert-info > button');

    await page.locator('#COOKIE_ACCEPT').click();

    await page.locator('#ARTICLE-CONTENT > div.alert.alert-info > button').click();

    entry.representative === RepresentativeValues.PERSONAL
      ? await handleStepOnePerson(page, entry, screenshotPaths)
      : await handleStepOneCompany(page, entry, screenshotPaths);

    await handleStepTwo(page, entry.id);

    await handleStepThree(page, entry.id);

    await handleStepFour(page, entry);

    await handleStepFive(page, entry);

    await initiateScreenShot(page,`${entry.id}/mvr-step6.jpeg`);

    await ExecutorService.createExecutor({
      id: entry.id,
      screenshotPaths,
      entryId: entry.id,
      isSuccessful: true,
      errorMessage: '',
    });

    console.log('Успешно завършихте поръчка за номер: ', entry.regNumber);

  } catch (error) {
    if (error instanceof Error) {
      await ExecutorService.createExecutor({
        id: entry.id,
        screenshotPaths,
        entryId: entry.id,
        isSuccessful: false,
        errorMessage: error.message,
      });

      console.log('Неуспешно запазихте номер: ', entry.regNumber, " Моля проверете логовете на http://localhost:3000/users");
    }
  }
}

export async function initiateScreenShot(page: Page, path: string, screenshotPath?: string[]) {
  const screenshotDir = pathLib.join('./src/screenshots', path.split('/')[0]);

  try {
    await fs.access(screenshotDir);
  } catch (e) {
    await fs.mkdir(screenshotDir, {recursive: true});
    screenshotPath && screenshotPath.push(screenshotDir);
  }

  await makeScreenshot(page, path);
}

async function makeScreenshot(page: Page, path: string) {
  await page.screenshot({
    path: `./src/screenshots/${path}`,
  });
}
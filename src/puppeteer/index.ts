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

    await handleStepTwo(page, entry.id, screenshotPaths);

    await handleStepThree(page, entry.id, screenshotPaths);

    await handleStepFour(page, entry, screenshotPaths);

    await handleStepFive(page, entry, screenshotPaths);

    await initiateScreenShot(page, screenshotPaths, `${entry.id}/mvr-step6.jpeg`);

    await ExecutorService.createExecutor({
      id: entry.id,
      screenshotPaths,
      entryId: entry.id,
      isSuccessful: true,
      errorMessage: '',
    });

  } catch (error) {
    if (error instanceof Error) {
      await ExecutorService.createExecutor({
        id: entry.id,
        screenshotPaths,
        entryId: entry.id,
        isSuccessful: false,
        errorMessage: error.message,
      });
    }
  }
}

export async function initiateScreenShot(page: Page, screenshotPaths: string[], path: string) {
  const screenshotDir = pathLib.join('./src/screenshots', path.split('/')[0]);

  try {
    await fs.access(screenshotDir);
  } catch (e) {
    await fs.mkdir(screenshotDir, {recursive: true});
  }

  await makeScreenshot(page, path);
  screenshotPaths.push(path);
}

async function makeScreenshot(page: Page, path: string) {
  await page.screenshot({
    path: `./src/screenshots/${path}`,
  });
}
import puppeteer, {Browser, Page} from 'puppeteer';
import pathLib from 'path';
import {handleStepFour, handleStepThree, handleStepOnePerson, handleStepOneCompany, handleStepTwo, handleStepFive, kepLogin, handleStepSix, finalStepSeven} from '@src/puppeteer/steps';
import {IEntry} from '@src/models/Entry';
import {goToLink, RepresentativeValues} from '@src/common/misc';
import ExecutorService from '@src/services/ExecutorService';
import fs from 'fs-extra';
import {windowManager} from 'node-window-manager';
import EntryService from '@src/services/EntryService';
import { log } from 'console';

export async function mainPuppeteer(entry: IEntry) {
  const entriesList: IEntry[] = [entry];

  let hasNextChild = true;
  let currentEntry = entry;
  while (hasNextChild) {
    const childEntry = await EntryService.getChildByParentId(currentEntry.id);
    if (!childEntry) {
      hasNextChild = false;
      continue;
    }

    entriesList.push(childEntry);
    currentEntry = childEntry;
  }

  // Run top lvl entry + child entries
  let page: Page | undefined;
  let currentEntryIndex = 0;
  for (const entry1 of entriesList) {
    const isThereNextEntry = currentEntryIndex < entriesList.length - 1;
    if (page) {
      await executeEntry(entry1, isThereNextEntry, page);
      return;
    }

    const pageFromExecution = await executeEntry(entry1, isThereNextEntry);
    if (pageFromExecution) {
      page = pageFromExecution;
    }

    currentEntryIndex++;
  }
}

async function executeEntry(entry: IEntry, isThereNextEntry: boolean, page?: Page): Promise<Page> {
  const screenshotPaths: string[] = [];
  let browser: Browser | undefined;

  if (!page) {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [
        '--start-maximized',
      ],
    });

    page = await browser.newPage();
  }

  try {
    if (!page || entry.parentEntryId === '1') {
      const puppeteerPid = browser?.process()?.pid; // Get Puppeteer browser process ID

      const windows = windowManager.getWindows();
      const puppeteerWindow = windows.find((win) => win.processId === puppeteerPid);

      if (puppeteerWindow) {
        console.log('Found Puppeteer-controlled window:', puppeteerWindow);
        puppeteerWindow.bringToTop(); // Focus the Puppeteer browser window
      } else {
        console.log('Could not find Puppeteer window.');
      }

      await page.goto(goToLink, {});
      await page.mouse.click(100, 200);

      page.setDefaultNavigationTimeout(0);

      await kepLogin(page);

      await page.waitForSelector('#ARTICLE-CONTENT > div.alert.alert-info > button');

      await page.locator('#COOKIE_ACCEPT').click();

      await page.locator('#ARTICLE-CONTENT > div.alert.alert-info > button').click();
    }

    // Да проверим дали имаме нужда от този код
    // await page.waitForSelector('#ARTICLE-CONTENT > div.alert.alert-info > button');

    const start = Date.now();

    entry.representative === RepresentativeValues.PERSONAL
      ? await handleStepOnePerson(page, entry, screenshotPaths)
      : await handleStepOneCompany(page, entry, screenshotPaths);

    await handleStepTwo(page, entry.id);

    await handleStepThree(page, entry.id);

    await handleStepFour(page, entry);

    await handleStepFive(page, entry);

    await handleStepSix(page, entry, screenshotPaths);

    isThereNextEntry 
    ? await finalStepSeven(page, entry, screenshotPaths)
    : await page.waitForSelector("#ARTICLE-CONTENT > div.button-bar.button-bar--form.button-bar--responsive > div.left-side > button", {timeout: 60000});

    await initiateScreenShot(page, `${entry.id}/mvr-step6.jpeg`);

    const end = Date.now();
    const result = ((end - start) / 1000).toFixed(2);
    console.log('Времето за изпълнение отне: ', result, 'секунди');

    await ExecutorService.createExecutor({
      id: entry.id,
      screenshotPaths,
      entryId: entry.id,
      isSuccessful: true,
      errorMessage: '',
      executionTime: result,
    });

    return page;

  } catch (error) {
    if (error instanceof Error) {
      await ExecutorService.createExecutor({
        id: entry.id,
        screenshotPaths,
        entryId: entry.id,
        isSuccessful: false,
        errorMessage: error.message,
      });

      console.log('Неуспешно запазихте номер: ', entry.regNumber, ' Моля проверете логовете на http://localhost:3000/users');

      // Да добавим изчакване на потребителя сам да си завърши запазването на номера.
      //  await page.locator('#ARTICLE-CONTENT > div > div > div.right-side > button.btn.btn-primary').click()
    }
    return page;
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
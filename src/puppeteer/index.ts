import puppeteer, {Browser, Page} from 'puppeteer';
import pathLib from 'path';
import {handleStepFour, handleStepThree, handleStepOnePerson, handleStepOneCompany, handleStepTwo, handleStepFive, kepLogin, handleStepSix, finalStepSeven, handleLogoutFromSession} from '@src/puppeteer/steps';
import {IEntry} from '@src/models/Entry';
import {goToLink, RepresentativeValues} from '@src/common/misc';
import ExecutorService from '@src/services/ExecutorService';
import fs from 'fs-extra';
import {windowManager} from 'node-window-manager';
import EntryService from '@src/services/EntryService';

export async function mainPuppeteer(entry: IEntry) {
  const entriesList: IEntry[] = [entry];

  // Тази проверка ни трябва, за да не влизаме при тестово пускане на програмата.
  if (entry.firstName !== 'test') {
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
  }

  // Run top lvl entry + child entries
  let page: Page | undefined;
  let currentEntryIndex = 0;
  for (const entry1 of entriesList) {
    const isThereNextEntry = currentEntryIndex < entriesList.length - 1;
    if (page) {
      await executeEntry(entry1, isThereNextEntry, page);
      continue;
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
  let wasThereAPreviousEntry = false;

  if (!page) {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [
        '--start-maximized',
      ],
    });

    page = await browser.newPage();
    page.setDefaultTimeout(1500000);
  } else {
    // Проверяваме дали има предишен номер за екзекуцията
    // Това е нужно за да прескочим стъпката със избирането на смарт карта
    wasThereAPreviousEntry = true;
  }

  const start = Date.now();

  try {
    if (!page || entry.parentEntryId === '1') {
      const puppeteerPid = browser?.process()?.pid; // Get Puppeteer browser process ID

      const windows = windowManager.getWindows();
      const puppeteerWindow = windows.find((win) => win.processId === puppeteerPid);

      if (puppeteerWindow) {
        puppeteerWindow.bringToTop(); // Focus the Puppeteer browser window
      }

      await page.goto(goToLink, {});
      await page.mouse.click(100, 200);

      page.setDefaultNavigationTimeout(0);

      await kepLogin(page);

      await page.waitForSelector('#ARTICLE-CONTENT > div.alert.alert-info > button');

      await page.locator('#COOKIE_ACCEPT').click();

      await page.locator('#ARTICLE-CONTENT > div.alert.alert-info > button').click();
    }

    // We need to stop the program if the data is fake.
    if (entry.firstName === 'test') {
      await handleLogoutFromSession(page);
      return page;
    }

    const startFillingData = Date.now();

    entry.representative === RepresentativeValues.PERSONAL
      ? await handleStepOnePerson(page, entry, screenshotPaths)
      : await handleStepOneCompany(page, entry, screenshotPaths);

    await handleStepTwo(page, entry.id);

    await handleStepThree(page, entry.id);

    await handleStepFour(page, entry);

    const response: boolean = await handleStepFive(page, entry);

    if (!response) {
      console.log(`Неуспешно намиране на номер, който не е основен - ${entry.regNumber}. Операцията беше прекратена и се преминава към следващ номер.`);
      // Изчакване на разгловането да приключи
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Натискане на бутона Заявки услуга, който вече води към започването на процеса за следващ номер
      await page.waitForSelector('#servicename > h1');
      await page.locator('#ARTICLE-CONTENT > div:nth-child(1) > div.left-side > button').click();

      return page;
    }

    const startNumber = Date.now();

    await handleStepSix(page, wasThereAPreviousEntry);

    const endNumber = Date.now();
    const numberResult = ((endNumber - startNumber) / 1000).toFixed(2);
    console.log('Времето за запазване на номера отне: ', numberResult, 'секунди');

    isThereNextEntry
      ? await finalStepSeven(page, entry, screenshotPaths)
      : await page.waitForSelector('#ARTICLE-CONTENT > div.button-bar.button-bar--form.button-bar--responsive > div.left-side > button', {timeout: 1500000});

    const end = Date.now();
    const result = ((end - start) / 1000).toFixed(2);
    console.log('Времето за пълното изпълнение отне: ', result, 'секунди');

    const reachingData = ((startFillingData - start) / 1000).toFixed(2);
    console.log('Времето до стигане на първото първата страница за попълване на данните отне: ', reachingData, 'секунди');

    const fillingResult = ((startNumber - startFillingData) / 1000).toFixed(2);
    console.log('Времето на попълневането на данните отне: ', fillingResult, 'секунди');

    const loadingIndicatorResult = ((end - endNumber) / 1000).toFixed(2);
    console.log('Времето на зареждащия индикатор отне: ', loadingIndicatorResult, 'секунди');

    await ExecutorService.createExecutor({
      id: entry.id,
      screenshotPaths,
      entryId: entry.id,
      isSuccessful: true,
      errorMessage: '',
      executionTime: numberResult,
    });

    await initiateScreenShot(page, `${entry.id}/mvr-step6.jpeg`);

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

      console.log(
        'Неуспешно изпълнение на програмата. Програмата минава в ръчен режим за този номер: ',
        entry.regNumber,
        ' Моля проверете логовете на http://localhost:3000/users',
        'error: ', error,
      );

      // Изчакване на потребителя сам да завърши запазването на номера.
      // тук има проблем, ако долният не се получи и се чупи
      await page.waitForSelector('#ARTICLE-CONTENT > div.button-bar.button-bar--form.button-bar--responsive > div.left-side > button', {timeout: 250000});
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
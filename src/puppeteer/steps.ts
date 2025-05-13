import { Page } from 'puppeteer';
import path from 'path';
import { IEntry } from '@src/models/Entry';
import { initiateScreenShot } from '@src/puppeteer/index';
import keySender from 'node-key-sender';
import { keyboard, Key } from '@nut-tree-fork/nut-js';
import { windowManager } from 'node-window-manager';

async function sendKeysSequentially() {
  await keySender.sendKey('enter');
  await new Promise((resolve) => setTimeout(resolve, 150));

  const keys = ['1', '9', '0', '8', 'enter'];
  await keySender.sendCombination(keys);
  await new Promise((resolve) => setTimeout(resolve, 50));
}

export async function waitForWindowTitleMatch(
  expectedTitle: string,
  step: number,
  timeoutMs = 25000,
  pollIntervalMs = 100,
): Promise<boolean> {
  // eslint-disable-next-line node/no-unsupported-features/es-syntax
  const start = Date.now();
  let result = false;

  while (Date.now() - start < timeoutMs && !result) {
    const win = windowManager.getActiveWindow();
    console.log(win.getTitle(), expectedTitle);
    console.log(win.getOwner(), 'owner');

    if (win.getTitle().includes(expectedTitle) && step !== 2) {
      console.log(win.getTitle(), win.getTitle() === expectedTitle);
      result = true;
    } else if ((win.getTitle() === '' && win.path !== '' && win.processId !== 0) && step === 2) {
      result = true;
      console.log('Active window has no title.');
    }

    if (!result) {
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
  }

  return result;
}

async function finalKepPart(wasThereAPreviousEntry: boolean) {
  // Изберете удостоверение
  const result1 = await waitForWindowTitleMatch('Моля, изберете удостоверение за електронно подписване', 1);
  if (!result1) throw new Error('Неуспешно избиране на удостоверение за електронно подписване');
  await keyboard.type(Key.Down);
  await keyboard.type(Key.Down);
  await keyboard.type(Key.Enter);

  // Следните даннни ще бъдат подписани.
  const result2 = await waitForWindowTitleMatch('', 2);
  if (!result2) throw new Error('Следните даннни ще бъдат подписани.');
  await keyboard.type(Key.Enter);
  await new Promise((resolve) => setTimeout(resolve, 50));

  // Вкарване на пин и натискане на enter
  if (!wasThereAPreviousEntry) {
    const result3 = await waitForWindowTitleMatch('Token Logon', 3);
    if (!result3) throw new Error('Следните даннни ще бъдат подписани.');
    await keySender.sendCombination(['1', '9', '9', '9']);

    // Натисни Enter след записване на номер-а.
    // await keyboard.type(Key.Enter);
    // await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function waitForSearchResult(page: Page, millisecondsToWait: number) {
  // Натисни бутона Търси
  await page.locator('body > div:nth-child(7) > div > div.modal.fade.show > div > div > div.modal-body > div.search-box.search-box--report > fieldset > div.card-footer > div > div.right-side > button').click();

  const selector1 = 'body > div:nth-child(7) > div > div.modal.fade.show > div > div > div.modal-body > fieldset > legend';
  const selector2 = 'body > div:nth-child(7) > div > div.modal.fade.show > div > div > div.modal-body > div:nth-child(3)';

  // Add a small delay to ensure DOM updates
  await new Promise(resolve => setTimeout(resolve, 500));

  const foundSelector = await Promise.race([
    page.waitForSelector(selector1, { timeout: millisecondsToWait, visible: true })
      .then(() => selector1)
      .catch(() => selector2),
    page.waitForSelector(selector2, { timeout: millisecondsToWait, visible: true })
      .then(() => selector2)
      .catch(() => selector2),
  ]);

  if (foundSelector === selector1) {
    return true;
  } else if (foundSelector === selector2) {
    return false;
  } else {
    return 'break';
  }
}

export async function kepLogin(page: Page) {
  const targetEls = await page.$$('body > div.layout-wrapper > main > div.main-wrapper.section-wrapper.section-wrapper--margins.fixed-content-width > div.page-wrapper > div > div > div:nth-child(3) > section:nth-child(1) > a > div > div > div > h3');
  for (const target of targetEls) {
    const iHtml = await page.evaluate(el => el.innerHTML, target);
    if (iHtml.trim() === 'Вход с КЕП') {
      await target.click();

      setTimeout(async () => {
        await sendKeysSequentially();
      }, 500);

      await page.waitForNavigation({ waitUntil: 'networkidle0' });

      await page.goto('https://e-uslugi.mvr.bg/services/applicationProcesses/371');

      break;
    }
  }
}

export async function handleStepOnePerson(page: Page, entry: IEntry, screenshotPath: string[]) {
  // Стъпка 1.
  // Натисни бутона упълномощител
  await page.locator('#ARTICLE-CONTENT > div > fieldset:nth-child(3) > div > div > div:nth-child(2) > input').click();

  // Попълни всички данни на упълномощеното лице

  await page.locator('#applicant_recipientGroup\\.recipient\\.itemPersonBasicData\\.names\\.first').fill(entry.firstName);
  await page.locator('#applicant_recipientGroup\\.recipient\\.itemPersonBasicData\\.names\\.middle').fill(entry.middleName);
  await page.locator('#applicant_recipientGroup\\.recipient\\.itemPersonBasicData\\.names\\.last').fill(entry.lastName);
  await page.locator('#applicant_recipientGroup\\.recipient\\.itemPersonBasicData\\.identifier\\.item').fill(entry.securityNumber);
  await page.locator('#applicant_recipientGroup\\.recipient\\.itemPersonBasicData\\.identityDocument\\.identityNumber').fill(entry.documentNumber);
  await page.locator('#applicant_recipientGroup\\.recipient\\.itemPersonBasicData\\.identityDocument\\.identitityIssueDate').fill(entry.issuedOn);
  await page.locator('#applicant_recipientGroup\\.recipient\\.itemPersonBasicData\\.identityDocument\\.identityIssuer').fill(entry.issuer);

  await initiateScreenShot(page, `${entry.id}/mvr-step1.jpeg`, screenshotPath);

  // Продължи към стъпка 3
  await page.locator('#PAGE-NAV > nav > ul > li:nth-child(3) > div.nav-item-title > button').click();
}

export async function handleStepOneCompany(page: Page, entry: IEntry, screenshotPath: string[]) {
  // Стъпка 1.
  // Натисни бутона юридическо лице
  await page.locator('#ARTICLE-CONTENT > div > fieldset:nth-child(3) > div > div > div:nth-child(3) > input').click();

  // Попълни ЕИК на фирма
  await page.locator('#applicant_recipientGroup\\.recipient\\.itemEntityBasicData\\.identifier').fill(entry.bullstat);

  // Натисни бутона извличване на данни
  await page.locator('#ARTICLE-CONTENT > div > fieldset:nth-child(4) > div > div.form-group.col-auto > button').click();

  await initiateScreenShot(page, `${entry.id}/mvr-step1.jpeg`, screenshotPath);

  await page.waitForSelector('#applicant_recipientGroup\\.recipient\\.itemEntityBasicData\\.name');

  // Изчакваме да бъдат извлечени данните.
  await page.waitForFunction(
    () => {
      const input = document.querySelector('#applicant_recipientGroup\\.recipient\\.itemEntityBasicData\\.name') as HTMLInputElement;
      return input && input.value !== '';
    },
    { timeout: 10000 }, // default is 30 seconds
  );

  // Продължи към стъпка 3
  await page.locator('#PAGE-NAV > nav > ul > li:nth-child(3) > div.nav-item-title > button').click();
}

export async function handleStepTwo(page: Page, id: string) {
  // Премини от стъпка 3 към 4
  await page.waitForFunction(() => {
    const icon = document.querySelector('ul.nav-section li.nav-item:first-child i');
    return icon && icon.classList.contains('ui-icon-processed');
  });
  await page.waitForSelector('#ARTICLE-CONTENT > div > fieldset:nth-child(2) > div > div > p');

  await initiateScreenShot(page, `${id}/mvr-step2.jpeg`);
  await page.locator('#PAGE-NAV > nav > ul > li:nth-child(4) > div.nav-item-title > button').click();
  await page.locator('#PAGE-NAV > nav > ul > li:nth-child(4) > div.nav-item-title > button').click();
}

export async function handleStepThree(page: Page, id: string) {
  await page.waitForSelector('#ARTICLE-CONTENT > div > div.ui-form.ui-form--input > fieldset:nth-child(1) > legend > h3');
  await page.waitForSelector('input[type="checkbox"]');
  const checkboxes = await page.$$('input[type="checkbox"]');

  // Loop through each checkbox and click if not checked
  setTimeout(async () => {
    for (const checkbox of checkboxes) {
      const isChecked = await checkbox.evaluate(input => input.checked);
      if (!isChecked) {
        await checkbox.click();
      }
    }
  }, 500);

  // Wait until all checkboxes are checked
  await page.waitForFunction(() => {
    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
    return checkboxes.length > 0 && checkboxes.every(input => (input as HTMLInputElement).checked);
  });

  await initiateScreenShot(page, `${id}/mvr-step3.jpeg`);

  // Proceed to click the next button
  await page.locator('#PAGE-NAV > nav > ul > li:nth-child(5) > div.nav-item-title > button').click();
}

export async function handleStepFour(page: Page, entry: IEntry) {
  // Прикачване на файл за придобиване
  // Step 1: Click on the desired option by its text or data-key

  if (entry.purchaseDoc) {
    await new Promise(resolve => setTimeout(resolve, 500));

    await page.evaluate(() => {
      const input = document.querySelector('#documentTypeID') as HTMLInputElement;
      input?.focus();
      input?.click();
    });

    // Step 2: Wait for the dropdown list items to appear
    await page.waitForSelector('.auto-complete-options li');
    await page.locator('ul.auto-complete-options li[data-key="1043"]').click();

    // Път към файл фактура за придобиване
    const filePathBuyout = path.resolve(`./src/files/${entry.purchaseDoc}`);
    // Натисни върху бутон за прикачване на файлове.
    const fileInput = await page.waitForSelector('input.dz-hidden-input');
    // Прикачи файла
    fileInput?.uploadFile(filePathBuyout);

    await page.waitForSelector('.ui-icon.ui-icon-download-color.mr-1');

    await initiateScreenShot(page, `${entry.id}/mvr-step41.jpeg`);
  }

  // Изчакваме малко да се обнови DOM-а.
  await new Promise(resolve => setTimeout(resolve, 500));

  // Прикачване на файл с пълномощно
  // Step 1: Click on the desired option by its text or data-key
  if (entry.powerAttorney) {
    await page.evaluate(() => {
      const input = document.querySelector('#documentTypeID') as HTMLInputElement;
      input?.focus();
      input?.click();
    });

    // Step 2: Wait for the dropdown list items to appear
    await page.waitForSelector('.auto-complete-options li');
    await page.locator('ul.auto-complete-options li[data-key="1002"]').click();

    // Избери път към файл с пълнонмощно
    const filePathTrustDeed = path.resolve(`./src/files/${entry.powerAttorney}`);
    const fileInput2 = await page.waitForSelector('input.dz-hidden-input');
    // Прикачи файла
    fileInput2?.uploadFile(filePathTrustDeed);

    // Изчакай да се прикачи вторият файл.
    await page.waitForFunction(() => {
      const elements = document.querySelectorAll('.ui-icon.ui-icon-download-color.mr-1');
      return elements.length >= 2;
    });

    await initiateScreenShot(page, `${entry.id}/mvr-step42.jpeg`);
  }

  // Отиди на втора стъпка
  await page.locator('#PAGE-NAV > nav > ul > li:nth-child(2) > div.nav-item-title > button').click();
}

export async function handleStepFive(page: Page, entry: IEntry) {
  // Стъпка 2.
  // Избери регион за който се отнася регистрацията
  await page.waitForSelector('#circumstances_issuingPoliceDepartment\\.policeDepartmentCode');
  // Варна
  // await page.select('#circumstances_issuingPoliceDepartment\\.policeDepartmentCode', '365');
  // Шумен
  await page.select('#circumstances_issuingPoliceDepartment\\.policeDepartmentCode', '372');

  await page.select('#circumstances_aiskatVehicleTypeCode', '8403');

  await initiateScreenShot(page, `${entry.id}/mvr-step51.jpeg`);

  // Избери отваряне на модал за селектиране на регистрационен номер
  await page.locator('#ARTICLE-CONTENT > div > fieldset:nth-child(4) > div.row > div > div > div.form-group.col-auto > button').click();

  // Попълни номера, който търсиш
  await page.waitForSelector('#fourDigitsCriteria_specificRegNumber');
  await page.locator('#fourDigitsCriteria_specificRegNumber').fill(entry.regNumber);

  let result: string | boolean = false;
  const millisecondsToWait = 15000;
  let attempt = 0;

  while (result !== 'break' && result !== true) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    // Тук чакаме 2 минути и половина - 1500 * 100 = 150 000 милисекунди
    if (attempt > 100) {
      result = 'break';
      break;
    }

    result = await waitForSearchResult(page, millisecondsToWait);
    attempt++;
  }

  if (result === 'break') {
    throw new Error(`Резултатът не успя да бъде намерен в рамките на ${millisecondsToWait / 1000} секунди`);
  }

  await initiateScreenShot(page, `${entry.id}/mvr-step52.jpeg`);

  // При намерен резултат, затвори модала
  await page.locator('body > div:nth-child(7) > div > div.modal.fade.show > div > div > div.modal-footer > div > div.right-side > button').click();

  await page.waitForSelector('.modal', { hidden: true });

  await page.locator('#circumstances_agreementToReceiveERefusal').click();

  await new Promise((resolve) => setTimeout(resolve, 100));

  // Отиди към последна стъпка
  await page.locator('#ARTICLE-CONTENT > div > div > div.right-side > button.btn.btn-secondary').click();
}

export async function handleStepSix(page: Page, entry: IEntry, screenshotPath: string[], wasThereAPreviousEntry: boolean) {
  // Стъпка 6.
  // Изчвакаме да се покажи текста Заявител, за да избегнем race condition с долния бутон, защото него го има и в пета стъпка.
  await page.waitForSelector('#applicantdocumentPreviewSection > div.interactive-container__content > h2');
  // Натисни бутона за подписване
  await page.locator('#ARTICLE-CONTENT > div > div > div.right-side > button.btn.btn-primary').click();

  // Изчакване на loader-а да приключи.
  await page.waitForSelector('.loader-overlay.load', { hidden: true });

  // Натисни бутона за смарт карта
  await page.locator('#SIGN_FORM > div.card-body > div.interactive-container > div > div.row.align-items-center > div:nth-child(1) > button').click();

  await initiateScreenShot(page, `${entry.id}/mvr-step61.jpeg`, screenshotPath);

  // Финална част от кеп
  await finalKepPart(wasThereAPreviousEntry);

  await initiateScreenShot(page, `${entry.id}/mvr-step61.jpeg`, screenshotPath);
}

export async function finalStepSeven(page: Page, entry: IEntry, screenshotPath: string[]) {
  // Стъпке 7
  // Изчакване на процеса да потвърди регистрацията и при нужда преминаваме към следващия номер
  await page.locator('#ARTICLE-CONTENT > div.button-bar.button-bar--form.button-bar--responsive > div.left-side > button').click();

  await new Promise((resolve) => setTimeout(resolve, 500));
  // Натискане на бутона Заявки услуга, който вече води към започването на процеса за следващ номер
  await page.locator('#ARTICLE-CONTENT > div:nth-child(1) > div.left-side > button').click();


  await initiateScreenShot(page, `${entry.id}/mvr-step7.jpeg`, screenshotPath);
}
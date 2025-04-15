import { Page } from 'puppeteer';
import path from 'path';
import { IEntry } from '@src/models/Entry';
import { initiateScreenShot } from '@src/puppeteer/index';
import keySender from 'node-key-sender';

async function sendKeysSequentially() {
  // await keySender.sendKey('down');
  // await new Promise((resolve) => setTimeout(resolve, 50));

  await keySender.sendKey('enter');
  await new Promise((resolve) => setTimeout(resolve, 150));

  const keys = ['9', '9', '9', '9', 'enter'];
  await keySender.sendCombination(keys);
  await new Promise((resolve) => setTimeout(resolve, 50));
}

async function finalKepPart() {
  // Изберете удостоверение
  await keySender.sendKey('down');
  await keySender.sendKey('down');
  await keySender.sendKey('enter');
  await new Promise((resolve) => setTimeout(resolve, 50));

  // Следните даннни ще бъдат подписани.
  await keySender.sendKey('enter');
  await new Promise((resolve) => setTimeout(resolve, 50));

  // Вкарване на пин и натискане на enter
  const keys = ['9', '9', '9', '9'];
  await keySender.sendCombination(keys);
  await new Promise((resolve) => setTimeout(resolve, 50));
}

async function waitForSearchResult(page: Page, millisecondsToWait: number) {
  // Натисни бутона Търси
  await page.locator('body > div:nth-child(7) > div > div.modal.fade.show > div > div > div.modal-body > div.search-box.search-box--report > fieldset > div.card-footer > div > div.right-side > button').click();

  const selector1 = 'body > div:nth-child(7) > div > div.modal.fade.show > div > div > div.modal-body > fieldset > legend';
  const selector2 = 'body > div:nth-child(7) > div > div.modal.fade.show > div > div > div.modal-body > div:nth-child(3)';

  // Add a small delay to ensure DOM updates
  await new Promise(resolve => setTimeout(resolve, 100));

  const foundSelector = await Promise.race([
    page.waitForSelector(selector1, { timeout: millisecondsToWait, visible: true })
      .then(() => selector1)
      .catch(() => 'break'),
    page.waitForSelector(selector2, { timeout: millisecondsToWait, visible: true })
      .then(() => selector2)
      .catch(() => null),
  ]);

  console.log('Race winner:', foundSelector);

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
  // await page.locator('#PAGE-NAV > nav > ul > li:nth-child(4) > div.nav-item-title > button').click();
}

export async function handleStepTwo(page: Page, id: string) {
  // Премини от стъпка 3 към 4
  await page.waitForSelector('#ARTICLE-CONTENT > div > fieldset:nth-child(2) > div > div > p');

  await initiateScreenShot(page, `${id}/mvr-step2.jpeg`);
  await page.locator('#PAGE-NAV > nav > ul > li:nth-child(4) > div.nav-item-title > button').click();
  await page.locator('#PAGE-NAV > nav > ul > li:nth-child(4) > div.nav-item-title > button').click();
}

export async function handleStepThree(page: Page, id: string) {
  await page.waitForSelector('#ARTICLE-CONTENT > div > div.ui-form.ui-form--input > fieldset:nth-child(1) > legend > h3');
  await page.waitForSelector('input[type="checkbox"]');
  const checkboxes = await page.$$('input[type="checkbox"]');

  console.log('checkboxes', checkboxes)
  // Loop through each checkbox and click if not checked
  setTimeout(async () => {
    for (const checkbox of checkboxes) {
      const isChecked = await checkbox.evaluate(input => input.checked);
      console.log(isChecked)
      if (!isChecked) {
        await checkbox.click();
        console.log('vliza li')
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
  await page.select('#circumstances_issuingPoliceDepartment\\.policeDepartmentCode', '365');

  await page.select('#circumstances_aiskatVehicleTypeCode', '8403');

  await initiateScreenShot(page, `${entry.id}/mvr-step51.jpeg`);

  // Избери отваряне на модал за селектиране на регистрационен номер
  await page.locator('#ARTICLE-CONTENT > div > fieldset:nth-child(4) > div.row > div > div > div.form-group.col-auto > button').click();

  // Попълни номера, който търсиш
  await page.waitForSelector('#fourDigitsCriteria_specificRegNumber');
  await page.locator('#fourDigitsCriteria_specificRegNumber').fill(entry.regNumber);

  let result: string | boolean = false;
  const millisecondsToWait = 10000;
  let attempt = 0;

  while (result !== 'break' && result !== true) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    if (attempt > 5) {
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

  // Отиди към последна стъпка
  await page.locator('#ARTICLE-CONTENT > div > div > div.right-side > button.btn.btn-secondary').click();
}

export async function handleStepSix(page: Page, entry: IEntry, screenshotPath: string[]) {
  // Стъпка 6.
  // Натисни бутона за подписване
  await page.locator('#ARTICLE-CONTENT > div > div > div.right-side > button.btn.btn-primary').click();

  // Натисни бутона за смарт карта
  await page.locator('#SIGN_FORM > div.card-body > div.interactive-container > div > div.row.align-items-center > div:nth-child(1) > button').click();

  await initiateScreenShot(page, `${entry.id}/mvr-step61.jpeg`, screenshotPath);

  if (entry.parentEntryId === '1') {
    // Финална част от кеп
    setTimeout(async () => {
      await finalKepPart();
    }, 2000);

    await initiateScreenShot(page, `${entry.id}/mvr-step61.jpeg`, screenshotPath);
  }
}

export async function finalStepSeven(page: Page, entry: IEntry, screenshotPath: string[]) {
  // Стъпке 7
  // Изчакване на процеса да потвърди регистрацията и при нужда преминаваме към следващия номер
  await page.locator('#ARTICLE-CONTENT > div.button-bar.button-bar--form.button-bar--responsive > div.left-side > button').click();

  await initiateScreenShot(page, `${entry.id}/mvr-step7.jpeg`, screenshotPath);
}
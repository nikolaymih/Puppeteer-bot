// **** Variables **** //

Handlebars.registerHelper('multiply', function(num1, num2) {
    return num1 * num2;
});

Handlebars.registerHelper('equals', function (a, b, options) {
  return a === b ? options.fn(this) : options.inverse(this);
});

function toggleContent() {
  const personContent = document.getElementById('personContent');
  const firmContent = document.getElementById('firmContent');

  const isPersonChecked = document.getElementById('person')?.checked;
  const isFirmChecked = document.getElementById('firm')?.checked;
  if (isPersonChecked) {
    personContent.classList.remove('d-none');
    personContent.classList.add('d-block');
    firmContent.classList.add('d-none');
    addRequiredAttributesToPerson(isPersonChecked);
  } else if (isFirmChecked) {
    firmContent.classList.remove('d-none');
    firmContent.classList.add('d-block');
    personContent.classList.add('d-none');
    addRequiredAttributesToPerson();
  }
}

function addRequiredAttributesToPerson(isPersonChecked = false) {
  const firstName = document.getElementById('firstName');
  const middleName = document.getElementById('middleName');
  const lastName = document.getElementById('lastName');
  const securityNumber = document.getElementById('securityNumber');
  const documentNumber = document.getElementById('documentNumber');
  const issuedOn = document.getElementById('issuedOn');
  const issuer = document.getElementById('issuer');

  const bullstat = document.getElementById('bullstat');
  const powerAttorney = document.getElementById('powerAttorney');

  if (isPersonChecked) {
    firstName.setAttribute('required', 'required');
    middleName.setAttribute('required', 'required');
    lastName.setAttribute('required', 'required');
    securityNumber.setAttribute('required', 'required');
    documentNumber.setAttribute('required', 'required');
    issuedOn.setAttribute('required', 'required');
    issuer.setAttribute('required', 'required');

    bullstat.removeAttribute('required');
    powerAttorney.removeAttribute('required');
  } else {
    bullstat.setAttribute('required', 'required');
    powerAttorney.setAttribute('required', 'required');

    firstName.removeAttribute('required');
    middleName.removeAttribute('required');
    lastName.removeAttribute('required');
    securityNumber.removeAttribute('required');
    documentNumber.removeAttribute('required');
    issuedOn.removeAttribute('required');
    issuer.removeAttribute('required');
  }
}


// Start
displayFutureEntries();

/**
 * Call api
 */
function displayFutureEntries() {
  const selectElement = document.getElementById('connection-select');
  selectElement.innerHTML = '<option value="1">Индивидуален</option>';

  Http
    .get('/api/entries/get-future')
    .then(resp => resp.json())
    .then(resp => {
      // First template for displaying entries
      var allEntriesTemplate = document.getElementById('all-entries-template'),
        allEntriesTemplateHtml = allEntriesTemplate.innerHTML,
        template = Handlebars.compile(allEntriesTemplateHtml);
      var allEntriesAnchor = document.getElementById('all-entries-anchor');
      // Map over the nested structure
      const mappedEntries = resp.map(group =>
        group.map(entry => ({
          ...entry,
          powerAttorney: entry.powerAttorney || '-',
          parentEntryId: entry.parentEntryId === '1' ? '-' : entry.parentEntryId,
        }))
      );

      allEntriesAnchor.innerHTML = template({
        entries: mappedEntries
      });

      // Second template for select options - flatten the array for select
      var selectTemplate = document.getElementById('select-entry-template'),
        selectTemplateHtml = selectTemplate.innerHTML,
        template = Handlebars.compile(selectTemplateHtml);
      var selectElement = document.getElementById('connection-select');

      // Flatten the nested array for select options
      const flatEntries = resp.flat();
      selectElement.innerHTML += template({
        entries: flatEntries.map(entry => ({
          ...entry,
          powerAttorney: entry.powerAttorney || '-',
        })),
      });
    });
}

function showOldEntries() {
  Http
    .get('/api/executors/all')
    .then(resp => resp.json())
    .then(resp => {
      console.log(resp)
      var allExecutorsTemplate = document.getElementById('all-еxecutors-template'),
        allExecutorsTemplateHtml = allExecutorsTemplate.innerHTML,
        template = Handlebars.compile(allExecutorsTemplateHtml);
      var allExecutorsAnchor = document.getElementById('all-executors-anchor');
      allExecutorsAnchor.innerHTML = template({
        executors: resp.map(exec => ({
          ...exec,
          errorMessage: exec.errorMessage || '-',
          isSuccessful: exec.isSuccessful ? 'Приключен успешно': 'Провален',
          screenshotPaths: exec.screenshotPaths[0]
        })),
      });
    });
}

const form = document.getElementById('submit-form');
form.addEventListener('submit', handleForSubmission);
// form.addEventListener("submit", clearFormAfterSubmission);

function handleForSubmission(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  const entries = Object.fromEntries(data.entries());

  const formData = new FormData();
  formData.append('representative', entries.representative);
  formData.append('firstName', entries.firstName);
  formData.append('middleName', entries.middleName);
  formData.append('lastName', entries.lastName);
  formData.append('securityNumber', entries.securityNumber.toString()); // Convert numbers to strings
  formData.append('documentNumber', entries.documentNumber.toString());
  formData.append('issuedOn', entries.issuedOn);
  formData.append('issuer', entries.issuer);
  formData.append('parentEntryId', entries.parentEntryId);
  formData.append('bullstat', entries.bullstat.toString());
  formData.append('regNumber', entries.regNumber);
  formData.append('purchaseDoc', entries.purchaseDoc); // File
  formData.append('powerAttorney', entries.powerAttorney); // File
  formData.append('startDay', entries.startDay);

  Http
    .post('/api/entries/add', formData)
    .then(data => displayFutureEntries());
}

function clearFormAfterSubmission() {
  form.reset();
}

// Setup event listener for button click
document.addEventListener('click', event => {
  var ele = event.target;
  if (ele.matches('.delete-user-btn')) {
    deleteEntry(ele);
  }
}, false);

/**
 * Delete an entry
 */
function deleteEntry(ele) {
  var id = ele.getAttribute('data-user-id');
  Http
    .delete('/api/entries/delete/' + id)
    .then(() => displayFutureEntries());
}

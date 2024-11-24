// **** Variables **** //

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
  const lastName = document.getElementById('lastName');
  const securityNumber = document.getElementById('securityNumber');
  const documentNumber = document.getElementById('documentNumber');
  const issuedOn = document.getElementById('issuedOn');
  const issuer = document.getElementById('issuer');

  const bullstat = document.getElementById('bullstat');

  if (isPersonChecked) {
    firstName.setAttribute('required', 'required');
    lastName.setAttribute('required', 'required');
    securityNumber.setAttribute('required', 'required');
    documentNumber.setAttribute('required', 'required');
    issuedOn.setAttribute('required', 'required');
    issuer.setAttribute('required', 'required');

    bullstat.removeAttribute('required');
  } else {
    bullstat.setAttribute('required', 'required');

    firstName.removeAttribute('required');
    lastName.removeAttribute('required');
    securityNumber.removeAttribute('required');
    documentNumber.removeAttribute('required');
    issuedOn.removeAttribute('required');
    issuer.removeAttribute('required');
  }
}


// Start
displayUsers();

/**
 * Call api
 */
function displayUsers() {
  Http
    .get('/api/entries/get-future')
    .then(resp => resp.json())
    .then(resp => {
      var allEntriesTemplate = document.getElementById('all-entries-template'),
        allEntriesTemplateHtml = allEntriesTemplate.innerHTML,
        template = Handlebars.compile(allEntriesTemplateHtml);
      var allEntriesAnchor = document.getElementById('all-entries-anchor');
      // allEntriesAnchor.innerHTML = template({entries: resp});
      allEntriesAnchor.innerHTML = template({
        entries: resp.map(entry => ({
          ...entry,
          createdFormatted: entry.startDay,
        })),
      });
    });
}

const form = document.getElementById('submit-form');
form.addEventListener('submit', handleForSubmission);

function handleForSubmission(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  const entries = Object.fromEntries(data.entries());

  const formData = new FormData();
  formData.append('representative', entries.representative);
  formData.append('firstName', entries.firstName);
  formData.append('lastName', entries.lastName);
  formData.append('securityNumber', entries.securityNumber.toString()); // Convert numbers to strings
  formData.append('documentNumber', entries.documentNumber.toString());
  formData.append('issuedOn', entries.issuedOn);
  formData.append('issuer', entries.issuer);
  formData.append('bullstat', entries.bullstat.toString());
  formData.append('regNumber', entries.regNumber);
  formData.append('purchaseDoc', entries.purchaseDoc); // File
  formData.append('powerAttorney', entries.powerAttorney); // File
  formData.append('startDay', entries.startDay);

  Http
    .post('/api/entries/add', formData)
    .then(data => displayUsers());
}

// Setup event listener for button click
document.addEventListener('click', event => {
  // event.preventDefault();
  var ele = event.target;
  // if (ele.matches('#add-user-btn')) {
  //   addUser();
  // } else if (ele.matches('.edit-user-btn')) {
  //   showEditView(ele.parentNode.parentNode);
  // } else if (ele.matches('.cancel-edit-btn')) {
  //   cancelEdit(ele.parentNode.parentNode);
  // } else if (ele.matches('.submit-edit-btn')) {
  //   submitEdit(ele);
  // }
  if (ele.matches('.delete-user-btn')) {
    deleteEntry(ele);
  }
}, false);

/**
 * Add a new user.
 */
function addUser() {
  var nameInput = document.getElementById('name-input');
  var emailInput = document.getElementById('email-input');
  var data = {
    user: {
      id: -1,
      name: nameInput.value,
      email: emailInput.value,
      created: new Date(),
    },
  };
  // Call api
  Http
    .post('/api/users/add', data)
    .then(() => {
      nameInput.value = '';
      emailInput.value = '';
      displayUsers();
    });
}

/**
 * Show edit view.
 */
function showEditView(userEle) {
  var normalView = userEle.getElementsByClassName('normal-view')[0];
  var editView = userEle.getElementsByClassName('edit-view')[0];
  normalView.style.display = 'none';
  editView.style.display = 'block';
}

/**
 * Cancel edit.
 */
function cancelEdit(userEle) {
  var normalView = userEle.getElementsByClassName('normal-view')[0];
  var editView = userEle.getElementsByClassName('edit-view')[0];
  normalView.style.display = 'block';
  editView.style.display = 'none';
}

/**
 * Submit edit.
 */
function submitEdit(ele) {
  var userEle = ele.parentNode.parentNode;
  var nameInput = userEle.getElementsByClassName('name-edit-input')[0];
  var emailInput = userEle.getElementsByClassName('email-edit-input')[0];
  var id = ele.getAttribute('data-user-id');
  var created = ele.getAttribute('data-user-created');
  console.log(ele, created);
  var data = {
    user: {
      id: Number(id),
      name: nameInput.value,
      email: emailInput.value,
      created: new Date(created),
    },
  };
  Http
    .put('/api/users/update', data)
    .then(() => displayUsers());
}

/**
 * Delete a user
 */
function deleteEntry(ele) {
  var id = ele.getAttribute('data-user-id');
  Http
    .delete('/api/entries/delete/' + id)
    .then(() => displayUsers());
}

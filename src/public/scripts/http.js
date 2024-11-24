var Http = (() => {

  // Setup request for json
  var getOptions = (verb, data) => {
    var options = {
      method: verb,
      headers: {
        'Accept': 'application/json',
      },
    };

    // If data is FormData (includes files), don't set 'Content-Type'
    if (data instanceof FormData) {
      options.body = data; // Send FormData directly
    } else {
      // If data is JSON, set headers and stringify
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data);
    }

    return options;
  };

  // Set Http methods
  return {
    get: (path) => fetch(path, getOptions('GET')),
    post: (path, data) => fetch(path, getOptions('POST', data)),
    put: (path, data) => fetch(path, getOptions('PUT', data)),
    delete: (path) => fetch(path, getOptions('DELETE')),
  };
})();

import { readObjects, readObservations, readPrograms, nullOrEmpty } from './tsv_utils.js';
import { ObjectFilter, ObservationFilter, ProgramFilter } from './query.js';
import { objectTypes } from './constants.js';
import { Database } from './database.js';

let database;

function getObjectAttribute(displayName) {
  const lookupMap = {
    Id: 'id',
    Name: 'names',
    Type: 'type',
    Con: 'con',
    RA: 'raString',
    Dec: 'decString',
    Mag: 'mag',
    Size: 'size',
    Sep: 'sep',
    PA: 'pa',
    Class: 'objectClass',
    Distance: 'distance',
    Notes: 'notes',
    Observations: 'observationIds',
    Programs: 'programIds',
    'Num Obs': 'numObservations',
    'Num Programs': 'numPrograms'
  };
  return lookupMap[displayName];
}

function getObservationAttribute(displayName) {
  const lookupMap = {
    Id: 'id',
    Date: 'date',
    Loc: 'location',
    Scope: 'scope',
    Seeing: 'seeing',
    Trans: 'transparency',
    ObjectIds: 'objectIds',
    Time: 'time',
    Eyepiece: 'eyepiece',
    Mag: 'magnification',
    Phase: 'phase',
    Notes: 'notes'
  };
  return lookupMap[displayName];
}

function createObjectListingTable(objects, columns) {
  const objTable = document.createElement('table');
  const tableHeader = document.createElement('thead');
  const headerRow = document.createElement('tr');
  for (const col of columns) {
    const cell = document.createElement('th');
    const cellText = document.createTextNode(col);
    cell.appendChild(cellText);
    headerRow.appendChild(cell);
  }
  tableHeader.appendChild(headerRow);
  objTable.appendChild(tableHeader);

  const tableBody = document.createElement('tbody');

  for (const obj of objects) {
    const row = document.createElement('tr');

    for (const col of columns) {
      const cell = document.createElement('td');
      const cellText = document.createTextNode(obj[getObjectAttribute(col)]);
      cell.appendChild(cellText);
      row.appendChild(cell);
    }

    tableBody.appendChild(row);
  }
  objTable.appendChild(tableBody);

  return objTable;
}

function createObjectListingText(objects, columns) {
  const preBlock = document.createElement('pre');
  const codeBlock = document.createElement('code');
  preBlock.appendChild(codeBlock);

  let text = '';
  text = columns.join('\t');
  text += '\n';

  for (const obj of objects) {
    for (let i = 0; i < columns.length; i++) {
      text += obj[getObjectAttribute(columns[i])];
      if (i < columns.length - 1) {
        text += '\t';
      }
    }
    text += '\n';
  }
  codeBlock.innerText = text;
  return preBlock;
}

function getColumns(objectListMode) {
  if (objectListMode === 'observing') {
    return ['Name', 'Type', 'Con', 'RA', 'Dec', 'Mag', 'Size', 'Sep', 'PA', 'Notes'];
  } else if (objectListMode === 'program') {
    return ['Id', 'Name', 'Type', 'Con', 'RA', 'Dec', 'Observations'];
  } else if (objectListMode === 'object') {
    return ['Id', 'Name', 'Type', 'Con', 'RA', 'Dec', 'Mag', 'Size', 'Sep', 'PA', 'Class', 'Distance', 'Notes'];
  } else { // objectListMode === 'meta'
    return ['Name', 'Type', 'Con', 'RA', 'Dec', 'Distance', 'Num Obs', 'Num Programs', 'Observations', 'Programs'];
  }
}

function showObjectList(objects, showAsText, objectListMode) {
  const resultsArea = document.getElementById('search_objects_results');

  // clear old results
  while (resultsArea.hasChildNodes()) {
    resultsArea.removeChild(resultsArea.lastChild);
  }

  // Add new results

  // count of observations
  const resultsHeader = document.createElement('div');
  const resultCount = document.createElement('p');
  // resultCount.textContent = "Found " + object_ids.length + " matching objects in " + observation_ids.length + " observations.";
  resultCount.textContent = 'Found ' + objects.length + ' objects.';
  resultCount.className = 'summary';
  resultsHeader.appendChild(resultCount);

  resultsArea.appendChild(resultsHeader);

  const columns = getColumns(objectListMode);

  if (showAsText) {
    const text = createObjectListingText(objects, columns);
    resultsArea.appendChild(text);
  } else {
    const table = createObjectListingTable(objects, columns);
    resultsArea.appendChild(table);
  }
}

function setObjectInfo(observation, element) {
  const objectIds = observation.objectIds.split('|');
  for (const objectId of objectIds) {
    const obj = database.objects[objectId];
    const title = document.createElement('div');
    title.className = 'objname';
    title.textContent = obj.names;
    element.appendChild(title);

    // Only bother to show type, con etc. for
    // objects that have a fixed position in the sky.
    if (obj.con !== '') {
      const attrslist = document.createElement('ul');
      const attributes = ['Type', 'Con', 'RA', 'Dec'];
      for (const attr of attributes) {
        if (obj[attr] !== '') {
          const li = document.createElement('li');
          li.textContent = attr + ': ' + obj[getObjectAttribute(attr)];
          attrslist.appendChild(li);
        }
      }
      element.appendChild(attrslist);
    }
  }
}

function getObservationSortFunction(sortMethod) {
  if (sortMethod === 'name') {
    return function(x, y) {
      // first sort by name
      if (x.names !== y.names) {
        // locale compare should sort names in natural order, so that 'M 2' < 'M 10'
        return x.names.localeCompare(y.names, undefined, { numeric: true, sensitivity: 'base' });
      }
      // fall back to observation date/number
      return x.id.localeCompare(y.id);
    };
  } else if (sortMethod === 'date') {
    return function(x, y) {
      // id has date-obs#-name, so this includes date then observation number
      return x.id.localeCompare(y.id);
    };
  }
}

function getObjectSortFunction(objectListMode) {
  if (objectListMode === 'observing') {
    // sort by ra, then name
    return function(x, y) {
      if (x.ra !== y.ra) {
        return x.ra - y.ra;
      }
      return x.id.localeCompare(y.id, undefined, { numeric: true, sensitivity: 'base' });
    };
  } else if (objectListMode === 'program') {
    // sort by program name, then program number, then object id (e.g. for objects not in any program)
    return function(x, y) {
      const xProgramName = x.programData.length === 0 ? 'zzzzzzzzzz' : x.programData[0].programName;
      const yProgramName = y.programData.length === 0 ? 'zzzzzzzzzz' : y.programData[0].programName;
      const xNumber = x.programData.length === 0 ? '0' : x.programData[0].number;
      const yNumber = y.programData.length === 0 ? '0' : y.programData[0].number;
      if (xProgramName !== yProgramName) {
        return xProgramName.localeCompare(yProgramName);
      }
      if (xNumber !== yNumber) {
        return xNumber.localeCompare(yNumber, undefined, { numeric: true, sensitivity: 'base' });
      }
      return x.id.localeCompare(y.id, undefined, { numeric: true, sensitivity: 'base' });
    };
  } else { // objectListMode === 'object' || objectListMode === 'meta'
    // sort by type, then by id.  Id uses locale compare to sort in
    // natural order, so that 'M 2' < 'M 10'
    // or no sorting...
    return function(x, y) {
      const xHasLocation = nullOrEmpty(x.ra);
      const yHasLocation = nullOrEmpty(y.ra);
      const xType = x.type.toLowerCase().split('+')[0]; // get the first type, for sorting
      const yType = y.type.toLowerCase().split('+')[0];
      if (xHasLocation !== yHasLocation) {
        return xHasLocation - yHasLocation;
      }
      if (xType !== yType) {
        return xType.localeCompare(yType);
      }
      return x.id.localeCompare(y.id, undefined, { numeric: true, sensitivity: 'base' });
    };
  }
}

function toggleLargeSketchesClass(checkboxId, resultsAreaId) {
  const checkbox = document.getElementById(checkboxId);
  const resultsArea = document.getElementById(resultsAreaId);
  if (checkbox && resultsArea) {
    if (checkbox.checked) {
      resultsArea.classList.add('large-sketches');
    } else {
      resultsArea.classList.remove('large-sketches');
    }
  }
}

function showObservations(resultElementIdName, observations) {
  const resultsArea = document.getElementById(resultElementIdName);

  // Apply large sketches class if checkbox is checked.
  // This needs to be done before appending new elements
  // so the grid and sketch sizes are correct from the start.
  if (resultElementIdName === 'view_program_results') {
    toggleLargeSketchesClass('program_large_sketches', 'view_program_results');
  } else if (resultElementIdName === 'search_observations_results') {
    toggleLargeSketchesClass('observation_large_sketches', 'search_observations_results');
  }

  // clear old results
  while (resultsArea.hasChildNodes()) {
    resultsArea.removeChild(resultsArea.lastChild);
  }

  // add new results

  // count of observations
  const resultsHeader = document.createElement('div');
  const resultCount = document.createElement('p');
  // resultCount.textContent = 'Found ' + object_ids.length + ' matching objects in ' + observation_ids.length + ' observations.';
  resultCount.textContent = 'Found ' + observations.length + ' observations.';
  resultCount.className = 'summary';
  resultsHeader.appendChild(resultCount);

  // grid of observations
  const resultsGrid = document.createElement('div');
  resultsGrid.className = 'observation_result_grid';

  resultsArea.appendChild(resultsHeader);
  resultsArea.appendChild(resultsGrid);

  for (const obs of observations) {
    const fragment = document.createDocumentFragment();
    const obsDiv = document.createElement('div');
    obsDiv.className = 'observation';

    const notesDiv = document.createElement('div');
    notesDiv.className = 'notes';
    const objinfo = document.createElement('div');
    setObjectInfo(obs, objinfo);

    const notesList = document.createElement('ul');
    const attributes = ['Date', 'Loc', 'Scope', 'Seeing', 'Trans', 'Time', 'Eyepiece', 'Mag', 'Phase'];
    for (const attr of attributes) {
      if (obs[getObservationAttribute(attr)] !== '') {
        const li = document.createElement('li');
        li.textContent = attr + ': ' + obs[getObservationAttribute(attr)];
        notesList.appendChild(li);
      }
    }
    notesDiv.appendChild(objinfo);
    notesDiv.appendChild(notesList);
    if (obs.notes != null) {
      const description = document.createElement('p');
      description.textContent = obs.notes;
      notesDiv.appendChild(description);
    }

    const sketchDiv = document.createElement('div');
    sketchDiv.className = 'sketch';
    const sketch = document.createElement('img');
    sketch.src = 'data/sketches/' + obs.id + '.jpg';
    sketchDiv.appendChild(sketch);

    obsDiv.appendChild(notesDiv);
    obsDiv.appendChild(sketchDiv);
    fragment.appendChild(obsDiv);

    resultsGrid.appendChild(fragment);
  }
}

function doProgramQuery() {
  const filter = new ProgramFilter();
  filter.setProgramNameIs(document.getElementById('program_program_name').value);

  const matchingObservationIds = filter.getMatchingObservationIds(database.programs);
  const matchingObservations = matchingObservationIds.map(id => database.observations[id]);

  updateUrlFromControls('view_program');
  showObservations('view_program_results', matchingObservations);
}

function doObjectQuery() {
  const filter = new ObjectFilter();
  filter.setNameLike(document.getElementById('object_object_name').value);
  filter.setTypeIs(document.getElementById('object_object_type').value);
  filter.setConIs(document.getElementById('object_constellation').value);
  filter.setRaRange(document.getElementById('object_ra_min').value,
    document.getElementById('object_ra_max').value);
  filter.setDecRange(document.getElementById('object_dec_min').value,
    document.getElementById('object_dec_max').value);
  filter.setMagMax(document.getElementById('object_mag_max').value);
  filter.setSizeRange(document.getElementById('object_size_min').value,
    document.getElementById('object_size_max').value);
  filter.setProgramNameIs(document.getElementById('object_program_name').value);
  filter.setSeenStatus(document.getElementById('object_seen_status').value);

  const objectListMode = document.querySelector('input[name="object_list_mode"]:checked').value;

  const matchingObjectIds = filter.getMatchingObjectIds(database.objects);
  const matchingObjects = matchingObjectIds.map(id => database.objects[id]);

  const sortFunction = getObjectSortFunction(objectListMode);
  matchingObjects.sort(sortFunction);

  const showAsText = document.getElementById('object_show_as_text').checked;

  updateUrlFromControls('search_objects');
  showObjectList(matchingObjects, showAsText, objectListMode);
}

function doObservationQuery() {
  const filter = new ObservationFilter();
  filter.setHasObjectNameLike(document.getElementById('observation_object_name').value);
  filter.setHasObjectType(document.getElementById('observation_object_type').value);
  filter.setHasObjectCon(document.getElementById('observation_constellation').value);
  filter.setDateLike(document.getElementById('observation_date').value);
  filter.setLocationIs(document.getElementById('observation_location').value);
  filter.setScopeIs(document.getElementById('observation_scope').value);

  const sortMethod = document.querySelector('input[name="observation_sort"]:checked').value;

  const matchingObservationIds = filter.getMatchingObservationIds(database.observations);
  const matchingObservations = matchingObservationIds.map(id => database.observations[id]);
  const sortFunction = getObservationSortFunction(sortMethod);
  matchingObservations.sort(sortFunction);

  updateUrlFromControls('search_observations');
  showObservations('search_observations_results', matchingObservations);
}

function showQuery(searchQueryType) {
  // Get all elements with class="tabcontent" and hide them
  const tabContent = document.getElementsByClassName('tabcontent');
  for (let i = 0; i < tabContent.length; i++) {
    tabContent[i].style.display = 'none';
  }
  // Hide results for everything
  const resultsContent = document.getElementsByClassName('results');
  for (let i = 0; i < resultsContent.length; i++) {
    resultsContent[i].style.display = 'none';
  }

  // Get all elements with class="tablinks" and remove the class "active"
  const tablinks = document.getElementsByClassName('tablinks');
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(' active', '');
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  const queryTabId = searchQueryType + '_tab';
  document.getElementById(searchQueryType).style.display = 'block';
  document.getElementById(queryTabId).className += ' active';

  const resultsAreaId = searchQueryType + '_results';
  document.getElementById(resultsAreaId).style.display = 'block';

  // make sure height of query/results are correct.
  const sidebarWidth = document.getElementById('sidebar_objquery').offsetWidth;
  const headerHeight = document.getElementById('header').offsetHeight;
  const resultsArea = document.getElementById('results_objquery');
  resultsArea.style.left = sidebarWidth + 'px';
  resultsArea.style.top = headerHeight + 'px';
  const queryArea = document.getElementById('sidebar_objquery');
  queryArea.style.top = headerHeight + 'px';

  document.getElementById('error_messages').style.display = 'none';
}

function getParamForField(fieldId) {
  const value = document.getElementById(fieldId).value;
  if (!nullOrEmpty(value)) {
    return '&' + fieldId + '=' + encodeURIComponent(value);
  } else {
    return '';
  }
}

function getParamForRadioGroup(groupId) {
  const selector = 'input[name="' + groupId + '"]:checked';
  const value = document.querySelector(selector).id;
  return '&' + groupId + '=' + encodeURIComponent(value);
}

function getParamForCheckBox(checkboxId) {
  if (document.getElementById(checkboxId).checked) {
    return '&' + checkboxId + '=true';
  } else {
    return '';
  }
}

function setFieldFromParam(urlParams, fieldId) {
  const value = urlParams.get(fieldId);
  document.getElementById(fieldId).value = value;
}

function setRadioFromParam(urlParams, groupId, defaultValue) {
  const elementId = urlParams.has(groupId) ? urlParams.get(groupId) : defaultValue;
  document.getElementById(elementId).checked = true;
}

function setCheckBoxFromParam(urlParams, elementId) {
  if (urlParams.has(elementId)) {
    document.getElementById(elementId).checked = true;
  }
}

function updateUrlFromControls(searchQueryType) {
  let params = 'mode=' + searchQueryType;

  switch (searchQueryType) {
    case 'view_program':
      params += getParamForField('program_program_name');
      params += getParamForCheckBox('program_large_sketches');
      break;

    case 'search_observations':
      params += getParamForField('observation_object_name');
      params += getParamForField('observation_object_type');
      params += getParamForField('observation_constellation');
      params += getParamForField('observation_date');
      params += getParamForField('observation_location');
      params += getParamForField('observation_scope');
      params += getParamForRadioGroup('observation_sort');
      params += getParamForCheckBox('observation_large_sketches');
      break;

    case 'search_objects':
      params += getParamForField('object_object_name');
      params += getParamForField('object_object_type');
      params += getParamForField('object_constellation');
      params += getParamForField('object_ra_min');
      params += getParamForField('object_ra_max');
      params += getParamForField('object_dec_min');
      params += getParamForField('object_dec_max');
      params += getParamForField('object_mag_max');
      params += getParamForField('object_size_min');
      params += getParamForField('object_size_max');
      params += getParamForField('object_program_name');
      params += getParamForField('object_seen_status');
      params += getParamForRadioGroup('object_list_mode');
      params += getParamForCheckBox('object_show_as_text');
      break;
  }

  history.replaceState(null, '', window.location.origin + window.location.pathname + '?' + params);
}

function updateControlsFromSearchParams() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  const autoShowResults = urlParams.has('mode');
  const mode = urlParams.has('mode') ? urlParams.get('mode') : 'search_observations';

  switch (mode) {
    case 'view_program':
      setFieldFromParam(urlParams, 'program_program_name');
      setCheckBoxFromParam(urlParams, 'program_large_sketches');
      break;

    case 'search_observations':
      setFieldFromParam(urlParams, 'observation_object_name');
      setFieldFromParam(urlParams, 'observation_object_type');
      setFieldFromParam(urlParams, 'observation_constellation');
      setFieldFromParam(urlParams, 'observation_date');
      setFieldFromParam(urlParams, 'observation_location');
      setFieldFromParam(urlParams, 'observation_scope');
      setRadioFromParam(urlParams, 'observation_sort', 'observation_name_radio');
      setCheckBoxFromParam(urlParams, 'observation_large_sketches');
      break;

    case 'search_objects':
      setFieldFromParam(urlParams, 'object_object_name');
      setFieldFromParam(urlParams, 'object_object_type');
      setFieldFromParam(urlParams, 'object_constellation');
      setFieldFromParam(urlParams, 'object_ra_min');
      setFieldFromParam(urlParams, 'object_ra_max');
      setFieldFromParam(urlParams, 'object_dec_min');
      setFieldFromParam(urlParams, 'object_dec_max');
      setFieldFromParam(urlParams, 'object_mag_max');
      setFieldFromParam(urlParams, 'object_size_min');
      setFieldFromParam(urlParams, 'object_size_max');
      setFieldFromParam(urlParams, 'object_program_name');
      setFieldFromParam(urlParams, 'object_seen_status');
      setRadioFromParam(urlParams, 'object_list_mode', 'object_program_radio');
      setCheckBoxFromParam(urlParams, 'object_show_as_text');
      break;
  }

  showQuery(mode);
  if (autoShowResults) {
    switch (mode) {
      case 'view_program':
        doProgramQuery();
        break;

      case 'search_observations':
        doObservationQuery();
        break;

      case 'search_objects':
        doObjectQuery();
        break;
    }
  }
}

function populateDropdown(dropdownElement, items) {
  for (const item of items) {
    if (item !== '') {
      const option = document.createElement('option');
      option.value = item;
      option.text = item;
      dropdownElement.appendChild(option);
    }
  }
}

function setupControls() {
  const programProgramPicker = document.getElementById('program_program_name');
  const objectProgramPicker = document.getElementById('object_program_name_list');
  const programList = Array.from(Object.keys(database.programs)).sort();
  populateDropdown(programProgramPicker, programList);
  populateDropdown(objectProgramPicker, programList);

  let cons = new Set();
  for (const [_, obs] of Object.entries(database.observations)) {
    const objectIds = obs.objectIds.split('|');
    for (const objectId of objectIds) {
      const c = database.objects[objectId].con;
      if (c != null) {
        cons.add(c);
      }
    }
  }
  cons = Array.from(cons).sort();
  const observationConPicker = document.getElementById('observation_constellation_list');
  populateDropdown(observationConPicker, cons);
  const objectConPicker = document.getElementById('object_constellation_list');
  populateDropdown(objectConPicker, cons);

  let scopes = new Set();
  for (const [_, observation] of Object.entries(database.observations)) {
    if (observation.scope != null) {
      scopes.add(observation.scope);
    }
  }
  scopes = Array.from(scopes).sort();
  const scopePicker = document.getElementById('observation_scope_list');
  populateDropdown(scopePicker, scopes);

  let locations = new Set();
  for (const [_, observation] of Object.entries(database.observations)) {
    if (observation.location != null) {
      locations.add(observation.location);
    }
  }
  locations = Array.from(locations).sort();
  const locationPicker = document.getElementById('observation_location_list');
  populateDropdown(locationPicker, locations);

  const objTypeList = document.getElementById('type_list');
  for (const objType of objectTypes) {
    if (objType.shortName !== '') {
      const option = document.createElement('option');
      option.value = objType.shortName;
      option.text = objType.fullName;
      objTypeList.appendChild(option);
    }
  }

  const objectShowButton = document.getElementById('object_show');
  objectShowButton.addEventListener('click', doObjectQuery);

  const programShowButton = document.getElementById('program_show');
  programShowButton.addEventListener('click', doProgramQuery);

  const observationShowButton = document.getElementById('observation_show');
  observationShowButton.addEventListener('click', doObservationQuery);

  const viewProgramTabElement = document.getElementById('view_program_tab');
  viewProgramTabElement.addEventListener('click', () => showQuery('view_program'));

  const searchObservationsTabElement = document.getElementById('search_observations_tab');
  searchObservationsTabElement.addEventListener('click', () => showQuery('search_observations'));

  const searchObjectsTabElement = document.getElementById('search_objects_tab');
  searchObjectsTabElement.addEventListener('click', () => showQuery('search_objects'));

  updateControlsFromSearchParams();
}

function displayErrors(err) {
  const errorMsg = document.createElement('p');
  errorMsg.className = 'error';
  errorMsg.innerText = err;

  const resultsArea = document.getElementById('error_messages');
  resultsArea.appendChild(errorMsg);
}

function checkResponses(responses) {
  for (const response of responses) {
    if (!response.ok) {
      throw Error(response.url + ' ' + response.statusText);
    }
  }
  return responses;
}

function ParseData(responses) {
  const observationList = readObservations(responses[0]);
  const objectList = readObjects(responses[1]);
  const programList = readPrograms(responses[2]);

  database = new Database(objectList, observationList, programList);
}

function LoadDataAndSetupPage() {
  Promise.all([
    fetch('data/observations.tsv'),
    fetch('data/objects.tsv'),
    fetch('data/programs.tsv')
  ])
    .then(checkResponses)
    .then(result => Promise.all(result.map(v => v.text())))
    .then(responses => ParseData(responses))
    .then(setupControls)
    .catch(err => displayErrors(err));
}

window.onload = LoadDataAndSetupPage;

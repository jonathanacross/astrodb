/* jshint esversion: 6 */

import { readObjects, readObservations, readPrograms } from './tsv_utils.js'
import { ObjectFilter, ObservationFilter, ProgramFilter } from './query.js'
import { objectTypes, constellations } from './constants.js'
import { AstroObject, Observation, ProgramEntry, Database } from './database.js'

let database;

function getObjectAttribute(displayName) {
  const lookupMap = {
    Id: 'id',
    Name: 'names',
    Type: 'type',
    Con: 'con',
    RA: 'ra',
    Dec: 'dec',
    Mag: 'mag',
    Size: 'size',
    Sep: 'sep',
    PA: 'pa',
    Class: 'objectClass',
    Distance: 'distance',
    Notes: 'notes',
    ObservationIds: 'observationIds',
    ProgramIds: 'programIds'
  };
  return lookupMap[displayName]
}

function getOservationAttribute(displayName) {
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
  return lookupMap[displayName]
}

function createObjectListingTable (objectIds, columns) {
  const objTable = document.createElement('table')
  const tableHeader = document.createElement('thead')
  const headerRow = document.createElement('tr')
  for (const col of columns) {
    const cell = document.createElement('th')
    const cellText = document.createTextNode(col)
    cell.appendChild(cellText)
    headerRow.appendChild(cell)
  }
  tableHeader.appendChild(headerRow)
  objTable.appendChild(tableHeader)

  const tableBody = document.createElement('tbody')

  for (const objId of objectIds) {
    const obj = database.objects[objId]
    const row = document.createElement('tr')

    for (const col of columns) {
      const cell = document.createElement('td')
      const cellText = document.createTextNode(obj[getObjectAttribute(col)])
      cell.appendChild(cellText)
      row.appendChild(cell)
    }

    tableBody.appendChild(row)
  }
  objTable.appendChild(tableBody)

  return objTable
}

function createObjectListingText (objectIds, columns) {
  const preBlock = document.createElement('pre')
  const codeBlock = document.createElement('code')
  preBlock.appendChild(codeBlock)

  let text = ''
  // TODO: avoid trailing tab
  for (const col of columns) {
    text += col + '\t'
  }
  text += '\n'

  for (const objId of objectIds) {
    const obj = database.objects[objId]
    for (const col of columns) {
      text += obj[getObjectAttribute(col)] + '\t'
    }
    text += '\n'
  }
  codeBlock.innerText = text
  return preBlock
}

function showObjectList (objectIds, showAsText) {
  const resultsArea = document.getElementById('search_objects_results')

  // clear old results
  while (resultsArea.hasChildNodes()) {
    resultsArea.removeChild(resultsArea.lastChild)
  }

  // Add new results

  // count of observations
  const resultsHeader = document.createElement('div')
  const resultCount = document.createElement('p')
  // resultCount.textContent = "Found " + object_ids.length + " matching objects in " + observation_ids.length + " observations.";
  resultCount.textContent = 'Found ' + objectIds.length + ' objects.';
  resultCount.className = 'summary';
  resultsHeader.appendChild(resultCount)

  resultsArea.appendChild(resultsHeader)

  const columns = ['Id', 'Name', 'Type', 'Con', 'RA', 'Dec', 'Mag', 'Size', 'Sep', 'PA', 'Class', 'Distance', 'Notes']

  if (showAsText) {
    const text = createObjectListingText(objectIds, columns)
    resultsArea.appendChild(text)
  } else {
    const table = createObjectListingTable(objectIds, columns)
    resultsArea.appendChild(table)
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

function showObservations(resultElementIdName, observationIds) {
  const resultsArea = document.getElementById(resultElementIdName)

  // clear old results
  while (resultsArea.hasChildNodes()) {
    resultsArea.removeChild(resultsArea.lastChild);
  }

  // add new results

  // count of observations
  const resultsHeader = document.createElement('div');
  const resultCount = document.createElement('p');
  //resultCount.textContent = 'Found ' + object_ids.length + ' matching objects in ' + observation_ids.length + ' observations.';
  resultCount.textContent = 'Found ' + observationIds.length + ' observations.';
  resultCount.className = 'summary';
  resultsHeader.appendChild(resultCount);

  // grid of observations
  const resultsGrid = document.createElement('div');
  resultsGrid.className = 'observation_result_grid';

  resultsArea.appendChild(resultsHeader);
  resultsArea.appendChild(resultsGrid);

  for (const observationId of observationIds) {
    const obs = database.observations[observationId];
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
      if (obs[getOservationAttribute(attr)] !== '') {
        const li = document.createElement('li');
        li.textContent = attr + ': ' + obs[getOservationAttribute(attr)];
        notesList.appendChild(li);
      }
    }
    notesDiv.appendChild(objinfo);
    notesDiv.appendChild(notesList);
    if (obs.Notes != null) {
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

function doProgramQuery () {
  const filter = new ProgramFilter()
  filter.setProgramNameIs(document.getElementById('program_program_name').value)

  const newquery = 'show=program' + filter.getUrlParameters()
  history.replaceState(null, '', window.location.origin + window.location.pathname + '?' + newquery)

  const matchingObservationIds = filter.getMatchingObservationIds(database.programs)

  showObservations('view_program_results', matchingObservationIds, database.objects);
}

function doObjectQuery () {
  const listType = document.querySelector('input[name="listtype"]:checked').value

  const filter = new ObjectFilter()
  filter.setNameLike(document.getElementById('object_object_name').value)
  filter.setTypeIs(document.getElementById('object_object_type').value)
  filter.setConIs(document.getElementById('object_constellation').value)
  filter.setRaRange(document.getElementById('object_ra_min').value,
    document.getElementById('object_ra_max').value)
  filter.setProgramNameIs(document.getElementById('object_program_name').value)

  // TODO: update url/history
  // let newquery = 'show=objects' + filter.getUrlParameters()
  // newquery += '&mode=' + encodeURIComponent(listType)
  // history.replaceState(null, '', window.location.origin + window.location.pathname + '?' + newquery)

  const matchingObjectIds = filter.getMatchingObjectIds(database.objects);

  const showAsText = document.getElementById('show_as_text').checked
  showObjectList(matchingObjectIds, showAsText)
}

function doObservationQuery () {
  const listType = document.querySelector('input[name="listtype"]:checked').value

  const filter = new ObservationFilter()
  filter.setHasObjectNameLike(document.getElementById('observation_object_name').value)
  filter.setHasObjectType(document.getElementById('observation_object_type').value)
  filter.setHasObjectCon(document.getElementById('observation_constellation').value)
  filter.setDateLike(document.getElementById('observation_date').value)

  // TODO: update url/history
  // let newquery = 'show=objects' + filter.getUrlParameters()
  // newquery += '&mode=' + encodeURIComponent(listType)
  // history.replaceState(null, '', window.location.origin + window.location.pathname + '?' + newquery)

  const matchingObservationIds = filter.getMatchingObservationIds(database.observations);

  showObservations('search_observations_results', matchingObservationIds, database.objects);
}

function showQuery(search_query_type) {
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
  let query_tab_id = search_query_type + '_tab';
  document.getElementById(search_query_type).style.display = 'block';
  document.getElementById(query_tab_id).className += ' active';

  let results_area_id = search_query_type + '_results';
  document.getElementById(results_area_id).style.display = 'block';

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

function showResults () {
  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)

  showObjectList(Object.keys(database.objects))
}

function updateControlsFromSearchParams () {
  // TODO: implmement
}

function populateDropdown(dropdownElement, items) {
  for (const item of items) {
    if (item !== '') {
      const option = document.createElement('option')
      option.value = item
      option.text = item
      dropdownElement.appendChild(option)
    }
  }
}

function setupControls () {
  const programpicker = document.getElementById('program_program_name')
  for (const [programName, _] of Object.entries(database.programs).sort()) {
    const option = document.createElement('option');
    option.text = programName;
    programpicker.add(option);
  }

  let cons = new Set()
  for (const [_, obs] of Object.entries(database.observations)) {
    const objectIds = obs.objectIds.split('|')
    for (const objectId of objectIds) {
      const c = database.objects[objectId].Con
      if (c != null) {
        cons.add(c)
      }
    }
  }
  cons = Array.from(cons).sort()
  const conpicker = document.getElementById('constellation_list')
  populateDropdown(conpicker, cons);

  let scopes = new Set()
  for (const [_, observation] of Object.entries(database.observations)) {
    if (observation.scope != null) {
      scopes.add(observation.scope);
    }
  }
  scopes = Array.from(scopes).sort()
  const scopePicker = document.getElementById('observation_scope_list')
  populateDropdown(scopePicker, scopes);

  let locations = new Set()
  for (const [_, observation] of Object.entries(database.observations)) {
    if (observation.location != null) {
      locations.add(observation.location);
    }
  }
  locations = Array.from(locations).sort()
  const locationPicker = document.getElementById('observation_location_list')
  populateDropdown(locationPicker, locations);

  const objTypeList = document.getElementById('type_list')
  for (const objType of objectTypes) {
    if (objType.shortName !== '') {
      const option = document.createElement('option')
      option.value = objType.shortName
      option.text = objType.fullName
      objTypeList.appendChild(option)
    }
  }

  const objectShowButton = document.getElementById('object_show')
  objectShowButton.addEventListener('click', doObjectQuery)

  const programShowButton = document.getElementById('program_show')
  programShowButton.addEventListener('click', doProgramQuery)

  const observationShowButton = document.getElementById('observation_show')
  observationShowButton.addEventListener('click', doObservationQuery)

  const viewProgramTabElement = document.getElementById('view_program_tab');
  viewProgramTabElement.addEventListener('click', () => showQuery('view_program'));

  const searchObservationsTabElement = document.getElementById('search_observations_tab');
  searchObservationsTabElement.addEventListener('click', () => showQuery('search_observations'));

  const searchObjectsTabElement = document.getElementById('search_objects_tab');
  searchObjectsTabElement.addEventListener('click', () => showQuery('search_objects'));

  updateControlsFromSearchParams()

  showResults()
}

function displayErrors (err) {
  const errorMsg = document.createElement('p')
  errorMsg.className = 'error'
  errorMsg.innerText = err

  const resultsArea = document.getElementById('error_messages')
  resultsArea.appendChild(errorMsg)
}

function checkResponses (responses) {
  for (const response of responses) {
    if (!response.ok) {
      throw Error(response.url + ' ' + response.statusText)
    }
  }
  return responses
}

function ParseData (responses) {
  const observationList = readObservations(responses[0]);
  const objectList = readObjects(responses[1]);
  const programList = readPrograms(responses[2]);

  database = new Database(objectList, observationList, programList)
}

function LoadDataAndSetupPage () {
  Promise.all([
    fetch('data/observations.tsv'),
    fetch('data/objects.tsv'),
    fetch('data/programs.tsv')
  ])
    .then(checkResponses)
    .then(result => Promise.all(result.map(v => v.text())))
    .then(responses => ParseData(responses))
    .then(setupControls)
    .catch(err => displayErrors(err))
}

window.onload = LoadDataAndSetupPage

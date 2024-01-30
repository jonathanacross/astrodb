/* jshint esversion: 6 */

import { tsvToJson, keyByColumn, keyByColumnAsLists } from './tsv_utils.js'
import { ObjectFilter, ObservationFilter, ProgramFilter } from './query.js'
import { objectTypes, constellations } from './astrodata.js'

let observations
let objects
let programs

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
    const obj = objects[objId]
    const row = document.createElement('tr')

    for (const col of columns) {
      const cell = document.createElement('td')
      const cellText = document.createTextNode(obj[col])
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
    const obj = objects[objId]
    for (const col of columns) {
      text += obj[col] + '\t'
    }
    text += '\n'
  }
  codeBlock.innerText = text
  return preBlock
}

function showObjectList (objectIds, showAsText) {
  // count of observations
  const resultsHeader = document.getElementById('results_header')
  // clear old header
  while (resultsHeader.hasChildNodes()) {
    resultsHeader.removeChild(resultsHeader.lastChild)
  }
  const resultCount = document.createElement('p')
  // resultCount.textContent = "Found " + object_ids.length + " matching objects in " + observation_ids.length + " observations.";
  resultsHeader.appendChild(resultCount)

  const resultsArea = document.getElementById('results')

  // clear old results
  while (resultsArea.hasChildNodes()) {
    resultsArea.removeChild(resultsArea.lastChild)
  }

  const columns = ['#id', 'Names', 'Type', 'Con', 'RA', 'Dec', 'Mag', 'Size', 'Sep', 'PA', 'Class', 'Distance', 'Notes']

  if (showAsText) {
    const text = createObjectListingText(objectIds, columns)
    resultsArea.appendChild(text)
  } else {
    const table = createObjectListingTable(objectIds, columns)
    resultsArea.appendChild(table)
  }
}

function showObservations(observation_ids) {
  // count of observations
  let resultsHeader = document.getElementById("results_header");
  // clear old header
  while (resultsHeader.hasChildNodes()) {
      resultsHeader.removeChild(resultsHeader.lastChild);
  }
  let resultCount = document.createElement("p");
  //resultCount.textContent = "Found " + object_ids.length + " matching objects in " + observation_ids.length + " observations.";
  resultCount.textContent = "Found " + observation_ids.length + " observations.";
  resultsHeader.appendChild(resultCount);

  let resultsArea = document.getElementById("results");

  // clear old results
  while (resultsArea.hasChildNodes()) {
    resultsArea.removeChild(resultsArea.lastChild);
  }

  // add new results
  for (const observation_id of observation_ids) {
      const obs = observations[observation_id];
      const fragment = document.createDocumentFragment();
      if (obs == null) {
          let obsDiv = document.createElement("div");
          obsDiv.className = "observation";

          let errDiv = document.createElement("div");
          errDiv.className = "error";
          errDiv.textContent = "Error: can't find observation id '" + observation_id + "'";

          obsDiv.appendChild(errDiv);
          fragment.appendChild(obsDiv);
      } else {
          const obsDiv = document.createElement("div");
          obsDiv.className = "observation";

          const notesDiv = document.createElement("div");
          notesDiv.className = "notes";
          const objinfo = document.createElement("div");
          //setObjectInfo(obs, objinfo);

          const notesList = document.createElement("ul");
          const attributes = ["Date", "Location", "Scope", "Seeing", "Trans", "Time", "Eyepiece", "Mag", "Phase"];
          for (const attr of attributes) {
              if (obs[attr] !== "") {
                  const li = document.createElement("li");
                  li.textContent = attr + ": " + obs[attr];
                  notesList.appendChild(li);
              }
          }
          notesDiv.appendChild(objinfo);
          notesDiv.appendChild(notesList);
          if (obs.Notes != null) {
              let description = document.createElement("p");
              description.textContent = obs.Notes;
              notesDiv.appendChild(description);
          }

          let sketchDiv = document.createElement("div");
          sketchDiv.className = "sketch";
          let sketch = document.createElement("img");
          sketch.src = "data/sketches/" + obs["#id"] + ".jpg";
          sketchDiv.appendChild(sketch);

          obsDiv.appendChild(notesDiv);
          obsDiv.appendChild(sketchDiv);
          fragment.appendChild(obsDiv);
      }

      resultsArea.appendChild(fragment);
  }
}

function doProgramQuery () {
  const filter = new ProgramFilter()
  filter.setProgramNameIs(document.getElementById('program_program_name').value)

  let newquery = 'show=program' + filter.getUrlParameters()
  history.replaceState(null, '', window.location.origin + window.location.pathname + '?' + newquery)

  const matchingObservationIds = filter.getMatchingObservationIds(programs)

  showObservations(matchingObservationIds, objects);
}

function doObjectQuery () {
  const listType = document.querySelector('input[name="listtype"]:checked').value

  const filter = new ObjectFilter()
  filter.setNameLike(document.getElementById('object_object_name').value)
  filter.setTypeIs(document.getElementById('object_object_type').value)
  filter.setConIs(document.getElementById('object_constellation').value)
  filter.setRaRange(document.getElementById('object_ra_min').value,
    document.getElementById('object_ra_max').value)

  let newquery = 'show=objects' + filter.getUrlParameters()
  newquery += '&mode=' + encodeURIComponent(listType)

  history.replaceState(null, '', window.location.origin + window.location.pathname + '?' + newquery)

  const matchingObjectIds = filter.getMatchingObjectIds(objects)

  const showAsText = document.getElementById('show_as_text').checked
  showObjectList(matchingObjectIds, showAsText)
}

function doObservationQuery () {
  const listType = document.querySelector('input[name="listtype"]:checked').value

  const filter = new ObservationFilter()
  filter.setNameLike(document.getElementById('observation_object_name').value)
  filter.setTypeIs(document.getElementById('observation_object_type').value)
  filter.setConIs(document.getElementById('observation_constellation').value)
  filter.setDateLike(document.getElementById('observation_date').value)

  let newquery = 'show=objects' + filter.getUrlParameters()
  newquery += '&mode=' + encodeURIComponent(listType)

  history.replaceState(null, '', window.location.origin + window.location.pathname + '?' + newquery)

  const matchingObservationIds = filter.getMatchingObservationIds(observations, objects)

  showObservations(matchingObservationIds, objects);
}


function showQuery(search_query_type) {
  // Get all elements with class="tabcontent" and hide them
  const tabcontent = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  const tablinks = document.getElementsByClassName("tablinks");
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  let query_tab_id = search_query_type + '_tab';
  document.getElementById(search_query_type).style.display = "block";
  document.getElementById(query_tab_id).className += " active";

  // update the width of the results section
  const sidebarWidth = document.getElementById('sidebar_objquery').offsetWidth;
  document.getElementById('results_objquery').style.marginLeft = sidebarWidth + "px";

  // make sure height of query/results are correct.
  const headerHeight = document.getElementById('header').offsetHeight;
  document.getElementById('sidebar_objquery').style.marginTop = +headerHeight + "px";
  document.getElementById('results_objquery').style.marginTop = +headerHeight + "px";
}

function showResults () {
  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)

  showObjectList(Object.keys(objects))
}

function updateControlsFromSearchParams () {
  // TODO: implmement

  // const queryString = window.location.search
  // const urlParams = new URLSearchParams(queryString)

  // const show_query = urlParams.get('show')
  // if (show_query == 'program') {
  //   const program_name = urlParams.get('name')
  //   const programpicker = document.getElementById('program')
  //   programpicker.value = program_name
  // } else if (show_query == 'objects') {
  //   const name_query = urlParams.get('name')
  //   const type_query = urlParams.get('type')
  //   const con_query = urlParams.get('con')
  //   const date_query = urlParams.get('date')
  //   const list_type = urlParams.has('sortby') ? urlParams.get('sortby') : 'name'
  //   const namequery_element = document.getElementById('name')
  //   const type_element = document.getElementById('type')
  //   const con_element = document.getElementById('constellation')
  //   const date_element = document.getElementById('dateobs')
  //   const list_type_element = document.getElementById(list_type + '_radio')
  //   namequery_element.value = name_query
  //   type_element.value = type_query
  //   con_element.value = con_query
  //   // date_element.value = date_query
  //   list_type_element.checked = true
  // }
}

function setupControls () {
  const programpicker = document.getElementById('program_program_name')
  for (const [program_name, _] of Object.entries(programs).sort()) {
    let option = document.createElement("option");
    option.text = program_name;
    programpicker.add(option);
  }

  let cons = new Set()
  for (const [_, obs] of Object.entries(observations)) {
    const objIds = obs.ObjIds.split('|')
    for (const objId of objIds) {
      const c = objects[objId].Con
      if (c != null) {
        cons.add(c)
      }
    }
  }
  cons = Array.from(cons).sort()
  const conpicker = document.getElementById('constellation_list')
  for (const c of cons) {
    if (c !== '') {
      const option = document.createElement('option')
      option.value = c
      option.text = c
      conpicker.appendChild(option)
    }
  }

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

  const view_program_tab_element = document.getElementById('view_program_tab');
  view_program_tab_element.addEventListener('click', () => showQuery('view_program'));
  const search_observations_tab_element = document.getElementById('search_observations_tab');
  search_observations_tab_element.addEventListener('click', () => showQuery('search_observations'));
  const search_objects_tab_element = document.getElementById('search_objects_tab');
  search_objects_tab_element.addEventListener('click', () => showQuery('search_objects'));

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

// Convenience function for seeing if an object contains a key.
function containsKey(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function JoinObjects() {
  for (const [_, observation] of Object.entries(observations)) {
    const objIds = observation.ObjIds.split('|')
    for (const objId of objIds) {
      if (!containsKey(objects, objId)) {
        throw Error('Observation ' + JSON.stringify(observation) + ' has objectId ' + objId + " that doesn't appear in any object");
      }
      const currObject = objects[objId];
      if (!containsKey(currObject, 'observation_ids')) {
        currObject.observation_ids = [];
      }
      currObject.observation_ids.push(observation['#id']);
    }
  }

  for (const [programName, programEntries] of Object.entries(programs)) {
    for (const programEntry of programEntries) {
      // Check consistency of observation ids (if any)
      const obsId = programEntry.observationId;
      if (obsId != null && obsId.length > 0 && !containsKey(observations, obsId)) {
        throw Error('Program ' + JSON.stringify(programEntry) + ' has an unknown/bad observationId');
      }

      // Check consistency of object ids
      const objId = programEntry.objectId;
      if (!containsKey(objects, objId)) {
        throw Error('Program ' + JSON.stringify(programEntry) + ' has an unknown/bad objectId');
      }

      // Link program ids back to the objects
      const currObject = objects[objId];
      if (!containsKey(currObject, 'program_ids')) {
        currObject.program_ids = [];
      }
      currObject.program_ids.push(programEntry['#program']);
    }
  }
}

function ParseData (responses) {
  observations = keyByColumn(tsvToJson(responses[0]), '#id')
  objects = keyByColumn(tsvToJson(responses[1]), '#id')
  programs = keyByColumnAsLists(tsvToJson(responses[2]), '#program')
  JoinObjects();
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

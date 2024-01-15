/* jshint esversion: 6 */

import { tsvToJson, keyByColumn, keyByColumnAsLists } from './tsv_utils.js'
import { ObjectFilter } from './query.js'
import { objectTypes, constellations } from './astrodata.js'

let observations
let objects
let programs

function onlyUnique (value, index, self) {
  return self.indexOf(value) === index
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

  const resultsArea = document.getElementById('results_table')

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

function doProgramQuery () {
  const programpicker = document.getElementById('program')
  const program_name = programpicker.options[programpicker.selectedIndex].value

  let newquery = 'show=program'
  newquery += '&name=' + encodeURIComponent(program_name)

  history.replaceState(null, '', window.location.origin + window.location.pathname + '?' + newquery)
  showObjectsForSelectedProgram(program_name)
}

function ObjectNameContains (obj, name) {
  const names = obj.Names.toLowerCase().split('/')
  for (const n of names) {
    if (n.includes(name)) {
      return true
    }
  }
  return false
}

function ObsDateContains (obs, month) {
  return obs.Date.includes(month)
}

function ObjectTypeContains (obj, type) {
  const types = obj.Type.split('+')
  for (const t of types) {
    if (t === type) {
      return true
    }
  }
  return false
}

function ObjectConIs (obj, con) {
  return obj.Con === con
}

function getSortFunction (sortMethod) {
  if (sortMethod === 'name') {
    return function (x, y) {
      // first sort by name
      if (x.obj_name !== y.obj_name) {
        return x.obj_name.localeCompare(y.obj_name, undefined, { numeric: true, sensitivity: 'base' })
      }
      // fall back to observation date/number
      return x.obs_id.localeCompare(y.obs_id)
    }
  } else if (sortMethod === 'date') {
    return function (x, y) {
      // obs_id has date-obs#-name, so this includes date then observation number
      return x.obs_id.localeCompare(y.obs_id)
    }
  } else if (sortMethod === 'ra') {
    return function (x, y) {
      // Sort by RA first
      if (Math.abs(x.obj_ra - y.obj_ra) > 0.00001) {
        return x.obj_ra - y.obj_ra
      }
      // For objects with no constellation/RA, sort by name
      if (x.obj_name !== y.obj_name) {
        return x.obj_name.localeCompare(y.obj_name, undefined, { numeric: true, sensitivity: 'base' })
      }
      // And finally fall back to date/observation number (encapsulated by obs_id)
      return x.obs_id.localeCompare(y.obs_id)
    }
  } else {
    return function (x, y) {
      // First sort by constellation
      const conToRa = Object.fromEntries(constellations.map(c => [c.shortName, c.ra]))
      if (x.obj_con !== y.obj_con) {
        return conToRa[x.obj_con].localeCompare(conToRa[y.obj_con])
      }
      // Within constellation sort by RA
      if (Math.abs(x.obj_ra - y.obj_ra) > 0.00001) {
        return x.obj_ra - y.obj_ra
      }
      // For objects with no constellation/RA, sort by name
      if (x.obj_name !== y.obj_name) {
        return x.obj_name.localeCompare(y.obj_name, undefined, { numeric: true, sensitivity: 'base' })
      }
      // And finally fall back to date/observation number (encapsulated by obs_id)
      return x.obs_id.localeCompare(y.obs_id)
    }
  }
}

function raStringToFloat (raStr) {
  const regex = /\d+/g
  const found = raStr.match(regex)
  if (found !== null && found.length === 3) {
    const hrs = parseFloat(found[0])
    const mins = parseFloat(found[1])
    const secs = parseFloat(found[2])
    return hrs + (mins / 60.0) + (secs / 3600.0)
  } else {
    // This will be the case for things without a position,
    // e.g., planets and comets.
    // Give a high value to put at the end.
    return 99
  }
}

function doObjectQuery () {
  const listType = document.querySelector('input[name="listtype"]:checked').value

  const filter = new ObjectFilter()
  filter.setNameLike(document.getElementById('name').value)
  filter.setTypeIs(document.getElementById('type').value)
  filter.setConIs(document.getElementById('constellation').value)
  filter.setRaRange(document.getElementById('ra_min').value,
    document.getElementById('ra_max').value)

  let newquery = 'show=objects' + filter.getUrlParameters()
  newquery += '&mode=' + encodeURIComponent(listType)

  history.replaceState(null, '', window.location.origin + window.location.pathname + '?' + newquery)

  const matchingObjectIds = filter.getMatchingObjectIds(objects)

  const showAsText = document.getElementById('show_as_text').checked
  showObjectList(matchingObjectIds, showAsText)
}

function showObjectsForObjectQuery (nameQuery, typeQuery, conQuery, dateQuery, sortMethod) {
  const observation_ids_and_matching_obj_info = []
  let allMatchingObjectIds = []
  for (const [observationId, observation] of Object.entries(observations)) {
    const matchingObjects = []
    const objids = observation.ObjIds.split('|')
    const objs = objids.map(objId => objects[objId])
    for (const obj of objs) {
      let objectMatches = true
      if (nameQuery !== null && !ObjectNameContains(obj, nameQuery.toLowerCase())) {
        objectMatches = false
      }
      if (conQuery !== null && (
        obj.Con == null || !ObjectConIs(obj, conQuery))) {
        objectMatches = false
      }
      if (typeQuery !== null && (
        obj.Type == null || !ObjectTypeContains(obj, typeQuery))) {
        objectMatches = false
      }
      if (dateQuery !== null && !ObsDateContains(observation, dateQuery)) {
        objectMatches = false
      }
      if (objectMatches) {
        matchingObjects.push(obj)
      }
    }

    if (matchingObjects.length > 0) {
      const objName = matchingObjects[0].Names.split('/')[0]
      const objCon = matchingObjects[0].Con
      const objRa = raStringToFloat(matchingObjects[0].RA)
      const obsDate = observation.Date
      observation_ids_and_matching_obj_info.push({
        obs_id: observationId,
        obj_name: objName,
        obj_con: objCon,
        obj_ra: objRa,
        obs_date: obsDate
      })
      allMatchingObjectIds = allMatchingObjectIds.concat(
        matchingObjects.map(mo => mo['#id']))
    }
  }

  // sort observations
  const sortFun = getSortFunction(sortMethod)
  observation_ids_and_matching_obj_info.sort(sortFun)
  // and strip down to just obs ids
  observation_ids = observation_ids_and_matching_obj_info.map(x => x.obs_id)

  const deduped_matching_obj_ids = allMatchingObjectIds.filter(onlyUnique)
  showObservations(observation_ids, deduped_matching_obj_ids)
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
}

function showResults () {
  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)

  showObjectList(Object.keys(objects))

  // const show_query = urlParams.get("show");
  // if (show_query == "program") {
  //    const program_name = urlParams.get("name");
  //    showObjectsForSelectedProgram(program_name);
  // } else if (show_query == "objects") {
  //    const name_query = urlParams.get("name");
  //    const type_query = urlParams.get("type");
  //    const con_query = urlParams.get("con");
  //    const date_query = urlParams.get("date");
  //    const list_type = urlParams.has("sortby") ? urlParams.get("sortby") : "name";
  //    showObjectsForObjectQuery(name_query, type_query, con_query, date_query, list_type);
  // }
}

function updateControlsFromSearchParams () {
  const queryString = window.location.search
  const urlParams = new URLSearchParams(queryString)

  const show_query = urlParams.get('show')
  if (show_query == 'program') {
    const program_name = urlParams.get('name')
    const programpicker = document.getElementById('program')
    programpicker.value = program_name
  } else if (show_query == 'objects') {
    const name_query = urlParams.get('name')
    const type_query = urlParams.get('type')
    const con_query = urlParams.get('con')
    const date_query = urlParams.get('date')
    const list_type = urlParams.has('sortby') ? urlParams.get('sortby') : 'name'
    const namequery_element = document.getElementById('name')
    const type_element = document.getElementById('type')
    const con_element = document.getElementById('constellation')
    const date_element = document.getElementById('dateobs')
    const list_type_element = document.getElementById(list_type + '_radio')
    namequery_element.value = name_query
    type_element.value = type_query
    con_element.value = con_query
    // date_element.value = date_query
    list_type_element.checked = true
  }
}

function setupControls () {
  const programpicker = document.getElementById('program')
  // for (const [program_name, _] of Object.entries(programs).sort()) {
  //    let option = document.createElement("option");
  //    option.text = program_name;
  //    programpicker.add(option);
  // }
  // let programbutton = document.getElementById("programshow");
  // programbutton.addEventListener("click", doProgramQuery);

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

  const objbutton = document.getElementById('objshow')
  objbutton.addEventListener('click', doObjectQuery)

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

function ParseData (responses) {
  observations = keyByColumn(tsvToJson(responses[0]), '#id')
  objects = keyByColumn(tsvToJson(responses[1]), '#id')
  programs = keyByColumnAsLists(tsvToJson(responses[2]), '#program')
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

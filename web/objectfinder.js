/* jshint esversion: 6 */

import { tsvToJson, keyByColumn, keyByColumnAsLists } from './tsv_utils.js'
import { ObjectFilter, getMatchingObjectIds } from './query.js'

var observations
var objects
var programs

function onlyUnique (value, index, self) {
  return self.indexOf(value) === index
}

function createObjectListingTable (objectIds, columns) {
  const objTable = document.createElement('table')
  // let tableHeader = document.createElement("thead");
  // let headerRow = document.createElement("tr");

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

function showObjectList (objectIds) {
  // count of observations
  const resultsHeader = document.getElementById('results_header')
  // clear old header
  while (resultsHeader.hasChildNodes()) {
    resultsHeader.removeChild(resultsHeader.lastChild)
  }
  const resultCount = document.createElement('p')
  // resultCount.textContent = "Found " + object_ids.length + " matching objects in " + observation_ids.length + " observations.";
  resultsHeader.appendChild(resultCount)

  const resultsArea = document.getElementById('results_list')

  // clear old results
  while (resultsArea.hasChildNodes()) {
    resultsArea.removeChild(resultsArea.lastChild)
  }

  const columns = ['#id', 'Names', 'Type', 'Con', 'RA', 'Dec', 'Mag', 'Size', 'Sep', 'PA', 'Class', 'Distance', 'Notes']

  const table = createObjectListingTable(objectIds, columns)
  resultsArea.appendChild(table)

  invert()
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
    // RA is the average of the most eastward and most westward RA.
    // From https://en.wikipedia.org/wiki/IAU_designated_constellations_by_area
    return function (x, y) {
      // First sort by constellation
      const conToRa = {
        And: '00 48.46',
        Ant: '10 16.43',
        Aps: '16 08.65',
        Aql: '19 40.02',
        Aqr: '22 17.38',
        Ara: '17 22.49',
        Ari: '02 38.16',
        Aur: '06 04.42',
        Boo: '14 42.64',
        Cae: '04 42.27',
        Cam: '08 51.37',
        Cap: '21 02.93',
        Car: '08 41.70',
        Cas: '01 19.16',
        Cen: '13 04.27',
        Cep: '02 32.64',
        Cet: '01 40.10',
        Cha: '10 41.53',
        Cir: '14 34.54',
        CMa: '06 49.74',
        CMi: '07 39.17',
        Cnc: '08 38.96',
        Col: '05 51.76',
        Com: '12 47.27',
        CrA: '18 38.79',
        CrB: '15 50.59',
        Crt: '11 23.75',
        Cru: '12 26.99',
        Crv: '12 26.52',
        CVn: '13 06.96',
        Cyg: '20 35.28',
        Del: '20 41.61',
        Dor: '05 14.51',
        Dra: '15 08.64',
        Equ: '21 11.26',
        Eri: '03 18.02',
        For: '02 47.88',
        Gem: '07 04.24',
        Gru: '22 27.39',
        Her: '17 23.16',
        Hor: '03 16.56',
        Hya: '11 36.73',
        Hyi: '02 20.65',
        Ind: '21 58.33',
        Lac: '22 27.68',
        Leo: '10 40.03',
        Lep: '05 33.95',
        Lib: '15 11.96',
        LMi: '10 14.72',
        Lup: '15 13.21',
        Lyn: '07 59.53',
        Lyr: '18 51.17',
        Men: '05 24.90',
        Mic: '20 57.88',
        Mon: '07 03.63',
        Mus: '12 35.28',
        Nor: '15 54.18',
        Oct: '23 00.00',
        Oph: '17 23.69',
        Ori: '05 34.59',
        Pav: '19 36.71',
        Peg: '22 41.84',
        Per: '03 10.50',
        Phe: '00 55.91',
        Pic: '05 42.46',
        PsA: '22 17.07',
        Psc: '00 28.97',
        Pup: '07 15.48',
        Pyx: '08 57.16',
        Ret: '03 55.27',
        Scl: '00 26.28',
        Sco: '16 53.24',
        Sct: '18 40.39',
        Ser: '16 57.04',
        Sex: '10 16.29',
        Sge: '19 39.05',
        Sgr: '19 05.94',
        Tau: '04 42.13',
        Tel: '19 19.54',
        TrA: '16 04.95',
        Tri: '02 11.07',
        Tuc: '23 46.64',
        UMa: '11 18.76',
        UMi: '15 00.00',
        Vel: '09 34.64',
        Vir: '13 24.39',
        Vol: '07 47.73',
        Vul: '20 13.88',
        // things with no constellation put last
        '': '99 99.99'
      }
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
  const namequery_element = document.getElementById('name')
  const type_element = document.getElementById('type')
  const constellation_element = document.getElementById('constellation')
  const dateobs_element = document.getElementById('dateobs')
  const sort_method = document.querySelector('input[name="sort"]:checked').value

  let newquery = 'show=objects'
  let newname = null
  if (namequery_element.value !== '') {
    newquery += '&name=' + encodeURIComponent(namequery_element.value)
    newname = namequery_element.value
  }
  let newtype = null
  if (type_element.value !== '') {
    newquery += '&type=' + encodeURIComponent(type_element.value)
    newtype = type_element.value
  }
  let newcon = null
  if (constellation_element.value !== '') {
    newquery += '&con=' + encodeURIComponent(constellation_element.value)
    newcon = constellation_element.value
  }
  let newdate = null
  if (dateobs_element.value !== '') {
    newquery += '&date=' + encodeURIComponent(dateobs_element.value)
    newdate = dateobs_element.value
  }
  newquery += '&sortby=' + encodeURIComponent(sort_method)

  history.replaceState(null, '', window.location.origin + window.location.pathname + '?' + newquery)

  const filter = new ObjectFilter();
  filter.nameIs = '118 Tau';
  const matchingObjectIds = getMatchingObjectIds(objects, filter)


  showObjectList(matchingObjectIds)
  //showObjectList(Object.keys(matchingObjects))
  // showObjectsForObjectQuery(newname, newtype, newcon, newdate, sort_method);
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

function invert () {
  const invert = document.getElementById('invert').checked

  // Can change this to use a class name if this is too generic.
  const imgs = document.getElementsByTagName('img')
  for (let i = 0; i < imgs.length; i++) {
    if (invert) {
      imgs[i].style.filter = 'invert(1)'
    } else {
      imgs[i].style.filter = null
    }
  }
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
  //    const sort_method = urlParams.has("sortby") ? urlParams.get("sortby") : "name";
  //    showObjectsForObjectQuery(name_query, type_query, con_query, date_query, sort_method);
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
    const sort_method = urlParams.has('sortby') ? urlParams.get('sortby') : 'name'
    const namequery_element = document.getElementById('name')
    const type_element = document.getElementById('type')
    const con_element = document.getElementById('constellation')
    const date_element = document.getElementById('dateobs')
    const sort_method_element = document.getElementById(sort_method + '_radio')
    namequery_element.value = name_query
    type_element.value = type_query
    con_element.value = con_query
    date_element.value = date_query
    sort_method_element.checked = true
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
  // let conpicker = document.getElementById("constellation_list");
  // for (const c of cons) {
  //    let option = document.createElement("option");
  //    option.value = c;
  //    option.text = c;
  //    conpicker.appendChild(option);
  // }

  const objbutton = document.getElementById('objshow')
  objbutton.addEventListener('click', doObjectQuery)

  const invertcheck = document.getElementById('invert')
  invertcheck.addEventListener('click', invert)

  updateControlsFromSearchParams()

  showResults()
}

function handleErrors (responses) {
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
    .then(handleErrors)
    .then(result => Promise.all(result.map(v => v.text())))
    .then(responses => ParseData(responses))
    .then(setupControls)
}

window.onload = LoadDataAndSetupPage

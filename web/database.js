// Classes to hold astronomical-related database data
import { nullOrEmpty, getObjectSizesArcminutes } from './tsv_utils.js'

function formatBase60(value, radixNames) {
  if (nullOrEmpty(value)) {
    return ''
  }

  const signStr = value < 0 ? '-' : ''
  const totalSeconds = Math.round(Math.abs(value) * 3600)
  const seconds = totalSeconds % 60
  const totalMinutes = (totalSeconds - seconds) / 60
  const minutes = totalMinutes % 60
  const degrees = (totalMinutes - minutes) / 60

  const degreesStr = String(degrees).padStart(2, '0')
  const minutesStr = String(minutes).padStart(2, '0')
  const secondsStr = String(seconds).padStart(2, '0')

  return signStr + degreesStr + radixNames[0] + ' ' +
      minutesStr + radixNames[1] + ' ' +
      secondsStr + radixNames[2]
}

// Converts a magnitude from string to a double value.
// Note that the magnitude string may actually be a range (e.g., variable
// stars) or a list in various formats (for double/multiple stars). If
// this is the case, we just take the first value, which typically is the
// brightest/smallest.
function getMagnitudeAsNumber(magString) {
  const regex = /-?[.0-9]+/g;
  const matches = magString.match(regex);
  if (matches !== null) {
    return matches.map(m => parseFloat(m))[0];
  } else {
    return null;
  }
}


export class AstroObject {
  constructor(lineNumber, id, names, type, con, ra, dec, mag, size, sep, pa, objectClass, distance, notes) {
    this.lineNumber = lineNumber;  // used only for logging errors
    this.id = id;
    this.names = names;
    this.type = type;
    this.con = con;
    this.ra = ra;
    this.raString = formatBase60(ra, ['h', 'm', 's']);
    this.dec = dec;
    this.decString = formatBase60(dec, ['°', '\'', '"']);
    this.mag = mag;
    this.magValue = getMagnitudeAsNumber(mag);
    this.size = size;
    const [minor, major] = getObjectSizesArcminutes(size);
    this.minorSizeMinutes = minor;
    this.majorSizeMinutes = major;
    this.sep = sep;
    this.pa = pa;
    this.objectClass = objectClass;
    this.distance = distance;
    this.notes = notes;

    // populated after joining
    this.observationData = [];
    this.observationIds = '';
    this.numObservations = 0;

    this.programData = [];
    this.programIds = '';
    this.numPrograms = 0;
  }
}

export class Observation {
  constructor(lineNumber, id, date, location, scope, seeing, transparency, objectIds, time, eyepiece, magnifcation, phase, notes) {
    this.lineNumber = lineNumber;  // used only for logging errors
    this.id = id;
    this.date = date;
    this.location = location;
    this.scope = scope;
    this.seeing = seeing;
    this.transparency = transparency;
    this.objectIds = objectIds;
    this.time = time;
    this.eyepiece = eyepiece;
    this.magnification = magnifcation;
    this.phase = phase;
    this.notes = notes;

    // populated after joining
    this.objectData = [];
    this.names = '';  // names of the first object in the observation
  }
}

export class ProgramEntry {
  constructor(lineNumber, programName, number, objectId, observationId) {
    this.lineNumber = lineNumber;  // used only for logging errors
    this.programName = programName;
    this.number = number;
    this.objectId = objectId;
    this.observationId = observationId;
  }
}

export class Program {
  constructor(programName, programEntries) {
    this.programName = programName;
    this.programEntries = programEntries;
  }
}

function containsKey(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export class Database {
  constructor(objectList, observationList, programList) {
    this.objects = this.#indexObjects(objectList);
    this.observations = this.#indexObservations(observationList);
    this.programs = this.#indexPrograms(programList);
    this.#addCrossIndex();
  } 

  // Convert objectList to map of id --> AstroObject
  #indexObjects(objectList) {
    const objects = {};
    for (const [_, object] of Object.entries(objectList)) {
      if (containsKey(objects, object.id)) {
        throw Error('Duplicate object id defined on line ' + object.lineNumber + '. \n' + JSON.stringify(object));
      }
      objects[object.id] = object;
    }
    return objects;
  }
  
  // Convert observationList to map of id --> Observation
  #indexObservations(observationList) {
    const observations = {};
    for (const [_, observation] of Object.entries(observationList)) {
      if (containsKey(observations, observation.id)) {
        throw Error('Duplicate observation id defined on line ' + observation.lineNumber + '. \n' + JSON.stringify(observation));
      }
      observations[observation.id] = observation;
    }
    return observations;
  }

  // Convert programList to map of id --> [list of ProgramEntry]
  #indexPrograms(programList) {
    const programs = {};
    for (const [_, programEntry] of Object.entries(programList)) {
      if (!containsKey(programs, programEntry.programName)) {
        programs[programEntry.programName] = [];
      }
      programs[programEntry.programName].push(programEntry);
    }
    return programs;
  }

  // Updates this.observations and this.programs with cross-reference ids
  #addCrossIndex() {
    for (const [_, observation] of Object.entries(this.observations)) {
      const objectIds = observation.objectIds.split('|')
      let firstObject = true;
      for (const objectId of objectIds) {
        // Check consistency of objectIds in observations
        if (!containsKey(this.objects, objectId)) {
          throw Error('Observation ' + observation.id + ' on line ' + observation.lineNumber + ' has objectId ' + objectId + " that doesn't appear in any object");
        }

        // link observation ids back to the objects
        const currObject = this.objects[objectId];
        currObject.observationData.push(observation);

        // link objects in the observations
        observation.objectData.push(currObject);
        if (firstObject) {
          observation.names = currObject.names;
          firstObject = false;
        }
      }
    }

    for (const [_, programEntries] of Object.entries(this.programs)) {
      for (const programEntry of programEntries) {
        // Check consistency of observation ids (if any)
        const obsId = programEntry.observationId;
        if (obsId != null && obsId.length > 0 && !containsKey(this.observations, obsId)) {
          throw Error('Program ' + JSON.stringify(programEntry) + ' has an unknown observationId');
        }

        // Check consistency of object ids
        const objectId = programEntry.objectId;
        if (!containsKey(this.objects, objectId)) {
          throw Error('Program ' + JSON.stringify(programEntry) + ' has an unknown objectId');
        }

        // Link program ids back to the objects
        const currObject = this.objects[objectId];
        currObject.programData.push(programEntry);
      }
    }

    // fill in derivative data for objects
    for (const [_, object] of Object.entries(this.objects)) {
      object.observationIds = object.observationData.map(o => o.id).join()
      object.numObservations = object.observationData.length
      object.programIds = object.programData.map(p => p.programName).join()
      object.numPrograms = object.programData.length
    }
  }
}
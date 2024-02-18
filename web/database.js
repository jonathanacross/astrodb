// Classes to hold astronomical-related database data

export class AstroObject {
  constructor(lineNumber, id, names, type, con, ra, dec, mag, size, sep, pa, objectClass, distance, notes) {
    this.lineNumber = lineNumber;  // used only for logging errors
    this.id = id;
    this.names = names;
    this.type = type;
    this.con = con;
    this.ra = ra;
    this.dec = dec;
    this.mag = mag;
    this.size = size;
    this.sep = sep;
    this.pa = pa;
    this.objectClass = objectClass;
    this.distance = distance;
    this.notes = notes;
    // populated after joining
    this.observationIds = [];
    this.programIds = [];
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
      for (const objectId of objectIds) {
        // Check consistency of objectIds in observations
        if (!containsKey(this.objects, objectId)) {
          throw Error('Observation ' + JSON.stringify(observation) + ' has objectId ' + objectId + " that doesn't appear in any object");
        }

        // link observation ids back to the objects
        const currObject = this.objects[objectId];
        currObject.observationIds.push(observation.id);
      }
    }
  
    for (const [_, programEntries] of Object.entries(this.programs)) {
      for (const programEntry of programEntries) {
        // Check consistency of observation ids (if any)
        const obsId = programEntry.observationId;
        if (obsId != null && obsId.length > 0 && !containsKey(this.observations, obsId)) {
          throw Error('Program ' + JSON.stringify(programEntry) + ' has an unknown/bad observationId');
        }
  
        // Check consistency of object ids
        const objId = programEntry.objectId;
        if (!containsKey(this.objects, objId)) {
          throw Error('Program ' + JSON.stringify(programEntry) + ' has an unknown/bad objectId');
        }
  
        // Link program ids back to the objects
        const currObject = this.objects[objId];
        currObject.programIds.push(programEntry.programName);
      }
    }
  }
}
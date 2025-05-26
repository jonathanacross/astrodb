import { objectTypes, constellations } from './constants.js';
import { AstroObject, Observation, ProgramEntry } from './database.js';

export function nullOrEmpty(str) {
  return str === null || str === '';
}

export function parseBase60(base60str) {
  if (nullOrEmpty(base60str)) {
    return null;
  }

  const regex = /[-.0-9]+/g;
  const matches = base60str.match(regex);
  if (matches !== null) {
    const digitGroups = matches.map(m => parseFloat(m));

    let value = 0.0;
    let scale = 1.0;
    const sign = (digitGroups[0] < 0) ? -1.0 : 1.0;

    for (const number of digitGroups) {
      value += Math.abs(number) * scale;
      scale /= 60.0;
    }
    return value * sign;
  } else {
    throw Error("Can't parse RA/Dec value of '" + base60str);
  }
}

// Extract the units from a size string.
function parseSizeUnits(sizeString) {
  const tLower = sizeString.toLowerCase().trim();
  if (tLower.endsWith('"') || tLower.endsWith("''") || tLower.endsWith('s')) {
    return 'ARC_SECONDS';
  } else if (tLower.endsWith('\'') || tLower.endsWith('m')) {
    return 'ARC_MINUTES';
  } else if (tLower.endsWith('d') || tLower.endsWith('deg') || tLower.endsWith('°')) {
    return 'DEGREES';
  } else {
    // default when no units specified
    return 'ARC_MINUTES';
  }
}

// parses a list of sizes, converts to arcminutes
export function parseSizesArcminutes(sizeString) {
  if (nullOrEmpty(sizeString)) {
    return null;
  }

  const units = parseSizeUnits(sizeString);
  let scale = 1.0;
  if (units === 'ARC_SECONDS') {
    scale = 1.0 / 60;
  } else if (units === 'DEGREES') {
    scale = 60.0;
  }

  const regex = /[.0-9]+/g;
  const matches = sizeString.match(regex);
  if (matches !== null) {
    const sizes = matches.map(m => parseFloat(m) * scale);
    return sizes;
  } else {
    throw Error('Could not parse object size ' + sizeString);
  }
}

// Extracts the size of an object in arcminutes.  Some objects have
// multiple dimensions for the major/minor axes.  We return the
// min/max in all cases.
export function getObjectSizesArcminutes(sizeString) {
  if (nullOrEmpty(sizeString)) {
    return [null, null];
  }

  const sizes = parseSizesArcminutes(sizeString);
  return [Math.min(...sizes), Math.max(...sizes)];
}

function validateObjectType(typeString, lineNumber, line) {
  if (nullOrEmpty(typeString)) {
    throw Error('Object on line ' + lineNumber + ' has no type set.  Line = \n' + line);
  }
  const knownObjectTypes = new Set(objectTypes.map(o => o.shortName));
  const types = typeString.split('+');
  types.forEach(t => {
    if (!knownObjectTypes.has(t)) {
      throw Error('Object on line ' + lineNumber + ' has unknown type ' + t + '. Line = \n' + line);
    }
  });
}

function validateObjectLocation(typeString, conString, raString, decString, lineNumber, line) {
  const typeToLoc = new Map();
  objectTypes.map((t) => {
    typeToLoc.set(t.shortName, t.fixedPosition);
  });

  const shouldHaveLocation = typeToLoc.get(typeString);
  if (shouldHaveLocation !== null && shouldHaveLocation === true) {
    if (nullOrEmpty(conString)) {
      throw Error('Object on line ' + lineNumber + ' has missing constellation ' + conString + '. Line = \n' + line);
    }
    if (nullOrEmpty(raString)) {
      throw Error('Object on line ' + lineNumber + ' has missing R.A. ' + raString + '. Line = \n' + line);
    }
    if (nullOrEmpty(decString)) {
      throw Error('Object on line ' + lineNumber + ' has missing Dec ' + decString + '. Line = \n' + line);
    }

    const knownConstellations = new Set(constellations.map(o => o.abbreviation));
    if (!knownConstellations.has(conString)) {
      throw Error('Object on line ' + lineNumber + ' has unknown constellation ' + conString + '. Line = \n' + line);
    }
  }
}

// Parses a TSV line into an AstroObject
function readObject(lineNumber, line) {
  const fields = line.split('\t');

  const id = fields[0];
  const names = fields[1];
  const type = fields[2];
  const con = fields[3];
  const ra = parseBase60(fields[4]);
  const dec = parseBase60(fields[5]);
  const mag = fields[6];
  const size = fields[7];
  const sep = fields[8];
  const pa = fields[9];
  const objectClass = fields[10];
  const distance = fields[11];
  const notes = fields[12];

  validateObjectType(type, lineNumber, line);
  validateObjectLocation(type, con, ra, dec, lineNumber, line);

  const object = new AstroObject(lineNumber, id, names, type, con, ra, dec, mag, size, sep, pa, objectClass, distance, notes);

  if (fields.length !== 13) {
    throw Error('Expected object line ' + lineNumber + ' to have 13 fields, but has ' + fields.length + '. Line = \n' + line + '\nParsed as: \n' + JSON.stringify(object));
  }

  return object;
}

export function readObjects(tsv) {
  const lines = tsv.split('\n');
  const objects = [];
  for (const [lineNumber, line] of lines.entries()) {
    // skip blank/comment lines (don't filter beforehand to keep line numbers correct)
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const object = readObject(lineNumber + 1, line);
    objects.push(object);
  }
  return objects;
}

// Parses a TSV line into an Observation
function readObservation(lineNumber, line) {
  const fields = line.split('\t');

  const id = fields[0];
  const date = fields[1];
  const location = fields[2];
  const scope = fields[3];
  const seeing = fields[4];
  const transparency = fields[5];
  const objectIds = fields[6];
  const time = fields[7];
  const eyepiece = fields[8];
  const magnification = fields[9];
  const phase = fields[10];
  const notes = fields[11];

  const observation = new Observation(lineNumber, id, date, location, scope, seeing, transparency, objectIds, time, eyepiece, magnification, phase, notes);

  if (fields.length !== 12) {
    throw Error('Expected observation line ' + lineNumber + ' to have 12 fields, but has ' + fields.length + '. Line = \n' + line + '\nParsed as: \n' + JSON.stringify(observation));
  }
  return observation;
}

export function readObservations(tsv) {
  const lines = tsv.split('\n');
  const observations = [];
  for (const [lineNumber, line] of lines.entries()) {
    // skip blank/comment lines (don't filter beforehand to keep line numbers correct)
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const observation = readObservation(lineNumber + 1, line);
    observations.push(observation);
  }
  return observations;
}

// Parses a TSV line into a ProgramEntry
function readProgramEntry(lineNumber, line) {
  const fields = line.split('\t');

  const programName = fields[0];
  const number = fields[1];
  const objectId = fields[2];
  const observationId = fields[3];

  const programEntry = new ProgramEntry(lineNumber, programName, number, objectId, observationId);

  if (fields.length !== 4) {
    throw Error('Expected program line ' + lineNumber + ' to have 4 fields, but has ' + fields.length + '. Line = \n' + line + '\nParsed as: \n' + JSON.stringify(programEntry));
  }
  return programEntry;
}

export function readPrograms(tsv) {
  const lines = tsv.split('\n');
  const programs = [];
  for (const [lineNumber, line] of lines.entries()) {
    // skip blank/comment lines (don't filter beforehand to keep line numbers correct)
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const programEntry = readProgramEntry(lineNumber + 1, line);
    programs.push(programEntry);
  }
  return programs;
}

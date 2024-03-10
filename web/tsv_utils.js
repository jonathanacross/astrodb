import { AstroObject, Observation, ProgramEntry } from './database.js'

function nullOrEmpty (str) {
  return str === null || str === ''
}

export function parseBase60(base60str) {
  if (nullOrEmpty(base60str)) {
    return null;
  }

  const regex = /[-.0-9]+/g;
  const matches = base60str.match(regex);
  if (matches !== null) {
    const digitGroups = matches.map(m => parseFloat(m));

    let value = 0.0
    let scale = 1.0
    const sign = (digitGroups[0] < 0) ? -1.0 : 1.0;

    for (const number of digitGroups) {
      value += Math.abs(number) * scale
      scale /= 60.0
    }
    return value * sign;
  } else {
    throw Error("Can't parse RA/Dec value of '" + base60str);
  }
}

// Parses a TSV line into an AstroObject
function readObject(lineNumber, line) {
  const fields = line.split('\t');

  // TODO: add validation for some of these; e.g., id should be populated
  // con and type should be known values.
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

  const object = new AstroObject(lineNumber, id, names, type, con, ra, dec, mag, size, sep, pa, objectClass, distance, notes);

  if (fields.length !== 13) {
    throw Error('Expected object line ' + lineNumber + ' to have 13 fields, but has ' + fields.length + '. Line = \n' + line + '\nParsed as: \n' + JSON.stringify(object));
  }
  return object;
}

export function readObjects(tsv) {
  const lines = tsv.split('\n').filter(line => line !== '' && !line.startsWith('#'));
  const objects = [];
  for (const [lineNumber, line] of lines.entries()) {
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
  const lines = tsv.split('\n').filter(line => line !== '' && !line.startsWith('#'));
  const observations = [];
  for (const [lineNumber, line] of lines.entries()) {
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
  const lines = tsv.split('\n').filter(line => line !== '' && !line.startsWith('#'));
  const programs = [];
  for (const [lineNumber, line] of lines.entries()) {
    const programEntry = readProgramEntry(lineNumber + 1, line);
    programs.push(programEntry);
  }
  return programs;
}
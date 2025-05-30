import { parseBase60, parseSizesArcminutes } from './tsv_utils.js';

function nullOrEmpty(str) {
  return str === null || str === '';
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

export class ObjectFilter {
  #nameIs = null;
  #nameLike = null;
  #typeIs = null;
  #conIs = null;
  #raMin = null;
  #raMax = null;
  #decMin = null;
  #decMax = null;
  #magMax = null;
  #sizeMin = null;
  #sizeMax = null;
  #programNameIs = null;
  #seenStatus = null;

  setNameIs(nameIs) {
    if (!nullOrEmpty(nameIs)) {
      this.#nameIs = nameIs.toLowerCase();
    }
  }

  setNameLike(nameLike) {
    if (!nullOrEmpty(nameLike)) {
      this.#nameLike = nameLike.toLowerCase();
    }
  }

  setTypeIs(typeIs) {
    if (!nullOrEmpty(typeIs)) {
      this.#typeIs = typeIs.toLowerCase();
    }
  }

  setConIs(conIs) {
    if (!nullOrEmpty(conIs)) {
      this.#conIs = conIs;
    }
  }

  setRaRange(raMin, raMax) {
    if (!nullOrEmpty(raMin)) {
      this.#raMin = parseBase60(raMin);
    }
    if (!nullOrEmpty(raMax)) {
      this.#raMax = parseBase60(raMax);
    }
  }

  setDecRange(decMin, decMax) {
    if (!nullOrEmpty(decMin)) {
      this.#decMin = parseBase60(decMin);
    }
    if (!nullOrEmpty(decMax)) {
      this.#decMax = parseBase60(decMax);
    }
  }

  setMagMax(magMax) {
    if (!nullOrEmpty(magMax)) {
      this.#magMax = magMax;
    }
  }

  setSizeRange(sizeMin, sizeMax) {
    if (!nullOrEmpty(sizeMin)) {
      this.#sizeMin = parseSizesArcminutes(sizeMin)[0];
    }
    if (!nullOrEmpty(sizeMax)) {
      this.#sizeMax = parseSizesArcminutes(sizeMax)[0];
    }
  }

  setProgramNameIs(programNameIs) {
    if (!nullOrEmpty(programNameIs)) {
      this.#programNameIs = programNameIs.toLowerCase();
    }
  }

  setSeenStatus(seenStatus) {
    if (!nullOrEmpty(seenStatus)) {
      this.#seenStatus = seenStatus;
    }
  }

  raIsInRange(ra) {
    // no RA defined
    if (nullOrEmpty(ra)) {
      return true;
    }

    // no RA filter defined
    if (this.#raMin === null && this.#raMax === null) {
      return true;
    }

    // only max RA defined
    if (this.#raMin === null) {
      return this.#raMax >= ra;
    }

    // only min RA defined
    if (this.#raMax === null) {
      return this.#raMin <= ra;
    }

    // Both min and max RA defined.  If the min and max are reversed, then
    // modify the checks to handle objects crossing the 24-0 RA line.
    if (this.#raMin < this.#raMax) {
      return this.#raMin <= ra && ra <= this.#raMax;
    } else {
      return this.#raMin <= ra || ra <= this.#raMax;
    }
  }

  decIsInRange(dec) {
    // no dec defined (e.g., for planets, comets, etc.)
    if (nullOrEmpty(dec)) {
      return true;
    }

    if (this.#decMin !== null && dec < this.#decMin) {
      return false;
    }

    if (this.#decMax !== null && dec > this.#decMax) {
      return false;
    }

    return true;
  }

  magIsInRange(mag) {
    if (nullOrEmpty(mag)) {
      return true;
    }

    if (this.#magMax !== null && mag > this.#magMax) {
      return false;
    }

    return true;
  }

  sizeIsInRange(minorSizeMinutes, majorSizeMinutes) {
    if (minorSizeMinutes !== null && this.#sizeMin !== null && minorSizeMinutes < this.#sizeMin) {
      return false;
    }

    if (majorSizeMinutes !== null && this.#sizeMax !== null && majorSizeMinutes > this.#sizeMax) {
      return false;
    }

    return true;
  }

  seenStatusMatches(object) {
    const matchingProgramData =
      object.programData.filter(p => p.programName.toLowerCase() === this.#programNameIs);

    switch (this.#seenStatus) {
      case 'Seen':
        return (object.observationData.length > 0);
      case 'Not seen':
        return (object.observationData.length === 0);
      case 'Seen in program':
        if (matchingProgramData.length >= 1) {
          return !nullOrEmpty(matchingProgramData[0].observationId);
        } else {
          return false;
        }
      case 'Not seen in program':
        if (matchingProgramData.length >= 1) {
          return nullOrEmpty(matchingProgramData[0].observationId);
        } else {
          return false;
        }
      default:
        // no (or invalid) filter
        return true;
    }
  }

  #objectMatches(object) {
    const objectNames = object.names.toLowerCase().split('/');
    if (this.#nameIs !== null && objectNames.every((name) => this.#nameIs !== name)) {
      return false;
    }
    if (this.#nameLike !== null && objectNames.every((name) => !name.includes(this.#nameLike))) {
      return false;
    }
    const objectTypes = object.type.toLowerCase().split('+');
    if (this.#typeIs !== null && objectTypes.every((type) => this.#typeIs !== type)) {
      return false;
    }
    if (this.#conIs !== null && this.#conIs !== object.con) {
      return false;
    }
    if (!this.raIsInRange(object.ra)) {
      return false;
    }
    if (!this.decIsInRange(object.dec)) {
      return false;
    }
    if (!this.magIsInRange(object.magValue)) {
      return false;
    }
    if (!this.sizeIsInRange(object.minorSizeMinutes, object.majorSizeMinutes)) {
      return false;
    }
    const programIds = object.programData.map(programEntry => programEntry.programName.toLowerCase());
    if (this.#programNameIs !== null && programIds.every((name) => this.#programNameIs !== name)) {
      return false;
    }
    if (!this.seenStatusMatches(object)) {
      return false;
    }
    return true;
  }

  getMatchingObjectIds(objects) {
    const objectIds = [];
    for (const [objectId, object] of Object.entries(objects)) {
      if (this.#objectMatches(object)) {
        objectIds.push(objectId);
      }
    }
    return objectIds;
  }
}

export class ObservationFilter {
  #dateLike = null;
  #hasObjectType = null;
  #hasObjectCon = null;
  #hasObjectNameLike = null;
  #locationIs = null;
  #scopeIs = null;

  setDateLike(dateLike) {
    if (!nullOrEmpty(dateLike)) {
      this.#dateLike = dateLike.toLowerCase();
    }
  }

  setHasObjectType(hasObjectType) {
    if (!nullOrEmpty(hasObjectType)) {
      this.#hasObjectType = hasObjectType.toLowerCase();
    }
  }

  setHasObjectCon(hasObjectCon) {
    if (!nullOrEmpty(hasObjectCon)) {
      this.#hasObjectCon = hasObjectCon;
    }
  }

  setHasObjectNameLike(hasObjectNameLike) {
    if (!nullOrEmpty(hasObjectNameLike)) {
      this.#hasObjectNameLike = hasObjectNameLike.toLowerCase();
    }
  }

  setLocationIs(locationIs) {
    if (!nullOrEmpty(locationIs)) {
      this.#locationIs = locationIs;
    }
  }

  setScopeIs(scopeIs) {
    if (!nullOrEmpty(scopeIs)) {
      this.#scopeIs = scopeIs;
    }
  }

  #observationMatches(observation) {
    if (this.#dateLike !== null && !observation.date.includes(this.#dateLike)) {
      return false;
    }

    if (this.#hasObjectNameLike !== null &&
      observation.objectData.every((object) => {
        const objectNames = object.names.toLowerCase().split('/');
        return objectNames.every((name) => !name.includes(this.#hasObjectNameLike));
      })) {
      return false;
    }

    if (this.#hasObjectCon !== null &&
        observation.objectData.every((object) => this.#hasObjectCon !== object.con)) {
      return false;
    }

    if (this.#hasObjectType !== null &&
        observation.objectData.every((object) => {
          const objectTypes = object.type.toLowerCase().split('+');
          return objectTypes.every((type) => !type.includes(this.#hasObjectType));
        })) {
      return false;
    }

    if (this.#locationIs != null && observation.location !== this.#locationIs) {
      return false;
    }

    if (this.#scopeIs != null && observation.scope !== this.#scopeIs) {
      return false;
    }

    return true;
  }

  getMatchingObservationIds(observations) {
    const observationIds = [];
    for (const [observationId, observation] of Object.entries(observations)) {
      if (this.#observationMatches(observation)) {
        observationIds.push(observationId);
      }
    }
    return observationIds;
  }
}

export class ProgramFilter {
  #programNameIs = null;

  setProgramNameIs(programNameIs) {
    if (!nullOrEmpty(programNameIs)) {
      this.#programNameIs = programNameIs;
    }
  }

  getMatchingObservationIds(programs) {
    const entries = programs[this.#programNameIs];
    const observationIds = entries
      .filter(o => o.observationId !== '')
      .map(o => o.observationId)
      .filter(onlyUnique);
    return observationIds;
  }
}

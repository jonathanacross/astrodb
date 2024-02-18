function nullOrEmpty (str) {
  return str === null || str === ''
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

export class ObjectFilter {
  #nameIs = null
  #nameLike = null
  #typeIs = null
  #conIs = null
  #raMin = null
  #raMax = null
  #decMin = null
  #decMax = null

  setNameIs (nameIs) {
    if (!nullOrEmpty(nameIs)) {
      this.#nameIs = nameIs.toLowerCase()
    }
  }

  setNameLike (nameLike) {
    if (!nullOrEmpty(nameLike)) {
      this.#nameLike = nameLike.toLowerCase()
    }
  }

  setTypeIs (typeIs) {
    if (!nullOrEmpty(typeIs)) {
      this.#typeIs = typeIs
    }
  }

  setConIs (conIs) {
    if (!nullOrEmpty(conIs)) {
      this.#conIs = conIs
    }
  }

  setRaRange (raMin, raMax) {
    if (!nullOrEmpty(raMin)) {
      this.#raMin = raMin
    }
    if (!nullOrEmpty(raMax)) {
      this.#raMax = raMax
    }
  }

  setDecRange (decMin, decMax) {
    if (!nullOrEmpty(decMin)) {
      this.#decMin = decMin
    }
    if (!nullOrEmpty(decMax)) {
      this.#decMax = decMax
    }
  }

  getUrlParameters () {
    let params = ''
    if (this.#nameIs !== null) {
      params += '&nameIs=' + encodeURIComponent(this.#nameIs)
    }
    if (this.#nameLike !== null) {
      params += '&nameLike=' + encodeURIComponent(this.#nameLike)
    }
    if (this.#typeIs !== null) {
      params += '&typeIs=' + encodeURIComponent(this.#typeIs)
    }
    if (this.#conIs !== null) {
      params += '&conIs=' + encodeURIComponent(this.#conIs)
    }
    if (this.#raMin !== null) {
      params += '&raMin=' + encodeURIComponent(this.#raMin)
    }
    if (this.#raMax !== null) {
      params += '&raMax=' + encodeURIComponent(this.#raMin)
    }
    return params
  }

  raIsInRange(ra) {
    // no RA defined
    if (nullOrEmpty(ra)) {
      return true
    }

    // no RA filter defined
    if (this.#raMin === null && this.#raMax === null) {
      return true
    }

    // only max RA defined
    if (this.#raMin === null) {
      return this.#raMax >= ra
    }

    // only min RA defined
    if (this.#raMax === null) {
      return this.#raMin <= ra
    }

    // Both min and max RA defined.  If the min and max are reversed, then
    // reverse the checks, to handle objects crossing the 24-0 RA line.
    if (this.#raMin < this.#raMax) {
      return this.#raMin <= ra && ra <= this.#raMax
    } else {
      return this.#raMin >= ra && ra >= this.#raMax
    }
  }

  #objectMatches (object) {
    const objectNames = object.names.toLowerCase().split('/')
    if (this.#nameIs !== null && objectNames.every((name) => this.#nameIs !== name)) {
      return false
    }
    if (this.#nameLike !== null && objectNames.every((name) => !name.includes(this.#nameLike))) {
      return false
    }
    if (this.#typeIs !== null && this.#typeIs !== object.type) {
      return false
    }
    if (this.#conIs !== null && this.#conIs !== object.con) {
      return false
    }
    if (!this.raIsInRange(object.ra)) {
      return false
    }
    return true
  }

  getMatchingObjectIds (objects) {
    const results = []
    for (const [objectId, object] of Object.entries(objects)) {
      if (this.#objectMatches(object)) {
        results.push(objectId)
      }
    }
    return results
  }
}

export class ObservationFilter {
  #nameIs = null
  #nameLike = null
  #typeIs = null
  #conIs = null
  #dateLike = null

  setNameIs (nameIs) {
    if (!nullOrEmpty(nameIs)) {
      this.#nameIs = nameIs.toLowerCase()
    }
  }

  setNameLike (nameLike) {
    if (!nullOrEmpty(nameLike)) {
      this.#nameLike = nameLike.toLowerCase()
    }
  }

  setTypeIs (typeIs) {
    if (!nullOrEmpty(typeIs)) {
      this.#typeIs = typeIs
    }
  }

  setConIs (conIs) {
    if (!nullOrEmpty(conIs)) {
      this.#conIs = conIs
    }
  }

  setDateLike (dateLike) {
    if (!nullOrEmpty(dateLike)) {
      this.#dateLike = dateLike.toLowerCase()
    }
  }

  getUrlParameters () {
    let params = ''
    if (this.#nameIs !== null) {
      params += '&nameIs=' + encodeURIComponent(this.#nameIs)
    }
    if (this.#nameLike !== null) {
      params += '&nameLike=' + encodeURIComponent(this.#nameLike)
    }
    if (this.#typeIs !== null) {
      params += '&typeIs=' + encodeURIComponent(this.#typeIs)
    }
    if (this.#conIs !== null) {
      params += '&conIs=' + encodeURIComponent(this.#conIs)
    }
    if (this.#dateLike !== null) {
      params += '&dateLike=' + encodeURIComponent(this.#dateLike)
    }
    return params
  }

  #observationMatches (observation) {
    //const objectNames = observation.Names.toLowerCase().split('/')
    // if (this.#nameIs !== null && objectNames.every((name) => this.#nameIs !== name)) {
    //   return false
    // }
    // if (this.#nameLike !== null && objectNames.every((name) => !name.includes(this.#nameLike))) {
    //   return false
    // }
    // if (this.#typeIs !== null && this.#typeIs !== observation.Type) {
    //   return false
    // }
    // if (this.#conIs !== null && this.#conIs !== observation.Con) {
    //   return false
    // }
    if (this.#dateLike !== null && !observation.date.includes(this.#dateLike)) {
      return false
    }
    return true
  }

  getMatchingObservationIds (observations) {
    const results = []
    for (const [observationId, observation] of Object.entries(observations)) {
      if (this.#observationMatches(observation)) {
        results.push(observationId)
      }
    }
    return results
  }
}

export class ProgramFilter {
  #programNameIs = null

  setProgramNameIs (programNameIs) {
    if (!nullOrEmpty(programNameIs)) {
      this.#programNameIs = programNameIs
    }
  }

  getUrlParameters () {
    let params = ''
    if (this.#programNameIs !== null) {
      params += '&programName=' + encodeURIComponent(this.#programNameIs)
    }
    return params
  }

  getMatchingObservationIds (programs) {
    const entries = programs[this.#programNameIs];
    const obsIds = entries
      .filter(o => o.observationId !== '')
      .map(o => o.observationId)
      .filter(onlyUnique);

    // TODO: extend to include matching objects, so we can show the count in the UI

    return obsIds;
  }
}

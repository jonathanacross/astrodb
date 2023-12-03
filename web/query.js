export class ObjectFilter {
  #nameIs = null
  #nameLike = null
  #typeIs = null
  #conIs = null

  setNameIs (nameIs) {
    if (nameIs !== null && nameIs !== '') {
      this.#nameIs = nameIs
    }
  }

  setNameLike (nameLike) {
    if (nameLike !== null && nameLike !== '') {
      this.#nameLike = nameLike
    }
  }

  setTypeIs (typeIs) {
    if (typeIs !== null && typeIs !== '') {
      this.#typeIs = typeIs
    }
  }

  setConIs (conIs) {
    if (conIs !== null && conIs !== '') {
      this.#conIs = conIs
    }
  }

  getUrlParameters () {
    let params = ''
    if (this.#nameIs !== null) {
      params += '&nameIs=' + encodeURIComponent(this.nameIs)
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
    return params
  }

  #objectMatches (object) {
    const objectNames = object.Names.split('/')
    if (this.#nameIs !== null && objectNames.every((name) => this.#nameIs !== name)) {
      return false
    }
    // TODO: handle case insensitivity; also seems only to handle exact matches
    if (this.#nameLike !== null && objectNames.every((name) => !this.#nameLike.includes(name))) {
      return false
    }
    if (this.#typeIs !== null && this.#typeIs !== object.Type) {
      return false
    }
    if (this.#conIs !== null && this.#conIs !== object.Con) {
      return false
    }
    return true
  }

  getMatchingObjectIds (objects) {
    const results = []
    for (const [objId, obj] of Object.entries(objects)) {
      if (this.#objectMatches(obj)) {
        results.push(objId)
      }
    }
    return results
  }
}

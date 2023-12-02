export class ObjectFilter {
  constructor () {
    this.nameIs = null
    this.nameLike = null
  }
}

function objectMatches (object, filter) {
  const objectNames = object.Names.toLowerCase().split('/')
  if (filter.nameIs !== null && objectNames.every((name) => filter.nameIs !== name)) {
    return false
  }
  if (filter.nameLike !== null && objectNames.every((name) => !filter.nameLike.includes(name))) {
    return false
  }
  return true
}

export function getMatchingObjectIds (objects, filter) {
  const results = []
  for (const [objId, obj] of Object.entries(objects)) {
    if (objectMatches(obj, filter)) {
      results.push(objId)
    }
  }
  return results
}

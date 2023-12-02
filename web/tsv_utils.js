export function tsvToJson (tsv) {
  const lines = tsv.split('\n').filter(line => line !== '')
  const headers = lines.shift().split('\t')
  return lines.map(line => {
    const data = line.split('\t')
    return headers.reduce((obj, nextKey, index) => {
      obj[nextKey] = data[index]
      return obj
    }, {})
  })
}

// Takes a list of objects that each have a #id,
// and creates a map with that id.
export function keyByColumn (list, columnName) {
  const result = {}
  for (const entry of list) {
    result[entry[columnName]] = entry
  }
  return result
}

// Takes a list of objects that each have a #id,
// and creates a map with that id.
// Entries for duplicate keys are maintained as
// a list in the same order as the input data.
export function keyByColumnAsLists (list, columnName) {
  const result = {}
  for (const entry of list) {
    const key = entry[columnName]
    if (!(key in result)) {
      result[key] = []
    }
    result[key].push(entry)
  }
  return result
}

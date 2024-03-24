import { constellations } from "./constants.js";

export function getObservationSortFunction(sortMethod) {
  if (sortMethod === 'name') {
    return function (x, y) {
      // first sort by name
      if (x.names !== y.names) {
        // locale compare should sort names in natural order, so that 'M 2' < 'M 10'
        return x.names.localeCompare(y.names, undefined, { numeric: true, sensitivity: 'base' });
      }
      // fall back to observation date/number
      return x.id.localeCompare(y.id);
    };
  } else if (sortMethod === 'date') {
    return function (x, y) {
      // id has date-obs#-name, so this includes date then observation number
      return x.id.localeCompare(y.id);
    };
  }
}
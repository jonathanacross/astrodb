function tsvToJson(tsv) {
    const lines = tsv.split('\n').filter( line => line !== "");
    const headers = lines.shift().split('\t');
    return lines.map(line => {
        const data = line.split('\t');
        return headers.reduce((obj, nextKey, index) => {
            obj[nextKey] = data[index];
            return obj;
        }, {});
    });
}

// takes a list of objects that each have a #id,
// and creates a map with that id
function keyByColumn(list, column_name) {
    var result = {}
    for (const entry of list) {
        result[entry[column_name]] = entry;
    }
    return result;
}

// takes a list of objects that each have a #id,
// and creates a map with that id
function keyByColumnAsLists(list, column_name) {
    var result = {}
    for (const entry of list) {
        const key = entry[column_name];
        if (!(key in result)) {
            result[key] = [];
        }
        result[key].push(entry);
    }
    return result;
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function setObjectInfo(obs, element) {
    const obj_ids = obs["ObjIds"].split("|");
    var nameInfo = document.createElement("ul");
    for (obj_id of obj_ids) {
        const obj = objects[obj_id];
        var title = document.createElement("div");
        title.className = "objname";
        title.textContent = obj["Names"];
        element.appendChild(title);

        // Only bother to show type, con etc. for
        // objects that have a fixed position in the sky.
        if (obj["Con"] !== "") {
            var attrslist = document.createElement("ul");
            var attributes = ["Type", "Con", "RA", "Dec"];
            for (const attr of attributes) {
                if (obj[attr] !== "") {
                    var li = document.createElement('li');
                    li.textContent = attr + ": " + obj[attr];
                    attrslist.appendChild(li);
                }
            }
            element.appendChild(attrslist);
        }
    }
}

function showObservations(observation_ids) {
    // count of observations
    var resultsHeader = document.getElementById("results_header");
    // clear old header
    while (resultsHeader.hasChildNodes()) {
        resultsHeader.removeChild(resultsHeader.lastChild);
    }
    var resultCount = document.createElement("p");
    resultCount.textContent = "Found " + observation_ids.length + " observations.";
    resultsHeader.appendChild(resultCount);

    var resultsArea = document.getElementById("results_list");

    // clear old results
    while (resultsArea.hasChildNodes()) {
        resultsArea.removeChild(resultsArea.lastChild);
    }

    // add new results
    for (const observation_id of observation_ids) {
        obs = observations[observation_id];
        var fragment = document.createDocumentFragment();
        if (obs == null) {
            var obsDiv = document.createElement("div");
            obsDiv.className = "observation";
            
            var errDiv = document.createElement("div");
            errDiv.className = "error";
            errDiv.textContent = "Error: can't find observation id '" + observation_id + "'";

            obsDiv.appendChild(errDiv);
            fragment.appendChild(obsDiv);
        } else {
            var obsDiv = document.createElement("div");
            obsDiv.className = "observation";

            var notesDiv = document.createElement("div");
            notesDiv.className = "notes";
            var objinfo = document.createElement("div");
            setObjectInfo(obs, objinfo);

            var notesList = document.createElement("ul");
            var attributes = ["Date", "Location", "Scope", "Seeing", "Trans", "Time", "Eyepiece", "Mag", "Phase"];
            for (const attr of attributes) {
                if (obs[attr] !== "") {
                    var li = document.createElement('li');
                    li.textContent = attr + ": " + obs[attr];
                    notesList.appendChild(li);
                }
            }
            notesDiv.appendChild(objinfo);
            notesDiv.appendChild(notesList);
            if (obs["Notes"] != null) {
                var description = document.createElement("p");
                description.textContent = obs["Notes"];
                notesDiv.appendChild(description);
            }

            var sketchDiv = document.createElement("div");
            sketchDiv.className = "sketch";
            var sketch = document.createElement("img");
            sketch.src = "data/sketches/" + obs["#id"] + ".jpg";
            sketchDiv.appendChild(sketch);

            obsDiv.appendChild(notesDiv);
            obsDiv.appendChild(sketchDiv);
            fragment.appendChild(obsDiv);
        }

        resultsArea.appendChild(fragment);
    }
    invert();
}

function showObjectsForSelectedProgram() {
    var programpicker = document.getElementById("program");
    const program_name = programpicker.options[programpicker.selectedIndex].value;
    const entries = programs[program_name];
    const obs_ids = entries
        .map(o => o["observationId"])
        .filter(onlyUnique)
        .filter(name => name !== "");
    showObservations(obs_ids);
}

function showObjectsForSelectedDate() {
    var datepicker = document.getElementById("month");
    const month = datepicker.value;
    var observation_ids = [];
    for (const [observation_id, observation] of Object.entries(observations)) {
        if (trimToMonth(observation["Date"]) === month) {
            observation_ids.push(observation_id);
        }
    }
    showObservations(observation_ids);
}

function ObjectNameIs(obj, name) {
    const names = obj["Names"].toLowerCase().split("/");
    for (n of names) {
        if (n === name) {
            return true;
        }
    }
    return false;
}

function ObjectNameContains(obj, name) {
    const names = obj["Names"].toLowerCase().split("/");
    for (n of names) {
        if (n.includes(name)) {
            return true;
        }
    }
    return false;
}

function ObjectTypeContains(obj, type) {
    const types = obj["Type"].split("+");
    for (t of types) {
        if (t === type) {
            return true;
        }
    }
    return false;
}

function ObjectConIs(obj, con) {
    return obj["Con"] === con
}

function showObjectsForObjectQuery() {
    var namematch_element = document.getElementById("namematch");
    var namequery_element = document.getElementById("name");
    var type_element = document.getElementById("type");
    var constellation_element = document.getElementById("constellation");

    const name_query = namequery_element.value.toLowerCase();
    const do_exact_name_match = namematch_element.value === "is" && name_query !== "";
    const do_substring_name_match = namematch_element.value === "contains" && name_query !== "";
    const do_type_match = type_element.value !== "";
    const do_con_match = constellation_element.value !== "";

    var observation_ids_and_matching_obj_id = [];
    for (const [observation_id, observation] of Object.entries(observations)) {
        var observation_matches = false;
        var matching_object = null;
        const obj_ids = observation["ObjIds"].split("|");
        const objs = obj_ids.map( obj_id => objects[obj_id])
        for (const obj of objs) {
            var object_matches = true;
            if (do_exact_name_match && !ObjectNameIs(obj, name_query)) {
                object_matches = false;
            }
            if (do_substring_name_match && !ObjectNameContains(obj, name_query)) {
                object_matches = false;
            }
            if (do_con_match && (
                obj["Con"] == null || !ObjectConIs(obj, constellation_element.value))) {
                object_matches = false;
            }
            if (do_type_match && (
                obj["Type"] == null || !ObjectTypeContains(obj, type_element.value))) {
                object_matches = false;
            }
            if (object_matches) {
                observation_matches = true;
                matching_object = obj;
            }
        }

        if (observation_matches) {
            const obj_name = matching_object["Names"].split("/")[0];
            observation_ids_and_matching_obj_id.push([observation_id, obj_name]);
        }
    }

    // sort observations by object name
    observation_ids_and_matching_obj_id.sort(
        function(x, y) {
            return x[1].localeCompare(y[1], undefined, {numeric: true, sensitivity: 'base'});
        }
    )
    // and strip down to just obs ids
    observation_ids = observation_ids_and_matching_obj_id.map(x => x[0]);

    showObservations(observation_ids);
}

function invert() {
  var invert = document.getElementById("invert").checked;

  // Can change this to use a class name if this is too generic.
  var imgs = document.getElementsByTagName('img');
  for(i = 0; i < imgs.length; i++) {
    if (invert) {
      imgs[i].style.filter = 'invert(1)';
    } else {
      imgs[i].style.filter = null;
    }
  }
}

// Trims a string of the format yyyy-mm-dd to just yyyy-mm
function trimToMonth(yearmonthday) {
    return yearmonthday.substring(0, 7);
}

function getObservationRanges(observations) {
    var minDate = "9999-12-31";
    var maxDate = "0000-01-01";
    for (const [observation_id, observation] of Object.entries(observations)) {
        if (observation["Date"] < minDate) {
            minDate = observation["Date"];
        }
        if (observation["Date"] > maxDate) {
            maxDate = observation["Date"];
        }
    }
    return {"min": trimToMonth(minDate), "max": trimToMonth(maxDate)};
}

function setupControls() {
    var programpicker = document.getElementById("program");
    for (const [program_name, observation_ids] of Object.entries(programs)) {
        var option = document.createElement("option");
        option.text = program_name;
        programpicker.add(option);
    }
    var programbutton = document.getElementById("programshow");
    programbutton.addEventListener("click", showObjectsForSelectedProgram);

    var datepicker = document.getElementById("month");
    observationRange = getObservationRanges(observations);
    datepicker.min = observationRange["min"];
    datepicker.max = observationRange["max"];
    datepicker.value = observationRange["max"];
    var datebutton = document.getElementById("dateshow");
    datebutton.addEventListener("click", showObjectsForSelectedDate);

    var cons = new Set()
    for (const [obs_id, obs] of Object.entries(observations)) {
        obj_ids = obs["ObjIds"].split("|");
        for (const obj_id of obj_ids) {
            c = objects[obj_id]["Con"];
            if (c != null) {
                cons.add(c);
            }
            t = objects[obj_id]["Type"];
        }
    }
    cons = Array.from(cons).sort();
    var conpicker = document.getElementById("constellation_list");
    for (const c of cons) {
        var option = document.createElement("option");
        option.value = c;
        option.text = c;
        conpicker.appendChild(option);
    }

    var objbutton = document.getElementById("objshow");
    objbutton.addEventListener("click", showObjectsForObjectQuery);
    
    var invertcheck = document.getElementById("invert");
    invertcheck.addEventListener("click", invert);
}

function handleErrors(responses) {
    for (const response of responses) {
        if (!response.ok) {
            throw Error(response.url + " " + response.statusText);
        }
    }
    return responses;
}

function DisplayError(errors) {
    var body = document.body;
    while (body.hasChildNodes()) {
        body.removeChild(body.lastChild);
    }
    body.innerHTML = "<p>Couldn't load data. <br>" + errors + "</p>";
}

function ParseData(responses) {
    observations = keyByColumn(tsvToJson(responses[0]), "#id");
    objects = keyByColumn(tsvToJson(responses[1]), "#id");
    programs = keyByColumnAsLists(tsvToJson(responses[2]), "#program");
}

function LoadDataAndSetupPage() {
    Promise.all([
        fetch('data/full_observations.tsv'),
        fetch('data/objects.tsv'),
        fetch('data/full_programs.tsv'),
    ])
    .then(handleErrors)
    .then(result => Promise.all(result.map(v => v.text())))
    .then(responses => ParseData(responses))
    .then(setupControls);
    //.catch(error => DisplayError(error));

}

window.onload = LoadDataAndSetupPage

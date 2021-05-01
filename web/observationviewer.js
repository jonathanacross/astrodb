/*jshint esversion: 6 */

function tsvToJson(tsv) {
    const lines = tsv.split("\n").filter(line => line !== "");
    const headers = lines.shift().split("\t");
    return lines.map(line => {
        const data = line.split("\t");
        return headers.reduce((obj, nextKey, index) => {
            obj[nextKey] = data[index];
            return obj;
        }, {});
    });
}

// takes a list of objects that each have a #id,
// and creates a map with that id
function keyByColumn(list, column_name) {
    let result = {};
    for (const entry of list) {
        result[entry[column_name]] = entry;
    }
    return result;
}

// takes a list of objects that each have a #id,
// and creates a map with that id
function keyByColumnAsLists(list, column_name) {
    let result = {};
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
    const obj_ids = obs.ObjIds.split("|");
    for (const obj_id of obj_ids) {
        const obj = objects[obj_id];
        let title = document.createElement("div");
        title.className = "objname";
        title.textContent = obj.Names;
        element.appendChild(title);

        // Only bother to show type, con etc. for
        // objects that have a fixed position in the sky.
        if (obj.Con !== "") {
            let attrslist = document.createElement("ul");
            let attributes = ["Type", "Con", "RA", "Dec"];
            for (const attr of attributes) {
                if (obj[attr] !== "") {
                    let li = document.createElement("li");
                    li.textContent = attr + ": " + obj[attr];
                    attrslist.appendChild(li);
                }
            }
            element.appendChild(attrslist);
        }
    }
}

function showObservations(observation_ids, object_ids) {
    // count of observations
    let resultsHeader = document.getElementById("results_header");
    // clear old header
    while (resultsHeader.hasChildNodes()) {
        resultsHeader.removeChild(resultsHeader.lastChild);
    }
    let resultCount = document.createElement("p");
    resultCount.textContent = "Found " + object_ids.length + " matching objects in " + observation_ids.length + " observations.";
    resultsHeader.appendChild(resultCount);

    let resultsArea = document.getElementById("results_list");

    // clear old results
    while (resultsArea.hasChildNodes()) {
        resultsArea.removeChild(resultsArea.lastChild);
    }

    // add new results
    for (const observation_id of observation_ids) {
        obs = observations[observation_id];
        let fragment = document.createDocumentFragment();
        if (obs == null) {
            let obsDiv = document.createElement("div");
            obsDiv.className = "observation";

            let errDiv = document.createElement("div");
            errDiv.className = "error";
            errDiv.textContent = "Error: can't find observation id '" + observation_id + "'";

            obsDiv.appendChild(errDiv);
            fragment.appendChild(obsDiv);
        } else {
            let obsDiv = document.createElement("div");
            obsDiv.className = "observation";

            let notesDiv = document.createElement("div");
            notesDiv.className = "notes";
            let objinfo = document.createElement("div");
            setObjectInfo(obs, objinfo);

            let notesList = document.createElement("ul");
            const attributes = ["Date", "Location", "Scope", "Seeing", "Trans", "Time", "Eyepiece", "Mag", "Phase"];
            for (const attr of attributes) {
                if (obs[attr] !== "") {
                    let li = document.createElement("li");
                    li.textContent = attr + ": " + obs[attr];
                    notesList.appendChild(li);
                }
            }
            notesDiv.appendChild(objinfo);
            notesDiv.appendChild(notesList);
            if (obs.Notes != null) {
                let description = document.createElement("p");
                description.textContent = obs.Notes;
                notesDiv.appendChild(description);
            }

            let sketchDiv = document.createElement("div");
            sketchDiv.className = "sketch";
            let sketch = document.createElement("img");
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

function doProgramQuery() {
    let programpicker = document.getElementById("program");
    const program_name = programpicker.options[programpicker.selectedIndex].value;

    let newquery = "show=program";
    newquery += "&name=" + encodeURIComponent(program_name);

    history.replaceState(null, "", window.location.origin + "?" + newquery);
    showObjectsForSelectedProgram(program_name);
}

function showObjectsForSelectedProgram(program_name) {
    const entries = programs[program_name];
    const obs_ids = entries
        .filter(o => o.observationId !== "")
        .map(o => o.observationId)
        .filter(onlyUnique);

    // make a list of objects that appear in these observations
    const obj_ids = entries
        .filter(o => o.observationId !== "")
        .map(o => o.objectId)
        .filter(onlyUnique);
    showObservations(obs_ids, obj_ids);
}

function ObjectNameContains(obj, name) {
    const names = obj.Names.toLowerCase().split("/");
    for (const n of names) {
        if (n.includes(name)) {
            return true;
        }
    }
    return false;
}

function ObsDateContains(obs, month) {
    return obs.Date.includes(month);
}

function ObjectTypeContains(obj, type) {
    const types = obj.Type.split("+");
    for (const t of types) {
        if (t === type) {
            return true;
        }
    }
    return false;
}

function ObjectConIs(obj, con) {
    return obj.Con === con;
}

function getSortFunction(sort_method) {
    if (sort_method === "name") {
        return function(x, y) {
            // first sort by name
            if (x.obj_name !== y.obj_name) {
                return x.obj_name.localeCompare(y.obj_name, undefined, {numeric: true, sensitivity: "base"});
            }
            // fall back to observation date/number
            return x.obs_id.localeCompare(y.obs_id);
        };
    } else if (sort_method === "date") {
        return function(x, y) {
            // obs_id has date-obs#-name, so this includes date then observation number
            return x.obs_id.localeCompare(y.obs_id);
        };
    } else if (sort_method === "ra") {
        return function(x, y) {
            // Sort by RA first
            if (Math.abs(x.obj_ra - y.obj_ra) > 0.00001) {
                return x.obj_ra - y.obj_ra;
            }
            // For objects with no constellation/RA, sort by name
            if (x.obj_name !== y.obj_name) {
                return x.obj_name.localeCompare(y.obj_name, undefined, {numeric: true, sensitivity: "base"});
            }
            // And finally fall back to date/observation number (encapsulated by obs_id)
            return x.obs_id.localeCompare(y.obs_id);
        };
    } else {
        // RA is the average of the most eastward and most westward RA.
        // From https://en.wikipedia.org/wiki/IAU_designated_constellations_by_area
        return function(x, y) {
            // First sort by constellation
            const con_to_ra = {
                "And": "00 48.46", "Ant": "10 16.43", "Aps": "16 08.65", "Aql": "19 40.02",
                "Aqr": "22 17.38", "Ara": "17 22.49", "Ari": "02 38.16", "Aur": "06 04.42",
                "Boo": "14 42.64", "Cae": "04 42.27", "Cam": "08 51.37", "Cap": "21 02.93",
                "Car": "08 41.70", "Cas": "01 19.16", "Cen": "13 04.27", "Cep": "02 32.64",
                "Cet": "01 40.10", "Cha": "10 41.53", "Cir": "14 34.54", "CMa": "06 49.74",
                "CMi": "07 39.17", "Cnc": "08 38.96", "Col": "05 51.76", "Com": "12 47.27",
                "CrA": "18 38.79", "CrB": "15 50.59", "Crt": "11 23.75", "Cru": "12 26.99",
                "Crv": "12 26.52", "CVn": "13 06.96", "Cyg": "20 35.28", "Del": "20 41.61",
                "Dor": "05 14.51", "Dra": "15 08.64", "Equ": "21 11.26", "Eri": "03 18.02",
                "For": "02 47.88", "Gem": "07 04.24", "Gru": "22 27.39", "Her": "17 23.16",
                "Hor": "03 16.56", "Hya": "11 36.73", "Hyi": "02 20.65", "Ind": "21 58.33",
                "Lac": "22 27.68", "Leo": "10 40.03", "Lep": "05 33.95", "Lib": "15 11.96",
                "LMi": "10 14.72", "Lup": "15 13.21", "Lyn": "07 59.53", "Lyr": "18 51.17",
                "Men": "05 24.90", "Mic": "20 57.88", "Mon": "07 03.63", "Mus": "12 35.28",
                "Nor": "15 54.18", "Oct": "23 00.00", "Oph": "17 23.69", "Ori": "05 34.59",
                "Pav": "19 36.71", "Peg": "22 41.84", "Per": "03 10.50", "Phe": "00 55.91",
                "Pic": "05 42.46", "PsA": "22 17.07", "Psc": "00 28.97", "Pup": "07 15.48",
                "Pyx": "08 57.16", "Ret": "03 55.27", "Scl": "00 26.28", "Sco": "16 53.24",
                "Sct": "18 40.39", "Ser": "16 57.04", "Sex": "10 16.29", "Sge": "19 39.05",
                "Sgr": "19 05.94", "Tau": "04 42.13", "Tel": "19 19.54", "TrA": "16 04.95",
                "Tri": "02 11.07", "Tuc": "23 46.64", "UMa": "11 18.76", "UMi": "15 00.00",
                "Vel": "09 34.64", "Vir": "13 24.39", "Vol": "07 47.73", "Vul": "20 13.88",
                // things with no constellation put last
                "":    "99 99.99",
            };
            if (x.obj_con !== y.obj_con) {
                return con_to_ra[x.obj_con].localeCompare(con_to_ra[y.obj_con]);
            }
            // Within constellation sort by RA
            if (Math.abs(x.obj_ra - y.obj_ra) > 0.00001) {
                return x.obj_ra - y.obj_ra;
            }
            // For objects with no constellation/RA, sort by name
            if (x.obj_name !== y.obj_name) {
                return x.obj_name.localeCompare(y.obj_name, undefined, {numeric: true, sensitivity: "base"});
            }
            // And finally fall back to date/observation number (encapsulated by obs_id)
            return x.obs_id.localeCompare(y.obs_id);
        };
    }
}

function raStringToFloat(ra_str) {
    const regex = /\d+/g;
    const found = ra_str.match(regex);
    if (found !== null && found.length === 3) {
        const hrs = parseFloat(found[0]);
        const mins = parseFloat(found[1]);
        const secs = parseFloat(found[2]);
        return hrs + (mins / 60.0) + (secs / 3600.0);
    }
    else {
        // This will be the case for things without a position,
        // e.g., planets and comets.
        // Give a high value to put at the end.
        return 99;
    }
}

function doObjectQuery() {
    let namequery_element = document.getElementById("name");
    let type_element = document.getElementById("type");
    let constellation_element = document.getElementById("constellation");
    let dateobs_element = document.getElementById("dateobs");
    let sort_method = document.querySelector('input[name="sort"]:checked').value;

    let newquery = "show=objects";
    let newname = null;
    if (namequery_element.value !== "") {
        newquery += "&name=" + encodeURIComponent(namequery_element.value);
        newname = namequery_element.value;
    }
    let newtype = null;
    if (type_element.value !== "") {
        newquery += "&type=" + encodeURIComponent(type_element.value);
        newtype = type_element.value;
    }
    let newcon = null;
    if (constellation_element.value !== "") {
        newquery += "&con=" + encodeURIComponent(constellation_element.value);
        newcon = constellation_element.value;
    }
    let newdate = null;
    if (dateobs_element.value !== "") {
        newquery += "&date=" + encodeURIComponent(dateobs_element.value);
        newdate = dateobs_element.value;
    }
    newquery += "&sortby=" + encodeURIComponent(sort_method);

    history.replaceState(null, "", window.location.origin + "?" + newquery) ;
    showObjectsForObjectQuery(newname, newtype, newcon, newdate, sort_method);
}

function showObjectsForObjectQuery(name_query, type_query, con_query, date_query, sort_method) {
    let observation_ids_and_matching_obj_info = [];
    let all_matching_object_ids = [];
    for (const [observation_id, observation] of Object.entries(observations)) {
        let matching_objects = [];
        const obj_ids = observation.ObjIds.split("|");
        const objs = obj_ids.map(obj_id => objects[obj_id]);
        for (const obj of objs) {
            let object_matches = true;
            if (name_query !== null && !ObjectNameContains(obj, name_query.toLowerCase())) {
                object_matches = false;
            }
            if (con_query !== null && (
                obj.Con == null || !ObjectConIs(obj, con_query))) {
                object_matches = false;
            }
            if (type_query !== null && (
                obj.Type == null || !ObjectTypeContains(obj, type_query))) {
                object_matches = false;
            }
            if (date_query !== null && !ObsDateContains(observation, date_query)) {
                object_matches = false;
            }
            if (object_matches) {
                matching_objects.push(obj);
            }
        }

        if (matching_objects.length > 0) {
            const obj_name = matching_objects[0].Names.split("/")[0];
            const obj_con = matching_objects[0].Con;
            const obj_ra = raStringToFloat(matching_objects[0].RA);
            const obs_date = observation.Date;
            observation_ids_and_matching_obj_info.push({
                obs_id: observation_id,
                obj_name: obj_name,
                obj_con: obj_con,
                obj_ra: obj_ra,
                obs_date: obs_date
            });
            all_matching_object_ids = all_matching_object_ids.concat(
                matching_objects.map(mo => mo["#id"]));
        }
    }

    // sort observations
    const sort_fun = getSortFunction(sort_method);
    observation_ids_and_matching_obj_info.sort(sort_fun);
    // and strip down to just obs ids
    observation_ids = observation_ids_and_matching_obj_info.map(x => x.obs_id);

    const deduped_matching_obj_ids = all_matching_object_ids.filter(onlyUnique);
    showObservations(observation_ids, deduped_matching_obj_ids);
}

function invert() {
    let invert = document.getElementById("invert").checked;

    // Can change this to use a class name if this is too generic.
    let imgs = document.getElementsByTagName("img");
    for (let i = 0; i < imgs.length; i++) {
        if (invert) {
            imgs[i].style.filter = "invert(1)";
        } else {
            imgs[i].style.filter = null;
        }
    }
}

function showResults() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const show_query = urlParams.get("show");
    if (show_query == "program") {
        const program_name = urlParams.get("name");
        showObjectsForSelectedProgram(program_name);
    } else if (show_query == "objects") {
        const name_query = urlParams.get("name");
        const type_query = urlParams.get("type");
        const con_query = urlParams.get("con");
        const date_query = urlParams.get("date");
        const sort_method = urlParams.has("sortby") ? urlParams.get("sortby") : "name";
        showObjectsForObjectQuery(name_query, type_query, con_query, date_query, sort_method);
    }
}

function updateControlsFromSearchParams() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const show_query = urlParams.get("show");
    if (show_query == "program") {
        const program_name = urlParams.get("name");
        let programpicker = document.getElementById("program");
        programpicker.value = program_name;
    } else if (show_query == "objects") {
        const name_query = urlParams.get("name");
        const type_query = urlParams.get("type");
        const con_query = urlParams.get("con");
        const date_query = urlParams.get("date");
        const sort_method = urlParams.has("sortby") ? urlParams.get("sortby") : "name";
        let namequery_element = document.getElementById("name");
        let type_element = document.getElementById("type");
        let con_element = document.getElementById("constellation");
        let date_element = document.getElementById("dateobs");
        let sort_method_element = document.getElementById(sort_method + "_radio");
        namequery_element.value = name_query;
        type_element.value = type_query;
        con_element.value = con_query;
        date_element.value = date_query;
        sort_method_element.checked = true;
    }
}

function setupControls() {
    let programpicker = document.getElementById("program");
    for (const [program_name, _] of Object.entries(programs).sort()) {
        let option = document.createElement("option");
        option.text = program_name;
        programpicker.add(option);
    }
    let programbutton = document.getElementById("programshow");
    programbutton.addEventListener("click", doProgramQuery);

    let cons = new Set();
    for (const [_, obs] of Object.entries(observations)) {
        const obj_ids = obs.ObjIds.split("|");
        for (const obj_id of obj_ids) {
            const c = objects[obj_id].Con;
            if (c != null) {
                cons.add(c);
            }
        }
    }
    cons = Array.from(cons).sort();
    let conpicker = document.getElementById("constellation_list");
    for (const c of cons) {
        let option = document.createElement("option");
        option.value = c;
        option.text = c;
        conpicker.appendChild(option);
    }

    let objbutton = document.getElementById("objshow");
    objbutton.addEventListener("click", doObjectQuery);

    let invertcheck = document.getElementById("invert");
    invertcheck.addEventListener("click", invert);

    updateControlsFromSearchParams();

    showResults();
}

function handleErrors(responses) {
    for (const response of responses) {
        if (!response.ok) {
            throw Error(response.url + " " + response.statusText);
        }
    }
    return responses;
}

function ParseData(responses) {
    observations = keyByColumn(tsvToJson(responses[0]), "#id");
    objects = keyByColumn(tsvToJson(responses[1]), "#id");
    programs = keyByColumnAsLists(tsvToJson(responses[2]), "#program");
}

function LoadDataAndSetupPage() {
    Promise.all([
        fetch("data/observations.tsv"),
        fetch("data/objects.tsv"),
        fetch("data/programs.tsv"),
    ])
        .then(handleErrors)
        .then(result => Promise.all(result.map(v => v.text())))
        .then(responses => ParseData(responses))
        .then(setupControls);
}

window.onload = LoadDataAndSetupPage;

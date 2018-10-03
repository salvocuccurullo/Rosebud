/*global $, storage */

"use strict";

var storage_keys = [
    {
    'name': 'flip-save-images',
    'type': 'boolean'
    },
    {
        'name': 'flip-dld-images',
        'type': 'boolean'
    },
    {
    'name': 'show-extra-info',
    'type': 'boolean'
    },
    {
        'name': 'enable-notifications',
        'type': 'boolean'
    },
    {
        'name': 'enable-geoloc',
        'type': 'boolean'
    }
];


function get_ls(key) { // eslint-disable-line no-unused-vars

    /*
    if ( ! storage_keys.includes(key) )     // ECMAScript 2016
        return "error";
    */

    var ls_value = storage.getItem(key);

    if (ls_value === "" || ls_value === null || ls_value === undefined) {
        return "";
    }

    return ls_value;

}

function set_ls(key, value) { // eslint-disable-line no-unused-vars

    if (key !== "" && key !== undefined && key !== null && value !== undefined && value !== null) {
        storage.setItem(key, value);
    }
}

function get_ls_bool(key) {
    if (storage.getItem(key) === "true") {
         return true;
    }
    return false;
}

function get_ls_bool_default(key,def) {
    if (storage.getItem(key) === "true") {
         return true;
    }
    else if (storage.getItem(key) === "false") {
         return false;
    }
    return def;
}

function get_all_ls() { // eslint-disable-line no-unused-vars

    var out = {};

    $.each(storage_keys, function (idx, value) {
        var ls_value = storage.getItem(value.name);

        if (ls_value === "" || ls_value === null || ls_value === undefined) {
            out[value] = "";
        } else if (value.type === 'boolean') {
                out[value.name] = get_ls_bool(value.name);
        } else {
                out[value.name] = ls_value;
        }
    });

    return out;
}

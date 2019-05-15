'use strict';


let isEmpty = function (json) {
    const result = json == null || Object.keys(json).length === 0 || json == "";
    return result;
}

let hasValue = function(property) {
    if (property == null || property == "") {
        return false;
    }
    return true;
}

let sanitizeRecord = function (queryObject) {
    const safeProperties  = [
      'user_id',
      'like_count',
      'comment_count',
    //   'public_status',
    //   'timestamp',
    //   'created_at'
    ];
    const safeQueryObject = {};
    safeQueryObject.record_id   = parseInt(queryObject.id),
    queryObject                 = queryObject.data()
  
    for (const property of safeProperties) {
        if (queryObject[property] !== null) {
            safeQueryObject[property] = queryObject[property];
        }
    }
  
    return safeQueryObject
  }

let displayResult = (records) => {
    records.forEach(record => {
        console.log('=>', record)
    });
}

let sortRecords = (records) => {
    return new Promise(function (resolve, reject) {
        resolve(records.sort(function(a, b) {
        return a.comment_count - b.comment_count;
        }))
    }).then((sortedRecords) => {
        records = sortedRecords
        console.log(records.length + " Popular records found: ")
    })
}

/**
 * Randomize array element order in-place.
 * Reference: https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
 */
let shuffleArray = function (array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array
}


module.exports = {
    sanitizeRecord: sanitizeRecord,
    sortRecords: sortRecords,
    shuffleArray: shuffleArray,
    isEmpty: isEmpty,
    hasValue: hasValue,
    displayResult: displayResult
}
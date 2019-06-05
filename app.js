'use strict';

let config = require('./common/configurations');
let constants = require('./common/constants')
let utils = require('./common/utils');
let firebaseDao = require('./modules/firebaseDao');
let engagementConfig = constants.engagementConstants;


let getRecommendations = () => {
    const records = 'records'

    var allRecords = [];
    var popularRecords = []
    var unpopularRecords = []

    getCollection(records)
    .then(snapshot => {
      return getAllRecords(snapshot, allRecords)
    })
    .then(() => {
      return getPopularRecords(allRecords, popularRecords)
    })
    .then(() => {
      return getUnpopularRecords(allRecords, unpopularRecords)
    })
    .then(() => {
      return randomiseRecords(popularRecords, unpopularRecords)
    })
    .then(() => {
      return combineRecords(popularRecords, unpopularRecords)
    })
    .then((result) => {
      return utils.displayResult(result)
    })
    .catch((err) => {
      console.log('Error: ' + err.stack)
    })
}

/**
 * 
 * @param {*} collectionName 
 */
let getCollection = (collectionName) => {
  return db.collection(collectionName).orderBy('created_at','desc').get()
}

/**
 * 
 * @param {*} snapshot 
 * @param {*} allRecords 
 */
let getAllRecords = (snapshot, allRecords) => {
  snapshot.forEach(doc => {
    allRecords.push(utils.sanitizeRecord(doc));
  });
  console.log("Total records found: " + allRecords.length)
}

/**
 * 
 * @param {*} allRecords 
 * @param {*} popularRecords 
 */
let getPopularRecords = function (allRecords, popularRecords) {
  let engagedUsersPost = []
  let unengagedUsersPost = []

  return getPopularPosts(allRecords, popularRecords)
  .then(() => {
    return getEngagedUsers()
  }).then((engagement) => {
    return getEngagedUsersPost(engagedUsersPost, engagement, popularRecords)
  }).then((engagedUsersPost) => {
    return getUnengagedUsersPost(unengagedUsersPost, engagedUsersPost, popularRecords)
  }).then((unengagedUsersPost) => {
    return combinePosts(engagedUsersPost, unengagedUsersPost)
  }).then((result) => {
    popularRecords = result
  }).catch((err) => {
    console.error("Failed to get Popular records: " + err.stack)
  })
}

/**
 * 
 * @param {*} allRecords 
 * @param {*} popularRecords 
 */
let getPopularPosts = (allRecords, popularRecords) => {
  return new Promise(function (resolve, reject) {
    allRecords.forEach(record => {
      if (isPostPopular(record)) 
        popularRecords.push(record)
      })
    console.log()
    console.log("Popular records found: " + popularRecords.length)
    resolve(popularRecords) 
    })
}

/**
 * 
 * @param {*} record 
 */
let isPostPopular = (record) => {
  return (
    isPostReallyPopular(record) ? true: false)
}

let isPostReallyPopular = (record) => {
  return record.comment_count > 4 
  || (
    record.comment_count >= config.popularPostCommentThreshold 
    && record.like_count >= config.popularPostLikeThreshold
    )
}

/**
 * 
 * @param {*} allRecords 
 * @param {*} unpopularRecords 
 */
let getUnpopularRecords = function (allRecords, unpopularRecords) {
  return new Promise(function (resolve, reject) {
    resolve(allRecords.forEach(record => {
      if (isPostUnpopular(record)) 
        unpopularRecords.push(record)
      }))
    }).then(() => {
      console.log()
      console.log("Unpopular records found: " + unpopularRecords.length)
      console.log()
    }).catch((err) => {
      console.error("Failed to get Unpopular records: " + err.stack)
    })
}

/**
 * 
 * @param {*} record 
 */
let isPostUnpopular = (record) => {
  return (record.comment_count <= config.unpopularPostCommentThreshold
    && record.like_count <= config.unpopularPostLikeThreshold
    ? true: false)
}

/**
 * 
 * @param {*} popularRecords 
 * @param {*} unpopularRecords 
 */
let randomiseRecords = (popularRecords, unpopularRecords) => {
  popularRecords     = utils.shuffleArray(popularRecords)
  unpopularRecords   = utils.shuffleArray(unpopularRecords)
}

/**
 * 
 * @param {*} popularRecords 
 * @param {*} unpopularRecords 
 */
let combineRecords = (popularRecords, unpopularRecords) => {
  const popularSliceLimit = parseInt(config.recommendationThreshold * config.popularPostPercentage)
  const unpopularSliceLimit = config.recommendationThreshold * (1- config.popularPostPercentage)

  popularRecords    = popularRecords.slice(0, popularSliceLimit)
  unpopularRecords  = unpopularRecords.slice(0, unpopularSliceLimit)

  return popularRecords.concat(unpopularRecords)
}

/**
 * 
 * @param {*} engagement 
 * @param {*} popularRecords 
 */
let getEngagedUsersPost = (engagedUsersPost, engagement, popularRecords) => {
  for (var i = popularRecords.length - 1; i > 0; i--) {
    for (const engaged_user_id of Object.keys(engagement)) {
      const user_id = popularRecords[i].user_id
      if (user_id == engaged_user_id) {
        engagedUsersPost.push(popularRecords[i])
        continue;
      } 
    } // inner loop closes here
  } // outer loop closes here

  console.log('Engaged Users Post found in popular records: ' + engagedUsersPost.length)
  return engagedUsersPost
}

/**
 * Get getUnengagedUsersPost from post which are popular
 * but from people whose engagementScore is less
 * 
 * @param {*} engagedUsersPost 
 * @param {*} popularRecords 
 */
let getUnengagedUsersPost = (unengagedUsersPost, engagedUsersPost, popularRecords) => {
  var engagedUsersRecordIds   = engagedUsersPost.map(function (post) { return parseInt(post.record_id) })

  popularRecords.forEach(function (poprecord) {

    let counter = 0;
    engagedUsersRecordIds.forEach(function (eng_user_record_id) {
      if (parseInt(poprecord.record_id) != parseInt(eng_user_record_id)) {
        counter += 1;
        if (counter == engagedUsersRecordIds.length) {
          unengagedUsersPost.push(poprecord)
        }
      }
    }) // inner loop closes here
  }) // outer loop closes here

  console.log('Unengaged Users Post found in popular records: ' + unengagedUsersPost.length)
  return unengagedUsersPost
}

let combinePosts = (engagedUsersPost, unengagedUsersPost) => {
  const engagementThreshold = parseInt(config.recommendationThreshold * config.popularPostPercentage)
  const engageSliceLimit    = parseInt(engagementThreshold * config.engagedUsersPostPercentage)
  const unengageSliceLimit  = (1- config.engagedUsersPostPercentage) != 0 
  ? parseInt(engagementThreshold * (1- config.engagedUsersPostPercentage) + 1)
  : parseInt(engagementThreshold * (1- config.engagedUsersPostPercentage))

  engagedUsersPost    = engagedUsersPost.slice(0, engageSliceLimit)
  unengagedUsersPost  = unengagedUsersPost.slice(0, unengageSliceLimit)

  return engagedUsersPost.concat(unengagedUsersPost)
}

let getEngagedUsers = () => {
  let engagement = {}

  return computeUserLikeScore(engagement)
  .then((engagement) => {
    return computeUserCommentScore(engagement)
  }).then((engagement) => {
    return computeUserAvgEngagementScore(engagement)
  }).then((engagement) => {
    return filterUser(engagement)
  }).then((engagement) => {
    return engagement
  }).catch((err) => {
    console.log(err.stack)
  })
}

let computeUserLikeScore = (engagement) => {
  return new Promise(function (resolve, reject) {
    const collectionName = 'likes'
    resolve(computeScore(engagement, collectionName))
  })
}

let computeUserCommentScore = (engagement) => {
  return new Promise(function (resolve, reject) {
    const collectionName = 'comments'
    resolve(computeScore(engagement, collectionName))
  })
}

let computeUserAvgEngagementScore = (engagement) => {
  return new Promise(function (resolve, reject) {
    resolve(computeAverageScore(engagement))
  })
}

let filterUser = (engagement) => {
  return new Promise(function (resolve, reject) {
    resolve(filterUserByAvgScore(engagement))
  })
}

let filterUserByAvgScore = (engagement) => {
  let filteredResult = {}
  for (const [user_id, value] of Object.entries(engagement)) {
    if (value.average_score > config.avgEngagementScoreThreshold) {
      filteredResult[user_id] = value
    }
  }
  return filteredResult
}

let computeAverageScore = (engagement) => {
  return new Promise(function (resolve, reject) {
    Object.entries(engagement).forEach(entry => {
      if (utils.hasValue(entry)) {
        const user_id         = entry[0]
        entry                 = entry[1]

        const comment_count   = utils.hasValue(entry.comment_count) 
                              ? entry.comment_count
                              : setZeroEntry(0, user_id, engagement, "comment_count")

        const like_count      = utils.hasValue(entry.like_count) 
                              ? entry.like_count
                              : setZeroEntry(0, user_id, engagement, "like_count")

        engagement[user_id]["average_score"] = ((comment_count + like_count) / Object.keys(entry).length)
        resolve(engagement)
      }
    })
  })
}

let setZeroEntry = (val, user_id, engagement, measure) => {
  engagement[user_id][measure] = val
  return 0
}

let computeScore = (engagement, collectionName) => {
  return new Promise(function (resolve, reject) {
    getCollection(collectionName)
    .then((snapshot)=> {
      snapshot.forEach(doc => {
        let result = doc.data()
        let user_id = result.user_id
  
        if ( user_id in engagement ) {
          updateEngagementScore(collectionName, engagement, result)
        } else {
          insertEngagementScore(collectionName, engagement, result)
        }
      });
    })
    .then(() => {
      resolve(engagement)
    })
    .catch((err) => {
      reject(err)
    })
  })
}

let insertEngagementScore = (collectionName, engagement, result) => {
  engagement[result.user_id] = setEngagementScore(collectionName)
}

let updateEngagementScore = (collectionName, engagement, result) => {
  const scoreAttribute = engagementConfig[collectionName]

  if (scoreAttribute in engagement[result.user_id]) {
    engagement[result.user_id][scoreAttribute] = parseInt(engagement[result.user_id][scoreAttribute]) + 1
  } else {
    engagement[result.user_id][scoreAttribute] = 1
  }
}

let setEngagementScore = (collectionName) => {
  const scoreAttribute  = engagementConfig[collectionName];
  const score           = {}
  score[scoreAttribute] = 1

  return score
}


/**
 * Create firebase db instance
 */
const db = firebaseDao.initializeFirebaseDb()

/**
 * Get records from here
 */
getRecommendations()
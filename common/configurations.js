

const configuration = {
    serviceAccountKey               : '<Add service account json path>',

    recommendationThreshold         : 20,
    popularPostPercentage           : 0.7,

    popularPostLikeThreshold        : 3,
    popularPostCommentThreshold     : 3,

    engagedUsersPostPercentage      : 0.7,

    unpopularPostLikeThreshold      : 1,
    unpopularPostCommentThreshold   : 1,

    avgEngagementScoreThreshold     : 5
}

module.exports = configuration;
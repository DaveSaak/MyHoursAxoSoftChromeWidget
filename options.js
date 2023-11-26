function Options() {
    'use strict';

    var _this = this;

    _this.useDevOps = false;

    _this.axoSoftUrl = "";
    _this.axoSoftToken = "";
    _this.axoSoftUserId = 0;
    _this.axoSoftDefaultWorklogTypeId = 3;
    _this.axoSoftRecentItemsBubbleChartHiddenItemsIds = '';
    
    _this.contentSwitchProjectId = 0;
    _this.developmentTaskName = 'development';
    _this.contentSwitchZoneReEnterTime = 10;

    _this.allHoursAccessToken = '';
    _this.allHoursRefreshToken = '';
    _this.allHoursAccessTokenValidTill = '';
    _this.allHoursUrl = '';
    _this.allHoursUserName = '';
    _this.isSecret = '';

    _this.myHoursDefaultTagId = '';
    _this.myHoursCommonProjectId = '';
    // _this.myHoursRootClientId = '';
    _this.myHoursCommonDescriptions = '';
    _this.myHoursDistractionTaskId = '';
    _this.myHoursDistractionComment = '';

    _this.notificationsBadRatio = true;

    _this.devOpsAuthorName = '';
    _this.devOpsUserId = '';
    _this.devOpsPullRequestRepos = '';
    _this.devOpsPullRequestMyReviewerGroups = '';

    _this.recentItemsBubbleChartHiddenItemsIds = '';

    _this.extraTravelReimbursementDistance = 0;
    _this.extraTravelReimbursementKmCost = 0;
    _this.extraShowGaps = false;
    _this.extraGapsMinLength = 15;




    _this.save = function () {
        // console.info("saving options");

        return new Promise(
            function (resolve, reject) {

                if (chrome == undefined || chrome.storage == undefined) {
                    console.warn('cannot access chrome storage api');

                    reject();
                } else {
                    // console.info("saving options to the chrome store");
                    chrome.storage.sync.set({
                        'options': _this
                    })
                    resolve(_this);
                }
            }
        );
    };


    _this.load = function () {
        // console.info("loading options");

        return new Promise(
            function (resolve, reject) {
                if (chrome == undefined || chrome.storage == undefined) {
                    console.warn('cannot access chrome storage api');

                    reject();
                } else {
                    // console.info("loading options from the chrome store");

                    chrome.storage.sync.get('options', function (items) {
                        if (items.options) {
                            // console.info("found saved options");
                            //console.info(items.options);

                            _this.useDevOps = items.options.useDevOps;


                            _this.axoSoftUrl = items.options.axoSoftUrl;
                            _this.axoSoftToken = items.options.axoSoftToken;
                            _this.axoSoftUserId = items.options.axoSoftUserId;
                            _this.axoSoftDefaultWorklogTypeId = items.options.axoSoftDefaultWorklogTypeId;
                            _this.axoSoftRecentItemsBubbleChartHiddenItemsIds = items.options.axoSoftRecentItemsBubbleChartHiddenItemsIds;

                            _this.contentSwitchProjectId = items.options.contentSwitchProjectId;
                            _this.developmentTaskName = items.options.developmentTaskName;
                            _this.contentSwitchZoneReEnterTime = items.options.contentSwitchZoneReEnterTime;

                            _this.allHoursAccessToken = items.options.allHoursAccessToken;
                            _this.allHoursRefreshToken = items.options.allHoursRefreshToken;
                            _this.allHoursAccessTokenValidTill = items.options.allHoursAccessTokenValidTill;
                            _this.allHoursUrl = items.options.allHoursUrl;
                            _this.allHoursUserName = items.options.allHoursUserName;

                            _this.isSecret = items.options.isSecret;

                            _this.devOpsInstanceUrl = items.options.devOpsInstanceUrl;
                            _this.devOpsPersonalAccessToken = items.options.devOpsPersonalAccessToken;
                            // _this.devOpsDefaultWorklogType = items.options.devOpsDefaultWorklogType;
                            _this.devOpsAuthorName = items.options.devOpsAuthorName;
                            _this.devOpsUserId = items.options.devOpsUserId;
                            _this.devOpsPullRequestRepos = items.options.devOpsPullRequestRepos;
                            _this.devOpsPullRequestMyReviewerGroups = items.options.devOpsPullRequestMyReviewerGroups;

                            _this.myHoursDefaultTagId = items.options.myHoursDefaultTagId;
                            _this.myHoursCommonProjectId = items.options.myHoursCommonProjectId;
                            _this.myHoursCommonDescriptions = items.options.myHoursCommonDescriptions;
                            _this.myHoursDistractionTaskId = items.options.myHoursDistractionTaskId;
                            _this.myHoursDistractionComment = items.options.myHoursDistractionComment;

                            _this.notificationsBadRatio = items.options.notificationsBadRatio;
                            _this.recentItemsBubbleChartHiddenItemsIds = items.options.recentItemsBubbleChartHiddenItemsIds;


                            _this.extraTravelReimbursementDistance = items.options.extraTravelReimbursementDistance;
                            _this.extraTravelReimbursementKmCost = items.options.extraTravelReimbursementKmCost;
                            _this.extraShowGaps = items.options.extraShowGaps;
                            _this.extraGapsMinLength = items.options.extraGapsMinLength;
                        }

                        resolve();
                    });
                }
            }
        )
    }


}
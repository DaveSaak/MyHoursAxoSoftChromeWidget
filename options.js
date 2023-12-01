function Options() {
    'use strict';

    const storageKeys = ['gaps', 'options', 'travelReimbursement'];

    var _this = this;

    _this.useDevOps = false;

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
    _this.myHoursCommonDescriptions = '';
    _this.myHoursDistractionTaskId = '';
    _this.myHoursDistractionComment = '';

    _this.notificationsBadRatio = true;

    _this.devOpsAuthorName = '';
    _this.devOpsUserId = '';
    _this.devOpsPullRequestRepos = '';
    _this.devOpsPullRequestMyReviewerGroups = '';

    _this.recentItemsBubbleChartHiddenItemsIds = '';


    // _this.extraShowGaps = false;
    // _this.extraGapsMinLength = 15;

    _this.gaps = {
        showGaps: false,
        minLength: 15
    }

    _this.travelReimbursement = {
        distance: 0,
        kmCost: 0
    }


    _this.save = function () {
        // console.info("saving options");

        return new Promise(
            function (resolve, reject) {

                if (chrome == undefined || chrome.storage == undefined) {
                    console.warn('cannot access chrome storage api');

                    reject();
                } else {

                    const {gaps, travelReimbursement, ...mainOptions} = _this;
// console.log(gaps);
// console.log(travelReimbursement);
// console.log(mainOptions);

                    // const subset = {c, d};

                    const items = {
                        options: mainOptions,
                        gaps: gaps,
                        travelReimbursement: travelReimbursement
                    }

                    // console.info("saving options to the chrome store");
                    chrome.storage.sync.set(items, function () {
                        // Callback function to handle the completion of the storage operation
                        if (chrome.runtime.lastError) {
                            console.error(chrome.runtime.lastError);
                            reject();
                        } else {
                            console.log('Items have been successfully set in chrome.storage.sync');
                            resolve(_this);
                        }
                    })

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

                    chrome.storage.sync.get(storageKeys, function (items) {
                        if (items.options) {
                            // console.info("found saved options");
                            //console.info(items.options);

                            _this.useDevOps = items.options.useDevOps;

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

                            console.log('options', items.options);
                        }

                        if (items.gaps) {
                            _this.gaps = items.gaps;
                        }

                        if (items.travelReimbursement) {
                            _this.travelReimbursement = items.travelReimbursement;
                        }

                        resolve();
                    });
                }
            }
        )
    }


}
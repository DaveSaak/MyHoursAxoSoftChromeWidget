function Options() {
    'use strict';


    var _this = this;

    _this.allHoursAccessToken = '';
    _this.allHoursRefreshToken = '';
    _this.allHoursAccessTokenValidTill = '';
    _this.notificationsBadRatio = true;
    _this.recentItemsBubbleChartHiddenItemsIds = '';



    _this.kaboomDefinitions = [];


    _this.save = function () {
        // console.info("saving options");

        return new Promise(
            function (resolve, reject) {

                if (chrome == undefined || chrome.storage == undefined) {
                    console.warn('cannot access chrome storage api');

                    reject();
                } else {

                    const items = {
                        options: {
                            allHoursAccessToken: _this.allHoursAccessToken,
                            allHoursRefreshToken: _this.allHoursRefreshToken,
                            allHoursAccessTokenValidTill: _this.allHoursAccessTokenValidTill,
                            notificationsBadRatio: _this.notificationsBadRatio,
                            recentItemsBubbleChartHiddenItemsIds: _this.recentItemsBubbleChartHiddenItemsIds,
                        }
                    }

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


                    /*
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
                    
                        if (items.kaboomDefinitions) {
                            _this.kaboomDefinitions = items.kaboomDefinitions;
                        }

                        resolve();
                    });

                    // load settings from local json
                    fetch(chrome.runtime.getURL("settings.json"))
                        .then(response => response.json())
                        .then(data => {
                            console.log("JSON Data:", data);

                            _this = {..._this, ...data};

                            
                            
                            // _this.myHours.defaultProjectId = data.myHours.defaultProjectId;
                            // _this.myHours.defaultTaskId = data.myHours.defaultTaskId;
                            // _this.myHours.defaultTagId = data.myHours.defaultTagId;

                        })
                        .catch(error => console.error("Error loading JSON:", error));

                        */


                    const storagePromise = new Promise((resolveStorage) => {
                        chrome.storage.sync.get('options', function (items) {
                            if (items.options) {
                                Object.assign(_this, items.options);
                            }
                            resolveStorage();
                        });
                    });

                    const settingsPromise = fetch(chrome.runtime.getURL("settings.json"))
                        .then(response => response.json())
                        .then(data => {
                            console.log("JSON Data:", data);
                            Object.assign(_this, data);
                        })
                        .catch(error => {
                            console.error("Error loading settings:", error);
                            // If fetch fails, we still want to continue
                        });

                    const automatonsPromise = fetch(chrome.runtime.getURL("automatons.json"))
                        .then(response => response.json())
                        .then(data => {
                            console.log("JSON Data:", data);
                            Object.assign(_this, data);
                        })
                        .catch(error => {
                            console.error("Error loading automatons:", error);
                            // If fetch fails, we still want to continue
                        });                        

                    Promise.all([
                        storagePromise, 
                        settingsPromise, 
                        automatonsPromise
                    ])
                        .then(() => resolve())
                        .catch(err => reject(err));



                }
            }
        )
    }


}
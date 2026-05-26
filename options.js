function Options() {
    'use strict';


    var _this = this;

    _this.allHoursAccessToken = '';
    _this.allHoursRefreshToken = '';
    _this.allHoursAccessTokenValidTill = '';
    _this.notificationsBadRatio = true;
    _this.recentItemsBubbleChartHiddenItemsIds = '';
    _this.theme = 'spica';



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
                            theme: _this.theme,
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

        return new Promise(
            function (resolve, reject) {
                if (chrome == undefined || chrome.storage == undefined) {
                    console.warn('cannot access chrome storage api');

                    reject();
                } else {
   
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
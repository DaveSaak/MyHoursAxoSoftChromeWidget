chrome.webRequest.onCompleted.addListener(function (details) {
    const parsedUrl = new URL(details.url);
    if (details.tabId) {
        // console.log(details.method);
        // console.log(parsedUrl.pathname);
        if (
            (details.method === "GET" && parsedUrl.pathname === "/api/logs") ||
            (details.method === "PUT" && parsedUrl.pathname === "/api/logs")) {
            chrome.tabs.sendMessage(details.tabId, { type: 'logs-changed' });
            console.log('background script message sent: logs-changed');
        }
    }
},
    {
        urls: [
            "https://myhoursproduction-api.azurewebsites.net/api/*",
            "https://api2.myhours.com/api/*"
        ]
    }
);

chrome.webRequest.onCompleted.addListener(function (details) {
    const parsedUrl = new URL(details.url);
    //console.log(details);
    if (details.tabId) {
        //console.log(details);

        if (details.method === "GET" &&
            parsedUrl.pathname.includes("/OnTime/api/v6/features") &&
            parsedUrl.pathname.includes("template/view")) {
            chrome.tabs.sendMessage(details.tabId, { type: 'axo-item-loaded' });
            console.log('background script message sent: axo-item-loaded');
        }
    }
},
    {
        urls: [
            "http://despacito.spica.si/OnTime/api/*",
            "https://ontime.spica.com:442/OnTime/api/*",
        ]
    }
);


chrome.webRequest.onCompleted.addListener(function (details) {
    const parsedUrl = new URL(details.url);
    //console.log(details);
    if (details.tabId) {
        //console.log(details);

        if (details.method === "GET" 
            && parsedUrl.pathname.includes("/_workitems") 
            // && parsedUrl.pathname.includes("template/view")
            ) 
        {
            chrome.tabs.sendMessage(details.tabId, { type: 'devops-item-loaded' });
            console.log('background script message sent: devops-item-loaded');
        }
    }
},
    {
        urls: [
            "https://dev.azure.com/*",
            // "https://dev.azure.com/Spica-International/*/_workitems/*",
        ]
    }
);

// https://dev.azure.com/Spica-International/Spica%20Common/_workitems


chrome.runtime.onMessage.addListener(function (message) {
    if (message && message.type == 'copy') {
        var input = document.createElement('textarea');
        document.body.appendChild(input);
        input.value = message.text;
        input.focus();
        input.select();
        document.execCommand('Copy');
        input.remove();
    }

    if (message && message.type == 'refreshBadge') {
        refreshBadge();
    }

});


// var requestData = {"action": "createContextMenuItemStartLog"};
// chrome.extension.sendRequest(requestData);

chrome.extension.onRequest.addListener(function (request, sender, callback) {
    if (request.action == 'createContextMenuItemStartLog') {
        // console.log(chrome.contextMenus);

        let options = new Options();
        options.load().then(_ => {

            chrome.contextMenus.remove("spicaContextMenu");

            // console.log('create mh tools');
            chrome.contextMenus.create({
                title: "Spica tools",
                id: "spicaContextMenu",
                contexts: ["all"]
            });


            if (!options.useDevOps) {
                chrome.contextMenus.create({
                    title: "Axo: start timer for Item #%s",
                    id: "axoParent",
                    parentId: "spicaContextMenu",
                    contexts: ["selection"],
                    onclick: startTrackingTimeAxo
                });

                if (options.myHoursCommonDescriptions) {
                    let descriptions = options.myHoursCommonDescriptions.split(';');
                    descriptions.forEach(function (value, i) {
                        if (!options.useDevOps) {
                            chrome.contextMenus.create({
                                title: "Axo: start timer for Item #%s -- " + value,
                                id: `mhDescription_${i}`,
                                parentId: "spicaContextMenu",
                                contexts: ["selection"],
                                onclick: startTrackingTimeAxo
                            });
                        }
                    })
                }
            }

            if (options.useDevOps) {
                chrome.contextMenus.create({
                    title: "Start timer for #%s",
                    parentId: "spicaContextMenu",
                    contexts: ["selection"],
                    onclick: startTrackingTimeDevOps
                });
            }

            chrome.contextMenus.create({
                title: "Start timer with description: '%s'",
                parentId: "spicaContextMenu",
                contexts: ["selection"],
                onclick: startTrackingTime
            });

            chrome.contextMenus.create({
                type: 'separator',
                parentId: "spicaContextMenu",
                contexts: ["all"],
            });

            chrome.contextMenus.create({
                title: "Add to running log description",
                parentId: "spicaContextMenu",
                contexts: ["selection"],
                onclick: updateRunningLogDescription
            });

/*
            if (sender?.url?.startsWith('https://dev.azure.com/')) {
                chrome.contextMenus.create({
                    type: 'separator',
                    parentId: "spicaContextMenu",
                    contexts: ["all"],
                });

                chrome.contextMenus.create({
                    title: "Copy branch name to clipboard",
                    parentId: "spicaContextMenu",
                    contexts: ["selection"],
                    onclick: getBranchName
                });
            }
            */
        // });


        // chrome.contextMenus.create({
        //     type: 'separator',
        //     parentId: "spicaContextMenu",
        //     contexts: ["all"],
        // });

        // chrome.contextMenus.create({
        //     title: "Copy branch name to clipboard",
        //     parentId: "spicaContextMenu",
        //     contexts: ["selection"],
        //     onclick: getBranchName
        // });



        // chrome.contextMenus.create({
        //     title: "Stop running log",
        //     parentId: "spicaContextMenu",
        //     contexts: ["all"],
        //     onclick: stopTimer
        // });

    });
           

    }
}
);


var checkInterval = 10;
chrome.alarms.create("checkAxoWorklogForYesterday", {
    delayInMinutes: 1,
    periodInMinutes: checkInterval
});

chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name === "checkAxoWorklogForYesterday") {
        console.log('alarm - checkAxoWorklogForYesterday');
        refreshBadge();
    }
});

function refreshBadge() {
    let currentUser = new CurrentUser();
    let options = new Options();

    //check only fro m 6.00 till 12.00

    let today = moment().startOf('day');
    // if (today.hour() < 6 && hour() > 14){
    //     return;
    // }

    console.info(`refresh badge: checking ratio`);
    options.load().then(
        function () {
            if (!chrome.browserAction?.setBadgeText) {
                return;
            }

            currentUser.load(function () {
                let allHoursApi = new AllHoursApi(options);
                let yesterday = today.add(-1, 'days');
                console.info(`refresh badge: get minutes worked yesterday`);

                if (options.useDevOps) {
                    const myHoursApi = new MyHoursApi(currentUser);

                    myHoursApi.getLogs(today).then(logs => {
                        const sumDuration = logs.reduce((accumulator, log) => accumulator + log.duration / 60, 0);
                        console.log(sumDuration);

                        allHoursApi.getCurrentUserId().then(currentUserId => {
                            allHoursApi.getAttendance(currentUserId, yesterday).then(results => {
                                if (results && results.CalculationResultValues.length > 0) {
                                    let attendance = parseInt(results.CalculationResultValues[0].Value, 10);
                                    // console.info(`refresh badge: ah attendance ${attendance}`);
                                    setBadge(sumDuration, attendance);
                                } else {
                                    console.info('refresh badge: no attendance data.');
                                    chrome.browserAction.setBadgeText({ text: `` });
                                }
                            });
                        });

                    });
                } else {
                    let axoSoftApi = new AxoSoftApi(options);
                    axoSoftApi.getWorkLogMinutesWorked(yesterday).then(
                        function (axoMinutes) {
                            console.info(`refresh badge: axo minutes ${axoMinutes}`);
                            allHoursApi.getCurrentUserId().then(
                                function (currentUserId) {
                                    console.info(`refresh badge: get attendance`);
                                    allHoursApi.getAttendance(currentUserId, yesterday).then(
                                        function (data) {
                                            if (data && data.CalculationResultValues.length > 0) {
                                                let attendance = parseInt(data.CalculationResultValues[0].Value, 10);
                                                console.info(`refresh badge: ah attendance ${attendance}`);
                                                setBadge(axoMinutes, attendance);
                                            } else {
                                                console.info('refresh badge: no attendance data.');
                                                chrome.browserAction.setBadgeText({ text: `` });
                                            }

                                        },
                                        function (error) {
                                            console.error('refresh badge: error while getting attendance.');
                                            console.log(error);
                                        }
                                    )
                                }
                            )
                        }
                    )
                        .catch(error => {
                            console.log('refresh badge: error:');
                            console.log(error);
                            chrome.browserAction.setBadgeText({ text: 'Err' });
                            chrome.browserAction.setBadgeBackgroundColor({
                                color: '#222222'
                            });
                        });
                }
            })
        }
    )
}

function setBadge(value, reference) {
    // reference = ah
    // value = axo, devops
    if (reference > 0) {

        let ratio = value / reference;
        console.info(`refresh badge: ratio ${ratio}`);

        chrome.browserAction.setBadgeText({ text: `${Math.floor(ratio * 100)}%` });
        if (ratio < 0.9 || ratio > 1) {
            if (chrome.browserAction.setBadgeTextColor) {
                chrome.browserAction.setBadgeTextColor({ color: '#111' });
            }
            chrome.browserAction.setBadgeBackgroundColor({ color: '#A4002D)' });
            //chrome.browserAction.setBadgeText({ text: `$` }); 

            //inform user that sync must be done every hour or so
            if (options.notificationsBadRatio && moment().minute() <= 10) {
                chrome.notifications.create('', getNotificationOptions(`Yesterdays' ratio is ${Math.floor(ratio * 100)}%. Do something about it.`), function () { });
            }
        }
        else {
            if (chrome.browserAction.setBadgeTextColor) {
                chrome.browserAction.setBadgeTextColor({ color: '#111' });
            }
            chrome.browserAction.setBadgeBackgroundColor({ color: '#339933' });
        }
    }
    else {
        console.error('refresh badge: reference == 0');
        chrome.browserAction.setBadgeText({ text: `` });
    }
}

function startTrackingTimeAxo(info, tab) {

    let currentUser = new CurrentUser();
    let options = new Options();
    let myHoursApi = new MyHoursApi(currentUser);

    options.load().then(
        function () {
            currentUser.load(function () {
                let axoSoftApi = new AxoSoftApi(options);

                axoSoftApi.getWorkLogTypes()
                    .then(response => {
                        let defaultWorkLogType = "";
                        let worklogTypes = response;
                        var workLogType = _.find(worklogTypes,
                            function (w) {
                                return w.id.toString() === options.axoSoftDefaultWorklogTypeId.toString();
                            });

                        if (workLogType) {
                            defaultWorkLogType = workLogType.name;
                        }

                        let myHoursNote = info.selectionText;
                        if (defaultWorkLogType !== "") {
                            myHoursNote = myHoursNote + '/' + defaultWorkLogType.toLowerCase();

                            if (info.menuItemId) {
                                let descriptionIndex = info.menuItemId.split('_')[1];
                                let description = options.myHoursCommonDescriptions.split(';')[descriptionIndex];
                                if (description) {
                                    myHoursNote = `${myHoursNote} ${description}`;
                                }
                            }


                        }

                        myHoursApi.getRefreshToken(currentUser.refreshToken).then(
                            function (token) {
                                console.info('got refresh token. token: ');
                                console.info(token);

                                currentUser.setTokenData(token.accessToken, token.refreshToken);
                                currentUser.save();

                                myHoursApi.startLog(myHoursNote + ' ')
                                    .then(
                                        function (data) {
                                            chrome.notifications.create('', getNotificationOptions('Log started. Axo item #' + info.selectionText), function () { });
                                            refreshMyHoursPage();
                                        },
                                        function (error) {
                                            console.log(error);
                                            chrome.notifications.create('', getNotificationOptions("There was an error. Open widget so the token gets refreshed. If that doesn't help check console for errors."), function () { });
                                        }
                                    );
                            }
                        )
                    });
            });
        });
}

function startTrackingTimeDevOps(info, tab) {

    let currentUser = new CurrentUser();
    let options = new Options();
    let myHoursApi = new MyHoursApi(currentUser);

    options.load().then(
        function () {
            currentUser.load(function () {

                myHoursApi.getRefreshToken(currentUser.refreshToken).then(
                    function (token) {
                        console.info('got refresh token. token: ');
                        console.info(token);

                        currentUser.setTokenData(token.accessToken, token.refreshToken);
                        currentUser.save();

                        myHoursApi.startLogFromId(info.selectionText.trim(), options.myHoursDefaultTagId)
                            .then(
                                (data) => {
                                    if (data.logStarted) {
                                        refreshMyHoursPage();
                                        chrome.notifications.create('', getNotificationOptions(`Log started: ${data.projectTask.name}`), function () { });
                                    } else {
                                        chrome.notifications.create('', getNotificationOptions(`There is no incompleted no task with id ${info.selectionText}`), function () { });
                                    }
                                }
                            )
                            .catch(() => {
                                chrome.notifications.create('', getNotificationOptions(`There was an error. See console.`), function () { });
                            })
                    });
            });
        });
}

function startTrackingTime(info, tab) {
    const options = new Options();
    options.load().then(
        _ => {
            const currentUser = new CurrentUser();
            currentUser.load(_ => {
                const myHoursApi = new MyHoursApi(currentUser);
                myHoursApi.getRefreshToken(currentUser.refreshToken)
                .then(
                    function (token) {
                        console.info('got refresh token. token: ');
                        console.info(token);

                        currentUser.setTokenData(token.accessToken, token.refreshToken);
                        currentUser.save();

                        myHoursApi.startLog(info.selectionText)
                            .then(
                                function (data) {
                                    chrome.notifications.create('', getNotificationOptions('Log started. Description: ' + info.selectionText), function () { });
                                    refreshMyHoursPage();
                                },
                                function (error) {
                                    console.log(error);
                                    chrome.notifications.create('', getNotificationOptions("There was an error. Open widget so the token gets refreshed. If that doesn't help check console for errors."), function () { });
                                }
                            );
                    }
                )
            })
        }
    );
}

function stopTimer(info, tab) {

    let currentUser = new CurrentUser();
    let options = new Options();
    let myHoursApi = new MyHoursApi(currentUser);

    options.load().then(
        function () {
            currentUser.load(function () {
                myHoursApi.getRefreshToken(currentUser.refreshToken).then(
                    function (token) {
                        console.info('got refresh token. token: ');
                        console.info(token);

                        currentUser.setTokenData(token.accessToken, token.refreshToken);
                        currentUser.save();

                        myHoursApi.stopTimer()
                            .then(
                                function (data) {
                                    let message = '';
                                    if (data) {
                                        message = "Timer stopped: " + data.note
                                    }
                                    else {
                                        message = "There are no running logs."
                                    }
                                    chrome.notifications.create('', getNotificationOptions(message), function () { });
                                    refreshMyHoursPage();
                                },
                                function (error) {
                                    console.log(error);
                                    chrome.notifications.create('', getNotificationOptions("There was an error. Open widget so the token gets refreshed. If that doesn't help check console for errors."), function () { });
                                }
                            );
                    }
                )

            });
        });
}

// function insertTimeStamp(info, tab){

//         chrome.tabs.sendMessage(tab.id, "getClickedElement", {frameId: info.frameId}, data => {
//             if (data?.element) {
//                 const timeStamp = new Date().toDateString() + ': ';

//                 element.focus();
//                 [...timeStamp].map((x) => {
//                     document.dispatchEvent(new KeyboardEvent("keydown", { key: x }));
//                 });
//             }

//         });




// }

function createProject(info, tab) {

    let currentUser = new CurrentUser();
    let myHoursApi = new MyHoursApi(currentUser);

    myHoursApi.getRefreshToken(currentUser.refreshToken).then(
        function (token) {
            console.info('got refresh token. token: ');
            console.info(token);

            currentUser.setTokenData(token.accessToken, token.refreshToken);
            currentUser.save();

            myHoursApi.createProject(info.selectionText)
                .then(
                    function (data) {
                        chrome.notifications.create('', getNotificationOptions('Project created.'), function () { });
                    },
                    function (error) {
                        console.log(error);
                        chrome.notifications.create('', getNotificationOptions("There was an error. Open widget so the token gets refreshed. If that doesn't help check console for errors."), function () { });
                    }
                );
        }
    )

}

function updateRunningLogDescription(info, tab) {

    let currentUser = new CurrentUser();
    let options = new Options();
    let myHoursApi = new MyHoursApi(currentUser);

    options.load().then(
        function () {
            currentUser.load(function () {
                myHoursApi.getRefreshToken(currentUser.refreshToken).then(
                    function (token) {
                        currentUser.setTokenData(token.accessToken, token.refreshToken);
                        currentUser.save();

                        myHoursApi.updateRunningLogDescription(info.selectionText)
                            .then(
                                function (updatedLog) {

                                    if (updatedLog) {
                                        chrome.notifications.create('', getNotificationOptions("Description updated: " + updatedLog.note), function () { });
                                    }
                                    else {
                                        chrome.notifications.create('', getNotificationOptions("There are no running logs"), function () { });
                                    }
                                    refreshMyHoursPage();
                                },
                                function (error) {
                                    console.log(error);
                                    chrome.notifications.create('', getNotificationOptions("There was an error. Open widget so the token gets refreshed. If that doesn't help check console for errors."), function () { });
                                }
                            );
                    }
                )

            });
        });
}

function getBranchName(info, tab) {

    /*
    // console.log("selection: " + info.selectionText);
    let branchName = info.selectionText.toLowerCase().trim().replace(/ /g, "-");

    // console.log('background script - copy-to-clipboard message sent.');
    //chrome.tabs.sendMessage(tab.id, { type: 'copy-to-clipboard', text: branchName });

    navigator.clipboard.writeText(request.branchName).then(function () {
        console.log('Async: Copying to clipboard was successful!');
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
    });
    */


    let branchName = info.selectionText
        .toLowerCase()
        .trim()
        .replace(/[\W_]+/g, " ")  //remove all non alpha chars
        .replace(/\s\s+/g, ' ')  //replace mulitple spaces with single one. 
        .replace(/ /g, "-");     //replace spaces with dashes

    // let fullBranchName = itemId + "-" + branchName;

    // chrome.runtime.sendMessage({
    //     type: 'copy',
    //     text: branchName
    // });

    var input = document.createElement('textarea');
    document.body.appendChild(input);
    input.value = branchName;
    input.focus();
    input.select();
    document.execCommand('Copy');
    input.remove();

    chrome.notifications.create('', getNotificationOptions("Copied to clipboard: " + branchName), function () { });

}

function refreshMyHoursPage() {

    chrome.tabs.query({ url: 'https://app.myhours.com/*' }, function (foundTabs) {
        foundTabs.forEach(myHoursTab => {
            console.info('refreshing myhours tabs');
            chrome.tabs.reload(
                myHoursTab.id
            );
        });
    });

}

function getNotificationOptions(message) {
    return {
        type: 'basic',
        iconUrl: './images/ts-badge128.png',
        title: 'Spica extension',
        message
    };
}
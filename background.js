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
});


chrome.extension.onRequest.addListener(function (request, sender, callback) {
    if (request.action == 'createContextMenuItemStartLog') {
        
        chrome.contextMenus.remove("mhParent");

        chrome.contextMenus.create({
            title: "My Hours tools",
            id: "mhParent",
            contexts: ["all"]
        });

        chrome.contextMenus.create({
            // title: "Start tracking time for Axo Item",
            title: "Start tracking time for Axo Item #%s",
            parentId: "mhParent",
            contexts: ["selection"],
            onclick: startTrackingTimeAxo
        });

        chrome.contextMenus.create({
            // title: "Start tracking time with description",
            title: "Start tracking time with description: '%s'",
            parentId: "mhParent",
            contexts: ["selection"],
            onclick: startTrackingTime
        });

        chrome.contextMenus.create({
            type: 'separator',
            parentId: "mhParent",
            contexts: ["all"],
        });     
        
        chrome.contextMenus.create({
            // title: "Add to running log description",
            title: "Add to running log description",
            parentId: "mhParent",
            contexts: ["selection"],
            onclick: updateRunningLogDescription
        });          

        chrome.contextMenus.create({
            title: "Stop running log",
            parentId: "mhParent",
            contexts: ["all"],
            onclick: stopTimer
        });
           
        chrome.contextMenus.create({
            type: 'separator',
            parentId: "mhParent",
            contexts: ["all"],
        });          

        chrome.contextMenus.create({
            title: "Add new project: '%s'",
            parentId: "mhParent",
            contexts: ["selection"],
            onclick: createProject
        });  
            

    }
}
);

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
                                            var notificationOptions = {
                                                type: 'basic',
                                                iconUrl: './images/MH-badge.png',
                                                title: 'My Hours',
                                                message: 'Log started. Axo item #' + info.selectionText
                                            };
                                            //chrome.notifications.create('', 'Log started');
                                            chrome.notifications.create('', notificationOptions, function () { });
                                        },
                                        function (error) {
                                            console.log(error);
                                            var notificationOptions = {
                                                type: 'basic',
                                                iconUrl: './images/MH-badge.png',
                                                title: 'My Hours',
                                                message: "There was an error. Open widget so the token gets refreshed. If that doesn't help check console for errors."
                                            };
                                            //chrome.notifications.create('', 'Bummer something went wrong.');
                                            chrome.notifications.create('', notificationOptions, function () { });
                                        }
                                    );
                            }
                        )
                    });
            });
        });
}

function startTrackingTime(info, tab) {

    let currentUser = new CurrentUser();
    let myHoursApi = new MyHoursApi(currentUser);

    myHoursApi.getRefreshToken(currentUser.refreshToken).then(
        function (token) {
            console.info('got refresh token. token: ');
            console.info(token);

            currentUser.setTokenData(token.accessToken, token.refreshToken);
            currentUser.save();

            myHoursApi.startLog(info.selectionText)
                .then(
                    function (data) {
                        var notificationOptions = {
                            type: 'basic',
                            iconUrl: 'mh-badge.jpg',
                            title: 'MyHours',
                            message: 'Log started. Description: ' + info.selectionText
                        };
                        //chrome.notifications.create('', 'Log started');
                        chrome.notifications.create('', notificationOptions, function () { });
                    },
                    function (error) {
                        console.log(error);
                        var notificationOptions = {
                            type: 'basic',
                            iconUrl: 'mh-badge.jpg',
                            title: 'MyHours',
                            message: "There was an error. Open widget so the token gets refreshed. If that doesn't help check console for errors."
                        };
                        //chrome.notifications.create('', 'Bummer something went wrong.');
                        chrome.notifications.create('', notificationOptions, function () { });
                    }
                );
        }
    )    

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
                                    var notificationOptions = {
                                        type: 'basic',
                                        iconUrl: './images/MH-badge.png',
                                        title: 'My Hours',
                                    };
                                    if (data) {
                                        notificationOptions.message = "Timer stopped: " + data.note
                                    }
                                    else {
                                        notificationOptions.message = "There are no running logs."
                                    }

                                    //chrome.notifications.create('', 'Log started');
                                    chrome.notifications.create('', notificationOptions, function () { });
                                },
                                function (error) {
                                    console.log(error);
                                    var notificationOptions = {
                                        type: 'basic',
                                        iconUrl: './images/MH-badge.png',
                                        title: 'My Hours',
                                        message: "There was an error. Open widget so the token gets refreshed. If that doesn't help check console for errors."
                                    };
                                    //chrome.notifications.create('', 'Bummer something went wrong.');
                                    chrome.notifications.create('', notificationOptions, function () { });
                                }
                            );
                    }
                )

            });
        });
}

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
                        var notificationOptions = {
                            type: 'basic',
                            iconUrl: 'mh-badge.jpg',
                            title: 'MyHours',
                            message: 'Project created.'
                        };
                        //chrome.notifications.create('', 'Log started');
                        chrome.notifications.create('', notificationOptions, function () { });
                    },
                    function (error) {
                        console.log(error);
                        var notificationOptions = {
                            type: 'basic',
                            iconUrl: 'mh-badge.jpg',
                            title: 'MyHours',
                            message: "There was an error. Open widget so the token gets refreshed. If that doesn't help check console for errors."
                        };
                        //chrome.notifications.create('', 'Bummer something went wrong.');
                        chrome.notifications.create('', notificationOptions, function () { });
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
                        console.info('got refresh token. token: ');
                        console.info(token);

                        currentUser.setTokenData(token.accessToken, token.refreshToken);
                        currentUser.save();

                        myHoursApi.updateRunningLogDescription(info.selectionText)
                            .then(
                                function (updatedLog) {
                                    var notificationOptions = {
                                        type: 'basic',
                                        iconUrl: 'mh-badge.jpg',
                                        title: 'MyHours',
                                    };
                                    if (updatedLog) {
                                        console.log(updatedLog);
                                        notificationOptions.message = "Description updated: " + updatedLog.note
                                    }
                                    else {
                                        notificationOptions.message = "There are no running logs."
                                    }

                                    //chrome.notifications.create('', 'Log started');
                                    chrome.notifications.create('', notificationOptions, function () { });
                                },
                                function (error) {
                                    console.log(error);
                                    var notificationOptions = {
                                        type: 'basic',
                                        iconUrl: 'mh-badge.jpg',
                                        title: 'MyHours',
                                        message: "There was an error. Open widget so the token gets refreshed. If that doesn't help check console for errors."
                                    };
                                    //chrome.notifications.create('', 'Bummer something went wrong.');
                                    chrome.notifications.create('', notificationOptions, function () { });
                                }
                            );
                    }
                )
                  
            });
        });
}

function getBranchName(info, tab) {
    console.log("selection: " + info.selectionText);
    let branchName = info.selectionText.toLowerCase().trim().replace(/ /g, "-");

    console.log('background script - copy-to-clipboard message sent.');
    //chrome.tabs.sendMessage(tab.id, { type: 'copy-to-clipboard', text: branchName });

    navigator.clipboard.writeText(request.branchName).then(function () {
        console.log('Async: Copying to clipboard was successful!');
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
    });


}



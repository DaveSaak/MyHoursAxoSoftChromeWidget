importScripts('currentUser.js');
importScripts('options.js');
importScripts('myHoursApi.js');
importScripts('allHoursApi.js');
importScripts('moment.js');



chrome.runtime.onStartup.addListener( () => {
    console.log(`onStartup()`);
});

// chrome.webNavigation.onCompleted.addListener((details) => {
//     console.log(details);
//     if (details.url.includes("dev.azure.com") && details.url.includes("pullrequest")) {
//         chrome.tabs.sendMessage(details.tabId, { action: "addPresetComments" });
//         // chrome.tabs.sendMessage(details.tabId, { action: "highlightCode" });
//         // chrome.tabs.sendMessage(details.tabId, { action: "logDetails" });
//     }
// }, { url: [{ hostContains: "dev.azure.com" }] });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('background script - got message: ' + message.type);

    if (message.action === "wakeUpServiceWorker") {
        console.log("Service worker reactivated.");
        sendResponse({ status: "Service worker is awake!" });
    }

    if (message.type === 'start-myhours-log') {
        startTrackingTimeDevOps({ selectionText: message.itemId, itemTitle: message.itemTitle }, undefined);
    }

    if (message.type === 'get-allhours-calculation') {
    
    }
});

chrome.webRequest.onCompleted.addListener(
    (details) => {
        const parsedUrl = new URL(details.url);
        if (details.method === "POST" 
            && parsedUrl.pathname.includes("/_apis/wit/workItemsBatch") 
            ) 
            {
                console.log('sending message to cointent script', details);
                chrome.tabs.sendMessage(details.tabId, { type: 'work-item-fetched' });
                console.log('background script message sent: work-item-fetched');
            }        
    },
    { urls: ["*://dev.azure.com/*"] } // filter only requests to dev.azure.com
  );


  chrome.webRequest.onCompleted.addListener(
    (details) => {
        const parsedUrl = new URL(details.url);
        if (details.method === "GET" && parsedUrl.pathname.includes("/api/logs")) {
            console.log('sending message to cointent script', parsedUrl);
            chrome.tabs.sendMessage(details.tabId, { type: 'mh-logs-fetched', date: parsedUrl.searchParams.get('date') });
        }        
    },
    { urls: ["*://api2.myhours.com/*"] } // filter only requests to mh
  );

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

                        let tagIds = options.platforms.myHours.defaultTagIds;
                        if (info.itemTitle?.includes('Code Review')) {
                            tagIds = options.platforms.myHours.codeReviewTagIds;
                        
                        }

                        myHoursApi.startLogFromId(info.selectionText.trim(), tagIds)
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
                            .catch((error) => {
                                console.error(error);
                                chrome.notifications.create('', getNotificationOptions(`There was an error. See console.`), function () { });
                            })
                        })
                        .catch((error) => {
                            console.error(error);
                            chrome.notifications.create('', getNotificationOptions(`Counld not refresh MH token. Please go to settings and login.`), function () { });
                        })                    
                    
                    ;
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

function refreshMyHoursPage() {

    chrome.tabs.query({ url: 'https://app.myhours.com/*' }, function (foundTabs) {
        foundTabs.forEach(myHoursTab => {
            console.info('refreshing myhours tabs');
            chrome.tabs.reload(
                myHoursTab.id
            );
        });
    });

    chrome.tabs.query({ url: 'https://legacy.myhours.com/*' }, function (foundTabs) {
        foundTabs.forEach(myHoursTab => {
            console.info('refreshing myhours tabs');
            chrome.tabs.reload(
                myHoursTab.id
            );
        });
    });

}
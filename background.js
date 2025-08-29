importScripts('currentUser.js');
importScripts('options.js');
importScripts('myHoursApi.js');
importScripts('allHoursApi.js');
importScripts('moment.js');



chrome.runtime.onStartup.addListener(() => {
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
        ) {
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

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "azureDevMenu",
        title: "Start timer for %s",
        contexts: ["selection"],
        documentUrlPatterns: ["https://dev.azure.com/*"]
    });

    chrome.contextMenus.create({
        id: "copyBranchNameToClipboard",
        title: "Copy branch name to clipboard",
        contexts: ["selection"],
        documentUrlPatterns: ["https://dev.azure.com/*"]
    });    
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "azureDevMenu" && info.selectionText) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            args: [info.selectionText],
            func: (selectedText) => {
                console.log("Selected text: " + selectedText);
                chrome.runtime.sendMessage({ type: 'start-myhours-log', itemId: selectedText });

            }
        });
    }
    if (info.menuItemId === "copyBranchNameToClipboard" && info.selectionText) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            args: [info.selectionText],
            func: (selectedText) => {
                
                const branchName = selectedText
                    .toLowerCase()
                    .trim()
                    .replace(/[\W_]+/g, " ")  //remove all non alpha chars
                    .replace(/\s\s+/g, ' ')  //replace mulitple spaces with single one. 
                    .replace(/ /g, "-");     //replace spaces with dashes

                navigator.clipboard.writeText(branchName)
                    .then(() => {
                        console.log('Branch name copied to clipboard successfully.');
                        chrome.notifications.create('', getNotificationOptions(`Copied ${branchName} to clipboard.`), () => {resolve();});
                    })
                    .catch(err => {
                        console.error('Failed to copy branch name: ', err);
                        chrome.notifications.create('', getNotificationOptions(`Error generating branch name.`), () => {resolve();});
                    });


            }
        });
    }    
});



function startTrackingTimeDevOps(info, tab) {

    const notificationId = getRandomString();

    // chrome.notifications.create('', getNotificationOptions(`Starting log ${data.projectTask.name}. Please wait a bit.`), function () { });

    chrome.notifications.create(notificationId, getProgressNotificationOptions(`Starting log. Please wait a bit.`, `input: ${info.selectionText}`, 10));


    let currentUser = new CurrentUser();
    let options = new Options();
    let myHoursApi = new MyHoursApi(currentUser);

    options.load().then(
        function () {
            // chrome.notifications.create(notificationId, getProgressNotificationOptions(`Options loaded`, `ready to fetch MH token`, 20));

            currentUser.load(function () {
                // chrome.notifications.create(notificationId, getProgressNotificationOptions(`Current user loaded`, 30));

                myHoursApi.getRefreshToken(currentUser.refreshToken).then(
                    function (token) {
                        // chrome.notifications.create(notificationId, getProgressNotificationOptions(`Ready for MH`, 'token fetched', 50));

                        console.info('got refresh token. token: ');
                        console.info(token);

                        currentUser.setTokenData(token.accessToken, token.refreshToken);
                        currentUser.save();

                        let tagIds = options.platforms.myHours.defaultTagIds;
                        const splitInfo = splitNumberAndText(info.selectionText.trim());

                        const itemTitle = splitInfo.text || info.itemTitle;
                        if (itemTitle) {
                            switch (true) {
                                case itemTitle.toLowerCase().includes('code review'):
                                    tagIds = options.platforms.myHours.codeReviewTagIds;
                                    break;
                                case itemTitle.toLowerCase().includes('documentation'):
                                    tagIds = options.platforms.myHours.documentationTagIds;
                                    break;
                                case itemTitle.toLowerCase().includes('testing'):
                                    tagIds = options.platforms.myHours.testTagIds;
                                    break;                                    
                                default:
                                    // tagIds remains as defaultTagIds
                                    break;
                            }
                        }

                        // myHoursApi.startLogFromId(info.selectionText.trim(), tagIds)
                        myHoursApi.startLogFromId(splitInfo.itemId, tagIds)
                            .then(
                                (data) => {
                                    if (data.logStarted) {
                                        refreshMyHoursPage();
                                        // chrome.notifications.create(notificationId, getProgressNotificationOptions(`Starting log ${info.selectionText}. Please wait a bit.`, 10));
                                        // chrome.notifications.create(notificationId, getProgressNotificationOptions(`Log started: ${data.projectTask.name}`, 90));
                                        chrome.notifications.create(notificationId, getProgressNotificationOptions(`Log started.`, 'success', 100), () => {resolve();});


                                        // chrome.notifications.create('', getNotificationOptions(`Log started: ${data.projectTask.name}`), function () { });
                                    } else {
                                        // chrome.notifications.create(notificationId, getProgressNotificationOptions(`There is no incompleted no task with id ${info.selectionText}`, 99));
                                        chrome.notifications.create(notificationId, getProgressNotificationOptions(`There is no incompleted no task with id ${info.selectionText}`, 'Failed to start log.', 100), () => {resolve();});

                                        // chrome.notifications.create('', getNotificationOptions(`There is no incompleted no task with id ${info.selectionText}`), function () { });
                                    }
                                }
                            )
                            .catch((error) => {
                                console.error(error);

                                chrome.notifications.create(notificationId, getProgressNotificationOptions(`There was an error. See console.`, 'Failed to start log.', 100), () => {resolve();});

                                // chrome.notifications.create('', getNotificationOptions(`There was an error. See console.`), function () { });
                            })
                    })
                    .catch((error) => {
                        console.error(error);

                        chrome.notifications.create(notificationId, getProgressNotificationOptions(`Counld not refresh MH token. Please go to settings and login.`, 'Failed to start log', 100), () => {resolve();});

                        // chrome.notifications.create('', getNotificationOptions(`Counld not refresh MH token. Please go to settings and login.`), function () { });
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
        silent: true,
        message
    };
}

function splitNumberAndText(input) {

    const trimmed = input.trim();

    // Regex: ^(\d+) = one or more digits at start, (.*) = rest of the text
    const match = trimmed.match(/^(\d+)\s*(.*)$/);

    if (match) {
        return {
            itemId: match[1],
            text: match[2]
        };
    } else {
        return null;
    }
}

function getProgressNotificationOptions(message, title, progress) {
    return {        
        type: 'progress',
        iconUrl: './images/ts-badge128.png',
        title: 'Spica extension',
        silent: true,
        message,
        title,
        progress: progress || 0
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


function getRandomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
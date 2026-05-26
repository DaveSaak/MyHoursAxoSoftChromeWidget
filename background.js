importScripts('currentUser.js');
importScripts('options.js');
importScripts('myHoursApi.js');
importScripts('allHoursApi.js');
importScripts('moment.js');


const TASK_LISTS_CACHE_KEY = 'taskListsCache';

backgroundData = {
    taskLists: undefined,
    myHoursApi: undefined,
    options: undefined,
    currentUser: undefined
}


async function setupEnvironment() {
    console.log('setup environment');

    if (!this.backgroundData.options ) {
        const options = new Options();
        await options.load();
        this.backgroundData.options = options;
    }

    if (!this.backgroundData.currentUser) {
        const currentUser = new CurrentUser();
        await currentUser.load();
        this.backgroundData.currentUser = currentUser;
    }

    if (!this.backgroundData.myHoursApi) {
        this.backgroundData.myHoursApi = new MyHoursApi(this.backgroundData.currentUser, this.backgroundData.options.platforms.myHours.apiUri, this.backgroundData.options.platforms.myHours.pat);
    }
}

async function fetchAndStoreTaskLists() {
    try {
        let taskLists = await this.backgroundData.myHoursApi.getTaskLists();

        this.backgroundData.taskLists = taskLists
            .map(list => {
                if (!list.incompletedTasks) return null;

                const filteredTasks = list.incompletedTasks
                    .filter(task => /^\d/.test(task.name))
                    .map(task => ({ id: task.id, name: task.name }));

                if (filteredTasks.length === 0) return null;

                return {
                    projectId: list.projectId,
                    incompletedTasks: filteredTasks
                };
            })
            .filter(list => list !== null);

        console.log(this.backgroundData.taskLists);

        await chrome.storage.local.set({
            [TASK_LISTS_CACHE_KEY]: { data: this.backgroundData.taskLists, cachedAt: Date.now() }
        });
        console.log('Task lists data stored successfully');

        const bytes = await chrome.storage.local.getBytesInUse(TASK_LISTS_CACHE_KEY);
        console.log(`Task lists data: ${bytes} bytes (${(bytes / 1024).toFixed(2)} KB)`);
    }
    catch (err) {
        console.error('Task lists fetch failed, keeping stale data:', err);
    }
}

async function getTaskLists() {
    const cacheEntry = await chrome.storage.local.get(TASK_LISTS_CACHE_KEY);
    if (cacheEntry[TASK_LISTS_CACHE_KEY]) {
        const cacheData = cacheEntry[TASK_LISTS_CACHE_KEY];
        const cacheAge = Date.now() - cacheData.cachedAt;
        if (cacheAge < 24 * 60 * 60 * 1000 && cacheData.data !== undefined) { // 24 hours cache validity
            console.log('Using cached task lists data');
            return cacheData.data;
        } else {
            console.log('Cached task lists data is stale, fetching new data');
            await fetchAndStoreTaskLists();
            return this.backgroundData.taskLists;
        }
    } else {
        console.log('No cached task lists data, fetching new data');
        await fetchAndStoreTaskLists();
        return this.backgroundData.taskLists;
    }
}

chrome.runtime.onStartup.addListener(async () => {
    console.log(`onStartup()`);
    await setupEnvironment();
    await getTaskLists();
});


chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    console.log(`onInstalled()`);
    if (this.backgroundData.options == undefined) {
        console.log('setting up the environment for the first time');
        await setupEnvironment();
        await getTaskLists();
    }

});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('background script - got message: ' + message.type);

    if (message.action === "wakeUpServiceWorker") {
        console.log("Service worker reactivated.");
        sendResponse({ status: "Service worker is awake!" });
    }

    if (message.type === 'start-myhours-log') {
        startTrackingTimeDevOps(
            message.itemId,
            message.tabId,
            message.tagId
        );
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
        if (details.tabId != -1 && details.method === "GET" && parsedUrl.pathname.includes("/api/logs")) {
            console.log('sending message to cointent script', parsedUrl);
            chrome.tabs.sendMessage(details.tabId, { type: 'mh-logs-fetched', date: parsedUrl.searchParams.get('date') });
        }
    },
    { urls: ["*://api2.myhours.com/*"] } // filter only requests to mh
);

chrome.runtime.onInstalled.addListener(() => {


    options = new Options();
    options.load().then(
        x => {


            chrome.contextMenus.create({
                id: "contextMenuDivider",
                type: "separator",
                contexts: ["selection"],
                documentUrlPatterns: ["https://dev.azure.com/*"]
            });

            chrome.contextMenus.create({
                id: "azureDevMenu",
                title: "Track %s",
                contexts: ["selection"],
                documentUrlPatterns: ["https://dev.azure.com/*"]
            });

            if (options.platforms.myHours.contextMenuTags != undefined && options.platforms.myHours.contextMenuTags.length > 0) {
                // chrome.contextMenus.create({
                //     id: "azureDevMenuRoot",
                //     title: "Track [%s]",
                //     contexts: ["selection"],
                //     documentUrlPatterns: ["https://dev.azure.com/*"]
                // }); 

                options.platforms.myHours.contextMenuTags.forEach(tagConfig => {
                    chrome.contextMenus.create({
                        id: `azureDevMenuTag_${tagConfig.id}`,
                        title: `Track %s / ${tagConfig.name}`,
                        contexts: ["selection"],
                        documentUrlPatterns: ["https://dev.azure.com/*"]
                    });
                });
            }

            // chrome.contextMenus.create({
            //     id: "copyBranchNameToClipboard",
            //     title: "Copy branch name to clipboard",
            //     contexts: ["selection"],
            //     documentUrlPatterns: ["https://dev.azure.com/*"]
            // }); 


            // if(options.platforms.myHours.contextMenuTags!=undefined && options.platforms.myHours.contextMenuTags.length>0) {
            //     chrome.contextMenus.create({
            //         id: "azureDevMenuRoot",
            //         title: "Track %s",
            //         contexts: ["selection"],
            //         documentUrlPatterns: ["https://dev.azure.com/*"]
            //     }); 

            //     options.platforms.myHours.contextMenuTags.forEach(tagConfig => {
            //         chrome.contextMenus.create({
            //             id: `azureDevMenuTag_${tagConfig.id}`,
            //             parentId: "azureDevMenuRoot",
            //             title: `${tagConfig.name}`,
            //             contexts: ["selection"],
            //             documentUrlPatterns: ["https://dev.azure.com/*"]
            //         });
            //     });
            // }
        }
    );

    /*


    chrome.contextMenus.create({
        id: "azureDevMenu",
        title: "Track %s",
        contexts: ["selection"],
        documentUrlPatterns: ["https://dev.azure.com/*"]
    });  

    chrome.contextMenus.create({
        id: "contextMenuDivider",
        type: "separator",
        contexts: ["selection"],
        documentUrlPatterns: ["https://dev.azure.com/*"]
    });
    */

    chrome.contextMenus.create({
        id: "copyBranchNameToClipboard",
        title: "Copy branch name to clipboard",
        contexts: ["selection"],
        documentUrlPatterns: ["https://dev.azure.com/*"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "azureDevMenu" && info.selectionText) {
        startTrackingTimeDevOps(info.selectionText, tab, null);
    }
    if (info.menuItemId.startsWith("azureDevMenuTag_") && info.selectionText) {
        const tagId = info.menuItemId.replace("azureDevMenuTag_", "");
        startTrackingTimeDevOps(info.selectionText, tab, tagId);
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
                        chrome.notifications.create('', getNotificationOptions(`Copied ${branchName} to clipboard.`), () => { resolve(); });
                    })
                    .catch(err => {
                        console.error('Failed to copy branch name: ', err);
                        chrome.notifications.create('', getNotificationOptions(`Error generating branch name.`), () => { resolve(); });
                    });
            }
        });
    }
});


async function startTrackingTimeDevOps(info, tab, tagId) {
    await setupEnvironment();

    const notificationId = getRandomString();
    // chrome.notifications.create(notificationId, getProgressNotificationOptions(`Starting log. Please wait a bit.`, `input: ${info}`, 10));

    let tagIds = this.backgroundData.options.platforms.myHours.defaultTagIds;
    const splitInfo = splitNumberAndText(info.trim());

    tagName = '';
    if (tagId) {
        tagIds = [tagId];
        tagName = this.backgroundData.options.platforms.myHours.contextMenuTags.find(t => t.id == tagId)?.name || '';
    }

    let taskInfo = findTaskInTaskLists(this.backgroundData.taskLists, splitInfo.itemId);
    if (taskInfo == null) {
        chrome.notifications.create(notificationId, getProgressNotificationOptions(
            `Fetching task info...`, '⏳ Please wait', 30));
        // try to fetch new task lists and find the task again, in case there is a new task that is not in the cache.
        await fetchAndStoreTaskLists();
        taskInfo = findTaskInTaskLists(this.backgroundData.taskLists, splitInfo.itemId);
    }

    if (taskInfo) {
        this.backgroundData.myHoursApi.startLog('', taskInfo.projectId, taskInfo.taskId, tagIds)
            .then(data => {
                refreshMyHoursPage();
                chrome.notifications.create(notificationId, getProgressNotificationOptions(
                    `Log started: ${taskInfo.taskName}`, '👍 success', 100));
            })
            .catch(error => {
                console.log(error);
                chrome.notifications.create(notificationId, getProgressNotificationOptions(
                    `There was an error. See console.`, '💥 Failed to start log.', 100));
            });
    } else {
        chrome.notifications.create(notificationId, getProgressNotificationOptions(
            `No incompleted task ${splitInfo.itemId}`, '😮 MH task not found.', 100));
    }
}


function findTaskInTaskLists(taskLists, text) {

    if (taskLists == undefined) {
        console.warn('Task lists data is undefined');
        return null;
    }


    for (const taskList of taskLists) {
        if (!taskList.incompletedTasks) continue;

        const projectTask = taskList.incompletedTasks.find(x => x.name.startsWith(text + ' '));
        if (projectTask) {
            return { projectId: taskList.projectId, taskId: projectTask.id, taskName: projectTask.name };
        }
    }
    return null;
}


function startTrackingTimeDevOps_old(info, tab, tagId) {

    const notificationId = getRandomString();
    chrome.notifications.create(notificationId, getProgressNotificationOptions(`Starting log. Please wait a bit.`, `input: ${info}`, 10));

    let currentUser = new CurrentUser();
    let options = new Options();

    options.load().then(
        function () {
            let myHoursApi = new MyHoursApi(currentUser, options.platforms.myHours.apiUri, options.platforms.myHours.pat);

            currentUser.load(function () {

                let tagIds = options.platforms.myHours.defaultTagIds;
                const splitInfo = splitNumberAndText(info.trim());

                tagName = '';
                if (tagId) {
                    tagIds = [tagId];
                    tagName = options.platforms.myHours.contextMenuTags.find(t => t.id == tagId)?.name || '';
                }

                myHoursApi.startLogFromId(splitInfo.itemId, tagIds)
                    .then(
                        (data) => {
                            if (data.logStarted) {
                                refreshMyHoursPage();
                                chrome.notifications.create(notificationId, getProgressNotificationOptions(`${splitInfo.itemId} ${tagName}`, 'Log started', 100), () => { resolve(); });
                            } else {
                                chrome.notifications.create(notificationId, getProgressNotificationOptions(`There is no incompleted no task with id ${splitInfo.itemId}`, 'Failed to start log.', 100), () => { resolve(); });
                            }
                        }
                    )
                    .catch((error) => {
                        console.error(error);
                        chrome.notifications.create(notificationId, getProgressNotificationOptions(`There was an error. See console.`, 'Failed to start log.', 100), () => { resolve(); });
                    });
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
        silent: true,
        title: message,
        message: title,
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

    // chrome.tabs.query({ url: 'https://legacy.myhours.com/*' }, function (foundTabs) {
    //     foundTabs.forEach(myHoursTab => {
    //         console.info('refreshing myhours tabs');
    //         chrome.tabs.reload(
    //             myHoursTab.id
    //         );
    //     });
    // });

}


function getRandomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
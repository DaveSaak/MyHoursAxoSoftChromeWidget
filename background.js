// chrome.webRequest.onCompleted.addListener(
//     function (details) {
//         const parsedUrl = new URL(details.url);
//         if (details.tabId) {
//             if (
//                 (details.method === "GET" && parsedUrl.pathname === "/api/logs") ||
//                 (details.method === "PUT" && parsedUrl.pathname === "/api/logs")
//             ) {
//                 chrome.tabs.sendMessage(details.tabId, { type: 'logs-changed' });
//                 console.log('Service Worker message sent: logs-changed');
//             }
//         }
//     },
//     { urls: ["https://myhoursproduction-api.azurewebsites.net/api/*", "https://api2.myhours.com/api/*"] }
// );

// chrome.webRequest.onCompleted.addListener(
//     function (details) {
//         const parsedUrl = new URL(details.url);
//         if (details.tabId) {
//             if (details.method === "GET" &&
//                 parsedUrl.pathname.includes("/OnTime/api/v6/features") &&
//                 parsedUrl.pathname.includes("template/view")
//             ) {
//                 chrome.tabs.sendMessage(details.tabId, { type: 'axo-item-loaded' });
//                 console.log('Service Worker message sent: axo-item-loaded');
//             }
//         }
//     },
//     { urls: ["http://despacito.spica.si/OnTime/api/*", "https://ontime.spica.com:442/OnTime/api/*"] }
// );

// chrome.runtime.onMessage.addListener((message) => {
//     if (message.type === 'copy') {
//         navigator.clipboard.writeText(message.text).then(() => {
//             console.log('Text copied to clipboard');
//         }).catch(err => {
//             console.error('Failed to copy text:', err);
//         });
//     }

//     if (message.type === 'refreshBadge') {
//         refreshBadge();
//     }

//     if (message.type === 'start-myhours-log') {
//         startTrackingTimeDevOps({ selectionText: message.itemId }, undefined);
//     }
// });

// // Context Menu
// chrome.runtime.onInstalled.addListener(() => {
//     console.log('Extension installed');
    
//     chrome.contextMenus.create({
//         title: "Spica Tools",
//         id: "spicaContextMenu",
//         contexts: ["all"]
//     });

//     chrome.contextMenus.create({
//         title: "Start Timer for #%s",
//         id: "startTimer",
//         parentId: "spicaContextMenu",
//         contexts: ["selection"],
//         onclick: startTrackingTime
//     });

//     chrome.contextMenus.create({
//         title: "Add to running log",
//         id: "addToLog",
//         parentId: "spicaContextMenu",
//         contexts: ["selection"],
//         onclick: updateRunningLogDescription
//     });

//     chrome.contextMenus.create({
//         title: "Copy Branch Name",
//         id: "copyBranch",
//         parentId: "spicaContextMenu",
//         contexts: ["selection"],
//         onclick: getBranchName
//     });
// });

// // Alarms API for periodic badge refresh
// chrome.alarms.create("checkAxoWorklog", {
//     delayInMinutes: 1,
//     periodInMinutes: 10
// });

// chrome.alarms.onAlarm.addListener((alarm) => {
//     if (alarm.name === "checkAxoWorklog") {
//         console.log('Alarm triggered: checking worklog');
//         refreshBadge();
//     }
// });

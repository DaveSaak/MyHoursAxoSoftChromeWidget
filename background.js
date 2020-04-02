
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
    { urls: [
        "https://myhoursproduction-api.azurewebsites.net/api/*",
        "https://api2.myhours.com/api/*"
    ]}
);

chrome.webRequest.onCompleted.addListener(function (details) {
    const parsedUrl = new URL(details.url);
    console.log(details);
    if (details.tabId) {
        console.log(details);

        if (details.method === "GET" &&
            parsedUrl.pathname.includes("/OnTime/api/v6/features") &&
            parsedUrl.pathname.includes("template/view")) {
            chrome.tabs.sendMessage(details.tabId, { type: 'axo-item-loaded' });
            console.log('background script message sent: axo-item-loaded');
        }
    }
},
    { urls: [
        "http://despacito.spica.si/OnTime/api/*",
        "https://ontime.spica.com:442/OnTime/api/*",
    ] }
);

chrome.runtime.onMessage.addListener(function(message) {
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

/*
chrome.extension.onRequest.addListener(function (request, sender, callback) {
    if (request.action == 'createContextMenuItem') {
        chrome.contextMenus.create({
            title: "convert %s to branch name and copy it to clipboard",
            contexts: ["selection"],
            onclick: getBranchName
        });
    }
}
);

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
*/


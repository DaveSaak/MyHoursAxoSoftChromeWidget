
chrome.webRequest.onCompleted.addListener(function (details) {
    const parsedUrl = new URL(details.url);
    if (details.method === "GET" && parsedUrl.pathname === "/api/logs" && details.tabId) {
        chrome.tabs.sendMessage(details.tabId, { type: 'logs-changed' });
        console.log('hello from background script - message sent.');
    }
},
    { urls: ["https://myhoursproduction-api.azurewebsites.net/api/*"] }
);

//see https://medium.com/@softvar/making-chrome-extension-smart-by-supporting-spa-websites-1f76593637e8
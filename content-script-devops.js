var requestData = {"action": "createContextMenuItemStartLog"};
chrome.extension.sendRequest(requestData);


// var clickedElement = null;

// document.addEventListener("contextmenu", function(event){
//     clickedElement = event.target;
// }, true);

// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//     if(request == "getClickedElement") {
//         sendResponse({data: clickedElement});
//     }
// });
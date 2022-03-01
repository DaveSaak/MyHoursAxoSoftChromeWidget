console.log('hello from content script');

var colors = ['#F44336', '#E91E63', "#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#4CAF50", "#FFC107"];
var textColors = ['#ffffff', '#ffffff', "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"];

chrome.runtime.onMessage.addListener(function (request) {
    console.log('content script - got request: ' + request.type);
    console.log(request);

    if (request && request.type === 'logs-changed') {
        console.log('hello from content script - page rendered');

        //old track view
        $('log-action-toolbar').parent().parent().each(function (index, data) {

            var dataContainer = $(data).find('.d-flex.flex-column');
            var description = dataContainer.find('p').text();
            console.log('description: ' + description);

            var itemId = getAxoItemId(description);
            if (!itemId) {
                var clientProjectTask = $(data).find('span').text();
                console.log('clientProjectTask: ' + clientProjectTask);
                itemId = getAxoItemId(clientProjectTask);
            }

            let colorIndex = numberToIndex(itemId, 8);
            let logColor = 'whitesmoke';
            if (colorIndex > -1) {
                logColor = colors[colorIndex];
            }

            let logStyle = 'solid 6px ' + logColor;
            $(data).css('border-left', logStyle);
        });


        //new track view
        $('.list-log').each(function (index, data) {

            var dataContainer = $(data);
            var description = dataContainer.find('h5 #textDisplay p').text();
            console.log('description: ' + description);

            var itemId = getAxoItemId(description);
            if (!itemId) {
                var clientProjectTask = $(data).find('[data-projectid]').text();
                console.log('clientProjectTask: ' + clientProjectTask);
                itemId = getAxoItemId(clientProjectTask);
            }

            let colorIndex = numberToIndex(itemId, 8);
            let logColor = 'whitesmoke';
            let textColor = 'black';
            if (colorIndex > -1) {
                logColor = colors[colorIndex];
                textColor = textColors[colorIndex];
            }

            let logStyle = 'solid 6px ' + logColor;
            $(data).find('.row').css('border-left', logStyle);

            //color timeline -- search by description
            if (description) {
                let timelineContentItem = $('.vis-timeline .vis-itemset .vis-item div.vis-item-content:contains("' + description + '")');
                if (timelineContentItem) {
                    console.log(timelineContentItem);
                    let timelineItem = $(timelineContentItem).closest('.vis-item');
                    // timelineItem.attr('style', 'background-color: ' + logColor + ' !important; color:white !important; border-color:' + logColor + ' !important;');
                    timelineItem.attr('style', `background-color: ${logColor} !important; opacity:0.85; line-height: 1.5rem; font-size: 0.88em; color: ${textColor} !important; border-color: ${logColor} !important; border-radius: 0 !important;`);
                    
                    //timelineItem.css('background-color', logColor);
                    // timelineItem.css('color', 'white');
                }
            }
        });
    }

    else if (request && request.type === 'copy-to-clipboard') {
        navigator.clipboard.writeText(request.branchName).then(function () {
            console.log('Async: Copying to clipboard was successful!');
        }, function (err) {
            console.error('Async: Could not copy text: ', err);
        });
    }

    else if (request && request.type === 'hilite-log') {
        console.log(request.logId);
        $('.logs-wrapper .list-log').removeClass('hiLite');
        $('.logs-wrapper .list-log[data-logid="' + request.logId + '"]').addClass('hiLite');
        console.log($('.logs-wrapper .list-log[data-logid="' + request.logId + '"]'));

    }
});


var requestData = { "action": "createContextMenuItem" };
//send request to background script
chrome.extension.sendRequest(requestData);




function numberToIndex(num, length) {
    if (!num) {
        return -1;
    }
    return num % length;
}

function getAxoItemId(stringWithNumberAtBegining) {
    if (stringWithNumberAtBegining != null) {
        var itemId = (stringWithNumberAtBegining
            .match(/\d+\.\d+|\d+\b|\d+(?=\w)/g) || [])
            .map(function (v) {
                return +v;
            }).shift();

        return itemId;

        // if (itemId !== undefined) {
        //     return _this.axoSoftApi.getFeatureItem(itemId);
        // }
    }
    return undefined;

}
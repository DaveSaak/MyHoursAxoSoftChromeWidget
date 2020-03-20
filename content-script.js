console.log('hello from content script');

var colors = ['#F44336', '#E91E63', "#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#4CAF50", "#FFC107"];


chrome.runtime.onMessage.addListener(function (request) {
    console.log('hello from content script - got request: ');
    console.log(request);

    if (request && request.type === 'logs-changed') {
        console.log('hello from content script - page rendered');

        $('log-action-toolbar').parent().parent().each(function(index, data) {

            var dataContainer = $(data).find('.d-flex.flex-column');
            var description = dataContainer.find('p').text();
            console.log('description: ' + description);

            var itemId = getAxoItemId(description);
            if (!itemId){
                var clientProjectTask = $(data).find('span').text();
                console.log('clientProjectTask: ' + clientProjectTask);
                itemId = getAxoItemId(clientProjectTask);
            }

            let colorIndex = numberToIndex(itemId, 8);
            let logStyle = 'solid 6px ' + colors[colorIndex];
            $(data).css('border-left', logStyle);
        });
    }
});


function numberToIndex(num, length) {
    if (!num) {
        return 0;
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
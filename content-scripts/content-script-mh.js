chrome.runtime.onMessage.addListener(function (request) {
    console.log('>> mh content script - got request: ' + request.type);
    console.log(request);

    if (request && request.type === 'mh-logs-fetched') {
        setTimeout(() => {
            console.log('>> mh content script - mh-logs-fetched', request.date);


            const currentUrl = window.location.href;

            if (currentUrl.includes('https://app.myhours.com/track/day') && $('mh-track-timeline').length > 0) {
                console.log('we are on track page with timeline open');

            }

            // drawAhTimeLine();
        }, 200);
    }
});
function ChromeNotifications() {
    'use strict'

    var _this = this;

    _this.showNotification = function(title, message, id){

        var notificationOptions = {
            type: 'basic',
            iconUrl: './images/TS-badge.png',
            title,
            message
        };
        chrome.notifications.create(id, notificationOptions, function () { });
    }
}

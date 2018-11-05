function Options() {

    this.axoSoftUrl = "";
    this.axoSoftToken = "";
    this.axoSoftUserId = 0;
    this.axoSoftDefaultWorklogTypeId = 3;

    this.save = function(){
        console.info("saving options");

        if (chrome == undefined || chrome.storage == undefined) {
            console.warn('cannot access chrome storage api');
        } else {
            console.info("saving options to the chrome store");
            chrome.storage.sync.set({
                'options': this
            })
        }
    }


    this.load = function (callback) {
        console.info("loading options");

        if (chrome == undefined || chrome.storage == undefined) {
            console.warn('cannot access chrome storage api');

            if (callback) {
                console.info("executing load options callback");
                callback();
            }

        } else {
            console.info("loading options from the chrome store");

            var options = this;

            chrome.storage.sync.get('options', function (items) {
                if (items.options) {
                  
                    options.axoSoftUrl = items.options.axoSoftUrl;
                    options.axoSoftToken = items.options.axoSoftToken;
                    options.axoSoftUserId = items.options.axoSoftUserId;
                    options.axoSoftDefaultWorklogTypeId = items.options.axoSoftDefaultWorklogTypeId;
                }

                if (callback) {
                    console.info("executing load options callback");
                    callback();
                }
            });
        }
    }    

    //var wr = new Worklog;

    //console.log(JSON.stringify(wr));

}


//function save_options() {

    // var color = document.getElementById('color').value;
    // var likesColor = document.getElementById('like').checked;
    // chrome.storage.sync.set({
    //     favoriteColor: color,
    //     likesColor: likesColor
    // }, function () {
    //     // Update status to let user know options were saved.
    //     var status = document.getElementById('status');
    //     status.textContent = 'Options saved.';
    //     setTimeout(function () {
    //         status.textContent = '';
    //     }, 750);
    // });
//}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
//function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    
    // chrome.storage.sync.get({
    //     favoriteColor: 'red',
    //     likesColor: true
    // }, function (items) {
    //     document.getElementById('color').value = items.favoriteColor;
    //     document.getElementById('like').checked = items.likesColor;
    // });
//}
// document.addEventListener('DOMContentLoaded', restore_options);
// document.getElementById('save').addEventListener('click',
//     save_options);
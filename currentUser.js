function CurrentUser() {

    this.accessToken = undefined;
    this.refreshToken = undefined;
    this.id = undefined;
    this.name = "John Doe";
    this.email = undefined;

    this.setUserData = function (id, name) {
        this.id = id;
        this.name = name;
    }

    this.setTokenData = function (accessToken, refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }

    this.save = function () {
        console.info("saving current user");

        if (chrome == undefined || chrome.storage == undefined) {
            console.warn('cannot access chrome storage api');
        } else {
            console.info("saving current user to the chrome store");
            chrome.storage.sync.set({
                'currentUser': this
            })
        }
    }

    this.load = function (callback) {
        console.info("loading current user");

        if (chrome == undefined || chrome.storage == undefined) {
            console.warn('cannot access chrome storage api');

            if (callback) {
                console.info("executing load current user callback");
                callback();
            }

        } else {
            console.info("loading current user from the chrome store");

            var currentUser = this;

            console.info(currentUser);

            chrome.storage.sync.get('currentUser', function (items) {
                if (items.currentUser) {
                    console.info(items.currentUser);



                    currentUser.accessToken = items.currentUser.accessToken;
                    currentUser.refreshToken = items.currentUser.refreshToken;
                    currentUser.id = items.currentUser.id;
                    currentUser.name = items.currentUser.name;
                    currentUser.email = items.currentUser.email;
                    //this = items.curentUser; 
                }

                if (callback) {
                    console.info("executing load current user callback");
                    callback();
                }
            });
        }
    }

    this.clear = function () {
      
        console.info("clearing current user");
        this.accessToken = undefined;
        this.refreshToken = undefined;
        this.id = undefined;
        this.name = undefined;
        this.email = undefined;



        if (chrome == undefined || chrome.storage == undefined) {
            console.warn('cannot access chrome storage api');
        } else {
            console.info("clearing current user from the chrome store");
            chrome.storage.sync.remove('currentUser', undefined);
        }

    }
}
'use strict'

function MyHoursApi(currentUser) {
    var _this = this;

    _this.currentUser= currentUser;
    //_this.accessToken = undefined;

    
    _this.getUser = function () {
        //var accessToken = _this.accessToken;

        return new Promise(
            function (resolve, reject) {
                console.info("api: getting user data");

                $.ajax({
                    url: "https://api.myhours.com/users",
                    headers: {
                        "Authorization": "Bearer " + _this.currentUser.accessToken
                    },
                    type: "GET",
                    success: function (data) {
                        return resolve(data)
                    },
                    error: function (data) {
                        console.error(data);
                        return reject(Error());
                    }
                });
            }
        )
    }

    _this.getAccessToken = function (email, password) {
        return new Promise(
            function (resolve, reject) {
                console.info("api: getting user data");

                $.ajax({
                    url: "https://api.myhours.com/tokens",
                    type: "POST",
                    data: {
                      clientId: "3d6bdd0e-5ee2-4654-ac53-00e440eed057",
                      email: email,
                      grantType: "password",
                      password: password
                    },
                    success: function (data) {
                        return resolve(data);
                    },
                    error: function (data) {
                        console.error(data);
                        return reject(Error());
                    }
                });
            }
        )
    }

    _this.getLogs = function(date){
        var accessToken = _this.accessToken;
        return new Promise(
            function (resolve, reject) {
                console.info("api: getting user data");

                $.ajax({
                    url: "https://api.myhours.com/logs",
                    headers: {
                      "Authorization": "Bearer " + _this.currentUser.accessToken
                    },
                    type: "GET",
                    data: {
                      dateFrom: moment(date).format("YYYY-MM-DD"),
                      dateTo: moment(date).format("YYYY-MM-DD")
                    },
                    success: function (data) {
                         resolve(data);
                    },
                    error: function (data) {
                        console.error(data);
                        reject(Error());
                    }
                });
            }
        )


    }

};
function AllHoursApi(allHoursUrl, allHoursAccessToken, allHoursRefreshToken) {
    'use strict';

    var baseUrl = 'https://ahdevelopment-api.azurewebsites.net/';
    var baseName = 'AH API';

    var _this = this;

    _this.allHoursAccessToken = allHoursAccessToken;
    _this.allHoursRefreshToken = allHoursRefreshToken;
    baseUrl = allHoursUrl;
    //_this.accessToken = undefined;

    _this.setAccessToken = function (accessToken) {
        _this.allHoursAccessToken = accessToken;
    };

    _this.setRefreshToken = function (refreshToken) {
        _this.allHoursRefreshToken = refreshToken;
    };    

    _this.getAccessToken = function (email, password) {
        return new Promise(
            function (resolve, reject) {
                console.info(baseName + ": getting token");

                var loginData = {
                    username: email,
                    grant_type: "password",
                    password: password
                };

                $.ajax({
                    url: baseUrl + "tokens",
                    contentType: "application/json",
                    type: "POST",
                    data: JSON.stringify(loginData),
                    success: function (data) {
                        return resolve(data);
                    },
                    error: function (data) {
                        //console.log(data);
                        return reject(Error());
                    }
                });
            }
        );
    };

    _this.refreshAccessToken = function (refreshToken) {
        return new Promise(
            function (resolve, reject) {
                console.info(baseName + ": refreshing token");

                // var loginData = {
                //     username: email,
                //     grant_type: "password",
                //     password: password
                // };

                // $.ajax({
                //     url: baseUrl + "tokens",
                //     contentType: "application/json",
                //     type: "POST",
                //     data: JSON.stringify(loginData),
                //     success: function (data) {
                //         return resolve(data);
                //     },
                //     error: function (data) {
                //         //console.log(data);
                //         return reject(Error());
                //     }
                // });
            }
        );
    };    

    _this.getCurrentUserId = function () {
        return new Promise(
            function (resolve, reject) {
                console.info(baseName + ": getting logged-in user");
                $.ajax({
                    url: baseUrl + "UserAccount/GetLoggedIn",
                    headers: {
                        "Authorization": "Bearer " + _this.allHoursAccessToken,
                    },
                    type: "GET",
                    success: function (data) {
                        return resolve(data ? data.user_id : "");
                    },
                    error: function (data) {
                        //console.log(data);
                        return reject(Error());
                    }
                });
            }
        );
    };

    _this.getCurrentUserName = function () {
        return new Promise(
            function (resolve, reject) {
                console.info(baseName + ": getting logged-in user");
                $.ajax({
                    url: baseUrl + "UserAccount/GetLoggedIn",
                    headers: {
                        "Authorization": "Bearer " + _this.allHoursAccessToken,
                    },
                    type: "GET",
                    success: function (data) {
                        return resolve(data ? data.given_name : "");
                    },
                    error: function (data) {
                        //console.log(data);
                        return reject(Error());
                    }
                });
            }
        );
    };


    _this.getAttendance = function (userId, date) {
        date = date.startOf('day');
        let dateString = date.format('YYYY-MM-DD') + 'T00:00:00';
        return new Promise(
            function (resolve, reject) {
                console.info(baseName + ": getting calculation");

                $.ajax({
                    url: baseUrl + "usercalculations/" + userId + "/CalculationValues/" +
                        "?date=" + dateString +
                        "&calculationResultTypeCode=33" +
                        "&timeEventIds=",
                    //"?userId=" + userId,
                    headers: {
                        "Authorization": "Bearer " + _this.allHoursAccessToken,
                        "X-Timezone-Offset": date.toDate().getTimezoneOffset()
                    },
                    type: "GET",
                    success: function (data) {
                        //can contain other dates. filter them out
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
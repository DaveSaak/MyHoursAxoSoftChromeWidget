function AllHoursApi(
    // allHoursUrl, allHoursAccessToken, allHoursRefreshToken
    options
    ) {
    'use strict';

    var baseName = 'AH API';

    var _this = this;
    _this.options = options;

    // _this.options.allHoursAccessToken,
    // _this.options.allHoursRefreshToken

    // _this.allHoursAccessToken = allHoursAccessToken;
    // _this.allHoursRefreshToken = allHoursRefreshToken;
    // _this.options.allHoursUrl = allHoursUrl;
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
                    url: _this.options.allHoursUrl + "tokens",
                    contentType: "application/json",
                    type: "POST",
                    data: JSON.stringify(loginData),
                    success: function (data) {
                        return resolve(data);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        //console.log(data);
                        if (jqXHR.status == 401){
                            return reject(Error("invalid credentials"));
                        }
                        else if (jqXHR.status == 404){
                            return reject(Error("invalid All Hours API Address"));
                        }                        
                        else{
                            return reject(Error("Error while geeting token."));
                        }
                    }
                });
            }
        );
    };

    _this.refreshAccessToken = function () {
        return new Promise(
            function (resolve, reject) {
                console.info(baseName + ": refreshing token");

                var refreshData = {
                    refreshToken: _this.options.allHoursRefreshToken,
                    grant_type:"refresh_token",
                    client_id:"Spica-vTime-WebAPP"
                  }

                $.ajax({
                    url: _this.options.allHoursUrl + "tokens",
                    contentType: "application/json",
                    type: "POST",
                    data: JSON.stringify(refreshData),
                    success: function (data) {
                        _this.options.allHoursAccessToken = data.access_token;
                        _this.options.allHoursRefreshToken = data.refresh_token;
                        _this.options.save();

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

    _this.getCurrentUserId = function () {
        return new Promise(
            function (resolve, reject) {
                console.info(baseName + ": getting logged-in user");
                $.ajax({
                    url: _this.options.allHoursUrl + "UserAccount/GetLoggedIn",
                    headers: {
                        "Authorization": "Bearer " + _this.options.allHoursAccessToken,
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
                    url: _this.options.allHoursUrl + "UserAccount/GetLoggedIn",
                    headers: {
                        "Authorization": "Bearer " + _this.options.allHoursAccessToken,
                    },
                    type: "GET",
                    success: function (data) {
                        return resolve(data ? data.given_name : "");
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
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
        let promise =  new Promise(
            function (resolve, reject) {
                console.info(baseName + ": getting calculation");

                $.ajax({
                    url: _this.options.allHoursUrl + "usercalculations/" + userId + "/CalculationValues/" +
                        "?date=" + dateString +
                        "&calculationResultTypeCode=33" +
                        "&timeEventIds=",
                    //"?userId=" + userId,
                    headers: {
                        "Authorization": "Bearer " + _this.options.allHoursAccessToken,
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
        return promise;
    }


    _this.getUserCalculations = function (userId, date) {
        date = date.startOf('day');
        let dateString = date.format('YYYY-MM-DD') + 'T00:00:00';
        let promise =  new Promise(
            function (resolve, reject) {
                console.info(baseName + ": getting calculation");

                $.ajax({
                    url: _this.options.allHoursUrl + "usercalculations/" + userId +
                        "?dateFrom=" + dateString +
                        "&dateTo=" + dateString,
                    headers: {
                        "Authorization": "Bearer " + _this.options.allHoursAccessToken,
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
        return promise;
    }    

    function checkTokenAndExecutePromise(promise){
        const treshold = 5 * 60;
        let allHoursTokenIsExpired = moment().isAfter(moment(_this.options.allHoursAccessTokenValidTill).add(-treshold, 'seconds'));
        if (allHoursTokenIsExpired){
            _this.refreshAccessToken.then(_ => {
                return promise;
            });
        }
        else {
            return promise;
        }
    }


};
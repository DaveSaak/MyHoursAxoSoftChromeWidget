function AllHoursApi(
    options
) {
    'use strict';

    var baseName = 'AH API';

    var _this = this;
    _this.options = options;

    _this.setAccessToken = function (accessToken) {
        _this.allHoursAccessToken = accessToken;
    };

    _this.setRefreshToken = function (refreshToken) {
        _this.allHoursRefreshToken = refreshToken;
    };

    _this.getAccessTokenOld = function (email, password) {
        return new Promise(
            function (resolve, reject) {
                // console.info(baseName + ": getting token");

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
                        if (jqXHR.status == 401) {
                            return reject(Error("invalid credentials"));
                        }
                        else if (jqXHR.status == 404) {
                            return reject(Error("invalid All Hours API Address"));
                        }
                        else {
                            return reject(Error("Error while geeting token."));
                        }
                    }
                });
            }
        );
    };

    _this.getAccessToken = function (email, password) {
        return new Promise(
            function (resolve, reject) {
                // console.info(baseName + ": getting token");

                var loginData = {
                    username: email,
                    grant_type: "password",
                    password: password,
                    client_id: "ro_client",
                    scope: "api profile offline_access openid",
                    client_secret: _this.options.isSecret
                };

                // Convert the project to a x-form-urlencoded string
                var urlencoded = Object.keys(loginData).map(key => encodeURIComponent(key) + "=" + encodeURIComponent(loginData[key])).join('&');

                $.ajax({
                    url: "https://login.allhours.com/connect/token",
                    dataType: 'json',
                    processData: false,
                    contentType: 'application/x-www-form-urlencoded',
                    type: "POST",
                    data: urlencoded,
                    success: function (data) {
                        return resolve(data);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        if (jqXHR.status == 401) {
                            return reject(Error("invalid credentials"));
                        }
                        else if (jqXHR.status == 404) {
                            return reject(Error("invalid All Hours API Address"));
                        }
                        else {
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
                // console.info(baseName + ": refreshing token");

                var refreshData = {
                    client_id: "ro_client",
                    client_secret: _this.options.isSecret,
                    grant_type: "refresh_token",
                    refresh_token: _this.options.allHoursRefreshToken,
                }

                // Convert the project to a x-form-urlencoded string
                var urlencoded = Object.keys(refreshData).map(key => encodeURIComponent(key) + "=" + encodeURIComponent(refreshData[key])).join('&');


                $.ajax({
                    url: "https://login.allhours.com/connect/token",
                    dataType: 'json',
                    processData: false,
                    contentType: 'application/x-www-form-urlencoded',
                    type: "POST",
                    data: urlencoded,
                    success: function (data) {
                        _this.options.allHoursAccessToken = data.access_token;
                        _this.options.allHoursRefreshToken = data.refresh_token;
                        _this.options.allHoursAccessTokenValidTill = moment().add(data.expires_in, 'seconds').toString();
                        _this.options.save();

                        // console.group('all hours token - referesh');
                        // console.table(data);
                        // console.groupEnd();

                        return resolve(data);
                    },
                    error: function (data) {
                        console.error(data);
                        return reject(Error());
                    }
                });
            }
        );
    };

    _this.getCurrentUserId = function () {
        let promiseFunction = function (resolve, reject) {
            // console.info(baseName + ": getting logged-in user");
            $.ajax({
                url: _this.options.allHoursUrl + "UserInfo",
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

        return checkTokenAndExecutePromise(promiseFunction);
    };

    _this.getCurrentUserName = function () {
        let promiseFunction = function (resolve, reject) {
            // console.info(baseName + ": getting logged-in user");
            $.ajax({
                url: _this.options.allHoursUrl + "UserInfo",
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
        return checkTokenAndExecutePromise(promiseFunction);
    };


    _this.getAttendance = function (userId, date) {
        date = date.startOf('day');
        let dateString = date.format('YYYY-MM-DD') + 'T00:00:00';

        let promiseFunction = function (resolve, reject) {
            // console.info(baseName + ": getting calculation");

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

        return checkTokenAndExecutePromise(promiseFunction);
    }

    
    _this.getCurrentBalance = function (userId) {

        let promiseFunction = function (resolve, reject) {
            // console.info(baseName + ": getting current balance");

            $.ajax({
                url: _this.options.allHoursUrl + "presence/" + userId + 
                    "?provideCurrentBalance=true",
                //"?userId=" + userId,
                headers: {
                    "Authorization": "Bearer " + _this.options.allHoursAccessToken,
                    "X-Timezone-Offset": moment().toDate().getTimezoneOffset()
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

        return checkTokenAndExecutePromise(promiseFunction);
    }


    _this.getUserCalculations = function (userId, dateFrom, dateTo) {
        dateFrom = dateFrom.clone().startOf('day');
        let dateFromString = dateFrom.format('YYYY-MM-DD') + 'T00:00:00';

        dateTo = dateTo.clone().startOf('day');
        let dateToString = dateTo.format('YYYY-MM-DD') + 'T00:00:00';

        let promiseFunction = function (resolve, reject) {
            // console.info(baseName + ": getting calculation");

            $.ajax({
                url: _this.options.allHoursUrl + "usercalculations/" + userId +
                    "?dateFrom=" + dateFromString +
                    "&dateTo=" + dateToString,
                headers: {
                    "Authorization": "Bearer " + _this.options.allHoursAccessToken,
                    "X-Timezone-Offset": dateFrom.toDate().getTimezoneOffset()
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

        };
        return checkTokenAndExecutePromise(promiseFunction);
    }

    _this.getUserClockings = function (userId, dateFrom, dateTo) {
        dateFrom = dateFrom.clone().startOf('day');
        let dateFromString = dateFrom.format('YYYY-MM-DD') + 'T00:00:00';

        dateTo = dateTo.clone().startOf('day');
        let dateToString = dateTo.format('YYYY-MM-DD') + 'T00:00:00';

        let promiseFunction = function (resolve, reject) {
            // console.info(baseName + ": getting clockings");

            $.ajax({
                url: _this.options.allHoursUrl + "clockings/getclockings" +
                    "?dateFrom=" + dateFromString +
                    "&dateTo=" + dateToString,
                headers: {
                    "Authorization": "Bearer " + _this.options.allHoursAccessToken,
                    "X-Timezone-Offset": dateFrom.toDate().getTimezoneOffset()
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

        };
        return checkTokenAndExecutePromise(promiseFunction);
    }    

    // function checkTokenAndExecutePromise(promiseFunction) {
    //     const treshold = 5* 60;
    //     let allHoursTokenIsExpired = moment().isAfter(moment(_this.options.allHoursAccessTokenValidTill).add(-treshold, 'seconds'));
    //     if (allHoursTokenIsExpired) {
    //         var x = await_this.refreshAccessToken();
    //         return new Promise(promiseFunction);
    //     }
    //     else {
    //         return new Promise(promiseFunction);
    //     }
    // }

    function checkTokenAndExecutePromise(promiseFunction) {
        const treshold = 5 * 60;
        let allHoursTokenIsExpired = moment().isAfter(moment(_this.options.allHoursAccessTokenValidTill).add(-treshold, 'seconds'));
        if (allHoursTokenIsExpired) {
            // console.log('ah token expired');
            _this.refreshAccessToken().then(
                function (x) {
                    // console.log('ah token refreshed');
                    return new Promise(promiseFunction);
                }
            )

        }
        else {
            return new Promise(promiseFunction);
        }
    }


};
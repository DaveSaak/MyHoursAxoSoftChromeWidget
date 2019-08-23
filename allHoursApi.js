function AllHoursApi(allHoursAccessToken) {
    'use strict';

    var baseUrl = 'https://ahdevelopment-api.azurewebsites.net/';
    var baseName = 'AH API';

    var _this = this;

    _this.allHoursAccessToken = allHoursAccessToken;
    //_this.accessToken = undefined;

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
                        console.log(data);
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

                // var loginData = {
                //     username: email,
                //     grant_type: "password",
                //     password: password
                // };

                $.ajax({
                    url: baseUrl + "UserAccount/GetLoggedIn",
                    headers: {
                        "Authorization": "Bearer " + _this.allHoursAccessToken,
                        //"X-Timezone-Offset": date.getTimezoneOffset()
                    },
                    //contentType: "application/json",
                    type: "GET",
                    //data: JSON.stringify(loginData),
                    success: function (data) {
                        return resolve(data ? data.user_id : "");
                    },
                    error: function (data) {
                        console.log(data);
                        return reject(Error());
                    }
                });
            }
        );
    };


    _this.getAttendance = function (userId, date) {
        date = date.startOf('day');
        return new Promise(
            function (resolve, reject) {
                console.info(baseName + ": getting calculation");

                $.ajax({
                    url: baseUrl + "usercalcuations/" + userId + "/CalculationValues/" +
                        "?date=" + date.toISOString() +
                        "&calculationResultTypeCode=33" +
                        "&timeEventIds=" +
                        "?userId=" + userId,
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
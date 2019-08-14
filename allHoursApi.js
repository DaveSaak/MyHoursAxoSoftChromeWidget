function AllHoursApi(currentUser) {
    'use strict';

    var baseUrl = 'https://ahdevelopment-api.azurewebsites.net/';
    var baseName = 'AH API';

    var _this = this;

    _this.currentUser = currentUser;
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
        )
    }


    _this.getPaidPresence = function (userId, date) {
        date = date.startOf('day');
        return new Promise(
            function (resolve, reject) {
                console.info(baseName + ": getting calculation");

                $.ajax({
                    url: baseUrl + "usercalcuation/" + userId + "/?dateFrom=" + moment(date).format('yyyy-MM-dd') + "&dateTo=" + moment(date).format('yyyy-MM-dd'),
                    headers: {
                        "Authorization": "Bearer " + _this.currentUser.allHoursAccessToken,
                        "X-Timezone-Offset": date.getTimezoneOffset()
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
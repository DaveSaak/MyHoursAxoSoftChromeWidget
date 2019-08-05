'use strict'

const baseUrl = 'https://api2.myhours.com/api/'

function AllHoursApi(currentUser) {
    var _this = this;

    _this.currentUser = currentUser;
    //_this.accessToken = undefined;

    _this.getAccessToken = function (email, password) {
        return new Promise(
            function (resolve, reject) {
                console.info("api: getting token");

                var loginData = {
                    clientId: "3d6bdd0e-5ee2-4654-ac53-00e440eed057",
                    email: email,
                    grantType: "password",
                    password: password
                };

                $.ajax({
                    url: baseUrl + "tokens/login",
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


    _this.getPresence = function (date) {
        date = date.startOf('day');
        return new Promise(
            function (resolve, reject) {
                console.info("api: getting calculation");

                $.ajax({
                    url: baseUrl + "usercalcuation",
                    headers: {
                        "Authorization": "Bearer " + _this.currentUser.accessToken
                    },
                    type: "GET",
                    data: {
                        startIndex: 0,
                        step: 200,
                        maxDate: moment(date).format("YYYY-MM-DD")
                    },
                    success: function (data) {
                        //can contain other dates. filter them out
                        data = data.filter(function (x) {
                            return moment(x.date).isSame(moment(date));
                        })
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
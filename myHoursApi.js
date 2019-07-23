'use strict'

const baseUrl = 'https://api2.myhours.com/api/'

function MyHoursApi(currentUser) {
    var _this = this;

    _this.currentUser = currentUser;
    //_this.accessToken = undefined;


    _this.getUser = function () {
        //var accessToken = _this.accessToken;

        return new Promise(
            function (resolve, reject) {
                console.info("api: getting user");

                $.ajax({
                    //url: "https://api.myhours.com/users",
                    url: baseUrl + "users",
                    //                    contentType: "application/json",
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
                console.info("api: getting token");

                var loginData = {
                    clientId: "3d6bdd0e-5ee2-4654-ac53-00e440eed057",
                    email: "davidsakelsek@gmail.com",
                    grantType: "password",
                    password: "password00"
                };

                // $.post({
                //     //url: "https://api.myhours.com/tokens",
                //     url: baseUrl + "tokens/login",
                //     contentType: "application/json",
                //     data: JSON.stringify(loginData),
                //     success: function (data) {
                //         return resolve(data);
                //     },
                //     error: function (data) {
                //         console.log(data);
                //         return reject(Error());
                //     }
                // });

                $.ajax({
                    //url: "https://api.myhours.com/tokens",
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

    _this.getLogs = function (date) {
        return new Promise(
            function (resolve, reject) {
                console.info("api: getting logs");

                $.ajax({
                    //url: "https://api.myhours.com/logs",
                    url: baseUrl + "logs",
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

    _this.getTimes = function (logId) {
        return new Promise(
            function (resolve, reject) {
                console.info("api: getting times");

                $.ajax({
                    //url: "https://api.myhours.com/times",
                    url: baseUrl + "times",
                    headers: {
                        "Authorization": "Bearer " + _this.currentUser.accessToken
                    },
                    type: "GET",
                    data: JSON.stringify({
                        logId: logId,
                    }),
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

    _this.addLog = function (projectId, comment) {
        return new Promise(
            function (resolve, reject) {
                console.info("api: adding log");

                var currentTime = moment();
                var newLogData = {
                    projectId: projectId,
                    note: comment,
                    date: currentTime.format("YYYY-MM-DD"),
                    start: currentTime.format(),
                    end: currentTime.format()
                }



                // var data = {
                //     billable: false,
                //     cost: "0.00",
                //     date: currentTime.format("YYYY-MM-DD"),
                //     duration: 0,
                //     startDate: currentTime.format(),
                //     endDate: currentTime.format(),
                //     originType: 1,
                //     task: null,
                //     userId: _this.currentUser.id,

                //     project: {
                //         id: projectId
                //     },
                //     comment: comment
                // };

                $.ajax({
                    url: baseUrl + "logs",
                    //url: "https://api.myhours.com/logs?userId=" + _this.currentUser.id,
                    //url: baseUrl + "tokens/login",
                    //contentType: "application/json",
                    type: "POST",
                    headers: {
                        "Authorization": "Bearer " + _this.currentUser.accessToken
                    },
                    data: JSON.stringify(newLogData),
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
};
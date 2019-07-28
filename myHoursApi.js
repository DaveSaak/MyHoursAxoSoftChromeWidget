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

    // _this.getLogs = function (date) {
    //     return new Promise(
    //         function (resolve, reject) {
    //             console.info("api: getting logs");

    //             $.ajax({
    //                 //url: "https://api.myhours.com/logs",
    //                 url: baseUrl + "logs",
    //                 headers: {
    //                     "Authorization": "Bearer " + _this.currentUser.accessToken
    //                 },
    //                 type: "GET",
    //                 data: {
    //                     dateFrom: moment(date).format("YYYY-MM-DD"),
    //                     dateTo: moment(date).format("YYYY-MM-DD")
    //                 },
    //                 success: function (data) {
    //                     resolve(data);
    //                 },
    //                 error: function (data) {
    //                     console.error(data);
    //                     reject(Error());
    //                 }
    //             });
    //         }
    //     )
    // }

    _this.getLogs = function (date) {
        date = date.startOf('day');
        return new Promise(
            function (resolve, reject) {
                console.info("api: getting logs");

                $.ajax({
                    url: baseUrl + "logs",
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

    _this.getTimes = function (logId) {
        return new Promise(
            function (resolve, reject) {
                console.info("api: getting times");

                $.ajax({
                    //url: "https://api.myhours.com/times",
                    url: baseUrl + "times/" + logId,
                    headers: {
                        "Authorization": "Bearer " + _this.currentUser.accessToken
                    },
                    type: "GET",
                    // data: JSON.stringify({
                    //     logId: logId,
                    // }),
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

    _this.addLog = function (projectId, comment, duration) {
        return new Promise(
            function (resolve, reject) {
                console.info("api: adding log");

                var currentTime = moment.utc();
                var newLogData = {
                    projectId: projectId,
                    taskId: 0,
                    note: comment,
                    date: currentTime.format("YYYY-MM-DDTHH:mm:ss" + "00Z"),
                    start: currentTime.format("YYYY-MM-DDTHH:mm:ss" + "00Z"),
                    end: currentTime.add(duration, 'minutes').format("YYYY-MM-DDTHH:mm:ss" + "00Z"),
                    billable: false,
                    additionalCost: 0
                };

                $.ajax({
                    url: baseUrl + "logs",
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
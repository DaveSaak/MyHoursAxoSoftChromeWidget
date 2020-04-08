function MyHoursApi(currentUser) {
    'use strict'

    var baseUrl = 'https://api2.myhours.com/api/';
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
                    email,
                    grantType: "password",
                    password
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

    _this.getRefreshToken = function (refreshToken) {
        return new Promise(
            function (resolve, reject) {
                console.info("api: using refresh token");

                var refreshData = {
                    grantType: "refresh_token",
                    clientId: "3d6bdd0e-5ee2-4654-ac53-00e440eed057",
                    refreshToken: refreshToken                    
                };

                $.ajax({
                    url: baseUrl + "tokens/refresh",
                    contentType: "application/json",
                    type: "POST",
                    data: JSON.stringify(refreshData),
                    success: function (data) {
                        return resolve(data);
                    },
                    error: function (data) {
                        console.log(data);
                        return reject(data);
                    }
                });
            }
        )
    }

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
                        reject(data);
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
                    url: baseUrl + "times/" + logId,
                    headers: {
                        "Authorization": "Bearer " + _this.currentUser.accessToken
                    },
                    type: "GET",
                    success: function (data) {
                        resolve(data);
                    },
                    error: function (data) {
                        console.error(data);
                        reject(data);
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
                    date: currentTime.format("YYYY-MM-DDTHH:mm:ss") + "Z",
                    start: currentTime.format("YYYY-MM-DDTHH:mm:ss") + "Z",
                    end: currentTime.add(duration, 'minutes').format("YYYY-MM-DDTHH:mm:ss") + "Z",
                    billable: false,
                    additionalCost: 0
                };

                console.info(newLogData);

                $.ajax({
                    url: baseUrl + "logs/insertlog",
                    type: "POST",
                    contentType: "application/json",
                    headers: {
                        "Authorization": "Bearer " + _this.currentUser.accessToken
                    },
                    data: JSON.stringify(newLogData),
                    success: function (data) {
                        return resolve(data);
                    },
                    error: function (data) {
                        console.error(data);
                        return reject(data);
                    }
                });
            }
        )
    }
};
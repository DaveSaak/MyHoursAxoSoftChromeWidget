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
                        // maxDate: moment(date).format("YYYY-MM-DD")
                        date: moment(date).format("YYYY-MM-DD")
                    },
                    success: function (data) {
                        //can contain other dates. filter them out
                        // data = data.filter(function (x) {
                        //     return moment(x.date).isSame(moment(date));
                        // })
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

    _this.getLog = function (runningLog) {
        return new Promise(
            function (resolve, reject) {
                console.info("api: getting log " + runningLog.id);

                _this.getLogs(moment(runningLog.date))
                    .then(logs => {
                        //find log
                        let log = logs.filter(function (x) {
                            return x.id === runningLog.id;
                        });

                        if (log.length === 1) {
                            resolve(log[0]);
                        }
                        else {
                            resolve(null);
                        }
                    })
                    .catch(error => {
                        console.error('error: ' + error);
                        return reject(error);
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

    _this.getActivity = function (dateFrom, dateTo) {
        return new Promise(
            function (resolve, reject) {
                console.info("api: getting times");

                $.ajax({
                    url: baseUrl + "/reports/activity",
                    headers: {
                        "Authorization": "Bearer " + _this.currentUser.accessToken
                    },
                    type: "GET",
                    data: {
                        // startIndex: 0,
                        // step: 200,
                        // maxDate: moment(date).format("YYYY-MM-DD")
                        dateFrom: moment(dateFrom).format("YYYY-MM-DD"),
                        dateTo: moment(dateTo).format("YYYY-MM-DD"),
                        UserIds: _this.currentUser.id
                    },                    
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

    _this.startLog = function (comment, projectId = undefined, taskId = undefined, tagId = undefined) {
        return new Promise(
            function (resolve, reject) {
                console.info("api: staring log");

                var currentTime = moment();
                var newLogData = {
                    note: comment,
                    date: currentTime.format('YYYY-MM-DD'),
                    start: currentTime.toISOString(true),
                    end: null
                };

                if (tagId) {
                    newLogData.tagIds = [];
                }
                
                if (projectId && taskId) {
                    newLogData.projectId = projectId;
                    newLogData.taskId = taskId;
                }

                if (tagId){
                    newLogData.tagIds = [];
                    // newLogData.tagIds.push({id: parseInt(tagId)});
                    newLogData.tagIds.push(tagId);
                }

                console.info(newLogData);
                console.info(JSON.stringify(newLogData));

                $.ajax({
                    url: baseUrl + "logs/startNewLog",
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

    _this.startLogFromId = function(text){


    }

    _this.startFromExisting = function(logId){
        return new Promise(
            function (resolve, reject) {
                console.info("api: staring log from existing");

                var currentTime = moment();
                var newLogData = {
                    logId: logId,
                    startTime: currentTime.toISOString(true),
                };

                console.info(newLogData);

                $.ajax({
                    url: baseUrl + "logs/insertAndStartFromExisting",
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

    _this.stopTimer = function (comment) {
        return new Promise(
            function (resolve, reject) {
                console.info("api: stop timer");

                _this.getRunning().then(
                    function (logs) {
                        console.info('got running log: ');
                        console.info(logs);

                        if (logs.length > 0) {
                            var currentTime = moment();
                            var stopTimerData = {
                                logId: logs[0].id,
                                time: currentTime.toISOString(true),
                            };

                            console.info(stopTimerData);

                            $.ajax({
                                url: baseUrl + "logs/stopTimer",
                                type: "POST",
                                contentType: "application/json",
                                headers: {
                                    "Authorization": "Bearer " + _this.currentUser.accessToken
                                },
                                data: JSON.stringify(stopTimerData),
                                success: function (data) {
                                    return resolve(data);
                                },
                                error: function (data) {
                                    console.error(data);
                                    return reject(data);
                                }
                            });
                        }
                        else {
                            return resolve(null);
                        }
                    }
                )
                    .catch(error => {
                        console.error('error: ' + error);
                        return reject(error);
                    });
            }
        )
    }

    _this.updateRunningLogDescription = function (comment) {
        return new Promise(
            function (resolve, reject) {
                console.info("api: update running log description");

                _this.getRunning().then(
                    function (logs) {
                        console.info('got running log: ');
                        console.info(logs);

                        if (logs.length === 1) {
                            _this.getLog(logs[0])
                                .then(runningLog => {
                                    var updatedLogData = {
                                        id: runningLog.id,
                                        note: runningLog.note + ' ' + comment
                                    };

                                    $.ajax({
                                        url: baseUrl + "logs/updatedescription?id=" + updatedLogData.id,
                                        type: "PUT",
                                        contentType: "application/json",
                                        headers: {
                                            "Authorization": "Bearer " + _this.currentUser.accessToken
                                        },
                                        data: JSON.stringify(updatedLogData),
                                        success: function (data) {
                                            return resolve(data);
                                        },
                                        error: function (data) {
                                            console.error(data);
                                            return reject(data);
                                        }
                                    });
                                })
                                .catch(error => {
                                    console.error('error: ' + error);
                                    return reject(error);
                                });
                        }
                        else {
                            return resolve(null);
                        }
                    }
                )
                    .catch(error => {
                        console.error('error: ' + error);
                        return reject(error);
                    });
            }
        )
    }

    _this.updateLogDescription = function (log, comment) {
        return new Promise(
            function (resolve, reject) {
                console.info("api: update log description");

                _this.getLog(log)
                    .then(existingLog => {
                        var updatedLogData = {
                            id: existingLog.id,
                            note: existingLog.note + ' ' + comment
                        };

                        $.ajax({
                            url: baseUrl + "logs/updatedescription?id=" + updatedLogData.id,
                            type: "PUT",
                            contentType: "application/json",
                            headers: {
                                "Authorization": "Bearer " + _this.currentUser.accessToken
                            },
                            data: JSON.stringify(updatedLogData),
                            success: function (data) {
                                return resolve(data);
                            },
                            error: function (data) {
                                console.error(data);
                                return reject(data);
                            }
                        });
                    })
                    .catch(error => {
                        console.error('error: ' + error);
                        return reject(error);
                    });
            }
        )
    }    

    _this.getRunning = function () {
        return new Promise(
            function (resolve, reject) {
                console.info("api: get running timer");

                var currentTime = moment();
                // var runningData = {
                //     date: currentTime.format('YYYY-MM-DD'),
                // };

                // console.info(runningData);

                $.ajax({
                    url: baseUrl + "logs/running",
                    type: "GET",
                    contentType: "application/json",
                    headers: {
                        "Authorization": "Bearer " + _this.currentUser.accessToken
                    },
                    // data: JSON.stringify(runningData),
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

    _this.crateProject = function (projectName) {
        return new Promise(
            function (resolve, reject) {
                console.info("api: creating project log");

                var currentTime = moment();
                var newProjectData = {
                    name: projectName,
                    // clientId": 0,
                    // invoiceMethod": 0,
                    // budgetType": 1,
                    // budgetValue": 0,
                    // budgetAlertPercent": 0,
                    // notes": "string",
                    // approved": false,
                    // rate": 0,
                    // autoAssignUserId": 0,
                    // roundType": 0,
                    // roundInterval": 0
                };

                console.info(newProjectData);

                $.ajax({
                    url: baseUrl + "project",
                    type: "POST",
                    contentType: "application/json",
                    headers: {
                        "Authorization": "Bearer " + _this.currentUser.accessToken
                    },
                    data: JSON.stringify(newProjectData),
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

    _this.getTags = function () {
        return new Promise(
            function (resolve, reject) {
                console.info("api: getting tags");

                $.ajax({
                    url: baseUrl + "tags",
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

    _this.getTasks = function () {
        return new Promise(
            function (resolve, reject) {
                console.info("api: getting tasks");
                $.ajax({
                    url: baseUrl + "tasks",
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
    
    _this.getProjects = function () {
        return new Promise(
            function (resolve, reject) {
                console.info("api: getting projects");
                $.ajax({
                    url: baseUrl + "projects",
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
    
    _this.getProjectTaskList = function (projectId) {
        return new Promise(
            function (resolve, reject) {
                console.info("api: getting project tasklist");
                $.ajax({
                    url: baseUrl + "projects/" + projectId + "/tasklist",
                    headers: {
                        "Authorization": "Bearer " + _this.currentUser.accessToken
                    },
                    type: "GET",
                    success: function (data) {
                        data.projectId = projectId;
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
    
    _this.getClients = function () {
        return new Promise(
            function (resolve, reject) {
                console.info("api: getting clients");
                $.ajax({
                    url: baseUrl + "clients",
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
};
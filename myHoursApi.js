function MyHoursApi(currentUser, apiUrl, apiKey) {
    'use strict';

    var baseUrl = apiUrl || 'https://api2.myhours.com/api/';
    //var baseUrl
    var _this = this;

    _this.currentUser = currentUser;
    _this.apiKey = apiKey;

    _this.getAjaxHeaders = function () {
        return {
            'Content-Type': 'application/json',
            //'Authorization': 'Bearer ' + _this.currentUser.accessToken
            'Authorization': 'ApiKey ' + _this.apiKey,
            'Accept': 'application/json',
            'User-Agent': 'PostmanRuntime/7.49.1', // Try mimicking Postman
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
            // _this.getAuthorizationHeader()
        };
    };

    // _this.getAuthorizationHeader = function() {
    //     return 'Authorization': 'ApiKey ' + _this.apiKey;
    // }

    // -------------------------------------------------------------------------
    // GET USER
    // -------------------------------------------------------------------------
    _this.getUser = function () {
        return new Promise((resolve, reject) => {
            fetch(baseUrl + 'users', {
                method: 'GET',
                // headers: {
                //     'Authorization': 'Bearer ' + _this.currentUser.accessToken
                // }
                headers: _this.getAjaxHeaders()
            })
            .then(response => {
                if (!response.ok) throw response;
                return response.json();
            })
            .then(data => resolve(data))
            .catch(error => {
                console.error(error);
                reject(error);
            });
        });
    };

    // -------------------------------------------------------------------------
    // GET ACCESS TOKEN
    // -------------------------------------------------------------------------
    _this.getAccessToken = function (email, password) {
        return new Promise((resolve, reject) => {
            const loginData = {
                clientId: '3d6bdd0e-5ee2-4654-ac53-00e440eed057',
                email,
                grantType: 'password',
                password
            };

            fetch(baseUrl + 'tokens/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            })
            .then(response => {
                if (!response.ok) throw response;
                return response.json();
            })
            .then(data => resolve(data))
            .catch(error => {
                console.log(error);
                reject(error);
            });
        });
    };

    // -------------------------------------------------------------------------
    // GET REFRESH TOKEN
    // -------------------------------------------------------------------------
    _this.getRefreshToken = function (refreshToken) {
        return new Promise((resolve, reject) => {
            const refreshData = {
                grantType: 'refresh_token',
                clientId: '3d6bdd0e-5ee2-4654-ac53-00e440eed057',
                refreshToken: refreshToken
            };

            fetch(baseUrl + 'tokens/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(refreshData)
            })
            .then(response => {
                if (!response.ok) throw response;
                return response.json();
            })
            .then(data => resolve(data))
            .catch(error => {
                console.log(error);
                reject(error);
            });
        });
    };

    // -------------------------------------------------------------------------
    // GET LOGS
    // -------------------------------------------------------------------------
    _this.getLogs = function (date) {
        // Convert to start-of-day and build query string
        date = date.startOf('day');
        const query = new URLSearchParams({
            startIndex: 0,
            step: 200,
            date: moment(date).format('YYYY-MM-DD')
        }).toString();

        return new Promise((resolve, reject) => {
            fetch(baseUrl + 'logs?' + query, {
                method: 'GET',
                // headers: {
                //     'Authorization': 'Bearer ' + _this.currentUser.accessToken
                // }
                headers: _this.getAjaxHeaders()
            })
            .then(response => {
                if (!response.ok) throw response;
                return response.json();
            })
            .then(data => resolve(data))
            .catch(error => {
                console.error(error);
                reject(error);
            });
        });
    };

    // -------------------------------------------------------------------------
    // GET A SPECIFIC LOG (by ID) -- internally calls getLogs()
    // -------------------------------------------------------------------------
    _this.getLog = function (runningLog) {
        return new Promise((resolve, reject) => {
            _this.getLogs(moment(runningLog.date))
                .then(logs => {
                    let log = logs.filter(x => x.id === runningLog.id);
                    if (log.length === 1) resolve(log[0]);
                    else resolve(null);
                })
                .catch(error => {
                    console.error('error: ' + error);
                    reject(error);
                });
        });
    };

    // -------------------------------------------------------------------------
    // GET TIMES
    // -------------------------------------------------------------------------
    _this.getTimes = function (logId) {
        return new Promise((resolve, reject) => {
            fetch(baseUrl + 'times/' + logId, {
                method: 'GET',
                // headers: {
                //     'Authorization': 'Bearer ' + _this.currentUser.accessToken
                // }
                headers: _this.getAjaxHeaders()
            })
            .then(response => {
                if (!response.ok) throw response;
                return response.json();
            })
            .then(data => resolve(data))
            .catch(error => {
                console.error(error);
                reject(error);
            });
        });
    };

    // -------------------------------------------------------------------------
    // GET ACTIVITY
    // -------------------------------------------------------------------------
    _this.getActivity = function (dateFrom, dateTo) {
        const query = new URLSearchParams({
            dateFrom: moment(dateFrom).format('YYYY-MM-DD'),
            dateTo: moment(dateTo).format('YYYY-MM-DD'),
            UserIds: _this.currentUser.id
        }).toString();

        return new Promise((resolve, reject) => {
            fetch(baseUrl + 'reports/activity?' + query, {
                method: 'GET',
                // headers: {
                //     'Authorization': 'Bearer ' + _this.currentUser.accessToken
                // }
                headers: _this.getAjaxHeaders()
            })
            .then(response => {
                if (!response.ok) throw response;
                return response.json();
            })
            .then(data => resolve(data))
            .catch(error => {
                console.error(error);
                reject(error);
            });
        });
    };

    // -------------------------------------------------------------------------
    // ADD LOG (with project, comment, duration)
    // -------------------------------------------------------------------------
    _this.addLog = function (projectId, comment, duration) {
        return new Promise((resolve, reject) => {
            var currentTime = moment.utc();
            var newLogData = {
                projectId: projectId,
                taskId: 0,
                note: comment,
                date: currentTime.format('YYYY-MM-DDTHH:mm:ss') + 'Z',
                start: currentTime.format('YYYY-MM-DDTHH:mm:ss') + 'Z',
                end: currentTime.add(duration, 'minutes').format('YYYY-MM-DDTHH:mm:ss') + 'Z',
                billable: false,
                additionalCost: 0
            };

            fetch(baseUrl + 'logs/insertlog', {
                method: 'POST',
                headers: _this.getAjaxHeaders(),
                body: JSON.stringify(newLogData)
            })
            .then(response => {
                if (!response.ok) throw response;
                return response.json();
            })
            .then(data => resolve(data))
            .catch(error => {
                console.error(error);
                reject(error);
            });
        });
    };

    // -------------------------------------------------------------------------
    // ADD LOG WITH START/END TIME
    // -------------------------------------------------------------------------
    _this.addLogWithTime = function (start, end, comment, projectId, taskId, tagIds) {
        return new Promise((resolve, reject) => {
            var newLogData = {
                note: comment,
                date: moment(start).toISOString(true),
                start: moment(start).toISOString(true),
                end: moment(end).toISOString(true),
                billable: false,
                additionalCost: 0
            };

            if (taskId) newLogData.taskId = taskId;
            if (projectId) newLogData.projectId = projectId;
            if (tagIds) newLogData.tagIds = [...tagIds];

            fetch(baseUrl + 'logs/insertlog', {
                method: 'POST',
                headers: _this.getAjaxHeaders(),
                body: JSON.stringify(newLogData)
            })
            .then(response => {
                if (!response.ok) throw response;
                return response.json();
            })
            .then(data => resolve(data))
            .catch(error => {
                console.error(error);
                reject(error);
            });
        });
    };

    // -------------------------------------------------------------------------
    // START LOG (timer)
    // -------------------------------------------------------------------------
    _this.startLogOld = function (comment, projectId, taskId, tagIds) {
        return new Promise((resolve, reject) => {
            var currentTime = moment().millisecond(0);
            var newLogData = {
                note: comment,
                date: currentTime.format('YYYY-MM-DD'),
                // start: currentTime.toISOString(true),
                start: currentTime.format('YYYY-MM-DD HH:mm:ssZ'),
                // end: null,
                originType: 10,
                attachments: [],
                billable: true,
                duration: null,
                customField1: null,
                customField2: null,
                customField3: null
            };

            if (taskId) newLogData.taskId = taskId;
            if (projectId) newLogData.projectId = projectId;
            if (tagIds) newLogData.tagIds = tagIds;

            
            var localDateStr = currentTime.startOf('day').format('YYYY-MM-DDTHH:mm:ssZ');
            // Only encode the + sign as %2B, leave colons unencoded
            var encodedLocalDate = localDateStr.replace('+', '%2B');

            fetch(baseUrl + 'logs/startNewLog?localDate=' + encodedLocalDate, {
                method: 'POST',
                headers: _this.getAjaxHeaders(),
                body: JSON.stringify(newLogData)
            })
            .then(response => {
                if (!response.ok) throw response;
                resolve(true); //response.json();
            })
            // .then(data => resolve(data))
            .catch(error => {
                console.error(error);
                reject(error);
            });
        });
    };


    _this.startLog = function (comment, projectId, taskId, tagIds) {

// const payload = {
//   "note": "research",
//   "date": "2025-11-10",
//   "start": "2025-11-10 23:27:28+01:00",
//   "taskId": 10481563,
//   "projectId": 1870755,
//   "tagIds": [77594]
// };

// fetch('https://mh-prod-weu-app-api.azurewebsites.net/api/logs/startNewLog', {
//   method: 'POST',
//   credentials: 'omit',
//   headers: {
//     'Content-Type': 'application/json',
//     'Authorization': 'ApiKey q9l2EQymL9gJHalE7HOlv8FWHkt3iQsj+rvLERJZ/SQ=',
//     'Accept': 'application/json'
//   },
//   body: JSON.stringify(payload)
// })
// .then(response => {
//   console.log('Status:', response.status);
//   console.log('Headers:', response.headers);
//   return response.text(); // Use .text() first to see raw response
// })
// .then(data => {
//   console.log('Response:', data);
// })
// .catch(error => {
//   console.error('Error:', error);
// });

         
        var currentTime = moment().millisecond(0);
        var newLogData = {
            note: comment,
            date: currentTime.format('YYYY-MM-DD'),
            start: currentTime.format('YYYY-MM-DD HH:mm:ssZ'),
        };

        if (taskId) newLogData.taskId = taskId;
        if (projectId) newLogData.projectId = projectId;
        if (tagIds) newLogData.tagIds = tagIds;

        
        var localDateStr = currentTime.startOf('day').format('YYYY-MM-DDTHH:mm:ssZ');
        // Only encode the + sign as %2B, leave colons unencoded
        var encodedLocalDate = localDateStr.replace('+', '%2B');

        const fetchOptions = {
            method: 'POST',
            headers: _this.getAjaxHeaders(),
            body: JSON.stringify(newLogData),
            // cache: 'no-store', // Add this to prevent caching
            // credentials: 'omit' // Omit credentials
        };

        console.log('Starting log with data:', fetchOptions);

        return fetch(baseUrl + 'logs/startNewLog?localDate=' + encodedLocalDate, fetchOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })    
            
    };


    // -------------------------------------------------------------------------
    // START LOG FROM TASK NAME
    // -------------------------------------------------------------------------
    _this.startLogFromId = function (text, tagIds) {
        return new Promise((resolve, reject) => {
            _this.getTaskLists()
                .then(taskLists => {
                    let projectTaskFound = false;
                    let logStarted = false;

                    for (const taskList of taskLists) {
                        const projectTask = taskList.incompletedTasks.find(x => x.name.startsWith(text + ' '));
                        if (projectTask) {
                            projectTaskFound = true;
                            _this.startLog('', taskList.projectId, projectTask.id, tagIds)
                                .then(data => {
                                    logStarted = true;
                                    resolve({ logStarted, projectTask });
                                })
                                .catch(error => {
                                    console.log(error);
                                    reject({ logStarted, projectTask });
                                });
                        }
                    }
                    if (!projectTaskFound) {
                        resolve({ logStarted });
                    }
                });
        });
    };

    // -------------------------------------------------------------------------
    // START FROM EXISTING LOG
    // -------------------------------------------------------------------------
    _this.startFromExisting = function (logId) {
        return new Promise((resolve, reject) => {
            var currentTime = moment();
            var newLogData = {
                logId: logId,
                startTime: currentTime.toISOString(true)
            };

            fetch(baseUrl + 'logs/insertAndStartFromExisting', {
                method: 'POST',
                headers: _this.getAjaxHeaders(),
                body: JSON.stringify(newLogData)
            })
            .then(response => {
                if (!response.ok) throw response;
                resolve(true);
                //return response.json();
            })
            // .then(data => resolve(data))
            .catch(error => {
                console.error(error);
                reject(error);
            });
        });
    };

    // -------------------------------------------------------------------------
    // STOP TIMER
    // -------------------------------------------------------------------------
    _this.stopTimer = function (comment) {
        return new Promise((resolve, reject) => {
            _this.getRunning()
                .then(logs => {
                    const myRunningLog = logs.find(x => x.userId === _this.currentUser.id);
                    if (!myRunningLog) {
                        // No running log for this user
                        resolve(null);
                        return;
                    }
                    var currentTime = moment();
                    var stopTimerData = {
                        logId: myRunningLog.id,
                        time: currentTime.toISOString(true)
                    };

                    fetch(baseUrl + 'logs/stopTimer', {
                        method: 'POST',
                        headers: _this.getAjaxHeaders(),
                        body: JSON.stringify(stopTimerData)
                    })
                    .then(response => {
                        if (!response.ok) throw response;
                        return true;
                        //return response.json();
                    })
                    .then(data => resolve(data))
                    .catch(error => {
                        console.error(error);
                        reject(error);
                    });
                })
                .catch(error => {
                    console.error('error: ' + error);
                    reject(error);
                });
        });
    };

    // -------------------------------------------------------------------------
    // UPDATE RUNNING LOG DESCRIPTION
    // -------------------------------------------------------------------------
    _this.updateRunningLogDescription = function (comment) {
        return new Promise((resolve, reject) => {
            _this.getRunning()
                .then(logs => {
                    const myRunningLog = logs.find(x => x.userId === _this.currentUser.id);
                    if (!myRunningLog) {
                        resolve(null);
                        return;
                    }
                    _this.getLog(myRunningLog)
                        .then(runningLog => {
                            var updatedLogData = {
                                id: runningLog.id,
                                note: ((runningLog.note == null ? '' : runningLog.note + ' ') + comment)
                            };

                            fetch(baseUrl + 'logs/updatedescription?id=' + updatedLogData.id, {
                                method: 'PUT',
                                headers: _this.getAjaxHeaders(),
                                body: JSON.stringify(updatedLogData)
                            })
                            .then(response => {
                                if (!response.ok) throw response;
                                return true;
                                // return response.json();
                            })
                            .then(data => resolve(data))
                            .catch(error => {
                                console.error(error);
                                reject(error);
                            });
                        })
                        .catch(error => {
                            console.error('error: ' + error);
                            reject(error);
                        });
                })
                .catch(error => {
                    console.error('error: ' + error);
                    reject(error);
                });
        });
    };

    // -------------------------------------------------------------------------
    // UPDATE LOG DESCRIPTION (generic)
    // -------------------------------------------------------------------------
    _this.updateLogDescription = function (log, comment, append = true) {
        return new Promise((resolve, reject) => {
            _this.getLog(log)
                .then(existingLog => {
                    var updatedLogData = {
                        id: existingLog.id,
                        note: append ? existingLog.note + ' ' + comment : comment
                    };

                    fetch(baseUrl + 'logs/updatedescription?id=' + updatedLogData.id, {
                        method: 'PUT',
                        headers: _this.getAjaxHeaders(),
                        body: JSON.stringify(updatedLogData)
                    })
                    .then(response => {
                        if (!response.ok) throw response;
                        return true;
                        // return response.json();
                    })
                    .then(data => resolve(data))
                    .catch(error => {
                        console.error(error);
                        reject(error);
                    });
                })
                .catch(error => {
                    console.error('error: ' + error);
                    reject(error);
                });
        });
    };


    _this.getRunning = function () {
        return fetch(baseUrl + "logs/running", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                'Authorization': 'ApiKey ' + _this.apiKey
                // "Authorization": "Bearer " + _this.currentUser.accessToken
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw errData;
                });
            }
            return response.json();
        })
        .catch(error => {
            console.error(error);
            throw error;
        });
    };

    _this.getProjectsAsync = async function() {
        const url = baseUrl + "projects";
        const response = await fetch(url, {
            headers: _this.getAjaxHeaders()
        });
        return response.json();        
    }

    _this.getProjectTaskList = async function(projectId) {
        const url = `${baseUrl}projects/${projectId}/tasklist?localDate=${(new Date()).toISOString}`;
        const response = await fetch(url, {
            headers: _this.getAjaxHeaders()
        });
        return response.json(); 
    }

    
    _this.getTaskLists = async function() {
        let projectTaskListPromises = [];

        const now = (new Date()).toISOString();
        const projects = await this.getProjectsAsync();
        projects.forEach(project => {
            const url = `${baseUrl}projects/${project.id}/tasklist?localDate=${now}`;

            projectTaskListPromises.push(fetch(url, {
                headers: _this.getAjaxHeaders(),
            }).then(res => res.json()));
        });

        let projectsTaskLists = [];
        const responses = await Promise.all(projectTaskListPromises);
        responses.forEach((response, index) => {
            projectsTaskLists.push(
                {
                    ...(response[0]), 
                    projectId: projects[index].id,
                    projectName: projects[index].name}
            );
        });

        return projectsTaskLists;        

    }

    _this.updateLog = function (log) {
        return new Promise(function (resolve, reject) {
            fetch(baseUrl + "logs", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': 'ApiKey ' + _this.apiKey
                    // "Authorization": "Bearer " + _this.currentUser.accessToken
                },
                body: JSON.stringify(log)
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errData => {
                        throw errData;
                    });
                }
                return response.json();
            })
            .then(data => resolve(data))
            .catch(error => {
                console.error(error);
                reject(error);
            });
        });
    }
    

}
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

    _this.getAccessToken = function (email, password) {
        return new Promise(
            function (resolve, reject) {
                console.info(baseName + ": getting token");

                var loginData = {
                    username: email,
                    grant_type: "password",
                    client_id: "ro_client",
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

    _this.getAccessTokenUsingCode = function (code, codeVerifier) {
        return new Promise(
            function (resolve, reject) {
                console.info(baseName + ": getting token");

                var loginData = {
                    grant_type: "authorization_code",
                    code: code,
                    // redirect_uri:"https://ejfeamnngdpogapmijokhbomdldkebcd.chromiumapp.org",
                    redirect_uri: "https://ahdevelopment-portal.azurewebsites.net/auth-callback",
                    code_verifier:codeVerifier,
                    client_id: "pkce_client"
                };


                
/*
                grant_type: authorization_code
                code: Ua01YXoAqFEYmcoYmJX8_hOvH0fSNylpqdYMD7EK1Ss
                redirect_uri: https://ahdevelopment-portal.azurewebsites.net/auth-callback
                code_verifier: T0dXaDJONjVlc0hjRHl1bUNXaXdfbGk4akFZa35Da3VHUFFuSFlYSUFfSzVG
                client_id: pk
*/
                console.log(loginData);

                $.ajax({
                    headers: {          
                        Accept: "application/json, text/plain, */*",         
                    },     
                    url: "https://spicaidentityserverdevelopment.azurewebsites.net/connect/token",
                    //url: "https://spicalevelzerodevelopment.azurewebsites.net/api/connect/token",
                    contentType: "application/x-www-form-urlencoded",
                    type: "POST",
                    data: loginData,
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
                        _this.options.allHoursAccessTokenValidTill = moment().add(data.expires_in, 'seconds').toString(); 
                        _this.options.save();

                        console.group('all hours token - referesh');
                        console.table(data);
                        console.groupEnd();                           

                        return resolve(data);
                    },
                    error: function (data) {
                        //console.error(data);
                        return reject();
                        // return reject(Error());
                    }
                });
            }
        );
    };    

    _this.getCurrentUserId = function () {
        let promiseFunction = function (resolve, reject){
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

        return checkTokenAndExecutePromise(promiseFunction);



        // let promise =  new Promise(
        //     function (resolve, reject) {
        //         console.info(baseName + ": getting logged-in user");
        //         $.ajax({
        //             url: _this.options.allHoursUrl + "UserAccount/GetLoggedIn",
        //             headers: {
        //                 "Authorization": "Bearer " + _this.options.allHoursAccessToken,
        //             },
        //             type: "GET",
        //             success: function (data) {
        //                 return resolve(data ? data.user_id : "");
        //             },
        //             error: function (data) {
        //                 //console.log(data);
        //                 return reject(Error());
        //             }
        //         });
        //     }
        // );
        // return checkTokenAndExecutePromise(promise);
    };

    _this.getCurrentUserName = function () {
        let promiseFunction = function (resolve, reject){
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



        // let promise = new Promise(
        //     function (resolve, reject) {
        //         console.info(baseName + ": getting logged-in user");
        //         $.ajax({
        //             url: _this.options.allHoursUrl + "UserAccount/GetLoggedIn",
        //             headers: {
        //                 "Authorization": "Bearer " + _this.options.allHoursAccessToken,
        //             },
        //             type: "GET",
        //             success: function (data) {
        //                 return resolve(data ? data.given_name : "");
        //             },
        //             error: function (jqXHR, textStatus, errorThrown) {
        //                 //console.log(data);
        //                 return reject(Error());
        //             }
        //         });
        //     }
        // );
        return checkTokenAndExecutePromise(promiseFunction);
    };


    _this.getAttendance = function (userId, date) {
        date = date.startOf('day');
        let dateString = date.format('YYYY-MM-DD') + 'T00:00:00';

        let promiseFunction = function (resolve, reject){  
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

        return checkTokenAndExecutePromise(promiseFunction);

        // let promise =  new Promise(
        //     function (resolve, reject) {
        //         console.info(baseName + ": getting calculation");

        //         $.ajax({
        //             url: _this.options.allHoursUrl + "usercalculations/" + userId + "/CalculationValues/" +
        //                 "?date=" + dateString +
        //                 "&calculationResultTypeCode=33" +
        //                 "&timeEventIds=",
        //             //"?userId=" + userId,
        //             headers: {
        //                 "Authorization": "Bearer " + _this.options.allHoursAccessToken,
        //                 "X-Timezone-Offset": date.toDate().getTimezoneOffset()
        //             },
        //             type: "GET",
        //             success: function (data) {
        //                 //can contain other dates. filter them out
        //                 resolve(data);
        //             },
        //             error: function (data) {
        //                 console.error(data);
        //                 reject(Error());
        //             }
        //         });
        //     }
        // )
        return promise;
    }


    _this.getUserCalculations = function (userId, date) {
        date = date.startOf('day');
        let dateString = date.format('YYYY-MM-DD') + 'T00:00:00';

        let promiseFunction = function (resolve, reject){  
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

        };


        
        // let promise =  new Promise(
        //     function (resolve, reject) {
        //         console.info(baseName + ": getting calculation");

        //         $.ajax({
        //             url: _this.options.allHoursUrl + "usercalculations/" + userId +
        //                 "?dateFrom=" + dateString +
        //                 "&dateTo=" + dateString,
        //             headers: {
        //                 "Authorization": "Bearer " + _this.options.allHoursAccessToken,
        //                 "X-Timezone-Offset": date.toDate().getTimezoneOffset()
        //             },
        //             type: "GET",
        //             success: function (data) {
        //                 //can contain other dates. filter them out
        //                 resolve(data);
        //             },
        //             error: function (data) {
        //                 console.error(data);
        //                 reject(Error());
        //             }
        //         });
        //     }
        // )
        return checkTokenAndExecutePromise(promiseFunction);
    }    

    function checkTokenAndExecutePromise(promiseFunction){
        const treshold = 5 * 60;
        let allHoursTokenIsExpired = moment().isAfter(moment(_this.options.allHoursAccessTokenValidTill).add(-treshold, 'seconds'));
        if (allHoursTokenIsExpired){
            _this.refreshAccessToken().then(_ => {
                return new Promise(promiseFunction);
            })
            .catch(error => {
                console.error('error while using refresh token: ' + error);
                return new Promise.reject();
            });
        }
        else {
            return new Promise(promiseFunction);
        }
    }


};
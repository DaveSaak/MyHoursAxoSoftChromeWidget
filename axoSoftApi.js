'use strict'

function AxoSoftApi(options) {
    var _this = this;
    _this.options = options;



    _this.getFeatureItem = function (itemId) {
        return new Promise(function (resolve, reject) {
            console.info('getting item from axosoft');
            $.ajax({
                url: _this.options.axoSoftUrl + "/v6/features/" + itemId,
                headers: {
                    "Authorization": "Bearer " + _this.options.axoSoftToken
                },
                type: "GET",

                success: function (response) {
                    //console.info(response);
                    resolve(response.data);
                },
                error: function () {
                    reject();
                }
            });
        })
    }


    _this.getWorkLogTypes = function () {
        //var options = this.options;
        return new Promise(function (resolve, reject) {
            console.info('getting item from axosoft');
            $.ajax({
                url: _this.options.axoSoftUrl + "/v6/picklists/work_log_types",
                headers: {
                    "Authorization": "Bearer " + _this.options.axoSoftToken,
                    "Access-Control-Allow-Origin": "*"
                },
                type: "GET",

                success: function (response) {
                    //console.info(response);
                    resolve(response.data);
                },
                error: function () {
                    reject();
                }
            });
        })
    }

    _this.getTimeUnits = function () {
        //var options = this.options;
        return new Promise(function (resolve, reject) {
            console.info('getting time unit definitions from axosoft');
            $.ajax({
                url: _this.options.axoSoftUrl + "/v6/picklists/time_units",
                headers: {
                    "Authorization": "Bearer " + _this.options.axoSoftToken,
                    "Access-Control-Allow-Origin": "*"
                },
                type: "GET",

                success: function (response) {
                    //console.info(response);
                    resolve(response.data);
                },
                error: function () {
                    reject();
                }
            });
        })
    }    

    _this.getUsers = function () {
        //var options = this.options;
        return new Promise(function (resolve, reject) {
            console.info('getting users from axosoft');
            $.ajax({
                url: _this.options.axoSoftUrl + "/v6/users",
                headers: {
                    "Authorization": "Bearer " + _this.options.axoSoftToken,
                    "Access-Control-Allow-Origin": "*"
                },
                type: "GET",

                success: function (response) {
                    //console.info(response);
                    resolve(response.data);
                },
                error: function () {
                    reject();
                }
            });
        })
    }

    _this.addWorkLog = function (worklog) {
        return new Promise(function (resolve, reject) {
            //resolve();
            console.info('getting item from axosoft');
            $.ajax({
                url: _this.options.axoSoftUrl + "/v5/work_logs",
                headers: {
                    "Authorization": "Bearer " + _this.options.axoSoftToken,
                    "Access-Control-Allow-Origin": "*"
                },
                type: "POST",
                contentType:"application/json; charset=utf-8",
                // dataType:"json",
                //data: worklog,
                data: JSON.stringify(worklog),

                success: function (response) {
                    //console.info(response);
                    resolve(response.data);
                },
                error: function () {
                    reject();
                }
            });

            
        })
    }

    _this.getWorkLogMinutesWorked = function (date) {
        return new Promise(function (resolve, reject) {

            var periodStartUtc = moment(date).startOf('day').utc().format("YYYY-MM-DDTHH:mm:ss.000") + "Z";
            //var periodEndUtc = moment(date).endOf('day').utc().format("YYYY-MM-DDThh:mm:ssZ");

            //console.info(periodStartUtc + " - " + periodEndUtc);
            console.info(periodStartUtc);

            //resolve();
            console.info('getting item from axosoft');
            $.ajax({
                url: _this.options.axoSoftUrl + "/v5/work_logs?user_Id="+_this.options.axoSoftUserId+"&date_range=" + "[" + periodStartUtc + "=" + periodStartUtc + "]",
                headers: {
                    "Authorization": "Bearer " + _this.options.axoSoftToken,
                },
                type: "GET",
                contentType:"application/json; charset=utf-8",
                // dataType:"json",
                //data: worklog,
                // data: {
                //     userId: _this.options.axoSoftUserId,
                //     //date_range="yesterday"
                //     date_range: "[" + periodStartUtc + "=" + periodStartUtc + "]"
                //   },

                success: function (response) {
                    //console.info(response);
                    resolve(parseInt(response.metadata.minutes_worked));
                },
                error: function () {
                    reject();
                }
            });

            
        })
    }

    _this.getWorkLogsWithinLastTenDays = function () {
        return new Promise(function (resolve, reject) {

            //var periodStartUtc = moment(date).startOf('day').utc().format("YYYY-MM-DDTHH:mm:ss.000") + "Z";
            //var periodEndUtc = moment(date).endOf('day').utc().format("YYYY-MM-DDThh:mm:ssZ");

            //console.info(periodStartUtc + " - " + periodEndUtc);
            //console.info(periodStartUtc);

            //resolve();
            console.info('getting items from axosoft');
            $.ajax({
                url: _this.options.axoSoftUrl + "/v6/work_logs?user_Id="+_this.options.axoSoftUserId+"&&page=1&page_size=250&user_type=user&include_archived=false&date_range=last10_days&",
                headers: {
                    "Authorization": "Bearer " + _this.options.axoSoftToken,
                },
                type: "GET",
                contentType:"application/json; charset=utf-8",

                success: function (response) {
                    console.info(response.data);
                    resolve(response);
                },
                error: function () {
                    reject();
                }
            });

            
        })
    }

    _this.getWorkLogs = function (date) {
        return new Promise(function (resolve, reject) {

            var periodStartUtc = moment(date).startOf('day').utc().format("YYYY-MM-DDTHH:mm:ss.000") + "Z";
            var periodEndUtc = moment(date).endOf('day').utc().format("YYYY-MM-DDThh:mm:ssZ");

            console.info(periodStartUtc + " - " + periodEndUtc);
            
            console.info('getting worklogs from axosoft');
            $.ajax({
                url: _this.options.axoSoftUrl + "/v5/work_logs?user_Id="+_this.options.axoSoftUserId+"&date_range=" + "[" + periodStartUtc + "=" + periodStartUtc + "]",
                headers: {
                    "Authorization": "Bearer " + _this.options.axoSoftToken,
                },
                type: "GET",
                contentType:"application/json; charset=utf-8",

                success: function (response) {
                    //console.info(response);
                    resolve(response);
                },
                error: function () {
                    reject();
                }
            });

            
        })
    }  

    _this.getWorkLogs = function (dateFrom, dateTo) {
        return new Promise(function (resolve, reject) {

            var periodStartUtc = moment(dateFrom).startOf('day').utc().format("YYYY-MM-DDTHH:mm:ss.000") + "Z";
            var periodEndUtc = moment(dateTo).endOf('day').utc().format("YYYY-MM-DDThh:mm:ssZ");

            console.info(periodStartUtc + " - " + periodEndUtc);
            
            console.info('getting worklogs from axosoft');
            $.ajax({
                url: _this.options.axoSoftUrl + "/v5/work_logs?user_Id="+_this.options.axoSoftUserId+"&date_range=" + "[" + periodStartUtc + "=" + periodStartUtc + "]",
                headers: {
                    "Authorization": "Bearer " + _this.options.axoSoftToken,
                },
                type: "GET",
                contentType:"application/json; charset=utf-8",

                success: function (response) {
                    //console.info(response);
                    resolve(response);
                },
                error: function () {
                    reject();
                }
            });

            
        })
    }


    _this.deleteWorkLog = function(worklogId) {
        // https://ontime.spica.com:442/OnTime/api/v6/work_logs?require_build=11358&ids=72529
        return new Promise(function (resolve, reject) {
            console.info('deleting item from axosoft');
            $.ajax({
                url: _this.options.axoSoftUrl + "/v6/work_logs?require_build=11358&ids=" + worklogId,
                headers: {
                    "Authorization": "Bearer " + _this.options.axoSoftToken,
                    "Access-Control-Allow-Origin": "*"
                },
                type: "DELETE",
                success: function (response) {
                    resolve(response.data);
                },
                error: function () {
                    reject();
                }
            });
        })
    }
    
    
}
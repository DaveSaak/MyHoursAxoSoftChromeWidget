'use strict'

function AxoSoftApi(options) {
    var _this = this;
    _this.options = options;



    _this.getFeatureItemType = function (itemId) {
        return new Promise(function (resolve, reject) {
            console.info('getting item from axosoft');
            $.ajax({
                url: _this.options.axoSoftUrl + "/v6/features/" + itemId,
                headers: {
                    "Authorization": "Bearer " + _this.options.axoSoftToken
                },
                type: "GET",

                success: function (response) {
                    console.info(response);
                    console.info(response.data.item_type);
                    resolve(response.data.item_type);
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
                    console.info(response);
                    resolve(response.data);
                },
                error: function () {
                    reject();
                }
            });
        })
    }

    _this.addWorkLog = function (worklog) {
        //var options = this.options;
        return new Promise(function (resolve, reject) {
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
                    console.info(response);
                    resolve(response.data);
                },
                error: function () {
                    reject();
                }
            });
        })
    }



    
}
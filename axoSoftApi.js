function AxoSoftApi() {
    this.options = new OptionsRepo.getInstance();
    this.options.load();


    this.getFeatureItemType = function (itemId) {
        var options = this.options;


        return new Promise(function (resolve, reject) {
            console.info('getting item from axosoft');
            $.ajax({
                url: options.axoSoftUrl + "/v6/features/" + itemId,
                headers: {
                    "Authorization": "Bearer " + options.axoSoftToken
                },
                type: "GET",

                success: function (data) {
                    console.info(data);
                    console.info(data.item_type);
                    resolve(data.item_type);
                },
                error: function (data) {
                    reject();
                }
            });
        })
    }

    this.getWorkLogTypes = function () {
        var options = this.options;
        return new Promise(function (resolve, reject) {
            console.info('getting item from axosoft');
            $.ajax({
                url: options.axoSoftUrl + "/v6/picklists/work_log_types",
                headers: {
                    "Authorization": "Bearer " + options.axoSoftToken,
                    "Access-Control-Allow-Origin": "*"
                },
                type: "GET",

                success: function (data) {
                    console.info(data);
                    resolve(data);
                },
                error: function (data) {
                    reject();
                }
            });
        })
    }

    
}
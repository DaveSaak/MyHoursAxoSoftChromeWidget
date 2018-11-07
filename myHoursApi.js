function MyHoursApi() {

    this.accessToken = undefined;



    this.getUser = function () {
        var accessToken = this.accessToken;

        return new Promise(
            function (resolve, reject) {
                console.info("api: getting user data");

                $.ajax({
                    url: "https://api.myhours.com/users",
                    headers: {
                        "Authorization": "Bearer " + accessToken
                    },
                    type: "GET",
                    success: function (data) {
                        resolve(data)
                    },
                    error: function (data) {
                        console.error(data);
                        reject(Error());
                    }
                });
            }
        )
    }

    this.getAccessToken = function (email, password) {
        return new Promise(
            function (resolve, reject) {
                console.info("api: getting user data");

                $.ajax({
                    url: "https://api.myhours.com/tokens",
                    type: "POST",
                    data: {
                      clientId: "3d6bdd0e-5ee2-4654-ac53-00e440eed057",
                      email: email,
                      grantType: "password",
                      password: password
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

    this.getLogs = function(date){
        var accessToken = this.accessToken;
        return new Promise(
            function (resolve, reject) {
                console.info("api: getting user data");

                $.ajax({
                    url: "https://api.myhours.com/logs",
                    headers: {
                      "Authorization": "Bearer " + accessToken
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

};
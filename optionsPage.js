$(function () {
    'use strict';
    console.info('init options page');
    var _this = this;
    _this.options = new Options();

    _this.options
        .load()
        .then(function () {
            $('#axoSoftUrl').val(_this.options.axoSoftUrl);
            $('#axoSoftToken').val(_this.options.axoSoftToken);
            $('#axoSoftUserId').val(_this.options.axoSoftUserId);
            $('#axoSoftDefaultWorklogTypeId').val(_this.options.axoSoftDefaultWorklogTypeId);
            $('#contentSwitchProjectId').val(_this.options.contentSwitchProjectId);
            $('#developmentTaskName').val(_this.options.developmentTaskName);
            $('#contentSwitchZoneReEnterTime').val(_this.options.contentSwitchZoneReEnterTime);
            $('#ahUrl').val(_this.options.allHoursUrl);
            $('#ahUserName').val(_this.options.allHoursUserName);

            _this.axoSoftApi = new AxoSoftApi(_this.options);
            _this.allHoursApi = new AllHoursApi(_this.options);

            _this.axoSoftApi.getUsers().then(function (users) {
                users = _.sortBy(users, function (u) {
                    return u.full_name;
                });
                var $select = $("#axoSoftUserId");
                $(users).each(function (i, user) {
                    if (user.is_active === true) {
                        $select.append($("<option>", {
                            value: user.id,
                            html: user.full_name //+ ' -- ' + user.id
                        }));
                    }
                });
                $select.val(_this.options.axoSoftUserId);
            });

            _this.axoSoftApi.getWorkLogTypes().then(function (workLogTypes) {
                workLogTypes = _.sortBy(workLogTypes, function (o) {
                    return o.name;
                });
                var $select = $("#axoSoftDefaultWorklogTypeId");
                $(workLogTypes).each(function (i, workLogType) {
                    $select.append($("<option>", {
                        value: workLogType.id,
                        html: workLogType.name
                    }));
                });
                $select.val(_this.options.axoSoftDefaultWorklogTypeId);
            });

            console.group('all hours token');
            console.log(_this.options.allHoursAccessTokenValidTill)
            console.groupEnd();


            //check ah token.
            if (_this.options.allHoursAccessTokenValidTill){
                let allHoursTokenIsExpired = moment().isAfter(moment(_this.options.allHoursAccessTokenValidTill));
                if (allHoursTokenIsExpired){
                    setAllHoursAccessTokenStyle('alert-danger').text("Sign in. Your access token expired on " + moment(_this.options.allHoursAccessTokenValidTill).format('LLL') + ".");
                }
                else {
                    setAllHoursAccessTokenStyle('alert-primary').text("Your access will expire on " + moment(_this.options.allHoursAccessTokenValidTill).format('LLL'));
                }
            }

        });

        $('input#ahPassword').keyup(function (e) {
            if (e.keyCode == 13) {
                loginToAllHours();
            }
        });         

    $('.saveButton').click(function () {
        _this.options.axoSoftUrl = $('#axoSoftUrl').val();
        _this.options.axoSoftToken = $('#axoSoftToken').val();
        _this.options.axoSoftUserId = $('#axoSoftUserId').val();
        _this.options.axoSoftDefaultWorklogTypeId = $('#axoSoftDefaultWorklogTypeId').val();
        _this.options.contentSwitchProjectId = $('#contentSwitchProjectId').val();
        _this.options.developmentTaskName = $('#developmentTaskName').val();
        _this.options.contentSwitchZoneReEnterTime = $('#contentSwitchZoneReEnterTime').val();
        _this.options.allHoursUrl = $('#ahUrl').val();
        _this.options.allHoursUserName = $('#ahUserName').val();
        

        saveOptions();

        // _this.options.save().then(function () {
        //     var notificationOptions = {
        //         type: 'basic',
        //         iconUrl: 'logo.png',
        //         title: 'Options saved',
        //         message: 'Options have been saved.'
        //     };
        //     //chrome.notifications.create('optionsSaved', notificationOptions);
        //     chrome.notifications.create('optionsSaved', notificationOptions, function () { });
        // });
    });

    $('#loginToAllHours').click(function () {
        loginToAllHours();
    });

    function loginToAllHours(){
        _this.allHoursApi.getAccessToken(
            $('#ahUserName').val(),
            $('#ahPassword').val()
        ).then(function (data) {
            console.log(data);
            setAllHoursAccessTokenStyle().addClass('alert-success').text("All Good. Token retrieved.");
            _this.options.allHoursAccessToken = data.access_token;
            _this.options.allHoursRefreshToken = data.refresh_token;
            _this.options.allHoursAccessTokenValidTill = moment().add(data.expires_in, 'seconds').toString(); 

            console.group('all hours token');
            console.log('expires in (seconds): ' + data.expires_in);
            console.log('valid till: ' + _this.options.allHoursAccessTokenValidTill);
            console.groupEnd();            

            _this.allHoursApi.setAccessToken(data.access_token);
            _this.allHoursApi.getCurrentUserName().then(
                function (data) {
                    console.log(data);
                    setAllHoursAccessTokenStyle('alert-success').text("Hi " + data + ". Your access token will expire at " + moment(_this.options.allHoursAccessTokenValidTill).format('LLL'));
                    saveOptions();
                },
                function (err) { }
            );
        },
            function (err) {
                setAllHoursAccessTokenStyle('alert-danger').text(err.message);
                console.info('error while geeting token');
                console.error(err);
            }
        );        
    }

    function saveOptions() {
        _this.options.save().then(function () {
            var notificationOptions = {
                type: 'basic',
                iconUrl: './images/TS-badge.png',
                title: 'Time & Space Suite Extension',
                message: 'Options have been saved.'
            };
            //chrome.notifications.create('optionsSaved', notificationOptions);
            chrome.notifications.create('optionsSaved', notificationOptions, function () { });
        });
    }

    function setAllHoursAccessTokenStyle(style){
        return $('#ahAccessToken').removeClass('alert-primary').removeClass('alert-danger').addClass(style);
    }

});
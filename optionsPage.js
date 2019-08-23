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

            _this.axoSoftApi = new AxoSoftApi(_this.options); //new axoSoftApi.getInstance();
            _this.allHoursApi = new AllHoursApi();

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
        });

    $('#saveButton').click(function () {
        _this.options.axoSoftUrl = $('#axoSoftUrl').val();
        _this.options.axoSoftToken = $('#axoSoftToken').val();
        _this.options.axoSoftUserId = $('#axoSoftUserId').val();
        _this.options.axoSoftDefaultWorklogTypeId = $('#axoSoftDefaultWorklogTypeId').val();
        _this.options.contentSwitchProjectId = $('#contentSwitchProjectId').val();
        _this.options.developmentTaskName = $('#developmentTaskName').val();
        _this.options.contentSwitchZoneReEnterTime = $('#contentSwitchZoneReEnterTime').val();

        _this.options.save().then(function () {
            var notificationOptions = {
                type: 'basic',
                iconUrl: 'logo.png',
                title: 'Options saved',
                message: 'Options have been saved.'
            };
            //chrome.notifications.create('optionsSaved', notificationOptions);
            chrome.notifications.create('optionsSaved', notificationOptions, function () {});
        });
    });


    $('#loginToAllHours').click(function () {
        _this.allHoursApi.getAccessToken(
            $('#ahUsername').val(),
            $('#ahPassword').val()
        ).then(function (data) {
                console.log(data);
                $('#ahAccessToken').text(data.access_token);
                _this.options.allHoursAccessToken = data.access_token;
            },
            function (err) {
                console.info('error while geeting token');
                console.error(err);
                showLoginPage();
            }
        );
    });
});
$(function () {
    'use strict';
    console.info('init options page');

    toastr.options = {
        "closeButton": true,
        "timeOut": "4000",
      } 

    var _this = this;
    _this.options = new Options();

    _this.options
        .load()
        .then(function () {
            $('#axoSoftUrl').val(_this.options.axoSoftUrl);
            $('#axoSoftToken').val(_this.options.axoSoftToken);
            $('#axoSoftUserId').val(_this.options.axoSoftUserId);
            $('#axoSoftDefaultWorklogTypeId').val(_this.options.axoSoftDefaultWorklogTypeId);
            $('#axoSoftRecentItemsBubbleChartHiddenItemsIds').val(_this.options.axoSoftRecentItemsBubbleChartHiddenItemsIds);
            $('#contentSwitchProjectId').val(_this.options.contentSwitchProjectId);
            $('#developmentTaskName').val(_this.options.developmentTaskName);
            $('#contentSwitchZoneReEnterTime').val(_this.options.contentSwitchZoneReEnterTime);
            $('#ahUrl').val(_this.options.allHoursUrl);
            $('#ahUserName').val(_this.options.allHoursUserName);
            $('#isSecret').val(_this.options.isSecret);
            $('#devOpsInstanceUrl').val(_this.options.devOpsInstanceUrl);
            $('#devOpsPersonalAccessToken').val(_this.options.devOpsPersonalAccessToken);
            $('#devOpsDefaultWorklogType').val(_this.options.devOpsDefaultWorklogType);
            $('#devOpsAuthorName').val(_this.options.devOpsAuthorName);
            
            $('#mhDefaultTagId').val(_this.options.mhDefaultTagId);
            $('#mhCommonDescriptions').val(_this.options.myHoursCommonDescriptions);
            $('#notificationsBadRatio').prop( "checked", _this.options.notificationsBadRatio);

            _this.currentUser = new CurrentUser();
            _this.axoSoftApi = new AxoSoftApi(_this.options);
            _this.allHoursApi = new AllHoursApi(_this.options);
            _this.myHoursApi = new MyHoursApi(_this.currentUser);
            _this.devOpsApi = new DevOpsApi(_this.options);
            _this.chromeNotifications = new ChromeNotifications();

            _this.devOpsApi.getMyRepositoriesAsync().then(repos => {
                repos.value.forEach(repo => {
                    $('#devops-repos')
                        .append(`<li class='d-flex'>
                            <div for="devops-repo-${repo.id}"> 
                                ${repo.name}
                            </div>
                            <div class='ml-auto'>
                                <small class='text-muted'>
                                    ${repo.id}
                                </small>
                            </div>
                        </li>`);
                        // .append(`<li><span class="ml-2" for="devops-repo-${repo.id}"> ${repo.name}</span> <small class='text-muted show-on-hover'>${repo.id}</small></li>`);
                        // .append(`<li><span class="ml-2" for="devops-repo-${repo.id}"> ${repo.name}</span></li>`);
                })
            });

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

            // AXO Worklogs
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

            // MH 
            _this.currentUser.load(x => {
                $('#mhUserName').val(_this.currentUser.email);

                _this.myHoursApi.getTags().then(function (tags) {
                    var $select = $("#mhDefaultTagId");
                    $(tags).each(function (i, tag) {
                        $select.append($("<option>", {
                            value: tag.id,
                            html: tag.name
                        }));
                    });
                    $select.val(_this.options.mhDefaultTagId);                
                });
                _this.myHoursApi.getClients().then(function (clients) {
                    clients = _.sortBy(clients, function (o) {
                        return o.name;
                    });
                    var $select = $("#mhRootClientId");
                    $(clients).each(function (i, client) {
                        if (!client.archived) {
                            $select.append($("<option>", {
                                value: client.id,
                                html: client.name
                            }));
                        }
                    });
                    $select.val(_this.options.myHoursRootClientId);
                });   

                _this.myHoursApi.getTags().then(function (tags) {
                    tags = _.sortBy(tags, function (o) {
                        return o.name;
                    });
                    var $select = $("#mhDefaultTagId");
                    $(tags).each(function (i, tag) {
                        if (!tag.archived) {
                            $select.append($("<option>", {
                                value: tag.id,
                                html: tag.name
                            }));
                        }
                    });
                    $select.val(_this.options.myHoursDefaultTagId);
                });                   

            });




            console.group('all hours token');
            console.log(_this.options.allHoursAccessTokenValidTill)
            console.groupEnd();


            //check ah token.
            if (_this.options.allHoursAccessTokenValidTill) {
                let allHoursTokenIsExpired = moment().isAfter(moment(_this.options.allHoursAccessTokenValidTill));
                if (allHoursTokenIsExpired) {
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
        // _this.options.axoSoftUrl = $('#axoSoftUrl').val();
        // _this.options.axoSoftToken = $('#axoSoftToken').val();
        // _this.options.axoSoftUserId = $('#axoSoftUserId').val();
        // _this.options.axoSoftDefaultWorklogTypeId = $('#axoSoftDefaultWorklogTypeId').val();
        // _this.options.contentSwitchProjectId = $('#contentSwitchProjectId').val();
        // _this.options.developmentTaskName = $('#developmentTaskName').val();
        // _this.options.contentSwitchZoneReEnterTime = $('#contentSwitchZoneReEnterTime').val();
        _this.options.allHoursUrl = $('#ahUrl').val();
        _this.options.allHoursUserName = $('#ahUserName').val();
        _this.options.isSecret = $('#isSecret').val();


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

    $('#saveAllHoursButton').click(function () {
        _this.options.allHoursUrl = $('#ahUrl').val();
        _this.options.allHoursUserName = $('#ahUserName').val();
        _this.options.isSecret = $('#isSecret').val();
        saveOptions();
        _this.chromeNotifications.showNotification('Save All Hours settings', 'All Hours settings saved', 'SaveAllHoursSettings');
    });    

    $('#saveAxoButton').click(function () {
        _this.options.axoSoftUrl = $('#axoSoftUrl').val();
        _this.options.axoSoftToken = $('#axoSoftToken').val();
        _this.options.axoSoftUserId = $('#axoSoftUserId').val();
        _this.options.axoSoftDefaultWorklogTypeId = $('#axoSoftDefaultWorklogTypeId').val();
        _this.options.axoSoftRecentItemsBubbleChartHiddenItemsIds = $('#axoSoftRecentItemsBubbleChartHiddenItemsIds').val();
        saveOptions();
        toastr.success('Axo settings saved');
    });   
    
    $('#saveMhButton').click(function () {
        _this.options.myHoursDefaultTagId = $('#mhDefaultTagId').val();
        _this.options.myHoursRootClientId = $('#mhRootClientId').val();
        saveOptions();
        toastr.success('MyHours settings saved');
    });      

    $('#saveMhButton').click(function () {
        _this.options.mhDefaultTagId = $('#mhDefaultTagId').val();
        _this.options.myHoursCommonDescriptions = $('#mhCommonDescriptions').val();
        saveOptions();
        toastr.success('My Hours settings saved');

    });     

    $('#saveDevOpsButton').click(function () {
        _this.options.devOpsInstanceUrl = $('#devOpsInstanceUrl').val();
        _this.options.devOpsPersonalAccessToken = $('#devOpsPersonalAccessToken').val();
        _this.options.devOpsDefaultWorklogType = $('#devOpsDefaultWorklogType').val();
        _this.options.devOpsAuthorName = $('#devOpsAuthorName').val();
        saveOptions();
        toastr.success('DevOps settings saved');

    });    

    $('#saveNotificationsButton').click(function () {
        _this.options.notificationsBadRatio = $('#notificationsBadRatio').prop( "checked");
        saveOptions();
        toastr.success('Notifications settings saved');
    });      

    $('#clearUserButton').click(x => {
        let currentUser = new CurrentUser();
        currentUser.clear();
        toastr.success('User data was cleared. You will need to login.');
    });

    $('#loginToAllHours').click(function () {
        loginToAllHours();
    });

    $('#loginToMyHours').click(function () {
        let loginToMyHoursInfo = $('#loginToMyHoursInfo');
        loginToMyHoursInfo.text('logging in...');

        let email = $('#mhUserName').val();
        let password = $('#mhPassword').val();
        _this.myHoursApi.getAccessToken(email, password).then(
            function (token) {
                //var currentUser = new CurrentUserRepo.getInstance();
                _this.currentUser.email = email;
                _this.currentUser.setTokenData(token.accessToken, token.refreshToken);
                _this.currentUser.save();

                //myHoursApi.accessToken = token.accessToken;
                _this.myHoursApi.getUser().then(function (user) {
                    _this.currentUser.setUserData(user.id, user.name);
                    _this.currentUser.save();
                    toastr.success('You are now logged into your My Hours account.');
                }, function (err) {
                    console.info('error while geeting the user data');
                    toastr.error('Error while getting the user data.');
                });

                loginToMyHoursInfo.text('success');

            },
            function (error) {
                console.info('error while geeting the access token');
                toastr.error('Error logging in.');
                loginToMyHoursInfo.text('fail');
            }
        )
    })

    function loginToAllHours() {
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
            // var notificationOptions = {
            //     type: 'basic',
            //     iconUrl: './images/TS-badge.png',
            //     title: 'Time & Space Suite Extension',
            //     message: 'Options have been saved.'
            // };
            // //chrome.notifications.create('optionsSaved', notificationOptions);
            // chrome.notifications.create('optionsSaved', notificationOptions, function () { });
        });
    }

    function setAllHoursAccessTokenStyle(style) {
        return $('#ahAccessToken').removeClass('alert-primary').removeClass('alert-danger').addClass(style);
    }

});
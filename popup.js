'use strict'

$(document).ready(function () {

    new popup();



});



function popup() {
    console.info('init');
    var _this = this;

    _this.myHoursLogs = undefined;
    _this.worklogTypes = undefined;
    _this.currentDate = moment();

    _this.currentUser = new CurrentUserRepo.getInstance();
    _this.options = new OptionsRepo.getInstance();

    _this.myHoursRepo = new MyHoursApi(_this.currentUser) //new MyHoursRepo.getInstance();
    _this.axoSoftRepo = new AxoSoftApi(_this.options); //new AxoSoftRepo.getInstance();

    _this.options.load().then(
        function () {
            //        _this.myHoursRepo.accessToken = options.accessToken;

            _this.currentUser.load(function () {
                console.info(_this.currentUser);

                if (_this.currentUser.accessToken == undefined) {
                    console.info('access token is undefined');

                    if (_this.currentUser.email != undefined) {
                        $('#email').val(_this.currentUser.email);
                    }

                    showLoginPage();
                } else {
                    //MyHoursRepo.accessToken = currentUser.accessToken;
                    showMainPage();
                }
            })
        }
    );

    function initInterface() {

        $('#loginButton').click(function () {
            var email = $('#email').val();
            var password = $('#password').val();
            login(email, password);
        });

        $('#copyToAxoSoftButton').click(function () {
            copyTimelogs();
        });

        $('#logOutButton').click(function () {
            _this.currentUser.clear();
            showLoginPage();
        });

        $('.timeControl span:first-child').click(function () {
            _this.currentDate = _this.currentDate.add(-1, 'days');
            getLogs();
        });

        $('.timeControl span:last-child').click(function () {
            _this.currentDate = _this.currentDate.add(1, 'days');
            getLogs();
        });


    }


    function showLoginPage() {
        $('body').addClass('narrow');
        $('body').removeClass('wide');

        $('#mainContainer').hide();
        $('#loginContainer').show();

        //var currentUser = new CurrentUserRepo.getInstance();
        if (_this.currentUser.email != undefined) {
            $('input#email').val(_this.currentUser.email);
        }

    }

    function showMainPage() {
        $('body').removeClass('narrow');
        $('body').addClass('wide');


        $('#mainContainer').show();
        $('#loginContainer').hide();


        //var currentUser = new CurrentUserRepo.getInstance();
        $('#usersName').text(_this.currentUser.name);

        getLogs();
    }


    function getLogs() {
        $('.timeControl span:nth-child(2)').text(_this.currentDate.format('LL'));

        _this.myHoursRepo.getLogs(_this.currentDate).then(
            function (data) {
                _this.myHoursLogs = data;

                var logsContainer = $('#logs');
                logsContainer.empty();

                $.each(data, function (index, data) {

                    var log = $('<li>').data('logId', data.id);

                    var columns = $('<div>').addClass('columns');
                    var columnA = $('<div>').addClass('column is-two-thirds');

                    if (data.project != null) {
                        var projectInfo = $('<span>').text(data.project.name).addClass('tag is-link');
                        columnA.append(projectInfo);
                    }

                    if (data.task != null) {
                        var taskInfo = $('<span>').text(data.task.name).addClass('tag is-warning');
                        columnA.append(taskInfo);
                    }
                    columns.append(columnA);

                    var columnB = $('<div>').addClass('column is-2');
                    if (data.duration != null) {
                        var duration = moment().startOf('day').add(data.duration, 'seconds');
                        var durationInfo = $('<span>').text(duration.format("HH:mm:ss"));
                        columnB.append(durationInfo);
                    }
                    columns.append(columnB);

                    var columnC = $('<div>').addClass('column is-1');
                    var statusDone = ($('<span>').addClass('icon has-text-success'));
                    statusDone.append('<i>').addClass('fas fa-check-square');
                    columnC.append(statusDone);
                    columns.append(columnC);

                        

                    
                    log.append(columns);
                    logsContainer.append(log);
                });
            },
            function () {
                console.info('failed to get logs');
                showLoginPage();
            }
        )
    }

    function login(email, password) {
        _this.myHoursRepo.getAccessToken(email, password).then(
            function (token) {
                //var currentUser = new CurrentUserRepo.getInstance();
                _this.currentUser.email = email;
                _this.currentUser.setTokenData(token.accessToken, token.refreshToken);
                _this.currentUser.save();

                //myHoursRepo.accessToken = token.accessToken;
                _this.myHoursRepo.getUser().then(function (user) {
                    _this.currentUser.setUserData(user.id, user.name);
                    _this.currentUser.save();
                    showMainPage();
                }, function (err) {
                    console.info('error while geeting the user data');
                    showLoginPage();
                });

            },
            function (error) {
                console.info('error while geeting the access token');
                showLoginPage();
            }
        )
    }

    function getTimeLogDetails(myHoursLog, workLogTypeId) {
        var itemId = (myHoursLog.project.name
                .match(/\d+\.\d+|\d+\b|\d+(?=\w)/g) || [])
            .map(function (v) {
                return +v;
            }).shift();

        if (itemId != undefined) {
            console.info(itemId);

            _this.axoSoftRepo.getFeatureItemType(itemId).then(function (itemType) {
                console.info(itemType);

                var worklog = new Worklog;
                worklog.user.id = _this.options.axoSoftUserId;
                worklog.work_done.duration = myHoursLog.duration / 60 / 60;
                worklog.item.id = itemId;
                worklog.item.item_type = itemType;
                worklog.work_log_type.id = workLogTypeId;
                worklog.description = myHoursLog.note;
                worklog.date_time = myHoursLog.date;

                console.info(worklog);
            })
        }
    }


    function copyTimelogs() {
        console.info(_this.myHoursLogs);
        _this.axoSoftRepo.getWorkLogTypes().then(
            function (response) {
                console.info(response);
                _this.worklogTypes = response;
                $.each(_this.myHoursLogs, function (index, myHoursLog) {
                    if (myHoursLog.project != undefined && myHoursLog.project.name != undefined) {

                        var workLogTypeId = _this.options.axoSoftDefaultWorklogTypeId;
                        if (myHoursLog.task != undefined && myHoursLog.task.name != undefined) {
                            var workLogType = _.find(_this.worklogTypes,
                                function (w) {
                                    return w.name.toUpperCase() === myHoursLog.task.name.toUpperCase();
                                });

                            if (workLogType != undefined) {
                                workLogTypeId = workLogType.Id;
                            }
                        }
                        getTimeLogDetails(myHoursLog, workLogTypeId);
                    }
                });
            },
            function () {});
    }




    initInterface();
};
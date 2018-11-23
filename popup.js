'use strict'

$(document).ready(function () {
    new popup();
});

function popup() {
    console.info('init');
    var _this = this;

    _this.myHoursLogs = undefined;
    _this.worklogTypes = undefined;
    _this.timeUnits = undefined;


    _this.currentDate = moment();

    _this.currentUser = new CurrentUserRepo.getInstance();
    _this.options = new OptionsRepo.getInstance();

    _this.myHoursApi = new MyHoursApi(_this.currentUser) //new myHoursApi.getInstance();
    _this.axoSoftApi = new AxoSoftApi(_this.options); //new axoSoftApi.getInstance();

    _this.options.load().then(
        function () {
            _this.currentUser.load(function () {
                console.info(_this.currentUser);

                if (_this.currentUser.accessToken == undefined) {
                    console.info('access token is undefined');

                    if (_this.currentUser.email != undefined) {
                        $('#email').val(_this.currentUser.email);
                    }

                    showLoginPage();
                } else {
                    //myHoursApi.accessToken = currentUser.accessToken;
                    showMainPage();
                }
            })
        }
    );

    function initInterface() {

        $('#loginButton').click(function () {
            login($('#email').val(), $('#password').val());
        });

        $('#loginContainer input').keyup(function (e) {
            if (e.keyCode == 13) {
                login($('#email').val(), $('#password').val());
            }
        });


        $('#copyToAxoSoftButton').click(function () {
            copyTimelogs();
        });

        $('#logOutButton').click(function () {
            _this.currentUser.clear();
            showLoginPage();
        });

        $('.timeControl span.previousDay').click(function () {
            _this.currentDate = _this.currentDate.add(-1, 'days');
            getLogs();
        });

        $('.timeControl span.nextDay').click(function () {
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
        // $('.timeControl span:nth-child(2)').text(_this.currentDate.format('dddd, LL'));
        $('.date').text(_this.currentDate.format('dddd, LL'));


        _this.axoSoftApi.getWorkLogMinutesWorked(_this.currentDate).then(function (minutesWorked) {
            console.info(minutesWorked);
            $("#axoTotal").text((Math.round(minutesWorked / 60 * 100) / 100) + "h");
        });


        _this.myHoursApi.getLogs(_this.currentDate).then(
            function (data) {
                _this.myHoursLogs = data;

                var logsContainer = $('#logs');
                logsContainer.empty();

                var totalMins = 0;

                $.each(data, function (index, data) {
                    totalMins = totalMins + (data.duration / 60);

                    var log = $('<li>').attr("data-logId", data.id);

                    var columns = $('<div>').addClass('columns');
                    var columnA = $('<div>').addClass('column is-two-thirds');

                    var tagGroup = $('<div>').addClass('tags has-addons');


                    if (data.project != null) {
                        var projectInfo = $('<span>').text(data.project.name).addClass('tag is-info');
                        tagGroup.append(projectInfo);
                    } else {
                        var projectInfo = $('<span>')
                            .text("Unassigned time log. Will not be copied to Axo")
                            .addClass('tag is-dark')
                            .css("font-style", "italic");

                        tagGroup.append(projectInfo);
                    }

                    if (data.task != null) {
                        var taskInfo = $('<span>').text(data.task.name).addClass('tag is-danger');
                        tagGroup.append(taskInfo);
                    }
                    columnA.append(tagGroup);

                    var columnB = $('<div>').addClass('column is-2').css('text-align', 'right').css('font-weight', '600');
                    if (data.duration != null) {
                        // var duration = moment().startOf('day').add(data.duration, 'seconds');
                        var duration = Math.round(data.duration / 60 / 60 * 100) / 100 + 'h';
                        // var durationInfo = $('<span>').text(duration.format("HH:mm:ss"));
                        var durationInfo = $('<span>').text(duration);
                        columnB.append(durationInfo);
                    }


                    var columnC = $('<div>').addClass('column is-1 statusColumn');
                    var statusDone = ($('<span>').addClass('icon has-text-success'));
                    statusDone.append('<i>').addClass('far fa-check-circle');
                    columnC.append(statusDone);
                    columnC.hide();

                    columns.append(columnB);
                    columns.append(columnA);
                    
                    columns.append(columnC);

                    log.append(columns);
                    logsContainer.append(log);

                    console.log(totalMins);
                });
                $('#mhTotal').text((Math.round(totalMins / 60 * 100) / 100) + "h");
            },
            function () {
                console.info('failed to get logs');
                showLoginPage();
            }
        )
    }

    function login(email, password) {
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

            _this.axoSoftApi.getFeatureItem(itemId).then(function (item) {
                console.info(item);

                var worklog = new Worklog;
                worklog.user.id = parseInt(_this.options.axoSoftUserId);
                worklog.work_done.duration = myHoursLog.duration / 60; // mins
                worklog.item.id = parseInt(itemId);
                worklog.item.item_type = item.item_type;
                worklog.work_log_type.id = parseInt(workLogTypeId);
                worklog.description = myHoursLog.note;
                worklog.date_time = myHoursLog.date;

                //calc remaining time
                var timeUnit = _.find(_this.timeUnits, function (t) {
                    return t.id === item.remaining_duration.time_unit.id
                });
                var remainingTimeMins = timeUnit.conversion_factor * item.remaining_duration.duration;
                worklog.remaining_time.duration = remainingTimeMins - worklog.work_done.duration;

                console.info(worklog);
                console.info(JSON.stringify(worklog));

                var myHoursLogId = myHoursLog.id;

                _this.axoSoftApi.addWorkLog(worklog)
                    .then(
                        function () {
                            console.info('worklog added');
                            $('*[data-logid="' + myHoursLogId + '"] .statusColumn').show();
                        }
                    )
                    .catch(
                        function () {
                            console.info('worklog add failed');
                        }
                    )


            })
        }
    }


    function copyTimelogs() {
        console.info(_this.myHoursLogs);
        _this.axoSoftApi.getWorkLogTypes().then(
            function (response) {
                console.info(response);
                _this.worklogTypes = response;

                _this.axoSoftApi.getTimeUnits().then(function (response) {
                    console.info(response);
                    _this.timeUnits = response;

                    $.each(_this.myHoursLogs, function (index, myHoursLog) {
                        if (myHoursLog.project != undefined && myHoursLog.project.name != undefined) {

                            var workLogTypeId = _this.options.axoSoftDefaultWorklogTypeId;
                            if (myHoursLog.task != undefined && myHoursLog.task.name != undefined) {
                                var workLogType = _.find(_this.worklogTypes,
                                    function (w) {
                                        return w.name.toUpperCase() === myHoursLog.task.name.toUpperCase();
                                    });

                                if (workLogType != undefined) {
                                    workLogTypeId = workLogType.id;
                                }
                            }
                            getTimeLogDetails(myHoursLog, workLogTypeId);
                        }
                    });

                });





            },
            function () {});
    }




    initInterface();
};
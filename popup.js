//'use strict';

$(document).ready(function () {
    new popup();
});

function popup() {
    'use strict';

    console.info('init');
    var _this = this;

    _this.myHoursLogs = undefined;
    _this.worklogTypes = undefined;
    _this.timeUnits = undefined;

    _this.currentDate = moment();
    _this.currentUser = new CurrentUser();
    _this.options = new Options();

    _this.myHoursApi = new MyHoursApi(_this.currentUser);
    _this.axoSoftApi = new AxoSoftApi(_this.options);

    _this.timeRatio = new TimeRatio(showRatio);

    _this.timeLineWidth = 1300;
    _this.noTimeDataText = "n/a";
    _this.noNumberDataText = "n/a";

    //init bootstrap tooltips
    // $(function () {
    //     $('[data-toggle="tooltip"]').tooltip()
    // })


    _this.options.load().then(
        function () {
            _this.allHoursApi = new AllHoursApi(
                _this.options);
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

        $('#optionsButton').click(function () {
            showOptionsPage();
        });


        $('#previousDay').click(function () {
            _this.currentDate = _this.currentDate.add(-1, 'days');
            getLogs();
        });

        $('#nextDay').click(function () {
            _this.currentDate = _this.currentDate.add(1, 'days');
            getLogs();
        });

        $('#today').click(function () {
            _this.currentDate = _this.currentDate = moment().startOf('day');
            getLogs();
        });

        $('#current-date').click(function () {
            _this.currentDate = _this.currentDate = moment().startOf('day');
            getLogs();
        });

        $('#refresh').click(function () {
            getLogs();
        });

        $('#switchContentButton').click(function () {
            _this.myHoursApi.addLog(_this.options.contentSwitchProjectId, "content switch", _this.options.contentSwitchZoneReEnterTime)
                .then(
                    function (data) {

                        var notificationOptions = {
                            type: 'basic',
                            iconUrl: 'logo.png',
                            title: 'Content Switch',
                            message: 'Content Switch was recorded.'
                        };
                        chrome.notifications.create('optionsSaved', notificationOptions, function () { });

                        //console.log(data);
                    },
                    function (error) {
                        console.log(error);
                    });
        });

        document.onkeyup = function (event) {
            if (event.keyCode === 37) {
                _this.currentDate = _this.currentDate.add(-1, 'days');
                getLogs();
            }
            else if (event.keyCode === 39) {
                _this.currentDate = _this.currentDate.add(1, 'days');
                getLogs();
            }
            else if (event.keyCode === 32) {
                _this.currentDate = _this.currentDate = moment().startOf('day');
                getLogs();
            }
        };

    }


    function showLoginPage() {
        $('body').addClass('narrow');
        $('body').removeClass('wide');

        $('#mainContainer').hide();
        $('#loginContainer').show();

        if (_this.currentUser.email != undefined) {
            $('input#email').val(_this.currentUser.email);
        }

    }

    function showOptionsPage() {
        chrome.runtime.openOptionsPage();

    }

    function showMainPage() {
        $('body').removeClass('narrow');
        $('body').addClass('wide');

        $('#mainContainer').show();
        $('#loginContainer').hide();
        $('#usersName').text(_this.currentUser.name);

        getLogs();
    }


    function getLogs() {
        _this.timeRatio.reset();
        clearRatio();

        var topContainer = $('#topContainer');
        topContainer.scrollLeft(300);

        var timeline = $('#timeline');
        timeline.empty();

        var colors = ['#F44336', '#E91E63', "#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#4CAF50", "#FFC107", "#FF5722", "#795548"];

        $('.date').text(_this.currentDate.format('dddd, DD.MMM'));

        $('#ahAttendance').text(_this.noTimeDataText);
        $('#axoTotal').text(_this.noTimeDataText);
        $('#mhTotal').text(_this.noTimeDataText);


        _this.axoSoftApi.getWorkLogMinutesWorked(_this.currentDate).then(function (minutesWorked) {
            console.info(minutesWorked);
            $("#axoTotal").text(minutesToString(minutesWorked));
        });


        getAllHoursData();

        var logsContainer2 = $('#logsContainer');
        // logsContainer2.toggleClass('d-none', true);
        // topContainer.toggleClass('d-none', true);

        _this.myHoursApi.getLogs(_this.currentDate).then(
            function (data) {
                _this.myHoursLogs = data;
                _this.myHoursTaskSummary = {};

                var logsContainer = $('#logs');
                logsContainer.empty();

                for (var i = 1; i <= 24; i++) {
                    var tickColor = "lightgray";
                    if (i % 6 == 0)
                        tickColor = "#474747";


                    var tick = $('<div>').css({
                        left: (i * 60) / 1440 * _this.timeLineWidth + 'px',
                        "background-color": tickColor,
                    });
                    tick.addClass('timeline-tick');
                    tick.prop('title', i);
                    timeline.append(tick);

                    var time = $('<div>').css({
                        left: ((i * 60) / 1440 * _this.timeLineWidth) - 10 + 'px',
                    });
                    time.addClass('timeline-time')
                    time.text(i);
                    timeline.append(time);
                }

                var totalMins = 0;

                logsContainer2.toggleClass('d-none', data.length === 0);
                topContainer.toggleClass('d-none', data.length === 0);


                $.each(data, function (index, data) {
                    var colorIndex = nameToIndex(data.projectName, 10);
                    var logColor = colors[colorIndex];

                    totalMins = totalMins + (data.duration / 60);

                    var log = $('<li>').attr("data-logId", data.id);
                    var columns = $('<div>').addClass('columns');
                    var columnA = $('<div>').addClass('column is-two-thirds mainColumn');
                    var tagGroup = $('<div>').addClass('tags has-addons');

                    if (data.projectId != null) {
                        var projectInfo = $('<span>')
                            .text(data.projectName)
                            .addClass('tag is-info')
                            .css("background-color", logColor);
                        tagGroup.append(projectInfo);
                    } else {
                        var projectInfo = $('<span>')
                            .text("Unassigned time log. Will not be copied to Axo")
                            .addClass('tag is-light is-rounded')
                            .css("font-style", "italic");

                        tagGroup.append(projectInfo);
                    }

                    if (data.taskId != null) {
                        var taskInfo = $('<span>').text(data.taskName).addClass('tag is-dark').css("font-style", "italic");;
                        tagGroup.append(taskInfo);

                        if (_this.myHoursTaskSummary[data.taskName] == undefined) {
                            _this.myHoursTaskSummary[data.taskName] = data.duration;
                        } else {
                            _this.myHoursTaskSummary[data.taskName] = _this.myHoursTaskSummary[data.taskName] + data.duration;
                        }
                    } else {
                        if (_this.myHoursTaskSummary['_'] == undefined) {
                            _this.myHoursTaskSummary['_'] = data.duration;
                        } else {
                            _this.myHoursTaskSummary['_'] = _this.myHoursTaskSummary['_'] + data.duration;
                        }

                    }
                    columnA.append(tagGroup);

                    var columnB = $('<div>').addClass('column is-1').css('text-align', 'right').css('font-weight', '600');

                    if (data.duration != null) {
                        var duration = minutesToString(data.duration / 60);
                        var durationInfo = $('<span>').text(duration);
                        columnB.append(durationInfo);
                    }
                    var columnC = $('<div>').addClass('column is-2 statusColumn');

                    var status = ($('<div>').addClass('tags'));
                    columnC.append(status);

                    getAxoItem(data).then(item => {
                        // var logStatus = $('*[data-logid="' + data.id + '"] .statusColumn .tags');
                        // logStatus.empty();
                        // var success = $('<span>').addClass('tag').text(item.name);
                        // logStatus.append(success);
                    },
                        function (err) {
                            var logStatus = $('*[data-logid="' + data.id + '"] .mainColumn .tags');
                            logStatus.empty();
                            var fail = $('<span>').addClass('tag is-light').html("<i class='fas fa-skull-crossbones mr-2'></i>Item was not found on Axo.<i class='fas fa-skull-crossbones ml-2'></i>");
                            logStatus.append(fail);
                        });

                    _this.myHoursApi.getTimes(data.id).then(
                        function (times) {
                            $.each(times, function (index, time) {
                                var left = timeToPixel(time.startTime, _this.timeLineWidth);
                                var right = timeToPixel(time.endTime, _this.timeLineWidth);
                                var timePeriod = intervalToString(time.startTime, time.endTime, time.duration);//minutesToString(time.duration / 60) + "h (" + moment(time.startTime).format('LT') + " - " + moment(time.endTime).format('LT') + ")";
                                var title = timePeriod + ' // ' + data.projectName + ' // ' + data.taskName;

                                var barGraph = $('<div>');
                                barGraph.addClass('timelineItem timeline-log');
                                barGraph.prop('title', title);
                                barGraph.attr('data-toggle', "tooltip");
                                barGraph.attr('data-placement', "bottom");
                                barGraph.attr('data-html', "true");
                                barGraph.css({
                                    left: left + 'px',
                                    width: right - left + 'px',
                                    "background-color": logColor,
                                });
                                timeline.append(barGraph);
                                //barGraph.tooltip();
                            });
                        }
                    );


                    columns.append(columnB);
                    columns.append(columnA);
                    columns.append(columnC);

                    log.append(columns);
                    logsContainer.append(log);
                });
                _this.timeRatio.setMyHours(totalMins);
                $('#mhTotal').text(minutesToString(totalMins));

                // let ahTopRange = moment.duration(totalMins / 0.9, 'minutes');
                // let ahBottomRange = moment.duration(totalMins, 'minutes');
                // $('#ahRange').text("[" + moment.utc(ahBottomRange.as('milliseconds')).format('HH:mm') + '-' + moment.utc(ahTopRange.as('milliseconds')).format('HH:mm') + ']');

                $('#tasks').empty();
                $.each(_this.myHoursTaskSummary, function (index, summary) {
                    let summaryHours = Math.round(summary / 60 / 60 * 100) / 100;

                    let taskCssClass = "is-info";
                    if (index == 'development' && summaryHours >= 4) {
                        taskCssClass = "is-success"
                    } else if (index == 'development' && summaryHours < 1) {
                        taskCssClass = "is-danger"
                    }

                    var taskControl = $('<div>').addClass('control');
                    var taskGroup = $('<div>').addClass('tags has-addons');
                    var taskName = $('<span>').text(index).addClass('tag is-dark').css("font-style", "italic");
                    var taskTime = $('<span>').text(minutesToString(summary / 60)).addClass('tag').addClass(taskCssClass);

                    taskGroup.append(taskName);
                    taskGroup.append(taskTime);

                    taskControl.append(taskGroup);

                    $('#tasks').append(taskControl);
                });
            },
            function () {
                console.info('failed to get logs');
                showLoginPage();
            }
        );
    }

    function getAllHoursData() {
        _this.allHoursApi.getCurrentUserId().then(
            function (data) {

                if (data) {
                    _this.allHoursApi.getAttendance(data, _this.currentDate).then(
                        function (data) {
                            if (data && data.CalculationResultValues.length > 0) {
                                let attendance = parseInt(data.CalculationResultValues[0].Value, 10);
                                _this.timeRatio.setAllHours(attendance);
                                $('#ahAttendance').text(minutesToString(attendance));
                            }
                        },
                        function (error) {
                            console.error('error while geeting attendance.');
                        }
                    );

                    _this.allHoursApi.getUserCalculations(data, _this.currentDate).then(
                        function (data) {
                            if (data && data.DailyCalculations.length > 0) {
                                let segments = data.DailyCalculations[0].CalculationResultSegments;
                                var timeline = $('#timeline');

                                console.group('all hours segments');
                                console.table(segments);
                                console.groupEnd();

                                $.each(segments, function (index, segment) {
                                    if (segment.Type === 4 && segment.StartTime && segment.StartTime.trim() !== "") {
                                        var left = timeToPixel(segment.StartTime, _this.timeLineWidth);
                                        var right = timeToPixel(segment.EndTime, _this.timeLineWidth);

                                        var timePeriod = intervalToString(segment.startTime, segment.endTime, segment.duration)

                                        var barGraph = $('<div>');
                                        barGraph.prop('data-tippy-content', 'All Hours paid time <br/>' + timePeriod);
                                        barGraph.addClass('allHoursSegment timelineItem');
                                        barGraph.prop('title', timePeriod);
                                        barGraph.css({
                                            left: left + 'px',
                                            width: right - left + 'px',
                                        });
                                        barGraph.addClass('timeline-segment')

                                        timeline.append(barGraph);
                                        //set tooltips
                                        //barGraph.tooltip();
                                        //tippy('.allHoursSegment');

                                    }
                                });

                            }
                        },
                        function (error) {
                            console.error('error while geeting calculation.');
                        }
                    );
                }
            },
            function (error) {
                console.error('error while geeting the AH current. token may be expired');
            }
        );
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
        var itemId = (myHoursLog.projectName
            .match(/\d+\.\d+|\d+\b|\d+(?=\w)/g) || [])
            .map(function (v) {
                return +v;
            }).shift();

        var logStatus = $('*[data-logid="' + myHoursLog.id + '"] .statusColumn .tags');
        logStatus.empty();

        console.info('copy to axo: itemId' + itemId);

        
        if (itemId != undefined) {
            console.info(itemId);

            _this.axoSoftApi.getFeatureItem(itemId).then(function (item) {
                //console.info(item);

                var worklog = new Worklog;
                worklog.user.id = parseInt(_this.options.axoSoftUserId);
                worklog.work_done.duration = myHoursLog.duration / 60; // mins
                worklog.item.id = parseInt(itemId);
                worklog.item.item_type = item.item_type;
                worklog.work_log_type.id = parseInt(workLogTypeId);
                worklog.description = myHoursLog.note;
                worklog.date_time = moment(myHoursLog.date).add(8, 'hours').toDate();

                //calc remaining time
                var timeUnit = _.find(_this.timeUnits, function (t) {
                    return t.id === item.remaining_duration.time_unit.id
                });
                var remainingTimeMins = timeUnit.conversion_factor * item.remaining_duration.duration;
                worklog.remaining_time.duration = Math.max(remainingTimeMins - worklog.work_done.duration, 0);

                //console.info(worklog);
                //console.info(JSON.stringify(worklog));

                _this.axoSoftApi.addWorkLog(worklog)
                    .then(
                        function () {
                            console.info('worklog added');
                            var success = $('<span>').addClass('tag');
                            var reminingHrs = Math.round(worklog.remaining_time.duration / 60);
                            if (reminingHrs > 0) {
                                success.addClass('is-success')
                            } else {
                                success.addClass('is-warning')
                            }
                            success.text(reminingHrs + " hrs left");

                            logStatus.append(success);
                            //logStatus.append('<span>').addClass('tag is-success').text("OK -- " + +" hrs left");
                        }
                    )
                    .catch(
                        function () {
                            logStatus.append('<span>').addClass('tag is-danger').text("error adding log").css('color: red');
                            console.info('worklog add failed');
                        }
                    )


            })
        } else {
            logStatus.append('<span>').addClass('tag is-danger').text("could not find the item id");
        }
    }

    function getAxoItem(myHoursLog) {
        if (myHoursLog.projectName != null) {
            var itemId = (myHoursLog.projectName
                .match(/\d+\.\d+|\d+\b|\d+(?=\w)/g) || [])
                .map(function (v) {
                    return +v;
                }).shift();

            if (itemId !== undefined) {
                return _this.axoSoftApi.getFeatureItem(itemId);
            }
        }

        if (myHoursLog.note != null) {
            var itemId = (myHoursLog.note
                .match(/\d+\.\d+|\d+\b|\d+(?=\w)/g) || [])
                .map(function (v) {
                    return +v;
                }).shift();

            if (itemId !== undefined) {
                return _this.axoSoftApi.getFeatureItem(itemId);
            }
        }
        return Promise.reject(new Error('project not found'));
    }


    function copyTimelogs() {
        console.info(_this.myHoursLogs);

        if (_this.options.axoSoftUserId == undefined) {
            $('#alertContainer').show();
            $('#alertContainer div.alert').text("AxoSoft user not defined. Check settings.");

        }
        else {
            $('#alertContainer').hide();

            $('#axoNotAccessible').hide();
            try {
                _this.axoSoftApi.getWorkLogTypes().then(
                    function (response) {
                        //console.info(response);
                        _this.worklogTypes = response;

                        _this.axoSoftApi.getTimeUnits().then(function (response) {
                            //console.info(response);
                            _this.timeUnits = response;

                            $.each(_this.myHoursLogs, function (index, myHoursLog) {
                                console.info('copy to axo: ' + index);
                                if (myHoursLog.projectId != undefined && myHoursLog.projectName != undefined) {

                                    var workLogTypeId = _this.options.axoSoftDefaultWorklogTypeId;
                                    if (myHoursLog.taskId != undefined && myHoursLog.taskName != undefined) {
                                        var workLogType = _.find(_this.worklogTypes,
                                            function (w) {
                                                return w.name.toUpperCase() === myHoursLog.taskName.toUpperCase();
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
                    function () { })
                    .catch(
                        function () {
                            $('#axoNotAccessible').show();
                        }
                    );
            } catch (e) {
                $('#axoNotAccessible').show();
            }
        }
    }

    function timeToPixel(date, fullLength) {
        var mmt = moment(date);
        var mmtMidnight = mmt.clone().startOf('day');
        var diffMinutes = mmt.diff(mmtMidnight, 'minutes');

        return Math.round(diffMinutes / 1440 * fullLength);

    }

    function minutesToString(minutes) {
        let duration = moment.duration(minutes, 'minutes');
        let minutesString = (duration.days() * 24) + duration.hours() + ':' + duration.minutes().toString().padStart(2, '0');

        //console.log('format minutes: ' + minutes + ' -> ' + minutesString);
        return minutesString;

        //return (Math.round(minutes / 60 * 100) / 100) + "h";
    }

    function nameToIndex(s, length) {
        if (!s) {
            return 0;
        }
        let sumOfChars = s.split('').map(x => x.charCodeAt(0)).reduce((a, b) => a + b, 0);
        return sumOfChars % length;
    }

    function showRatio(ratio) {
        let elementCard = $('#timeRatioCard');
        let ratioValid = (ratio >= 0.9 && ratio <= 1);
        elementCard.toggleClass('bg-warning', !ratioValid);

        let elementInfo = $('#timeRatio');
        elementInfo.text((ratio * 100).toFixed(0) + '%');
    }

    function clearRatio() {
        let elementCard = $('#timeRatioCard');
        elementCard.removeClass('bg-warning');

        let elementInfo = $('#timeRatio');
        elementInfo.text(_this.noNumberDataText);
    }

    function intervalToString(startTime, endTime, durationMinutes) {
        let interval = moment(startTime).format('LT') + " - " + moment(endTime).format('LT');
        return interval + ' (' + minutesToString(durationMinutes / 60) + 'h )';
    }

    initInterface();
}
//'use strict';
$(document).ready(function () {
    new popup();
});

function popup() {
    'use strict';

    console.info('init');
    var _this = this;

    toastr.options = {
        "closeButton": true,
        "timeOut": "4000",
    }

    _this.myHoursLogs = undefined;
    _this.worklogTypes = undefined;
    _this.timeUnits = undefined;

    _this.currentDate = moment();
    _this.currentUser = new CurrentUser();
    _this.options = new Options();

    _this.myHoursApi = new MyHoursApi(_this.currentUser);
    _this.axoSoftApi = new AxoSoftApi(_this.options);
    _this.devOpsApi = new DevOpsApi(_this.options);

    _this.timeRatio = new TimeRatio(showRatio);
    _this.timeRatioAllHourAxo = new TimeRatio(showRatioAllHoursAxo);

    _this.timeLineWidth = 1300;
    _this.noTimeDataText = "n/a";
    _this.noNumberDataText = "n/a";

    _this.isResizing = false;
    _this.lastDownX = 0;

    _this.worklogTypeChart = undefined;
    _this.recentItemsChart = undefined;
    _this.calendarChart = undefined;


    _this.axoItemColors = ['#F44336', '#E91E63', "#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#4CAF50", "#FFC107"];

    _this.fetchLogsId = 0;

    chrome.runtime.sendMessage({ type: 'refreshBadge' });

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
                    console.info('got current user.');
                    if (_this.currentUser.refreshToken != undefined) {
                        console.info('refresh token found. lets use it.');
                        showLoadingPage();
                        _this.myHoursApi.getRefreshToken(_this.currentUser.refreshToken).then(
                            function (token) {
                                console.info('got refresh token. token: ');
                                console.info(token);

                                _this.currentUser.setTokenData(token.accessToken, token.refreshToken);
                                _this.currentUser.save();
                                showMainPage();
                            }
                        )
                            .catch(error => {
                                console.error('error: ' + error);
                                showLoginPage();

                            });
                    }
                    else {
                        //myHoursApi.accessToken = currentUser.accessToken;
                        showMainPage();
                    }
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


        $('#deleteWorklogsFromAxoSoftButton').click(function () {
            deleteLogs();
        });


        $('.allHoursStats').click(function () {
            showHomePage();
        });

        $('.axoStats').click(function () {
            showAxoViewPage();
        });

        // $('#closeHome').click(function () {
        //     $('#mainContainer').show();
        //     $('#homeContainer').hide();
        // });

        // $('#closeAxoView').click(function () {
        //     $('#mainContainer').show();
        //     $('#axoViewContainer').hide();
        // });

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
            getLogsForToday();
        });

        $('#refresh').click(function () {
            getLogs();
        });

        $('#reloadDay').click(function () {
            getLogs();
        });

        $('#refreshHome').click(function () {
            getCurrentBalance();
        });

        $('#refreshRecentAxoItems').click(function () {
            getRecentAxoItems();
        });

        $('#refreshDevOpsItems').click(function () {
            getMyDevOpsItems();
        });

        $('#refreshCalendar').click(function () {
            refreshCalendar();
        });

        $('#pills-axo-tab').click(function () {
            getRecentAxoItems();
        });


        $('#pills-calendar-tab').click(function () {
            refreshCalendar();
        });


        $('.showLogsSwitch').click(function () {
            let show = $('#showLogsSwitch').prop("checked");
            if (show) {
                $('#logsContainer').show();
                $('#showLogsSwitchOff').show();
                $('#showLogsSwitchOn').hide();
            }
            else {
                $('#logsContainer').hide();
                $('#showLogsSwitchOn').show();
                $('#showLogsSwitchOff').hide();
            }

        });

        $('#switchContentButton').click(function () {
            _this.myHoursApi.addLog(_this.options.contentSwitchProjectId, "content switch", _this.options.contentSwitchZoneReEnterTime)
                .then(
                    function (data) {
                        var notificationOptions = {
                            type: 'basic',
                            iconUrl: './images/TS-badge.png',
                            title: 'Content Switch',
                            message: 'Content Switch was recorded.'
                        };
                        chrome.notifications.create('optionsSaved', notificationOptions, function () { });
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
                if (!event.ctrlKey) {
                    getLogsForToday();
                }
                else {
                    getLogs();
                }
            }
            // else if (event.keyCode === 32) {
            //     getLogsForToday();
            // }            
        };
    }

    function getLogsForToday() {
        _this.currentDate = _this.currentDate = moment().startOf('day');
        getLogs();
    }

    function showLoginPage() {
        $('body').addClass('narrow');
        $('body').removeClass('wide');

        // $('#mainContainer').hide();
        // $('#mainContainer').hide();
        $('#loginContainer').show();

        if (_this.currentUser.email != undefined) {
            $('input#email').val(_this.currentUser.email);
        }

        $('#password').focus();

    }

    function showOptionsPage() {
        chrome.runtime.openOptionsPage();
    }

    function showMainPage() {
        $('body').removeClass('narrow');
        $('body').addClass('wide');

        $('#mainContainer').show();
        $('#loginContainer').hide();
        $('#loadingContainer').hide();
        $('#usersName').text(_this.currentUser.name);

        getLogs();
        // getCurrentBalance();
        getRecentAxoItems();

    }

    function showLoadingPage() {
        $('body').removeClass('narrow');
        $('body').addClass('wide');

        $('#mainContainer').hide();
        $('#loginContainer').hide();
        $('#loadingContainer').show();

    }

    function showHomePage() {
        // $('#mainContainer').hide();
        // $('#homeContainer').show();
        getCurrentBalance();
    }

    function showAxoViewPage() {
        // $('#mainContainer').hide();
        // $('#axoViewContainer').show();
        getRecentAxoItems();
    }

    function drawTimeLineTimes(timelineContainer) {
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
            timelineContainer.append(tick);

            var time = $('<div>').css({
                left: ((i * 60) / 1440 * _this.timeLineWidth) - 10 + 'px',
            });
            time.addClass('timeline-time')
            time.text(i);
            timelineContainer.append(time);
        }
    }

    function getLogs() {
        let fetchLogsId = moment().valueOf();
        _this.fetchLogsId = fetchLogsId;

        console.log(`getting logs. fetch id: ${fetchLogsId}`);
        _this.timeRatio.reset();
        _this.timeRatioAllHourAxo.reset();
        clearRatio();
        //hideAlert();

        var topContainer = $('#topContainer');
        topContainer.scrollLeft(300);

        var timeline = $('#timeline');
        timeline.empty();
        drawTimeLineTimes(timeline);
        topContainer.toggleClass('d-none', false);

        // var colors = ['#F44336', '#E91E63', "#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#4CAF50", "#FFC107"];

        let today = moment().startOf('day');
        // if (today.month() === _this.currentDate.month() && today.year() === _this.currentDate.year()) {
        //     $('.date').text(_this.currentDate.format('dddd, DD'));
        // } else {
        //     $('.date').text(_this.currentDate.format('dddd, DD.MMM'));
        // }
        $('.date').text(_this.currentDate.startOf('day').calendar(today, {
            sameDay: '[Today]',
            nextDay: '[Tomorrow]',
            nextWeek: 'dddd, DD.',
            lastDay: '[Yesterday]',
            lastWeek: 'dddd, DD.',
            sameElse: 'dddd, DD.MMM'
        }));

        $('#ahAttendance').text(_this.noTimeDataText);
        $('#ahAttendance').empty().append(getSpinner());

        $('#axoTotal').text(_this.noTimeDataText);
        $('#axoTotal').empty().append(getSpinner());

        $('#mhTotal').text(_this.noTimeDataText);
        $('#mhTotal').empty().append(getSpinner());

        var logsContainer = $('#logs');
        logsContainer.empty();

        _this.axoSoftApi.getWorkLogMinutesWorked(_this.currentDate).then(function (minutesWorked) {
            console.info(minutesWorked);

            if (fetchLogsId !== _this.fetchLogsId) {
                console.info(`fetch log id mismatch. skipping. local fetch id: ${fetchLogsId}, global fetch id: ${_this.fetchLogsId}`);
                return;
            }


            $("#axoTotal").text(minutesToString(minutesWorked));
            _this.timeRatioAllHourAxo.setMyHours(minutesWorked);
        })
            .catch(error => {
                console.log(error);
                showAlert('could not connect to Axo.');
            });


        _this.axoSoftApi.getWorkLogTypes()
            .then(response => {

                if (fetchLogsId !== _this.fetchLogsId) {
                    console.info(`fetch log id mismatch. skipping. local fetch id: ${fetchLogsId}, global fetch id: ${_this.fetchLogsId}`);
                    return;
                }

                _this.worklogTypes = response;
                _this.axoSoftApi.getTimeUnits().then(function (response) {
                    _this.timeUnits = response;

                    getAllHoursData(fetchLogsId);
                    var logsContainer2 = $('#logsContainer');

                    _this.myHoursApi.getLogs(_this.currentDate).then(
                        function (logs) {

                            if (fetchLogsId !== _this.fetchLogsId) {
                                console.info(`fetch log id mismatch. skipping. local fetch id: ${fetchLogsId}, global fetch id: ${_this.fetchLogsId}`);
                                return;
                            }

                            $('#copyToAxoSoftButton').prop('disabled', logs.length == 0);

                            _this.myHoursLogs = logs;
                            _this.myHoursTaskSummary = {};

                            var totalMins = 0;

                            logsContainer2.toggleClass('d-none', _this.myHoursLogs.length === 0);
                            // topContainer.toggleClass('d-none', _this.myHoursLogs.length === 0);

                            $.each(_this.myHoursLogs, function (index, data) {
                                totalMins = totalMins + (data.duration / 60);

                                var log = $('<div>')
                                    .attr("data-logId", data.id)
                                    .addClass("d-flex logContainer my-1 p-1 mr-1 align-items-center");

                                var columnColorBar = $('<div>')
                                    .addClass('columnColorBar rounded mr-2');


                                var columnMain = $('<div>')
                                    .addClass('mainColumn columnMain d-flex flex-column');

                                var columnAxoWorklogType = $('<div>')
                                    .addClass('axoWorklogTypeColumn');

                                columnMain.append(columnAxoWorklogType);



                                log.mouseenter(function () {
                                    $('#timeline .timeline-log[data-logId="' + data.id + '"]').toggleClass("active", true);
                                    $('#timeline .timeline-log').not('[data-logId="' + data.id + '"]').toggleClass("deactivate", true);
                                    hiLiteMyHoursLog(data.id);
                                });
                                log.mouseleave(function () {
                                    $('#timeline .timeline-log[data-logId="' + data.id + '"]').toggleClass("active", false);
                                    $('#timeline .timeline-log').not('[data-logId="' + data.id + '"]').toggleClass("deactivate", false);
                                    hiLiteMyHoursLog();
                                });

                                var worklogTypeInfo = $('<div>')
                                    .addClass('text-muted text-lowercase worklogType')
                                    .css('font-size', '0.7rem');

                                columnAxoWorklogType.append(worklogTypeInfo);

                                var columnTime = $('<div>')
                                    .addClass('columnTime text-right');
                                //.css('text-align', 'right')
                                //.css('font-weight', '600');

                                if (data.duration != null) {
                                    var durationInfo = $('<i class="far fa-spinner-third fa-spin"></i>');
                                    if (!data.running) {
                                        var duration = minutesToString(data.duration / 60);
                                        durationInfo = $('<span>').text(duration);
                                    }
                                    columnTime.append(durationInfo);
                                }


                                var columnStatus = $('<div>')
                                    .addClass('statusColumn ml-auto');

                                var status = ($('<div>')
                                    .addClass('d-flex align-items-center columnStatus'));
                                columnStatus.append(status);

                                getAxoItem(data).then(item => {
                                    data.axoName = item.name;
                                    data.axoId = item.id;
                                    data.axoItemType = item.item_type;
                                    let remainingDurationIsAvailable = (item.remaining_duration.time_unit.id !== 0)

                                    if (remainingDurationIsAvailable) {
                                        data.axoRemainingDurationTimeUnitId = item.remaining_duration.time_unit.id;
                                        data.axoRemainingDuration = item.remaining_duration.duration;
                                        data.axoRemainingTimeMins = getRemainingMinutes(data.axoRemainingDurationTimeUnitId, data.axoRemainingDuration);
                                    }
                                    data.color = _this.axoItemColors[numberToIndex(data.axoId, 8)];
                                    columnColorBar.css("background-color", data.color);


                                    if (data.taskName) {
                                        let worklogTypeId = getWorklogTypeId(data.taskName, _this.worklogTypes, false);
                                        data.axoWorklogTypeId = worklogTypeId;
                                    }
                                    else {
                                        let partialWorkLogTypeName = getPartialWorkLogType(data);
                                        let worklogTypeId = getWorklogTypeId(partialWorkLogTypeName, _this.worklogTypes, true);
                                        data.axoWorklogTypeId = worklogTypeId;
                                    }
                                    let worklogTypeName = getWorklogTypeName(data.axoWorklogTypeId, _this.worklogTypes);
                                    data.axoWorklogTypeName = worklogTypeName;

                                    worklogTypeInfo.text(data.axoWorklogTypeName);



                                    var logStatus = $('*[data-logid="' + data.id + '"] .mainColumn');
                                    var truncatedAxoName = data.axoName; //truncateText(data.axoName, 50);
                                    var success = $('<div>')
                                        .addClass('axoItemName text-truncate')
                                        .text('' + data.axoId + " -- " + truncatedAxoName)
                                        //.css("background-color", data.color)
                                        //.css("color", "white")
                                        .click(function (event) {
                                            if (data.projectId && event.ctrlKey) {
                                                window.open(`https://app.myhours.com/#/projects/${data.projectId}/overview`, '_blank');
                                            }
                                            status.append(remainingHoursInfo);
                                            /*}
        
        
                                            // if (data.axoId) {
                                            //     var buttonCopyToAxo = $('<a title="copy to AXO woklog">')
                                            //         .addClass('btn btn-light')
                                            //         .click(function (event) {
                                            //             event.preventDefault();
                                            //             addAxoWorkLog(data);
                                            //         });
                                            //     buttonCopyToAxo.html('<i class="far fa-seedling" aria-hidden="true"></i>');
                                            //     status.append(buttonCopyToAxo);
                                            // }
        
                                            //status.append(getActionsDropDown(data));
        
                                            // if (data.projectId) {
                                            //     var button = $('<a title="open My Hours project details">')
                                            //         .addClass('btn roundButton')
                                            //         .click(function (event) {
                                            //             event.preventDefault();
                                            //             window.open(`https://app.myhours.com/#/projects/${data.projectId}/overview`, '_blank');
                                            //         });
                                            //     button.html('<i class="fas fa-external-link-alt"></i>');
                                            //     status.append(button);
                                            // }
        
                                            // if (data.axoId) {
                                            //     var buttonOpenAxoItem = $('<a title="open AXO item">')
                                            //         .addClass('btn roundButton')
                                            //         .click(function (event) {
                                            //             event.preventDefault();
                                            //             window.open(`https://ontime.spica.com:442/OnTime/ViewItem.aspx?type=features&id=${data.axoId}`, '_blank');
                                            //         });
                                            //     buttonOpenAxoItem.html('<i class="fas fa-external-link-alt"></i>');
                                            //     status.append(buttonOpenAxoItem);
                                            // }
        /*
                                            logStatus.append(success);
                                            getTimes(data, timeline);
                                        },
                                            function (err) {
                                                var logStatus = $('*[data-logid="' + data.id + '"] .mainColumn .tags');
                                                logStatus.empty();
                                                var fail = $('<div>');
                                                fail.append($("<i class='far fa-skull-crossbones'>"));
                                                fail.append($("<span>").addClass("axoItemName ml-2").html("Work Item not found"));
                                                //logStatus.append(fail);
        
                                                data.color = 'whitesmoke';
                                                getTimes(data, timeline);
                                                // columnMain.append($("<i class='far fa-skull-crossbones'>"));
                                                columnMain.append(fail);
                                                */
                                        });

                                    if (data.note) {
                                        success.attr('title', data.note);
                                    }

                                    var itemComment = $('<div>')
                                        .addClass('text-muted small worklogType')
                                        .text('' + data.note);

                                    {
                                        var remainingHoursInfo = $('<span>').addClass('small');

                                        if (remainingDurationIsAvailable) {
                                            var reminingHrs = Math.round(data.axoRemainingTimeMins / 60);
                                            remainingHoursInfo.text(reminingHrs + " hrs left");
                                        } else {
                                            remainingHoursInfo.addClass('badge-danger');
                                            remainingHoursInfo.text("enter estimate to sync");
                                        }
                                        status.append(remainingHoursInfo);
                                    }


                                    // if (data.axoId) {
                                    //     var buttonCopyToAxo = $('<a title="copy to AXO woklog">')
                                    //         .addClass('btn btn-light')
                                    //         .click(function (event) {
                                    //             event.preventDefault();
                                    //             addAxoWorkLog(data);
                                    //         });
                                    //     buttonCopyToAxo.html('<i class="far fa-seedling" aria-hidden="true"></i>');
                                    //     status.append(buttonCopyToAxo);
                                    // }

                                    status.append(getActionsDropDown(data));

                                    // if (data.projectId) {
                                    //     var button = $('<a title="open My Hours project details">')
                                    //         .addClass('btn roundButton')
                                    //         .click(function (event) {
                                    //             event.preventDefault();
                                    //             window.open(`https://app.myhours.com/#/projects/${data.projectId}/overview`, '_blank');
                                    //         });
                                    //     button.html('<i class="fas fa-external-link-alt"></i>');
                                    //     status.append(button);
                                    // }

                                    // if (data.axoId) {
                                    //     var buttonOpenAxoItem = $('<a title="open AXO item">')
                                    //         .addClass('btn roundButton')
                                    //         .click(function (event) {
                                    //             event.preventDefault();
                                    //             window.open(`https://ontime.spica.com:442/OnTime/ViewItem.aspx?type=features&id=${data.axoId}`, '_blank');
                                    //         });
                                    //     buttonOpenAxoItem.html('<i class="fas fa-external-link-alt"></i>');
                                    //     status.append(buttonOpenAxoItem);
                                    // }

                                    logStatus.append(success);
                                    logStatus.append(itemComment);
                                    getTimes(data, timeline);
                                },
                                    function (err) {
                                        var logStatus = $('*[data-logid="' + data.id + '"] .mainColumn .tags');
                                        logStatus.empty();
                                        var fail = $('<div>');
                                        fail.append($("<i class='far fa-skull-crossbones'>"));
                                        fail.append($("<span>").addClass("axoItemName ml-2").html("Work Item not found"));
                                        //logStatus.append(fail);

                                        data.color = 'whitesmoke';
                                        getTimes(data, timeline);
                                        // columnMain.append($("<i class='far fa-skull-crossbones'>"));
                                        columnMain.append(fail);
                                    });

                                log.append(columnColorBar);
                                //log.append(columnAxoWorklogType);
                                log.append(columnMain);
                                log.append(columnTime);
                                log.append(columnStatus);

                                log.append(log);
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
                });

            })
            .catch(error => {
                console.log(error);
                showAlert('could not connect to Axo.');
            });


    }

    function deleteLogs() {
        _this.axoSoftApi.getWorkLogs(_this.currentDate).then(
            function (logs) {

                $.each(logs.data, function (index, workLog) {
                    _this.axoSoftApi.deleteWorkLog(workLog.id);
                });
            }
        );
    }

    function getActionsDropDown(data) {
        let buttonGroup = $('<div>').addClass('btn-group ml-auto');
        buttonGroup.append($('<button type="button" class="btn btn-transparent dropdown-toggleX" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">')
            .append($('<i class="far fa-ellipsis-v">'))
            //.text('Actions')
        );

        let dropdownMenu = $('<div>').addClass('dropdown-menu');


        let startTrackingTime = $('<a class="dropdown-item" href="#">');
        startTrackingTime.append('<i class="far fa-play"></i> <span class="ml-1">Start tracing time</span>')
            .click(function (event) {
                event.preventDefault();
                _this.myHoursApi.startFromExisting(data.id).then(
                    function () {
                        console.info('worklog started');
                        getLogsForToday();
                    }
                )
                    .catch(
                        function () {
                            console.info('worklog add failed');
                        }
                    )
            });
        dropdownMenu.append(startTrackingTime);
        // dropdownMenu.append('<div class="dropdown-divider">');

        if (true) {
            // dropdownMenu.append('<div class="dropdown-divider">');
            dropdownMenu.append($('<a class="dropdown-item" href="#">')
                .append('<i class="far fa-code-merge"></i><span class="ml-1">Copy commit message to description</span>')
                .click(function (event) {
                    event.preventDefault();
                    copyCommitMessage(data);
                }));
        }

        if (data.projectId) {
            dropdownMenu.append($('<a class="dropdown-item" href="#">')
                .append('<i class="far fa-external-link-alt"></i><span class="ml-1">Open My Hours project</span>')
                .click(function (event) {
                    event.preventDefault();
                    window.open(`https://app.myhours.com/#/projects/${data.projectId}/overview`, '_blank');
                }));
        }



        if (data.axoId) {
            dropdownMenu.append('<div class="dropdown-divider">');
            dropdownMenu.append($('<a class="dropdown-item" href="#">')
                .append('<i class="far fa-external-link-alt"></i> <span class="ml-1">Open AXO item</span>')
                .click(function (event) {
                    event.preventDefault();
                    window.open(`https://ontime.spica.com:442/OnTime/ViewItem.aspx?type=features&id=${data.axoId}`, '_blank');
                }));

            dropdownMenu.append($('<a class="dropdown-item" href="#">')
                .append('<i class="far fa-seedling"></i><span class="ml-1">Copy time to AXO worklog</span>')
                .click(function (event) {
                    event.preventDefault();
                    _this.addAxoWorkLog(data, data.duration).then(x => console.log('added axo work log'));
                }));
        }
        buttonGroup.append(dropdownMenu);


        let startTrackingTimeShortcut = $('<button>').addClass("btn btn-transparent mr-1");
        startTrackingTimeShortcut.append($('<i class="far fa-play">').attr("title", "Start tracking time"))
            .click(function (event) {
                event.preventDefault();
                _this.myHoursApi.startFromExisting(data.id).then(
                    function () {
                        console.info('worklog started');
                        getLogsForToday();
                    }
                )
                    .catch(
                        function () {
                            console.info('worklog add failed');
                        }
                    )
            });

        let buttons = $("<div>").addClass("d-flex ml-auto");
        buttons.append(startTrackingTimeShortcut);
        buttons.append(buttonGroup);

        return buttons;
    }

    function getRecentAxoItemsActionsDropDown(data) {

        return $('<button class="btn btn-transparent">')
            .append($('<i class="far fa-play"></i>').attr("title", "Start tracking time"))
            .click(function (event) {
                event.preventDefault();
                let note = data.itemId + "/" + data.workLogTypeName;
                _this.myHoursApi.startLog(note).then(
                    function () {
                        console.info('worklog started');

                        var notificationOptions = {
                            type: 'basic',
                            iconUrl: './images/ts-badge.png',
                            title: 'MyHours',
                            message: 'Log started.'
                        };
                        chrome.notifications.create('notifyAxoItemStarted', notificationOptions, function () { console.log("Last error:", chrome.runtime.lastError); });
                        $('#pills-home-tab').tab('show');
                    }
                )
                    .catch(
                        function () {
                            console.info('worklog add failed');
                        }
                    )
            })
    }

    function getTimes(data, timeline) {
        _this.myHoursApi.getTimes(data.id).then(
            function (times) {
                data.times = times;
                $.each(times, function (index, time) {
                    var left = timeToPixel(time.startTime, _this.timeLineWidth);
                    var right = timeToPixel(time.endTime, _this.timeLineWidth);
                    //var timePeriod = intervalToString(time.startTime, time.endTime, time.duration);//minutesToString(time.duration / 60) + "h (" + moment(time.startTime).format('LT') + " - " + moment(time.endTime).format('LT') + ")";
                    // var title = intervalToString(time.startTime, time.endTime, time.duration) + ' // ' + data.projectName + ' // ' + data.taskName;
                    var title = intervalToString(time.startTime, time.endTime, time.duration) + ' -- ' + data.note;

                    var barGraph = $('<div>');
                    barGraph.addClass('timelineItem timeline-log');
                    barGraph.attr("data-logId", data.id);
                    barGraph.prop('title', title);

                    if (!data.axoId) {
                        barGraph.append('<i class="far fa-skull-crossbones ml-2" aria-hidden="true"></i>');
                    }

                    if (data.running) {
                        barGraph.css({
                            left: left + 'px',
                            width: '20px',
                            "background-image": '-webkit-gradient(linear, left top, right top, from(' + data.color + '), to(rgba(0, 0, 0, 0)))'
                        });
                    }
                    else {
                        barGraph.css({
                            left: left + 'px',
                            width: right - left + 'px',
                            "background-color": data.color,
                        });
                    }

                    barGraph.mouseenter(function () {
                        $('.logContainer[data-logId="' + data.id + '"]').toggleClass("active", true);
                        hiLiteMyHoursLog(data.id);
                    });
                    barGraph.mouseleave(function () {
                        $('.logContainer[data-logId="' + data.id + '"]').toggleClass("active", false);
                        hiLiteMyHoursLog();
                    });

                    timeline.append(barGraph);
                    //barGraph.tooltip();
                });
            }
        );


    }


    function getAllHoursData(fetchLogsId) {
        let currentUserPromise = _this.allHoursApi.getCurrentUserId();

        if (currentUserPromise != undefined) {
            currentUserPromise.then(
                function (data) {
                    getCurrentBalance();

                    if (data) {
                        if (fetchLogsId !== _this.fetchLogsId) {
                            console.info(`fetch log id mismatch. skipping. local fetch id: ${fetchLogsId}, global fetch id: ${_this.fetchLogsId}`);
                            return;
                        }

                        if (_this.currentDate.isSame(moment(), 'day')) {
                            console.log('it is today');

                            _this.allHoursApi.getCurrentBalance(data).then(
                                function (data) {
                                    var attendance = 450 + parseInt(data.CurrentBalanceMinutes);

                                    //let attendance = parseInt(data.CalculationResultValues[0].Value, 10);
                                    _this.timeRatio.setAllHours(attendance);
                                    _this.timeRatioAllHourAxo.setAllHours(attendance);
                                    $('#ahAttendance').text(minutesToString(attendance));
                                });
                        }
                        else {
                            console.log('it is NOT today');
                            _this.allHoursApi.getAttendance(data, _this.currentDate).then(
                                function (data) {
                                    if (data && data.CalculationResultValues.length > 0) {
                                        let attendance = parseInt(data.CalculationResultValues[0].Value, 10);
                                        _this.timeRatio.setAllHours(attendance);
                                        _this.timeRatioAllHourAxo.setAllHours(attendance);
                                        $('#ahAttendance').text(minutesToString(attendance));
                                    } else {
                                        $('#ahAttendance').text('0:00');
                                    }

                                },
                                function (error) {
                                    console.error('error while geting attendance.');
                                }
                            );
                        }

                        _this.allHoursApi.getUserCalculations(data, _this.currentDate, _this.currentDate.clone()).then(
                            function (data) {
                                if (fetchLogsId !== _this.fetchLogsId) {
                                    console.info(`fetch log id mismatch. skipping. local fetch id: ${fetchLogsId}, global fetch id: ${_this.fetchLogsId}`);
                                    return;
                                }

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

                                            var barGraph = $('<div>');
                                            barGraph.addClass('allHoursSegment timelineItem');
                                            barGraph.prop('title', intervalToString(segment.StartTime, segment.EndTime, segment.Value));
                                            barGraph.css({
                                                left: left + 'px',
                                                width: right - left + 'px',
                                            });
                                            barGraph.addClass('timeline-segment')

                                            timeline.append(barGraph);
                                        }
                                    });

                                }
                            },
                            function (error) {
                                console.error('error while getting calculation.');
                            }
                        );
                    } else {
                        $('#ahAttendance').text('0:00');
                    }
                })
                .catch(error => {
                    $('#ahAttendance').text('login error');
                    console.error('error while getting the AH current. token may be expired');
                })
        }
        else {
            $('#ahAttendance').text('login error');
        }
    }

    function getCurrentBalance() {
        $('#currentBalancePlan').text('-');
        $('#currentBalanceAttendance').text('-');
        $('#currentBalanceRunning').text('-');
        $('#currentBalanceDiff').text('-');
        $('currentVacationDays').text('-');

        let currentUserPromise = _this.allHoursApi.getCurrentUserId();

        if (currentUserPromise != undefined) {
            currentUserPromise.then(
                function (data) {
                    var userId = data;

                    if (data) {
                        var today = moment().startOf('day');

                        _this.allHoursApi.getCurrentBalance(data).then(
                            function (data) {
                                var currentBalance = parseInt(data.CurrentBalanceMinutes);
                                drawDayBalanceChart(userId, today, currentBalance);

                                console.log(data.CurrentBalanceMinutes);
                                $('#currentBalanceDiff').text(minutesToString(currentBalance, true));
                                $('#homeGreeting').text(data.Greeting);
                                $('#currentVacationDays').text(data.VacationBalance);

                                _this.allHoursApi.getUserCalculations(userId, today, today.clone()).then(
                                    function (data) {

                                        //
                                        let dayCalc = data.DailyCalculations[0];

                                        //day balance
                                        var currentBalanceAlternation = 0;
                                        var dayDiff = dayCalc.Accruals.filter(x => x.CalculationResultTypeCode == 4);
                                        if (dayDiff.length > 0) {
                                            let dayDiffValue = parseInt(dayDiff[0].Value);
                                            currentBalanceAlternation = currentBalance - dayDiffValue;
                                        }

                                        //plan
                                        var planAccrual = dayCalc.Accruals.filter(x => x.CalculationResultTypeCode == 1);
                                        if (planAccrual.length > 0) {
                                            $('#currentBalancePlan').text(minutesToString(parseInt(planAccrual[0].Value)));
                                        }

                                        //attendance
                                        var currentBalanceAttendance = 0;
                                        var planAttendance = dayCalc.Accruals.filter(x => x.CalculationResultTypeCode == 33);
                                        if (planAttendance.length > 0) {
                                            let planAttendanceValue = parseInt(planAttendance[0].Value);
                                            currentBalanceAttendance = planAttendanceValue + currentBalanceAlternation;
                                        } else if (currentBalanceAlternation != 0) {
                                            currentBalanceAttendance = currentBalanceAlternation;
                                        }
                                        $('#currentBalanceAttendance').text(minutesToString(currentBalanceAttendance));

                                        //running balance
                                        var runningBalance = dayCalc.Accruals.filter(x => x.CalculationResultTypeCode == 24);
                                        if (runningBalance.length > 0) {
                                            let runningBalanceValue = parseInt(runningBalance[0].Value);
                                            runningBalanceValue = runningBalanceValue + currentBalanceAlternation;

                                            $('#currentBalanceRunning').text(minutesToString(runningBalanceValue, true));
                                        }
                                    },
                                    function (error) {
                                        console.error('error while geeting attendance.');
                                    }
                                );
                            },
                            function (error) {
                                console.error('error while geeting attendance.');
                            }
                        );
                    }
                })
                .catch(error => {
                    $('#currentBalanceMinutes').text('error logging in');
                    console.error('error while getting the AH current. token may be expired');
                })
        }
        else {
            $('#currentBalanceMinutes').text('error logging in');
        }
    }

    function getDevOpsItemsActionsDropDown(item) {

        return $('<button class="btn btn-transparent">')
            .append($('<i class="far fa-play"></i>').attr("title", "Start tracking time"))
            .click(function (event) {
                event.preventDefault();
                let note = item.id;
                _this.myHoursApi.startLog(note, _this.options.mhDefaultTagId).then(
                    function () {
                        console.info('worklog started');

                        var notificationOptions = {
                            type: 'basic',
                            iconUrl: './images/ts-badge.png',
                            title: 'MyHours',
                            message: 'Log started.'
                        };
                        chrome.notifications.create('notifyDevOpsItemStarted', notificationOptions, function () { console.log("Last error:", chrome.runtime.lastError); });
                        $('#pills-home-tab').tab('show');
                    }
                )
                    .catch(
                        function () {
                            console.info('worklog add failed');
                        }
                    )
            })
    }

    function getMyDevOpsItems() {

        _this.devOpsApi.getMyItemsIds().then(
            function (queryResult) {
                console.log(queryResult);

                let myItemsContainer = $('#myDevOpsItems');
                myItemsContainer.empty();

                let ids = queryResult.workItems.map(x => x.id).join();
                _this.devOpsApi.getItems(ids).then(
                    function (items) {
                        console.log(items);

                        $.each(items.value, function (index, item) {
                            var log = $('<div>')
                                .attr("data-logId", item.id)
                                // .attr("data-workLogTypeId", recentAxoItem.workLogTypeId)
                                .addClass("d-flex logContainer my-1 p-1 mr-1 align-items-center");
                            myItemsContainer.append(log);

                            //color bar
                            var columnColorBar = $('<div>')
                                .addClass('columnColorBar rounded mr-2')
                                .css("background-color", _this.axoItemColors[numberToIndex(item.id, 8)]);
                            log.append(columnColorBar);


                            //item name and worklog type
                            var columnMain = $('<div>')
                                .addClass('mainColumn columnMain d-flex flex-row')
                            log.append(columnMain);

                            var columnItemTypeIcon = $('<div>');
                            if (item.fields['System.WorkItemType'] == 'Task') {
                                columnItemTypeIcon.append('<i class="fas fa-clipboard-check"></i>').css('color', '#a4880a')
                            } else if (item.fields['System.WorkItemType'] == 'Bug') {
                                columnItemTypeIcon.append('<i class="fas fa-bug"></i>').css('color', '#cc293d')
                            }
                            columnMain.append(columnItemTypeIcon);

                            var axoItemName = $('<div>')
                                .addClass('axoItemName text-truncate ml-2')
                                .text(item.id + " -- " + item.fields['System.Title']);
                            columnMain.append(axoItemName);


                            //actions
                            var actions = $('<div>')
                                .addClass('ml-auto');
                            actions.append(getDevOpsItemsActionsDropDown(item));
                            log.append(actions);

                        });
                    }
                );
            }
        );
    };

    function getRecentAxoItems() {
        _this.axoSoftApi.getWorkLogsWithinLastTenDays().then(
            function (recentWorkLogsWithinTenDaysResponse) {
                $('#recentItemsWorkLogsCount').text(recentWorkLogsWithinTenDaysResponse.data.length);

                let totalWorked = recentWorkLogsWithinTenDaysResponse.metadata.minutes_worked;
                $('.recentItemsTotal').text(minutesToString(totalWorked));

                let recentAxoItems = recentWorkLogsWithinTenDaysResponse.data.reduce((accumulator, workLog) => {
                    let key = workLog.item.id + "-" + workLog.work_log_type.id;
                    if (key in accumulator) {
                        accumulator[key].lastSeen = moment.max(accumulator[key].lastSeen, moment(workLog.date_time));
                        accumulator[key].count = accumulator[key].count + 1;
                        accumulator[key].workDone = accumulator[key].workDone + workLog.work_done.duration_minutes;
                    }
                    else {
                        accumulator[key] = {
                            itemId: workLog.item.id,
                            itemName: workLog.item.name,
                            workLogTypeId: workLog.work_log_type.id,
                            workLogTypeName: workLog.work_log_type.name,
                            lastSeen: moment(workLog.date_time),
                            count: 1,
                            workDone: workLog.work_done.duration_minutes,
                        }
                    }
                    return accumulator;
                }, {});

                recentAxoItems = Object.entries(recentAxoItems).map(x => x[1]);
                recentAxoItems.sort((a, b) => {
                    let order = b.lastSeen.unix() - a.lastSeen.unix();
                    if (order != 0)
                        return order;
                    return b.count - a.count;
                });

                $('#recentAxoItems').empty();

                $('#recentItemsCount').text(recentAxoItems.length);
                $.each(recentAxoItems, function (index, recentAxoItem) {
                    //container
                    var log = $('<div>')
                        .attr("data-logId", recentAxoItem.itemId)
                        .attr("data-workLogTypeId", recentAxoItem.workLogTypeId)
                        .addClass("d-flex logContainer my-1 p-1 mr-1 align-items-center");
                    $('#recentAxoItems').append(log);

                    //color bar
                    var columnColorBar = $('<div>')
                        .addClass('columnColorBar rounded mr-2')
                        .css("background-color", _this.axoItemColors[numberToIndex(recentAxoItem.itemId, 8)]);
                    log.append(columnColorBar);

                    //item name and worklog type
                    var columnMain = $('<div>')
                        .addClass('mainColumn columnMain d-flex flex-column')
                    log.append(columnMain);

                    var columnAxoWorklogType = $('<div>')
                        .addClass('axoWorklogTypeColumn');

                    columnMain.append(columnAxoWorklogType);

                    var worklogTypeInfo = $('<div>')
                        .addClass('text-muted text-lowercase worklogType')
                        .css('font-size', '0.7rem')
                        .text(recentAxoItem.workLogTypeName);

                    columnAxoWorklogType.append(worklogTypeInfo);

                    var axoItemName = $('<div>')
                        .addClass('axoItemName text-truncate')
                        .text(recentAxoItem.itemId + " -- " + recentAxoItem.itemName);
                    columnMain.append(axoItemName);



                    //last seen info
                    var lastSeen = $('<div>')
                        .addClass('columnLastSeen ml-3')
                        .text(recentAxoItem.lastSeen.fromNow());
                    log.append(lastSeen);

                    //count info
                    var countInfo = $('<div>')
                        .addClass('columnCountInfo text-right small ml-3')
                        .text(recentAxoItem.count + "x");
                    log.append(countInfo);

                    //count info
                    var workDoneInfo = $('<div>')
                        .addClass('columnWorkDoneInfo text-right small ml-3')
                        .text(minutesToString(recentAxoItem.workDone));
                    log.append(workDoneInfo);

                    //actions
                    var actions = $('<div>')
                        .addClass('ml-3');
                    actions.append(getRecentAxoItemsActionsDropDown(recentAxoItem));
                    log.append(actions);


                });
                console.log(recentAxoItems)

                let recentWorkTypes = recentWorkLogsWithinTenDaysResponse.data.reduce((accumulator, workLog) => {
                    let key = workLog.work_log_type.name;
                    if (key in accumulator) {
                        accumulator[key].count = accumulator[key].count + 1;
                        accumulator[key].workDone = accumulator[key].workDone + workLog.work_done.duration_minutes;
                    }
                    else {
                        accumulator[key] = {
                            workLogTypeId: workLog.work_log_type.id,
                            workLogTypeName: workLog.work_log_type.name,
                            count: 1,
                            workDone: workLog.work_done.duration_minutes,
                        }
                    }
                    return accumulator;
                }, {});
                recentWorkTypes = Object.entries(recentWorkTypes).map(x => x[1]);
                recentWorkTypes.map(x => x.workLogTypeName);
                recentWorkTypes.map(x => x.workDone);
                console.log(recentWorkTypes);

                let developmentMinutes = recentWorkTypes.find(x => x.workLogTypeId === 1);
                let internalWorkMinutes = recentWorkTypes.find(x => x.workLogTypeId === 3);
                let researchWorkMinutes = recentWorkTypes.find(x => x.workLogTypeId === 7);

                let developmentPercentage = '-';
                let internalWorkPercentage = '-';
                let researchWorkPercentage = '-';
                if (totalWorked !== 0) {
                    developmentPercentage = developmentMinutes ? Math.round(developmentMinutes.workDone / totalWorked * 100) : 0;
                    internalWorkPercentage = internalWorkMinutes ? Math.round(internalWorkMinutes.workDone / totalWorked * 100) : 0;
                    researchWorkPercentage = researchWorkMinutes ? Math.round(researchWorkMinutes.workDone / totalWorked * 100) : 0;
                }
                $('#recentItemsDevelopmentPercentage').text(developmentPercentage + '%');
                $('#recentItemsInternalWorkPercentage').text(internalWorkPercentage + '%');
                $('#recentItemsResearchPercentage').text(researchWorkPercentage + '%');

                // var worklogTypeData = {
                //     datasets: [
                //         {
                //             data: recentWorkTypes.map(x => x.workDone),
                //             borderWidth: 2,
                //             lineTension: 0.5,
                //             label: "ten day overview",
                //             backgroundColor: "rgba(102, 153, 204, 0.2)",
                //             borderColor: "rgba(102, 153, 204, 1)",
                //             pointBackgroundColor: "rgba(102, 153, 204, 1)",
                //             pointBorderColor: "#fff",
                //             pointHoverRadius: 5,
                //             pointHoverBackgroundColor: "#fff",
                //             pointHoverBorderColor: "rgba(102, 153, 204, 1)",
                //         },
                //     ],

                //     labels:
                //         recentWorkTypes.map(x => x.workLogTypeName),
                // };

                // var worklogTypeCtx = document.getElementById('worklogTypeChart').getContext('2d');
                // drawWorkLogTypeChart(worklogTypeCtx, worklogTypeData);






                //today
                // let todaysWorkLogs = recentWorkLogsWithinTenDaysResponse.data.filter(x => moment(x.date_time).isSame(_this.currentDate, 'day'));
                // todaysWorkLogs = todaysWorkLogs.reduce((accumulator, workLog) => {
                //     let key = workLog.work_log_type.name;
                //     if (key in accumulator) {
                //         accumulator[key].count = accumulator[key].count + 1;
                //         accumulator[key].workDone = accumulator[key].workDone + workLog.work_done.duration_minutes;
                //     }
                //     else {
                //         accumulator[key] = {
                //             workLogTypeId: workLog.work_log_type.id,
                //             workLogTypeName: workLog.work_log_type.name,
                //             count: 1,
                //             workDone: workLog.work_done.duration_minutes,
                //         }
                //     }
                //     return accumulator;
                // }, {});
                // todaysWorkLogs = Object.entries(todaysWorkLogs).map(x => x[1]);
                // todaysWorkLogs.map(x => x.workLogTypeName);
                // todaysWorkLogs.map(x => x.workDone);
                // console.log(todaysWorkLogs);

                // console.log( _this.worklogTypes);
                // _this.worklogTypes.forEach(element => {
                //     let workType = recentWorkTypes.find(x => x.workLogTypeId === element.id);

                //     if (!workType) {
                //         recentWorkTypes.push({
                //             workLogTypeId: element.id,
                //             workLogTypeName: element.name,
                //             count: 0,
                //             workDone: 0
                //         })
                //     }
                // });

                recentWorkTypes.sort((a, b) => b.workLogTypeId - a.workLogTypeId);

                // _this.worklogTypes.forEach(element => {
                //     let workType = todaysWorkLogs.find(x => x.workLogTypeId === element.id);

                //     if (!workType) {
                //         todaysWorkLogs.push({
                //             workLogTypeId: element.id,
                //             workLogTypeName: element.name,
                //             count: 0,
                //             workDone: 0
                //         })
                //     }
                // });

                // todaysWorkLogs.sort((a, b) => b.workLogTypeId - a.workLogTypeId);

                // var worklogTypeTodayData = {
                //     datasets: [
                //         {
                //             data: todaysWorkLogs.map(x => x.workDone),
                //             borderWidth: 2,
                //             lineTension: 0.5,
                //             label: "today",
                //             backgroundColor: "rgba(242, 119, 122, 0.2)",
                //             borderColor: "rgba(242, 119, 122, 1)",
                //             pointBackgroundColor: "rgba(242, 119, 122, 1)",
                //             pointBorderColor: "#fff",
                //             pointHoverRadius: 5,
                //             pointHoverBackgroundColor: "#fff",
                //             pointHoverBorderColor: "rgba(242, 119, 122, 1)",
                //         },
                //     ],

                //     labels:
                //         todaysWorkLogs.map(x => x.workLogTypeName),
                // };



                // var worklogTypeTodayCtx = document.getElementById('worklogTypeTodayChart').getContext('2d');
                // drawWorkLogTypeChart(worklogTypeTodayCtx, worklogTypeTodayData);

                var recentItemsCtx = document.getElementById('recentItemsChart').getContext('2d');
                drawRecentItemsChart(recentItemsCtx, recentAxoItems);



                var worklogTypeData = {
                    datasets: [
                        {
                            data: recentWorkTypes.map(x => x.workDone),
                            borderWidth: 2,
                            lineTension: 0.5,
                            label: "ten day overview",
                            backgroundColor: "rgba(102, 153, 204, 0.2)",
                            borderColor: "rgba(102, 153, 204, 1)",
                            pointBackgroundColor: "rgba(102, 153, 204, 1)",
                            pointBorderColor: "#fff",
                            pointHoverRadius: 5,
                            pointHoverBackgroundColor: "#fff",
                            pointHoverBorderColor: "rgba(102, 153, 204, 1)",
                        },
                        // {
                        //     data: todaysWorkLogs.map(x => x.workDone),
                        //     borderWidth: 2,
                        //     lineTension: 0.5,
                        //     label: "today",
                        //     backgroundColor: "rgba(242, 119, 122, 0.2)",
                        //     borderColor: "rgba(242, 119, 122, 1)",
                        //     pointBackgroundColor: "rgba(242, 119, 122, 1)",
                        //     pointBorderColor: "#fff",
                        //     pointHoverRadius: 5,
                        //     pointHoverBackgroundColor: "#fff",
                        //     pointHoverBorderColor: "rgba(242, 119, 122, 1)",
                        // }
                    ],

                    labels:
                        recentWorkTypes.map(x => x.workLogTypeName),
                };
                console.log(worklogTypeData);


                // worklogTypeData.datasets.push({
                //     data: todaysWorkLogs.map(x => x.workDone),
                //     borderWidth: 2,
                //     lineTension: 0.5,
                //     label: "today",
                //     backgroundColor: "rgba(242, 119, 122, 0.2)",
                //     borderColor: "rgba(242, 119, 122, 1)",
                //     pointBackgroundColor: "rgba(242, 119, 122, 1)",
                //     pointBorderColor: "#fff",
                //     pointHoverRadius: 5,
                //     pointHoverBackgroundColor: "#fff",
                //     pointHoverBorderColor: "rgba(242, 119, 122, 1)",                    
                // })
                var worklogTypeCtx = document.getElementById('worklogTypeChart').getContext('2d');
                drawWorkLogTypeChart(worklogTypeCtx, worklogTypeData);




            }
        );
    }

    function getSpinner() {
        return $('<i style="font-size:0.9em; font-weight:600;" class="fas fa-spinner fa-spin"></i>');
    }

    function drawRecentItemsChart(context, rawData) {
        if (_this.recentItemsChart != undefined) {
            _this.recentItemsChart.destroy();
        }

        // var chartData = {
        //     datasets: [{
        //         label: 'First Dataset',
        //         data: rawData.map(recentItem => {
        //             return{
        //                 x: recentItem.count,
        //                 r: recentItem.workDone/60,
        //                 y: 1//recentItem.lastSeen.fromNow()
        //             }
        //          }),
        //         backgroundColor: 'rgb(255, 99, 132)'
        //     }]
        // };

        let now = moment().startOf('day');

        let excludedItemIds = _this.options.axoSoftRecentItemsBubbleChartHiddenItemsIds.split(';');
        var chartData = {
            datasets:
                rawData
                    .filter(recentItem => !excludedItemIds.includes(recentItem.itemId.toString()))
                    .map(recentItem => {
                        return {
                            label: recentItem.itemName,
                            data: [{
                                y: recentItem.count,
                                r: Math.max(recentItem.workDone / 20, 2),
                                x: now.diff(recentItem.lastSeen.startOf('day'), 'days'),
                                recentItem: recentItem
                            }],
                            backgroundColor: _this.axoItemColors[numberToIndex(recentItem.itemId, 8)]
                        }
                    })
        };



        console.log('chartData');
        console.log(chartData);

        // let maxCounts = Math.max(...rawData.map(o => o.count), 0);

        _this.recentItemsChart = new Chart(context, {
            type: 'bubble',
            data: chartData,
            options: {
                clip: {
                    left: 10,
                    top: 100,
                    right: 0,
                    bottom: 0
                },
                legend: {
                    display: false,
                },
                scales: {
                    xAxes: [{
                        gridLines: {
                            drawBorder: true,
                            drawOnChartArea: false
                        },
                        ticks: {
                            //beginAtZero: true,
                            // maxTicksLimit: 7,
                            //display: false, //this removed the labels on the x-axis
                            stepSize: 1,
                            callback: function (value, index, values) {
                                switch (value) {
                                    case -1:
                                        return ""
                                    case 0:
                                        return "today"
                                    // case 1:
                                    //     return "yesterday"
                                    default:
                                        return `${value}`;
                                }

                            },
                            min: -1

                        },
                        scaleLabel: {
                             display: true,
                             labelString: 'last worked on days ago'
                           }
                    }],
                    yAxes: [{
                        gridLines: {
                            drawBorder: true,
                            drawOnChartArea: false
                        },
                        ticks: {
                            beginAtZero: true,
                            maxTicksLimit: 4,
                            //max: maxCounts + 2
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'number of switches'
                          }
                    }],

                },
                tooltips: {
                    callbacks: {
                        // title: function (tooltipItem, data) {
                        //     return data.datasets[tooltipItem[0].datasetIndex].label;
                        // },

                        label: function (tooltipItem, data) {
                            // let recentItemWorkDone = (data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].r * 30/60);
                            // let recentItemCount = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].y;
                            // let recentItemLastSeen = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].x;
                            // let recentItemName = data.datasets[tooltipItem.datasetIndex].label || '';
                            let recentItemWorkDone = minutesToString(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].recentItem.workDone);
                            let recentItemCount = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].y;
                            let recentItemLastSeen = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].x;
                            let recentItemName = data.datasets[tooltipItem.datasetIndex].label || '';
                            // return `${recentItemName} - ${recentItemWorkDone.toFixed(2)} hrs logged, last log ${recentItemLastSeen} days ago (switches: ${recentItemCount}).`;
                            return `${recentItemName} (${recentItemWorkDone}hrs, ${recentItemCount}x)`;
                        }
                    }
                }
            }
        });

    }

    function drawWorkLogTypeChart(context, data) {

        if (_this.worklogTypeChart != undefined) {
            _this.worklogTypeChart.destroy();
        }

        _this.worklogTypeChart = new Chart(context, {
            type: 'radar',
            data: data,
            options: {
                startAngle: -36,
                legend: {
                    display: false,
                    position: 'right'
                },

                scale: {
                    gridLines: {
                        // display: false
                        circular: true
                    },
                    angleLines: {
                        display: true,
                        lineWidth: 0.5,
                        color: 'rgba(128, 128, 128, 0.2)'
                    },
                    pointLabels: {
                        fontSize: 11,
                        fontStyle: '300',
                        fontColor: 'rgba(104, 104, 104, 1)',
                        //   fontFamily: "'Lato', sans-serif"
                    },
                    ticks: {
                        //   beginAtZero: true,
                        //   maxTicksLimit: 3,
                        //   min: 0,
                        //   max: 3,
                        display: false,
                        stepSize: 120
                    }
                },

                tooltips: {
                    displayColors: false,
                    callbacks: {
                        title: function (tooltipItem, data) {
                            return data.labels[tooltipItem[0].index];

                        },
                        label: function (tooltipItem, data) {
                            let value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                            return minutesToString(value, true);
                        }
                    }
                }
            }
        });


    }

    function drawDayBalanceChart(userId, today, currentAttendance) {
        var tenDaysAgo = today.clone().add(-14, 'day');

        _this.allHoursApi.getUserCalculations(userId, tenDaysAgo, today.clone().add(-1, 'day')).then(
            function (data) {
                //var dayDifferences = data.DailyCalculations.map(x => x.CalculationResultSummary.PaidPresenceValue);
                var dayDifferences = data.DailyCalculations.map(x => x.CalculationResultSummary.DailyBalanceValue);
                //dayDifferences.push(currentAttendance);

                let periodDiff = dayDifferences.reduce((a, b) => a + b, 0);
                $("#currentBalancePeriodDiff").text(minutesToString(periodDiff));


                var runningDifferences = data.DailyCalculations.map(x => x.CalculationResultSummary.RunningBalanceValue);

                // var labels = data.DailyCalculations.map(x => moment(x.DateTime).format('ddd'));
                // labels.push(today.format('ddd'));

                var labels = data.DailyCalculations.map(x => moment(x.DateTime));
                labels.push(today);


                var dailyCtx = document.getElementById('dayBalanceChart').getContext('2d');
                var dailyChart = new Chart(dailyCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: dayDifferences,
                            // backgroundColor: "rgba(102, 153, 204, 1)",
                            // borderColor: "rgba(102, 153, 204, 0.2)",
                            backgroundColor: "rgba(102, 153, 204, 0.2)",
                            borderColor: "rgba(102, 153, 204, 1)",
                            // backgroundColor: "rgba(102, 153, 204, 1)",
                            pointBackgroundColor: "rgba(102, 153, 204, 1)",
                            pointBorderColor: "#fff",
                            pointHoverRadius: 5,
                            pointHoverBackgroundColor: "#fff",
                            pointHoverBorderColor: "rgba(102, 153, 204, 1)",
                            tension: 0.5,
                            // barThickness: 10,
                        },
                            // {
                            //     data: runningDifferences, 
                            // }
                        ]
                    },
                    options: {
                        legend: {
                            display: false
                        },
                        scales: {
                            xAxes: [{
                                barThickness: 16,
                                position: 'middle',
                                gridLines: {
                                    drawBorder: false,
                                    display: false
                                },
                                ticks: {
                                    // maxTicksLimit: 7,
                                    //display: false, //this removed the labels on the x-axis
                                    callback: function (value, index, values) {
                                        return moment(value).format('dd').charAt(0);
                                    }
                                },
                            }],
                            yAxes: [{
                                gridLines: {
                                    drawBorder: false,
                                    //display: false,
                                },
                                ticks: {
                                    // maxTicksLimit: 7,
                                    // display: false, //this removed the labels on the x-axis
                                    stepSize: 60,
                                    callback: function (value, index, values) {
                                        return minutesToString(value);
                                    }
                                },
                            }]
                        },
                        tooltips: {
                            displayColors: false,
                            callbacks: {
                                title: function (tooltipItem, data) {
                                    return tooltipItem[0].xLabel.format('dddd, d.MMMM');
                                    //return value.format('dddd');
                                },
                                label: function (tooltipItem, data) {
                                    let value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                                    return minutesToString(value, true);
                                }
                            }
                        }
                    }
                });


                var runningCtx = document.getElementById('runningBalanceChart').getContext('2d');
                var runningChart = new Chart(runningCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: runningDifferences,
                            backgroundColor: "#76679233",
                            borderColor: "#766792",
                            pointBackgroundColor: "#766792",
                            pointBorderColor: "#fff",
                            pointHoverRadius: 5,
                            pointHoverBackgroundColor: "#fff",
                            pointHoverBorderColor: "#766792",
                        },
                        ]
                    },
                    options: {
                        legend: {
                            display: false
                        },
                        scales: {
                            xAxes: [{
                                gridLines: {
                                    drawBorder: false,
                                    display: false
                                },
                                ticks: {
                                    // maxTicksLimit: 7,
                                    display: false, //this removed the labels on the x-axis
                                },
                            }],
                            yAxes: [{
                                gridLines: {
                                    drawBorder: false,
                                    // display: false,
                                },
                                ticks: {
                                    beginAtZero: true,
                                    maxTicksLimit: 4,
                                    //display: false, //this removed the labels on the x-axis
                                    stepSize: 60,
                                    callback: function (value, index, values) {
                                        return minutesToString(value);
                                    }
                                },
                            }]
                        },
                        tooltips: {
                            displayColors: false,
                            callbacks: {
                                title: function (tooltipItem, data) {
                                    return tooltipItem[0].xLabel.format('dddd, d.MMMM');
                                    //return value.format('dddd');
                                },
                                label: function (tooltipItem, data) {
                                    let value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                                    return minutesToString(value, true);
                                }
                            }
                        }
                    }
                });


                /*
                var runningDifferences = data.DailyCalculations.map(x => x.CalculationResultSummary.RunningBalanceValue);
                //runningDifferences.push(currentAttendance);
                var labels = data.DailyCalculations.map(x => moment(x.DateTime).format('ddd'));
                //labels.push(today.format('ddd'));
                var runningCtx = document.getElementById('runningBalanceChart').getContext('2d');
                var runningChart = new Chart(runningCtx, {
                    type: 'line',
                    data: {
                        labels: labels, 
                        datasets: [{
                            data: runningDifferences, 
                        }]
                    },
                    options: {
                        legend: {
                            display: false
                        },
                        scales: {
                            xAxes: [{
                                gridLines: {
                                    drawBorder: false,
                                    display: false
                                },
                                ticks: {
                                    // maxTicksLimit: 7,
                                    display: false, //this removed the labels on the x-axis
                                },
                            }],
                            yAxes: [{
                                gridLines: {
                                    drawBorder: false,
                                    display: false
                                },
                                ticks: {
                                    // maxTicksLimit: 7,
                                    display: false, //this removed the labels on the x-axis
                                },
                            }]
                        }
                    }
                });                
*/

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

    function getRemainingMinutes(timeUnitId, duration) {
        let timeUnit = _.find(_this.timeUnits, function (t) {
            return t.id === timeUnitId;
        });
        return timeUnit.conversion_factor * duration;
    }

    _this.addAxoWorkLog = function (myHoursLog, myHoursTotalMinsDoneForAxoId) {
        return new Promise(
            function (resolve, reject) {
                console.log(myHoursLog);

                var logStatus = $('*[data-logid="' + myHoursLog.id + '"] .statusColumn .d-flex');
                logStatus.empty();

                if (myHoursLog.duration === 0) {
                    logStatus.append('<span>').addClass('tag is-warning').text("empty log. skipping.");
                    return;
                }

                if (!myHoursLog.axoId) {
                    logStatus.append('<span>').addClass('tag is-danger').text("axo item not found");
                    return;
                }

                console.info('copy to axo: item Id' + myHoursLog.axoId);
                console.info(myHoursLog);

                var worklog = new Worklog;
                worklog.user.id = parseInt(_this.options.axoSoftUserId);
                worklog.work_done.duration = myHoursLog.duration / 60; // mins
                worklog.item.id = myHoursLog.axoId;
                worklog.item.item_type = myHoursLog.axoItemType; //item.item_type;
                worklog.work_log_type.id = myHoursLog.axoWorklogTypeId;
                worklog.description = myHoursLog.note;
                worklog.date_time = moment(myHoursLog.date).add(8, 'hours').toDate();

                let remainingTimeMins = getRemainingMinutes(myHoursLog.axoRemainingDurationTimeUnitId, myHoursLog.axoRemainingDuration);
                console.log(`remaining item mins: itemId: ${worklog.item.id}`);
                console.log(`remaining item mins: remaining time mins: ${remainingTimeMins}`);
                console.log(`remaining item mins: worklog done mins: ${worklog.work_done.duration}`);

                //worklog.remaining_time.duration = Math.max(remainingTimeMins - worklog.work_done.duration, 0);
                worklog.remaining_time.duration = Math.max(remainingTimeMins - myHoursTotalMinsDoneForAxoId, 0);
                console.log(`remaining item mins: new remaining time mins: ${worklog.remaining_time.duration}`);

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
                            success.text(reminingHrs + "h left");

                            logStatus.append(success);
                            //logStatus.append('<span>').addClass('tag is-success').text("OK -- " + +" hrs left");

                            chrome.runtime.sendMessage({ type: 'refreshBadge' });

                            return resolve();
                        }
                    )
                    .catch(error => {
                        logStatus.append('<span>').addClass('tag is-danger').text("error adding log").css('color: red');
                        console.error('error: ' + error);
                        return reject(error);
                    });
            })


    }

    function copyCommitMessage(myHoursLog) {
        myHoursLog?.times.forEach(element => {
            _this.devOpsApi.getMyCommits(moment(element.startTime), moment(element.endTime)).then(
                function (data) {
                    // let commitMessages = "";
                    // data.value?.forEach(commit => {
                    //     console.log(commit.message);
                    //     commitMessages = commitMessages + 
                    // });
                    let comment = data.value?.map(x => x.comment).join(', ');

                    console.log(comment)
                    if (comment) {
                        _this.myHoursApi.updateLogDescription(myHoursLog, comment).then(x => {
                            toastr.success('Log comment updated.');
                            getLogs();

                            //showAlert('Log comment updated.');

                            // var notificationOptions = {
                            //     type: 'basic',
                            //     iconUrl: './images/ts-badge.png',
                            //     title: 'MyHours',
                            //     message: 'Log comment updated.'
                            // };
                            // chrome.notifications.create('notifyMyHoursNoteUpdated', notificationOptions, function () { console.log("Last error:", chrome.runtime.lastError); });                        
                        });
                    } else {
                        toastr.warning('No commit messages with comments found within the time frame of the log.');
                        // showAlert('No commit messages with comments found within the time frame of the log.');
                        // var notificationOptions = {
                        //     type: 'basic',
                        //     iconUrl: './images/ts-badge.png',
                        //     title: 'MyHours',
                        //     message: 'No commit messages with comments found within the time frame of the log.'
                        // };
                        // chrome.notifications.create('notifyNoCommitMessagesFound', notificationOptions, function () { console.log("Last error:", chrome.runtime.lastError); });                           
                    }
                });
        });
    }

    function getAxoItem(myHoursLog) {
        let itemNumberRegEx = new RegExp('^[0-9]*');
        if (myHoursLog.projectName != null) {
            let regExResults = itemNumberRegEx.exec(myHoursLog.projectName);
            if (regExResults && regExResults.length > 0 && regExResults[0] !== '') {
                return _this.axoSoftApi.getFeatureItem(regExResults[0]);
            }
        }

        if (myHoursLog.note != null) {
            let regExResults = itemNumberRegEx.exec(myHoursLog.note);

            if (regExResults && regExResults.length > 0 && regExResults[0] !== '') {
                //remove id from the note 
                myHoursLog.note = myHoursLog.note.replace(itemNumberRegEx, '');
                return _this.axoSoftApi.getFeatureItem(regExResults[0]);
            }
        }
        return Promise.reject(new Error('project not found'));
    }

    function getPartialWorkLogType(myHoursLog) {
        let workLogTypeRegEx = new RegExp('^\/[A-Za-z]*');
        if (myHoursLog.note != null) {

            let regExResults = workLogTypeRegEx.exec(myHoursLog.note);

            if (regExResults && regExResults.length > 0 && regExResults[0] !== '') {
                // remove id from the note 
                myHoursLog.note = myHoursLog.note.replace(workLogTypeRegEx, '').trim();
                return regExResults[0].substr(1);
            }
        }
        return '';
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
                const totalMinsDurationByAxoId = _this.myHoursLogs.reduce((result, worklog) => {
                    result[worklog.axoId] = result[worklog.axoId] ? result[worklog.axoId] + (worklog.duration / 60) : (worklog.duration / 60);
                    return result;
                }, {});
                console.table(totalMinsDurationByAxoId);

                _this.myHoursLogs.forEach(worklog => {
                    _this.addAxoWorkLog(worklog, totalMinsDurationByAxoId[worklog.axoId]);
                });
            } catch (e) {
                console.log(e);
                $('#axoNotAccessible').show();
            }
        }
    }

    function getWorklogTypeId(taskName, worklogTypes, partialMatch) {
        if (taskName != undefined) {
            var workLogType = _.find(worklogTypes,
                function (w) {
                    if (!partialMatch) {
                        return w.name.toUpperCase() === taskName.toUpperCase();
                    }
                    else {
                        return w.name.toUpperCase().startsWith(taskName.toUpperCase());
                    }
                });

            if (workLogType != undefined) {
                return workLogType.id;
            }
        }
        return _this.options.axoSoftDefaultWorklogTypeId;
    }

    function getWorklogTypeName(id, worklogTypes) {
        var workLogType = _.find(worklogTypes,
            function (w) {
                return w.id.toString() === id.toString();
            });

        if (workLogType) {
            return workLogType.name;
        }
        return 'unknown worklog type'
    }

    function truncateText(text, maxLength) {
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }
        return text;
    }

    function timeToPixel(date, fullLength) {
        var mmt = moment(date);
        var mmtMidnight = mmt.clone().startOf('day');
        var diffMinutes = mmt.diff(mmtMidnight, 'minutes');

        return Math.round(diffMinutes / 1440 * fullLength);

    }

    function minutesToString(minutes, showSign) {
        let sign = Math.sign(minutes);

        minutes = Math.abs(minutes);

        let duration = moment.duration(minutes, 'minutes');
        let minutesString = (duration.days() * 24) + duration.hours() + ':' + duration.minutes().toString().padStart(2, '0');

        //console.log('format minutes: ' + minutes + ' -> ' + minutesString);

        if (sign < 0) {
            minutesString = "-" + minutesString;
        }
        else if (showSign) {
            minutesString = "+" + minutesString;
        }
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

    function numberToIndex(num, length) {
        if (!num) {
            return 0;
        }
        return num % length;
    }

    function showRatio(timeRatio) {
        showRatioOnCard(timeRatio, $('#mhAhRatioText'));
    }

    function showRatioAllHoursAxo(ratio) {
        showRatioOnCard(ratio, $('#axoAhRatioText'), $('#axoAhRatioOk'));
        //drawAxoAhRatioChart(ratio);
    }

    function showRatioOnCard(timeRatio, element, elementOk) {
        let elementInfo = $(element);
        let parent = elementInfo.parent();
        // elementInfo.removeClass('blink');
        if (timeRatio?.ratio !== undefined) {
            elementInfo.hide();
            elementOk?.show();
            let ratioValid = (timeRatio.ratio >= 0.9 && timeRatio.ratio <= 1);
            //elementInfo.text((ratio * 100).toFixed(0) + '%');

            let cardText = 'Ratio: ' + (timeRatio.ratio * 100).toFixed(0) + '%';
            if (!ratioValid) {
                let diffMinutes = timeRatio.mhTotalTime - timeRatio.ahAttendance;
                if (diffMinutes > 0) {
                    cardText += ' Too much: ' + minutesToString(Math.abs(timeRatio.ahAttendance - timeRatio.ahAttendance * timeRatio.ratio));
                }
                else if (diffMinutes < 0) {
                    cardText += ' Missing: ' + minutesToString(timeRatio.ahAttendance * 0.9 - timeRatio.ahAttendance * timeRatio.ratio);
                }
                //cardText += 
                elementOk?.hide();
                elementInfo.show();
            }
            parent.attr('title', cardText);

            // elementInfo.toggleClass('blink', !ratioValid);
        }
        else {
            elementInfo.hide();
            //elementInfo.text('--');
        }
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

    function startDrag(e) {
        _this.isResizing = true;
        _this.lastDownX = e.clientX;
    }

    function showAlert(message) {
        $('#alertContainer span').text(message);
        $('#alertContainer').show();
    }


    function hideAlert() {
        $('#alertContainer').hide();
    }

    function hiLiteMyHoursLog(logId) {
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'hilite-log', logId });
        });
    }


    function refreshCalendar() {
        //get data from axo

        let today = moment().startOf('day');
        let startOfCalendar = today.clone().startOf('isoWeek').add(-3, 'week');
        let endOfCalendar = today.clone().endOf('isoWeek');

        let minutes = []

        _this.myHoursApi.getActivity(startOfCalendar, endOfCalendar).then(logs => {

            let minutesPerDayData = logs.reduce((accumulator, log) => {
                let key = log.date;
                if (key in accumulator) {
                    accumulator[key].duration = accumulator[key].duration + (log.logDuration / 60);
                }
                else {
                    accumulator[key] = {
                        duration: log.logDuration / 60,
                        date: moment(key).startOf('day')
                    }
                }
                return accumulator;
            }, {});
            let minutesPerDay = Object.entries(minutesPerDayData).map(x => x[1]);
    
            let totalMinutes = minutesPerDay.reduce((a, log) => a + log.duration, 0);
            $('.calendarItemsTotal').text(minutesToString(totalMinutes));

            let maxMinutesInDay = Math.max(...minutesPerDay.map(x => x.duration), 0);
            $('.calendarMaxMinutesInDay').text(minutesToString(maxMinutesInDay));
            
            let workDaysInRange = minutesPerDay.filter(x => x.date.isoWeekday() < 6).length;
            $('.calendarWorkDays').text(workDaysInRange);
            $('.calendarAverageMinutesInWorkDay').text(minutesToString(totalMinutes / workDaysInRange));

            let zeroDates = [];
            for (let currDay = startOfCalendar.clone(); currDay < endOfCalendar; currDay.add(1, 'day')) {
                if (!minutesPerDay.find(x => x.date == currDay)) {
                    zeroDates.push({
                        date: currDay.clone(),
                        duration:0
                    })
                }
            }
            minutesPerDay = minutesPerDay.concat(zeroDates);

            let today = moment().startOf('day');
            var chartData = {
                datasets: [{
                    data: minutesPerDay.map(dayMins => {
                        let mins = dayMins.duration;

                        // if (mins > 0) {
                        //     let diff = (mins - (8 * 60));

                        // }
                        // let weightedDiff = Math.sign(diff) * diff^2;
                        return {
                            x: dayMins.date.isoWeekday(),
                            // y: dayMins.date.startOf('isoWeek').unix(),
                            y: dayMins.date.isoWeek(),
                            // r: Math.max((mins + weightedDiff) / 30, 10),
                            r: mins /30,
                            mins: mins,
                            date: dayMins.date,
                            
                        }
                    }),
                    backgroundColor: '#3c5081',
                },
          
                {
                    data: [ {
                            x: today.isoWeekday(),
                            y: today.isoWeek(),
                            r: 520 /30,
                        }
                    ],
                    backgroundColor: 'white',
                    borderColor: '#b82f4e'
                }

                // {
                //     data: minutesPerDay
                //     .filter(x => x.date.isoWeekday() < 6)
                //     .map(dayMins => {
                //         return {
                //             x: dayMins.date.isoWeekday(),
                //             y: dayMins.date.isoWeek(),
                //             r: 480 /30,
                //             mins: 480,
                //             date: dayMins.date,
                //         }
                //     }),
                //     backgroundColor: 'white',
                //     borderColor: 'grey'
                // }
            ]
            };

    
            var calendarChartCtx = document.getElementById('calendarChart').getContext('2d');
    
            _this.calendarChart = new Chart(calendarChartCtx, {
                type: 'bubble',
                data: chartData,
                options: {
                    clip: {
                        left: 10,
                        top: 100,
                        right: 0,
                        bottom: 0
                    },
                    legend: {
                        display: false,
                    },
                    scales: {
                        xAxes: [{
                            position: 'top',
                            gridLines: {
                                display: false,
                                drawBorder: false,
                                drawOnChartArea: false
                            },
                            ticks: {
                                //beginAtZero: true,
                                // maxTicksLimit: 7,
                                //display: false, //this removed the labels on the x-axis
                                stepSize: 1,
                                callback: function (value, index, values) {
                                    switch (value) {
                                        case 1:
                                            return "mon"
                                        case 2:
                                            return "tue"
                                        case 3:
                                            return "wed"
                                        case 4:
                                            return "thu"
                                        case 5:
                                            return "fri"
                                        case 6:
                                            return "sat"
                                        case 7:
                                            return "sun"
                                    }
    
                                },
                                min: 0,
                                max: 7
                            },
                        }],
                        yAxes: [{
                            // display: false,
                            gridLines: {
                                display: false,
                                drawBorder: true,
                                drawOnChartArea: false
                            },
                            ticks: {
                                min: startOfCalendar.isoWeek()-1,
                                max: endOfCalendar.isoWeek()+1,
                                stepSize: 1,
                                reverse: true,
                                callback: function (value, index, values) {
                                    return (index > 0 && index < 5) ? `week ${value}` : '';
                                }
                                
                            },
                            // scaleLabel: {
                            //     display: true,
                            //     labelString: 'number of engagements'
                            //   }
                        }],
    
                    },
                    tooltips: {
                        callbacks: {
                            // title: function (tooltipItem, data) {
                            //     return data.datasets[tooltipItem[0].datasetIndex].label;
                            // },
    
                            label: function (tooltipItem, data) {
                                let mins = minutesToString(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].mins);
                                let date = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].date.format('lll');
                                return `${date}: ${mins}`;
                            }
                        }
                    }
                }
            });




        })




    }



    initInterface();
}
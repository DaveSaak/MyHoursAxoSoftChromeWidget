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

    _this.allHoursAttendance = 0;

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
            _this.allHoursApi = new AllHoursApi(_this.options);
            _this.balanceView = new BalanceView(_this.allHoursApi, $('#balanceContainer'));
            _this.recentItemsView = new RecentItemsView(_this.axoSoftApi, _this.myHoursApi, _this.options, _this.axoItemColors);
            _this.calendarView = new CalendarView(_this.myHoursApi, _this.allHoursApi, _this.axoSoftApi, $('#calendarContainer'));
            _this.ratioView = new RatioView(_this.allHoursApi, _this.axoSoftApi, _this.options);


            // PLATFORM UI MODS
            if (_this.options.useDevOps) {
                $('#copyToAxoSoftButton').hide();
                $('#copyDevOpsButton').show();
                $('.statistics-sm.axo').hide();

                $('#nav-ratio').remove();
                // $('#nav-recent-items').remove();
                $('#nav-calendar').remove();

            } else {
                $('#copyToAxoSoftButton').show();
                $('#copyDevOpsButton').hide();

                $('#nav-devops').remove();
            }



            _this.currentUser.load(function () {
                // console.info(_this.currentUser);

                if (_this.currentUser.accessToken == undefined) {
                    // console.info('access token is undefined');

                    if (_this.currentUser.email != undefined) {
                        $('#email').val(_this.currentUser.email);
                    }

                    showLoginPage();
                } else {
                    // console.info('got current user.');
                    if (_this.currentUser.refreshToken != undefined) {
                        // console.info('refresh token found. lets use it.');
                        showLoadingPage();
                        _this.myHoursApi.getRefreshToken(_this.currentUser.refreshToken).then(
                            function (token) {
                                // console.info('got refresh token. token: ');
                                // console.info(token);

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

        $('#copyDevOpsButton').click(function () {
            updateDevOps();
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
            getLogsForToday();
        });

        // $('#current-date').click(function () {
        //     getLogsForToday();
        // });

        $('#refresh').click(function () {
            getLogs();
        });

        $('#reloadDay').click(function () {
            getLogs();
        });

        $('#refreshHome').click(function () {
            getCurrentBalance();
        });

        $('#refreshRecentItems').click(function () {
            getRecentAxoItems();
        });

        $('#refreshDevOpsItems').click(function () {
            getMyDevOpsItems();
        });

        $('#refreshCalendar').click(function () {
            _this.calendarView.show();
        });

        $('#pills-worklogtypes-tab').click(function () {
            getRecentAxoItems();
        });

        $('#pills-axo-tab').click(function () {
            getRecentAxoItems();
        });

        $('#pills-calendar-tab').click(function () {
            _this.calendarView.show();
        });

        $('#pills-ratio-tab').click(function () {
            _this.ratioView.show();
        });

        $('#pills-devops-assignments-tab').click(function () {
            getMyDevOpsItems();
        });

        $('#refreshRatio').click(function () {
            _this.ratioView.show();
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

        // $('#switchContentButton').click(function () {
        //     _this.myHoursApi.addLog(_this.options.contentSwitchProjectId, "content switch", _this.options.contentSwitchZoneReEnterTime)
        //         .then(
        //             function (data) {
        //                 var notificationOptions = {
        //                     type: 'basic',
        //                     iconUrl: './images/TS-badge.png',
        //                     title: 'Content Switch',
        //                     message: 'Content Switch was recorded.'
        //                 };
        //                 chrome.notifications.create('optionsSaved', notificationOptions, function () { });
        //             },
        //             function (error) {
        //                 console.log(error);
        //             });
        // });

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
        // getLogs();
        _this.getProjectTracks();
    }

    function showLoginPage() {
        $('body').addClass('narrow');
        $('body').removeClass('wide');

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
        // getRecentAxoItems();

    }

    function showLoadingPage() {
        $('body').removeClass('narrow');
        $('body').addClass('wide');

        $('#mainContainer').hide();
        $('#loginContainer').hide();
        $('#loadingContainer').show();

    }

    function showHomePage() {
        getCurrentBalance();
    }

    function showAxoViewPage() {
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

    _this.getProjectTracks = async function () {

        // just get the promises, we'll run them all at once at the end so we can await them.
        let promises = [];
        await _this.myHoursApi.getLogs(_this.currentDate).then(logs => {
            _this.myHoursLogs = logs;

            _this.myHoursLogs.forEach(log => {

                // RESOLVE DEVOPS ITEM
                log.devOpsItemId = '';
                let itemNumberRegEx = new RegExp('^[0-9]*');
                if (log.taskName) {
                    let regExResults = itemNumberRegEx.exec(log.taskName);
                    if (regExResults && regExResults.length > 0 && regExResults[0] !== '') {
                        log.devOpsItemId = regExResults[0];


                        promises.push(new Promise(function (resolve, reject) {
                            _this.devOpsApi.getItemAsync(log.devOpsItemId).then(devOpsItem => {
                                log.devOpsItem = devOpsItem;
                                resolve();
                            })
                                .catch((error) => {
                                    console.error('Error fetching DEVOPS item:', error);
                                    reject();
                                });
                        }));

                        promises.push(new Promise(function (resolve, reject) {
                            _this.devOpsApi.getItemUpdatesAsync(log.devOpsItemId).then(devOpsItemUpdates => {
                                log.devOpsItemUpdates = devOpsItemUpdates;
                                resolve();
                            })
                                .catch((error) => {
                                    console.error('Error fetching DEVOPS updates', error);
                                    reject();
                                });
                        }));

                    }
                }

                // GET TIMES
                // promises.push(new Promise(function (resolve, reject) {
                //     _this.myHoursApi.getTimes(log.id).then(times => {
                //         log.times = times;
                //         resolve();
                //     })
                //         .catch((error) => {
                //             console.error('Error fetching MY HOURS times:', error);
                //             reject();
                //         });
                // }));
            });

        })
            .catch((error) => {
                console.error('Error fetching MY HOURS logs:', error);
            });

        await Promise.all(promises);
        // console.log(_this.myHoursLogs);


        // now we can show the data on the screen
        // ...

        var logsContainer = $('#logs');
        logsContainer.empty();

        if (_this.myHoursLogs?.length == 0) {
            showEmptyState();
        }

        var totalMins = 0;
        _this.myHoursLogs.forEach(log => {
            totalMins = totalMins + (log.duration / 60);

            var logContainer = $('<div>')
                .attr("data-logId", log.id)
                .attr("data-taskId", log.taskId)
                .addClass("logContainer  align-items-center logContainerGrid");

            logContainer.mouseenter(function () {
                $('#timeline .timeline-log[data-logId="' + log.id + '"]').toggleClass("active", true);
                $('#timeline .timeline-log').not('[data-logId="' + log.id + '"]').toggleClass("deactivate", true);
                hiLiteMyHoursLog(log.id);
            });
            logContainer.mouseleave(function () {
                $('#timeline .timeline-log[data-logId="' + log.id + '"]').toggleClass("active", false);
                $('#timeline .timeline-log').not('[data-logId="' + log.id + '"]').toggleClass("deactivate", false);
                hiLiteMyHoursLog();
            });

            // COLOR COLUMN
            var colorBarCell = $('<div>').addClass('rounded log-color-bar');
            logContainer.append(colorBarCell);

            //TAGS 
            var tagsCell = $('<div>').addClass('log-tags');
            logContainer.append(tagsCell);
            var worklogTypeInfo = $('<div>')
                // .addClass('text-muted text-lowercase')
                // .css('font-size', '0.7rem')
                .text(log.tags?.length > 0 ? log.tags.map(x => x.name).join(', ') : '-not set: worklog type-');
            tagsCell.append(worklogTypeInfo);


            // TITLE
            var logTitle = $('<div>').addClass('text-truncate log-title');
            // logTitle.append('<i class="fas fa-skull" aria-hidden="true"></i>');
            // logTitle.append('<span>').text(`${log.taskName ?? '-not set: task-'}`);

            logTitle.append($('<div>').text(`${log.taskName ?? '-not set: task-'}`));
            logContainer.append(logTitle);


            // COMMENT
            var logComment = $('<div>').addClass('log-comment');
            if (log.note) {
                // logComment.append($('<div>').text('Log comment'));
                logComment.append($('<div>').text(log.note));
            }
            logContainer.append(logComment);

            // TIME 
            var columnTime = $('<div>').addClass('log-time');
            logContainer.append(columnTime);

            if (log.duration != null) {
                var durationInfo = $('<i class="fas fa-circle-notch fa-spin"></i>');
                if (!log.running) {
                    var duration = minutesToString(log.duration / 60);
                    durationInfo = $('<span>').text(duration);
                    durationInfo.append($('<span class="small"> h</span>'));
                }
                columnTime.append(durationInfo);
            };

            // EFFORT
            var effortCell = $('<div>').addClass('log-effort');
            logContainer.append(effortCell);

            // ACTIONS COLUMN
            var columnActions = $('<div>').addClass('log-actions');
            logContainer.append(columnActions);


            let startTrackingTimeShortcut = $('<button>')
                .addClass("btn btn-transparent mr-1")
                .attr("title", "Start tracking time")
                .append($('<i class="fa-regular fa-circle-play">'))
                .click(function (event) {
                    event.preventDefault();
                    _this.myHoursApi.startFromExisting(log.id).then(
                        function () {
                            // console.info('worklog started');
                            getLogsForToday();
                        }
                    )
                        .catch(
                            function () {
                                console.erro('worklog add failed');
                            }
                        )
                });

            let copyCommitMessagesButton = $('<button>')
                .addClass("btn btn-transparent mr-1")
                .attr("title", "Copy commit message to description")
                .append('<i class="fa-solid fa-code-merge"></i>')
                .click(function (event) {
                    event.preventDefault();
                    copyCommitMessage(log);
                });

            let openDevOpsItemButton = $('<button>')
                .addClass("btn btn-transparent mr-1")
                .attr("title", "Open item in DevOps portal")
                .append($('<i class="fa-solid fa-arrow-up-right-from-square"></i>'))
                .click(function (event) {
                    event.preventDefault();
                    _this.devOpsApi.getItemAsync(log.devOpsItemId).then(devOpsItem => {
                        const editUrl = encodeURI(`${_this.options.devOpsInstanceUrl}/${devOpsItem.fields['System.AreaPath']}/_workitems/edit/${log.devOpsItemId}`);
                        window.open(editUrl, '_devops');
                    });
                });

            let copyWorklogButton = $('<button>')
                .addClass("btn btn-transparent mr-1")
                .attr("title", "Update DevOps Effort")
                .append($('<i class="fa-solid fa-upload"></i>'))
                .click(function (event) {
                    event.preventDefault();
                    let logDurationInHours = log.duration / 60 / 60;
                    updateDevOpsWorkItemEffort(log.devOpsItemId, logDurationInHours);
                 });

            let buttons = $("<div>").addClass("d-flex ml-auto justify-content-end");
            buttons.append(openDevOpsItemButton);
            buttons.append(copyWorklogButton);
            buttons.append(copyCommitMessagesButton);
            buttons.append(startTrackingTimeShortcut);

            columnActions.append(buttons);

            if (log.devOpsItem) {
                // log.color = _this.axoItemColors[numberToIndex(log.devOpsItemId, 8)];
                log.color = _this.axoItemColors[numberToIndex(log.taskId, 8)];


                var remainingMins = (log.devOpsItem?.fields['Microsoft.VSTS.Scheduling.RemainingWork'] ?? log.devOpsItem?.fields['Microsoft.VSTS.Scheduling.OriginalEstimate'] ?? 0) * 60;
                // logTitle.append($('<div style="font-size:0.85rem; font-weight:500">')
                //     .append($('<span>').text(`Remaining ${minutesToString(remainingMins)}`))
                // );


                let remainingInfo = $('<div class="effort-info d-flex align-items-center mt-2" style="font-size:0.85rem; font-weight:500; line-height: 1.5rem; font-style:normal">');
                logComment.append(remainingInfo);
                remainingInfo.append($('<div class="ml-1" style="font-weight:500">').text(`${minutesToString(remainingMins)}`));
                remainingInfo.append($('<div>').text(`h`));
                remainingInfo.append($('<div>').addClass('ml-1').text(`remaining`));

                if (log.devOpsItemUpdates?.count > 0) {
                    const effortUpdates = log.devOpsItemUpdates.value
                        .filter(x => x.fields && x.fields['Microsoft.VSTS.Scheduling.RemainingWork'])
                        .sort((a,b) => b.rev - a.rev);

                    if (effortUpdates.length > 0) {
                        const lastEffortUpdate = effortUpdates[0];
                        if (lastEffortUpdate.revisedBy._links?.avatar?.href){
                            remainingInfo.append($('<img src="' + lastEffortUpdate.revisedBy._links.avatar.href + '" style="border-radius: 100%;width: 13px; padding-bottom: 2px" class="ml-1">'));
                        }
                        remainingInfo.append($('<div class="ml-1">').text(`${lastEffortUpdate.revisedBy.displayName}`));
                        remainingInfo.append($('<div class="ml-1">').text(` ${moment(lastEffortUpdate.fields['System.ChangedDate']?.newValue).fromNow()}`)); 
                    }
                }    
                remainingInfo.append($('<div>').addClass("mx-2").text('|'));       
                remainingInfo.append($('<div class="ml-1" style="font-weight:500">').text(`${minutesToString((log.devOpsItem?.fields['Microsoft.VSTS.Scheduling.CompletedWork'] ?? 0)*60)}h completed`));     

                remainingInfo.append($('<div>').addClass("mx-2").text('|'));       
                remainingInfo.append($('<div class="ml-1" style="font-weight:500">').text(`${minutesToString((log.devOpsItem?.fields['Microsoft.VSTS.Scheduling.OriginalEstimate'] ?? 0)*60)}h estimated`));     


            } else {
                // log.color = 'lightgray';
                // logTitle.text('DevOps item not found');
                openDevOpsItemButton.hide();
                copyWorklogButton.hide();

                if (log.projectId == _this.options.myHoursCommonProjectId) {
                    log.color = '#bbc9f3';
                }
            }

            if (!log.taskId) {
                log.color = 'lightgray';
            }

            colorBarCell.css("background-color", log.color);
            logsContainer.append(logContainer);



            //timeline

            var timeline = $('#timeline');
            log.times.forEach(time => {
                var left = timeToPixel(time.startTime, _this.timeLineWidth);
                var right = timeToPixel(time.endTime, _this.timeLineWidth);
                var title = intervalToString(time.startTime, time.endTime, time.duration) + ' -- ' + log.note;

                var barGraph = $('<div>');
                barGraph.addClass('timelineItem timeline-log');
                barGraph.attr("data-logId", log.id);
                barGraph.prop('title', title);

                if (log.projectId == _this.options.myHoursCommonProjectId) {
                    barGraph.append('<i class="fas fa-crown ml-2" aria-hidden="true"></i>');
                } else if (!log.devOpsItemId) {
                    barGraph.append('<i class="fas fa-skull ml-2" aria-hidden="true"></i>');
                }


                if (log.running) {
                    barGraph.css({
                        left: left + 'px',
                        width: '20px',
                        "background-image": '-webkit-gradient(linear, left top, right top, from(' + log.color + '), to(rgba(0, 0, 0, 0)))'
                    });
                }
                else {
                    barGraph.css({
                        left: left + 'px',
                        width: right - left + 'px',
                        "background-color": log.color,
                    });
                }

                barGraph.mouseenter(function () {
                    $('.logContainer[data-logId="' + log.id + '"]')[0].scrollIntoViewIfNeeded();
                    $('.logContainer[data-logId="' + log.id + '"]').toggleClass("active", true);
                    hiLiteMyHoursLog(log.id);
                });
                barGraph.mouseleave(function () {
                    $('.logContainer[data-logId="' + log.id + '"]').toggleClass("active", false);
                    hiLiteMyHoursLog();
                });

                timeline.append(barGraph);
                //barGraph.tooltip();
            });
        });

        _this.timeRatio.setMyHours(totalMins);
        $('#mhTotal').text(minutesToString(totalMins));

        $('#copyDevOpsButton').toggle(totalMins > 0);
    }

    function updateDevOpsWorkItemEffort(devOpsItemId, logDurationInHours){
        _this.devOpsApi.getItemAsync(devOpsItemId).then(devOpsItem => {
            _this.devOpsApi.updateRemainingAndCompletedWorkAsync(devOpsItem, logDurationInHours)
                .then(updatedItem => {
                    toastr.success(`DevOps Item updated: Remaining ${minutesToString(updatedItem?.fields['Microsoft.VSTS.Scheduling.RemainingWork'] * 60)} h, Completed ${minutesToString(updatedItem.fields['Microsoft.VSTS.Scheduling.CompletedWork'] * 60)} h`);
                    getLogs();
                })
                .catch(x => {
                    console.log(x);
                    toastr.error(`DevOps item not updated. Error: ${x.message}`);
                });
        });        
    }

    function showEmptyState(){
        const logsContainer = $('#logs');
        const emptyStateContainer = $('<div>').addClass('d-flex flex-column');
        logsContainer.append(emptyStateContainer);

        if (_this.currentDate.isAfter(moment())) {
            // FUTURE
            emptyStateContainer.append($('<img src="./images/undraw_exciting_news_re_y1iw.svg">').addClass('empty-state-image'));
            emptyStateContainer.append($('<h6>').addClass('empty-state-text').text('Always in motion the future is'));
        } else {

            if (_this.currentDate.isoWeekday() > 5) {
                // WEEKEND
                emptyStateContainer.append($('<img src="./images/undraw_explore_re_8l4v.svg">').addClass('empty-state-image'));
                emptyStateContainer.append($('<h6>').addClass('empty-state-text').text('Weekends are a bit like rainbows; they look good from a distance but disappear when you get up close to them.'));
            } else {
                // WEEKDAY
                if (_this.allHoursAttendance > 0) {
                    // TIME CLOCKED ON AH
                    emptyStateContainer.append($('<img src="./images/undraw_empty_re_opql.svg">').addClass('empty-state-image'));
                    emptyStateContainer.append($('<h6>').addClass('empty-state-text').text('You have not added any My Hours logs on this day.'));
                } else {
                    // NO TIME CLOCKED ON AH
                    emptyStateContainer.append($('<img src="./images/undraw_reading_time_re_phf7.svg">').addClass('empty-state-image'));
                    emptyStateContainer.append($('<h6>').addClass('empty-state-text').text("It's okay to take a break."));

                }
            }
        }        
    }


    function getLogs() {
        let fetchLogsId = moment().valueOf();
        _this.fetchLogsId = fetchLogsId;

        // console.log(`getting logs. fetch id: ${fetchLogsId}`);
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


        let today = moment().startOf('day');
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


        if (_this.options.useDevOps) {
            _this.getProjectTracks();
            getAllHoursData(fetchLogsId);
            return;
        }



        _this.axoSoftApi.getWorkLogMinutesWorked(_this.currentDate).then(function (minutesWorked) {
            // console.info(minutesWorked);

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
                                    var durationInfo = $('<i class="fas fa-spinner fa-spin"></i>');
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

                                    status.append(getActionsDropDown(data));

                                    logStatus.append(success);
                                    logStatus.append(itemComment);
                                    getTimes(data, timeline);
                                },
                                    function (err) {
                                        var logStatus = $('*[data-logid="' + data.id + '"] .mainColumn .tags');
                                        logStatus.empty();
                                        var fail = $('<div>');
                                        fail.append($('<i class="fa-solid fa-skull-crossbones"></i>'));
                                        fail.append($("<span>").addClass("axoItemName ml-2").html("Work Item not found"));
                                        //logStatus.append(fail);

                                        data.color = 'whitesmoke';
                                        getTimes(data, timeline);
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
            .append($('<i class="fa-solid fa-ellipsis-vertical"></i>'))
            //.text('Actions')
        );

        let dropdownMenu = $('<div>').addClass('dropdown-menu');


        let startTrackingTime = $('<a class="dropdown-item" href="#">');
        startTrackingTime.append('<i class="fa-regular fa-circle-play"></i> <span class="ml-1">Start tracing time</span>')
            .click(function (event) {
                event.preventDefault();
                _this.myHoursApi.startFromExisting(data.id).then(
                    function () {
                        // console.info('worklog started');
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

        if (true) {
            dropdownMenu.append($('<a class="dropdown-item" href="#">')
                .append('<i class="fa-solid fa-code-merge"></i><span class="ml-1">Copy commit message to description</span>')
                .click(function (event) {
                    event.preventDefault();
                    copyCommitMessage(data);
                }));
        }

        if (data.projectId) {
            dropdownMenu.append($('<a class="dropdown-item" href="#">')
                .append('<i class="fa-solid fa-arrow-up-right-from-square"></i><span class="ml-1">Open My Hours project</span>')
                .click(function (event) {
                    event.preventDefault();
                    window.open(`https://app.myhours.com/#/projects/${data.projectId}/overview`, '_blank');
                }));
        }



        if (data.axoId) {
            dropdownMenu.append('<div class="dropdown-divider">');
            dropdownMenu.append($('<a class="dropdown-item" href="#">')
                .append('<i class="fa-solid fa-arrow-up-right-from-square"></i> <span class="ml-1">Open AXO item</span>')
                .click(function (event) {
                    event.preventDefault();
                    window.open(`https://ontime.spica.com:442/OnTime/ViewItem.aspx?type=features&id=${data.axoId}`, '_blank');
                }));

            dropdownMenu.append($('<a class="dropdown-item" href="#">')
                .append('<i class="fa-solid fa-seedling"></i><span class="ml-1">Copy time to AXO worklog</span>')
                .click(function (event) {
                    event.preventDefault();
                    _this.addAxoWorkLog(data, data.duration).then(x => console.log('added axo work log'));
                }));
        }
        buttonGroup.append(dropdownMenu);


        let startTrackingTimeShortcut = $('<button>').addClass("btn btn-transparent mr-1");
        startTrackingTimeShortcut.append($('<i class="fa-regular fa-circle-play">').attr("title", "Start tracking time"))
            .click(function (event) {
                event.preventDefault();
                _this.myHoursApi.startFromExisting(data.id).then(
                    function () {
                        // console.info('worklog started');
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
                        $('.logContainer[data-logId="' + data.id + '"]')[0].scrollIntoViewIfNeeded();
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
        _this.allHoursAttendance = 0;

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
                            // console.log('it is today');

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
                            // console.log('it is NOT today');
                            _this.allHoursApi.getAttendance(data, _this.currentDate).then(
                                function (data) {
                                    if (data && data.CalculationResultValues.length > 0) {
                                        let attendance = parseInt(data.CalculationResultValues[0].Value, 10);
                                        _this.timeRatio.setAllHours(attendance);
                                        _this.timeRatioAllHourAxo.setAllHours(attendance);
                                        _this.allHoursAttendance = attendance;
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

                                    // console.group('all hours segments');
                                    // console.table(segments);
                                    // console.groupEnd();

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
        _this.balanceView.show();
    }

    function getDevOpsItemsActions(item) {

        let actionsContainer = $('<div>')
            .addClass('d-flex justify-content-end');


        let startWorklogButton = $('<button class="btn btn-transparent">')
            .append($('<i class="fa-regular fa-circle-play"></i>').attr("title", "Start tracking time"))
            .click(function (event) {
                event.preventDefault();
                let itemId = item.id.toString();

                _this.myHoursApi.startLogFromId(itemId, _this.options.myHoursDefaultTagId)
                    .then(
                        (data) => {
                            if (data.logStarted) {
                                toastr.success(`Log started: ${data.projectTask.name}`);
                            } else {
                                toastr.warning(`There is no incompleted no task with id ${itemId}`);
                            }
                        }
                    )
                    .catch(() => {
                        toastr.error(`There was an error. See console.`)
                    })



                // _this.myHoursApi.startLog(note, _this.options.myHoursDefaultTagId).then(
                //     function () {
                //         console.info('worklog started');

                //         var notificationOptions = {
                //             type: 'basic',
                //             iconUrl: './images/ts-badge.png',
                //             title: 'MyHours',
                //             message: 'Log started.'
                //         };
                //         chrome.notifications.create('notifyDevOpsItemStarted', notificationOptions, function () { console.log("Last error:", chrome.runtime.lastError); });
                //         $('#pills-home-tab').tab('show');
                //     }
                // )
                //     .catch(
                //         function () {
                //             console.info('worklog add failed');
                //         }
                //     )
            });

        let openItemButton = $('<button class="btn btn-transparent">')
            .append($('<i class="fa-solid fa-arrow-up-right-from-square"></i>').attr("title", "Open item in DevOps"))
            .click(function (event) {
                event.preventDefault();
                _this.devOpsApi.getItemAsync(item.id).then(devOpsItem => {
                    const editUrl = encodeURI(`${_this.options.devOpsInstanceUrl}/${devOpsItem.fields['System.AreaPath']}/_workitems/edit/${item.id}`);
                    window.open(editUrl, '_devops');
                });
            });

        actionsContainer.append(startWorklogButton);
        actionsContainer.append(openItemButton);

        return actionsContainer;
    }

    function getMyDevOpsItems() {
        _this.devOpsApi.getMyItemsIdsAsync()
            .then(queryResult => {
                // console.log(queryResult);

                let myItemsContainer = $('#myDevOpsItems');
                myItemsContainer.empty();

                let ids = queryResult.workItems.map(x => x.id).join();
                _this.devOpsApi.getItemsAsync(ids)
                    .then(items => {
                        items.value.sort((a,b) => {
                            const level1 = a.fields['System.TeamProject']?.localeCompare(b.fields['System.TeamProject']);
                            if (level1 != 0) {
                                return level1;
                            }
                            return a.fields['System.Title']?.localeCompare(b.fields['System.Title']);
                        })


                        // console.log(items);

                        let lastTeamProject = '';
                        $('#devops-items-count').text(items.count);
                        $.each(items.value, function (index, devOpsItem) {
                            if (lastTeamProject.localeCompare(devOpsItem.fields['System.TeamProject']) != 0) {
                                var projectContainer = $('<h5>')
                                    // .attr("data-logId", devOpsItem.id)
                                    .addClass('m-2 mt-3')
                                    .text(devOpsItem.fields['System.TeamProject']);
                                myItemsContainer.append(projectContainer);
                                lastTeamProject = devOpsItem.fields['System.TeamProject'];
                            } 

                            var myItemContainer = $('<div>')
                                .attr("data-logId", devOpsItem.id)
                                .addClass('logContainer logContainerGrid')
                            myItemsContainer.append(myItemContainer);

                            // var log = $('<div>')
                            //     .attr("data-logId", item.id)
                            //     .addClass("d-flex logContainer my-1 p-1 mr-1 align-items-center");
                            // myItemContainer.append(log);

                            //color bar
                            var columnColorBarCell = $('<div>')
                                .addClass('log-color-bar')
                                .css("background-color", _this.axoItemColors[numberToIndex(devOpsItem.id, 8)]);
                            myItemContainer.append(columnColorBarCell);


                            //item name and worklog type
                            var titleCell = $('<div style="gap: 0.5rem">')
                                .addClass('log-title d-flex')
                            myItemContainer.append(titleCell);

                            var itemId = $('<div style="width: 4rem">')
                                .text(devOpsItem.id);
                            titleCell.append(itemId);

                            var itemTypeIcon = $('<div>');
                            if (devOpsItem.fields['System.WorkItemType'] == 'Task') {
                                itemTypeIcon.append('<i class="fas fa-clipboard-check"></i>').css('color', '#a4880a')
                            } else if (devOpsItem.fields['System.WorkItemType'] == 'Ticket') {
                                itemTypeIcon.append('<i class="fas fa-medal"></i>').css('color', '#cc293d')
                            }
                            titleCell.append(itemTypeIcon);

                            var itemName = $('<div style="white-space: break-spaces;">')
                                .addClass('axoItemName')
                                .text(devOpsItem.fields['System.Title']);
                            titleCell.append(itemName);

                            var commentCell = $('<div>')
                                .addClass('log-comment');
                            myItemContainer.append(commentCell);                                

                            let effortInfo = $('<div class="effort-info d-flex align-items-center" style="font-size:0.85rem; font-weight:500; line-height: 1.5rem; font-style:normal">');
                            commentCell.append(effortInfo);
                            effortInfo.append($('<div class="ml-1" style="font-weight:500">').text(`${minutesToString((devOpsItem.fields['Microsoft.VSTS.Scheduling.RemainingWork'] ?? 0)*60)}h remaining`));     
                            effortInfo.append($('<div>').addClass("mx-2").text('|'));       
                            effortInfo.append($('<div class="ml-1" style="font-weight:500">').text(`${minutesToString((devOpsItem.fields['Microsoft.VSTS.Scheduling.CompletedWork'] ?? 0)*60)}h completed`));     
                            effortInfo.append($('<div>').addClass("mx-2").text('|'));       
                            effortInfo.append($('<div class="ml-1" style="font-weight:500">').text(`${minutesToString((devOpsItem.fields['Microsoft.VSTS.Scheduling.OriginalEstimate'] ?? 0)*60)}h estimated`));     
            
                            // commentCell.append($('<div class="badge badge-light">').text(`Remaining ${devOpsItem.fields['Microsoft.VSTS.Scheduling.RemainingWork'] ?? '?'} h`));
                            // commentCell.append($('<div class="badge badge-light">').text(`Completed ${devOpsItem.fields['Microsoft.VSTS.Scheduling.CompletedWork'] ?? '?'} h`));
                            // commentCell.append($('<div class="badge badge-light">').text(`Estimate ${devOpsItem.fields['Microsoft.VSTS.Scheduling.OriginalEstimate'] ?? '?'} h`));
                            

                            /*
                            let state = devOpsItem.fields['System.State'];
                            var effortCell = $('<div>')
                                .addClass('log-effort');
                            var badge = $('<div class="badgex" style="line-height: 1rem">')
                                .text(state);

                            if (state == 'Active') {
                                badge.addClass('badge-primary')
                            } else if (state == 'Resolved') {
                                badge.addClass('badge-warning')
                            } else {
                                badge.addClass('badge-light')
                            }
                            

                            effortCell.append(badge);
                            myItemContainer.append(effortCell);
                            */

                            var tagsCell = $('<div>')
                                .addClass('log-tags')
                                // .text(devOpsItem.fields['System.TeamProject'])
                                .text(devOpsItem.fields['System.State'])
                            myItemContainer.append(tagsCell);

                            //actions
                            var actionsCell = $('<div>')
                                .addClass('log-actions');
                            actionsCell.append(getDevOpsItemsActions(devOpsItem));
                            myItemContainer.append(actionsCell);



                            // myItemContainer.append(log);

                        });
                    })
                    .catch((error) => {
                        console.error('Error:', error);
                    });
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    };

    function getRecentAxoItems() {
        _this.recentItemsView.show();
    }

    function getSpinner() {
        return $('<i style="font-size:0.9em; font-weight:600;" class="fas fa-spinner fa-spin"></i>');
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
                    console.error('error while geeting the user data');
                    showLoginPage();
                });

            },
            function (error) {
                console.error('error while geeting the access token');
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
                // console.log(myHoursLog);

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

                // console.info('copy to axo: item Id' + myHoursLog.axoId);
                // console.info(myHoursLog);

                var worklog = new Worklog;
                worklog.user.id = parseInt(_this.options.axoSoftUserId);
                worklog.work_done.duration = myHoursLog.duration / 60; // mins
                worklog.item.id = myHoursLog.axoId;
                worklog.item.item_type = myHoursLog.axoItemType; //item.item_type;
                worklog.work_log_type.id = myHoursLog.axoWorklogTypeId;
                worklog.description = myHoursLog.note;
                worklog.date_time = moment(myHoursLog.date).add(8, 'hours').toDate();

                let remainingTimeMins = getRemainingMinutes(myHoursLog.axoRemainingDurationTimeUnitId, myHoursLog.axoRemainingDuration);
                // console.log(`remaining item mins: itemId: ${worklog.item.id}`);
                // console.log(`remaining item mins: remaining time mins: ${remainingTimeMins}`);
                // console.log(`remaining item mins: worklog done mins: ${worklog.work_done.duration}`);

                //worklog.remaining_time.duration = Math.max(remainingTimeMins - worklog.work_done.duration, 0);
                worklog.remaining_time.duration = Math.max(remainingTimeMins - myHoursTotalMinsDoneForAxoId, 0);
                // console.log(`remaining item mins: new remaining time mins: ${worklog.remaining_time.duration}`);

                _this.axoSoftApi.addWorkLog(worklog)
                    .then(
                        function () {
                            // console.info('worklog added');
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

            _this.devOpsApi.getMyCommitsAsync(moment(element.startTime), moment(element.endTime)).then(
                function (data) {
                    let comment = data.map(x => x.comment).join(', ');

                    // console.log(comment)
                    if (comment) {
                        _this.myHoursApi.updateLogDescription(myHoursLog, comment).then(x => {
                            toastr.success('Log comment updated.');
                            getLogs();
                        });
                    } else {
                        toastr.warning('No commit messages with comments found within the time frame of the log.');
                    }
                });

        });
    }

    function updateDevOps() {
        // get sums per devops item
        var groupsObject = _this.myHoursLogs.reduce(function (res, log) {
            if (log.devOpsItem) {
                if (!res[log.devOpsItemId]) {
                    res[log.devOpsItemId] = { id: log.devOpsItemId, duration: log.duration };
                } else {
                    res[log.devOpsItemId].duration += log.duration;
                }
            }
            return res;
        }, {});


        // update item by item
        let groups = Object.entries(groupsObject).map(x => x[1]);
        groups.forEach(x => {
            // console.log(x);
            updateDevOpsWorkItemEffort(x.id, x.duration / 60 / 60);            
        })
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
        // console.info(_this.myHoursLogs);

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

    function nameToIndex(s, length) {
        if (!s) {
            return 0;
        }
        let sumOfChars = s.split('').map(x => x.charCodeAt(0)).reduce((a, b) => a + b, 0);
        return sumOfChars % length;
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
            let ratioValid = ((timeRatio.ahAttendance == 0 && timeRatio.mhTotalTime == 0) || (timeRatio.ratio >= 0.9 && timeRatio.ratio <= 1));
            //elementInfo.text((ratio * 100).toFixed(0) + '%');

            // let cardText = 'Ratio: ' + (timeRatio.ratio * 100).toFixed(0) + '%';
            let cardText = '' + (timeRatio.ratio * 100).toFixed(0) + '%';
            let badgeType = 'badge-secondary';
            if (!ratioValid || _this.options.useDevOps) {
                let diffMinutes = timeRatio.mhTotalTime - timeRatio.ahAttendance;
                if (diffMinutes > 0) {
                    const tooMuchMinutes = Math.abs(timeRatio.ahAttendance - timeRatio.ahAttendance * timeRatio.ratio);
                    cardText += ' Too much: ' + minutesToString(tooMuchMinutes);
                }
                else if (diffMinutes < 0) {
                    const minMissingMinutes = timeRatio.ahAttendance * 0.9 - timeRatio.ahAttendance * timeRatio.ratio;
                    if (!ratioValid) {
                        // cardText += ' Missing: ' + minutesToString(Math.abs(minMissingMinutes)) 
                        cardText += ' Missing: ' + minutesToString(Math.abs(diffMinutes)) + ' (' + minutesToString(Math.abs(minMissingMinutes)) + ')';
                    } else {
                        cardText += ' Missing: ' + minutesToString(Math.abs(diffMinutes));
                    }
                }

                if (!ratioValid) {
                    badgeType = 'badge-warning';
                }


                //cardText += 
                elementOk?.hide();
                elementInfo.show();
            }
            parent.attr('title', cardText);

            element.empty();
            element.append($('<span class="badge" style="font-size: 0.85rem">')
                .addClass(badgeType)
                .text(cardText));



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

    initInterface();
}
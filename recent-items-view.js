'use strict'

function RecentItemsView(axoSoftApi, options, axoItemColors, viewContainer){
    var _this = this;
    _this.axoSoftApi = axoSoftApi;
    _this.options = options;
    _this.axoItemColors = axoItemColors;
    _this.viewContainer = viewContainer;

    _this.show = function() {

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


                // chart shows data per item id, work type is ignored
                let recentAxoItems2 = recentWorkLogsWithinTenDaysResponse.data.reduce((accumulator, workLog) => {
                    let key = workLog.item.id;
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
                recentAxoItems2 = Object.entries(recentAxoItems2).map(x => x[1]);
                var recentItemsCtx = document.getElementById('recentItemsChart').getContext('2d');
                drawRecentItemsChart(recentItemsCtx, recentAxoItems2);



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
                                r: Math.max(recentItem.workDone / 15, 2),
                                x: now.diff(recentItem.lastSeen.startOf('day'), 'days'),
                                recentItem: recentItem
                            }],
                            backgroundColor: _this.axoItemColors[numberToIndex(recentItem.itemId, 8)] + 'BF'
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
                            min: -1,
                            max: 10

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
                            let recentItemId = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].recentItem.itemId;
                            // return `${recentItemName} - ${recentItemWorkDone.toFixed(2)} hrs logged, last log ${recentItemLastSeen} days ago (switches: ${recentItemCount}).`;
                            return `${recentItemId} ${recentItemName} (${recentItemWorkDone}hrs, ${recentItemCount}x)`;
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

}
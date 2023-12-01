'use strict'



function RecentItemsView(myHoursApi, options, viewContainer){
    var _this = this;
    _this.options = options;
    _this.viewContainer = viewContainer;
    _this.myHoursApi = myHoursApi;

    _this.workLogTypeIds = [77055, 77593, 77594, 77595, 77596, 77597, 77598, 77599];

    _this.show = function() {
        
        //get last logs for last 10 days.
        const today = new Date();
        // const tenDaysAgo = new Date(today.getDate()) -10;
        const tenDaysAgo = moment(today).add(-10, 'day');

        if(options.useDevOps){
            //DEVOPS
            _this.myHoursApi.getActivity(tenDaysAgo, today).then(activityLogs => {
                $('#recentItemsWorkLogsCount').text(activityLogs.length);

                let totalWorked = activityLogs.reduce((accumulator, log) => accumulator + log.logDuration / 60, 0);
                $('.recentItemsTotal').text(minutesToString(totalWorked));
                
                let recentWorkTypes = activityLogs.reduce(function (accumulator, log) {
                    if (log.tagsData && log.tagsData.length > 0) {
                        log.tagsData.forEach(tag => {
                            let key = tag.id;
                            if (key in accumulator) {
                                accumulator[key].count = accumulator[key].count + 1;
                                accumulator[key].workDone = accumulator[key].workDone + log.logDuration / 60;
                            }
                            else {
                                if (_this.workLogTypeIds.find(id => id == tag.id)) {
                                    accumulator[key] = {
                                        workLogTypeId: tag.id,
                                        workLogTypeName: tag.name,
                                        count: 1,
                                        workDone: log.logDuration / 60,
                                    }
                                }
                            }
                            return accumulator;
                        });
                    }
                    return accumulator;
                }, {});

                recentWorkTypes = Object.entries(recentWorkTypes).map(x => x[1]);
                recentWorkTypes.map(x => x.workLogTypeName);
                recentWorkTypes.map(x => x.workDone);
                console.log(recentWorkTypes);

                const totalWorkedWithWorkType = recentWorkTypes.reduce((accumulator, recentWorkLogType) => accumulator + recentWorkLogType.workDone, 0);
                $('#recentItemsUnassigned').text(minutesToString(totalWorked - totalWorkedWithWorkType));



                let workTypesPercentsBar = $('#worklogTypesSubHeader');
                workTypesPercentsBar.empty();

                if (totalWorked > 0) {
                    recentWorkTypes.forEach(recentWorkType => {
                        const percentage = Math.round(recentWorkType.workDone / totalWorked * 100);
                        let statistics = $('<div>').addClass('statistics-xs');
                        statistics.append($('<div>').text(percentage + '%'));
                        statistics.append($('<div>').text(recentWorkType.workLogTypeName));
                        workTypesPercentsBar.append(statistics);
                    });
                }
                renderWorkLogTypeChart(recentWorkTypes);


                // BUBBLE CHART?

                let recentItems = activityLogs
                    .filter(x => x.taskId != null)
                    .reduce(function (accumulator, log) {
                        let key = log.taskId;
                        if (key in accumulator) {
                            accumulator[key].count = accumulator[key].count + 1;
                            accumulator[key].workDone = accumulator[key].workDone + log.logDuration / 60;
                            accumulator[key].lastSeen = moment.max(accumulator[key].lastSeen, moment(log.date));
                        }
                        else {
                            accumulator[key] = {
                                itemId: log.taskId,
                                itemName: log.taskName,
                                count: 1,
                                workDone: log.logDuration / 60,
                                lastSeen: moment(log.date)
                            }
                        }
                        return accumulator;
                    }, {});

                recentItems = Object.entries(recentItems).map(x => x[1]);
                recentItems.sort((a, b) => {
                    let order = b.lastSeen.unix() - a.lastSeen.unix();
                    if (order != 0)
                        return order;
                    return b.count - a.count;
                });  
                
                var recentItemsCtx = document.getElementById('recentItemsChart').getContext('2d');
                drawRecentItemsChart(recentItemsCtx, recentItems);                





            });
        } 
    }

    function drawRecentItemsChart(context, rawData) {
        if (_this.recentItemsChart != undefined) {
            _this.recentItemsChart.destroy();
        }

        let now = moment().startOf('day');

        let excludedItemIds = [];
        if (_this.options.axoSoftRecentItemsBubbleChartHiddenItemsIds) {
            excludedItemIds = _this.options.axoSoftRecentItemsBubbleChartHiddenItemsIds?.split(';');
        }
        if (_this.options.recentItemsBubbleChartHiddenItemsIds) {
            excludedItemIds = [...excludedItemIds, ..._this.options.axoSoftRecentItemsBubbleChartHiddenItemsIds?.split(';')];
        }        

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


        // console.log('chartData');
        // console.log(chartData);

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
                            let recentItemWorkDone = minutesToString(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].recentItem.workDone);
                            let recentItemCount = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].y;
                            let recentItemLastSeen = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].x;
                            let recentItemName = data.datasets[tooltipItem.datasetIndex].label || '';
                            let recentItemId = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].recentItem.itemId;
                            return `${recentItemId} ${recentItemName} (${recentItemWorkDone}hrs, ${recentItemCount}x)`;
                        }
                    }
                }
            }
        });

    }   
    
    
    function renderWorkLogTypeChart(recentWorkTypes){
        // console.log(recentWorkTypes);

        var data = {
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
            ],

            labels:
                recentWorkTypes.map(x => x.workLogTypeName),
        };
      
        
        if (_this.worklogTypeChart != undefined) {
            _this.worklogTypeChart.destroy();
        }

        _this.worklogTypeChart = new Chart(document.getElementById('worklogTypeChart').getContext('2d'), {
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
                        // title: function (tooltipItem, data) {
                        //     return data.labels[tooltipItem[0].index];

                        // },
                        label: function (tooltipItem, data) {
                            let value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                            return minutesToString(value, true);
                        }
                    }
                }
            }
        });
    }

    // function drawWorkLogTypeChart(context, data) {

    //     if (_this.worklogTypeChart != undefined) {
    //         _this.worklogTypeChart.destroy();
    //     }

    //     _this.worklogTypeChart = new Chart(context, {
    //         type: 'radar',
    //         data: data,
    //         options: {
    //             startAngle: -36,
    //             legend: {
    //                 display: false,
    //                 position: 'right'
    //             },

    //             scale: {
    //                 gridLines: {
    //                     // display: false
    //                     circular: true
    //                 },
    //                 angleLines: {
    //                     display: true,
    //                     lineWidth: 0.5,
    //                     color: 'rgba(128, 128, 128, 0.2)'
    //                 },
    //                 pointLabels: {
    //                     fontSize: 11,
    //                     fontStyle: '300',
    //                     fontColor: 'rgba(104, 104, 104, 1)',
    //                     //   fontFamily: "'Lato', sans-serif"
    //                 },
    //                 ticks: {
    //                     //   beginAtZero: true,
    //                     //   maxTicksLimit: 3,
    //                     //   min: 0,
    //                     //   max: 3,
    //                     display: false,
    //                     stepSize: 120
    //                 }
    //             },

    //             tooltips: {
    //                 displayColors: false,
    //                 callbacks: {
    //                     title: function (tooltipItem, data) {
    //                         return data.labels[tooltipItem[0].index];

    //                     },
    //                     label: function (tooltipItem, data) {
    //                         let value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
    //                         return minutesToString(value, true);
    //                     }
    //                 }
    //             }
    //         }
    //     });


    // }    

    function getRecentAxoItemsActionsDropDown(data) {

        return $('<button class="btn btn-transparent">')
            .append($('<i class="fa-regular fa-play-circle"></i>').attr("title", "Start tracking time"))
            .click(function (event) {
                event.preventDefault();
                let note = data.itemId + "/" + data.workLogTypeName;
                _this.myHoursApi.startLog(note).then(
                    function () {
                        console.info('worklog started');
                        toastr.success('Log started');
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
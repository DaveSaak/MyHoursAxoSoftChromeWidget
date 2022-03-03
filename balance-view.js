'use strict'

function BalanceView(allHoursApi, viewContainer){
    var _this = this;
    _this.allHoursApi = allHoursApi;
    _this.viewContainer = viewContainer;

    _this.show = function() {
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

    function drawDayBalanceChart(userId, today, currentAttendance) {
        var tenDaysAgo = today.clone().add(-14, 'day');

        _this.allHoursApi.getUserCalculations(userId, tenDaysAgo, today.clone().add(-1, 'day')).then(
            function (data) {
                //var dayDifferences = data.DailyCalculations.map(x => x.CalculationResultSummary.PaidPresenceValue);
                var dayDifferences = data.DailyCalculations.map(x => x.CalculationResultSummary.DailyBalanceValue);
                dayDifferences.push(currentAttendance);

                let periodDiff = dayDifferences.reduce((a, b) => a + b, 0);
                $("#currentBalancePeriodDiff").text(minutesToString(periodDiff));


                var runningDifferences = data.DailyCalculations.map(x => x.CalculationResultSummary.RunningBalanceValue);

                var labels = data.DailyCalculations.map(x => moment(x.DateTime).format('ddd'));
                labels.push(today.format('ddd'));

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
}
'use strict'

function RatioView(allHoursApi, axoSoftApi, viewContainer) {

    var _this = this;
    _this.allHoursApi = allHoursApi;
    _this.axoSoftApi = axoSoftApi;
    _this.viewContainer = viewContainer;

    _this.show = function () {
        $('#invalidRatioCount').text('-');

        var today = moment().startOf('day');
        var twoWeeksAgo = today.clone().add(-9, 'day');

        let currentUserPromise = _this.allHoursApi.getCurrentUserId();
        currentUserPromise.then(
            function (userId) {
                _this.axoSoftApi.getWorkLogsWithinLastTenDays(twoWeeksAgo, today).then(response => {
                    let worklogs = response.data;
                    _this.allHoursApi.getUserCalculations(userId, twoWeeksAgo, today).then(calculations => {

                        let ratios = [];
                        let invalidRatios = [];
                        let labels = [];
                        for (let currDay = twoWeeksAgo.clone(); currDay < today; currDay.add(1, 'day')) {
                            labels.push(currDay.clone());

                            let axoWorklogs = worklogs.filter(x => moment(x.date_time).isSame(currDay, 'day'));
                            let axoMinutesWorked = axoWorklogs.reduce((a, b) => { return a + b.work_done.duration_minutes; }, 0);
                            let ahAttendance = calculations?.DailyCalculations?.find(x => moment(x.DateTime).isSame(currDay, 'day'))?.CalculationResultSummary.PaidPresenceValue || 0;

                            if (ahAttendance > 0) {
                                let ratio = Math.floor(axoMinutesWorked * 100 / ahAttendance) / 100;
                                if (ratio >= 0.9 && ratio <= 1) {
                                    ratios.push(ratio * 100);
                                    invalidRatios.push(undefined);
                                } else {
                                    ratios.push(undefined);
                                    invalidRatios.push(ratio * 100);
                                }
                            } else {
                                ratios.push(undefined);
                                invalidRatios.push(undefined);
                            }
                        }


                        var thresholdLowArray = new Array(ratios.length).fill(90);
                        var thresholdHighArray = new Array(ratios.length).fill(100);


                        var ratioChartCtx = document.getElementById('ratioChart').getContext('2d');
                        var ratioChart = new Chart(ratioChartCtx, {
                            type: 'bar',
                            data: {
                                labels: labels,
                                datasets: [
                                    {
                                        order: 4,
                                        type: 'line',
                                        data: thresholdLowArray,
                                        fill: false,
                                        borderColor: 'rgb(54, 162, 235)',
                                        pointRadius: 0
                                    },
                                    {
                                        order: 3,
                                        type: 'line',
                                        data: thresholdHighArray,
                                        fill: false,
                                        borderColor: 'rgb(54, 162, 235)',
                                        pointRadius: 0
                                    },
                                    {
                                        order: 2,
                                        data: ratios,
                                        backgroundColor: "#3c5081",
                                    },
                                    {
                                        order: 1,
                                        data: invalidRatios,
                                        backgroundColor: "#b82f4e",
                                    },                                    

                                ]
                            },
                            options: {
                                legend: {
                                    display: false
                                },
                                scales: {
                                    xAxes: [{
                                        // barThickness: 16,
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
                                            // beginAtZero: true,
                                            // maxTicksLimit: 7,
                                            // display: false, //this removed the labels on the x-axis
                                            // stepSize: 20,
                                            // callback: function (value, index, values) {
                                            //     return minutesToString(value);
                                            // }
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
                                        // label: function (tooltipItem, data) {
                                        //     let value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                                        //     return minutesToString(value, true);
                                        // }
                                    }
                                }
                            }
                        });



                    });
                })
            }
        )




    }


}
'use strict'

function CalendarView(myHoursApi, viewContainer){
    var _this = this;
    _this.myHoursApi = myHoursApi;
    _this.viewContainer = viewContainer;

    _this.show = function() {
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
            viewContainer.find('.calendarItemsTotal').text(minutesToString(totalMinutes));

            let maxMinutesInDay = Math.max(...minutesPerDay.map(x => x.duration), 0);
            viewContainer.find('.calendarMaxMinutesInDay').text(minutesToString(maxMinutesInDay));
            
            let workDaysInRange = minutesPerDay.filter(x => x.date.isoWeekday() < 6).length;
            viewContainer.find('.calendarWorkDays').text(workDaysInRange);
            viewContainer.find('.calendarAverageMinutesInWorkDay').text(minutesToString(totalMinutes / workDaysInRange));

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
                    borderColor: 'grey'
                    // borderColor: '#b82f4e'
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


}
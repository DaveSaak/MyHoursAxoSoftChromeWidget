'use strict'

function CalendarView(myHoursApi, allHoursApi, viewContainer) {
    var _this = this;
    _this.myHoursApi = myHoursApi;
    _this.allHoursApi = allHoursApi;
    _this.viewContainer = viewContainer;
    // _this.heatmapColors = ["#EEEEEE", "#D6E77F", "#8AC760", "#40A43A", "#19691F"];
    // _this.heatmapColors = ["#EEEEEE", "#C6E1E4", "#93BDB9", "#53BD99", "#D37B71","#A55F58"];
    _this.heatmapColors = ["#EEEEEE", '#91bbc1', '#bfbdbd', '#ffc107', '#ff9800', '#ff5722'];


    _this.show = function () {
        let today = moment().startOf('day');
        let startOfCalendar = today.clone().startOf('month').add(-4, 'month');
        let endOfCalendar = today.clone();

        // let loader = $('#calendarChartLoader');
        // loader.show();        

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

            let workDaysInRange = minutesPerDay.filter(x => x.date.isoWeekday() < 6 && x.duration > 0).length;
            viewContainer.find('.calendarWorkDays').text(workDaysInRange);
            viewContainer.find('.calendarAverageMinutesInWorkDay').text(minutesToString(totalMinutes / workDaysInRange));

            let calendarContainer = $('#calendarChart');
            calendarContainer.empty();

            let currentMonth = -1;
            let monthContainer = null;
            for (let currDay = startOfCalendar.clone(); currDay <= endOfCalendar; currDay.add(1, 'day')) {
                if (currDay.month() != currentMonth) {
                    monthContainer = $('<div>').addClass('calendar-month-container');
                    calendarContainer.append(monthContainer);
                    currentMonth = currDay.month();

                    let gaps = currDay.isoWeekday() - 1;
                    if (gaps > 0) {
                        Array(gaps).fill().forEach(() => monthContainer.append($('<div>').addClass("calendar-day-blank")));
                    }
                }


                let minutes = minutesPerDay.find(x => x.date.isSame(currDay, 'day'))?.duration || 0;
                let refMinutes = minutes;
                if (minutes > 0 && currDay.isoWeekday() >= 6) {
                    refMinutes = minutes + 8 * 60;
                }

                let heatmapColorIndex = 0;
                if (refMinutes > 10 * 60) {
                    heatmapColorIndex = 5
                } else if (refMinutes > 9 * 60) {
                    heatmapColorIndex = 4
                // } else if (refMinutes > 6.5 * 60) {
                //     heatmapColorIndex = 3
                } else if (refMinutes > 8.5 * 60) {
                    heatmapColorIndex = 3
                // } else if (refMinutes > 6.5 * 60) {
                //     heatmapColorIndex = 3
                } else if (refMinutes > 4 * 60) {
                    heatmapColorIndex = 2
                } else if (refMinutes > 0 * 60) {
                    heatmapColorIndex = 1
                }

                let cell = $('<div>')
                .addClass("calendar-day")
                .css("background-color", _this.heatmapColors[heatmapColorIndex])
                .attr('title', `${currDay.format('ll')}: ${minutesToString(minutes)}`);

                if (heatmapColorIndex > 2){
                    cell.addClass('calendar-day-highlight');
                }

                if (heatmapColorIndex == 1){
                    cell.addClass('calendar-day-lowlight');
                }

                monthContainer.append(cell);
                



            };





/*
            calendarContainer.append($('<div>'));
            calendarContainer.append($('<div>').addClass("calendar-day-name").text('Mon'));
            calendarContainer.append($('<div>'));
            calendarContainer.append($('<div>').addClass("calendar-day-name").text('Wed'));
            calendarContainer.append($('<div>'));
            calendarContainer.append($('<div>').addClass("calendar-day-name").text('Fri'));
            calendarContainer.append($('<div>'));
            calendarContainer.append($('<div>'));

            for (let currDay = startOfCalendar.clone(); currDay <= endOfCalendar; currDay.add(1, 'day')) {
                if (currDay.isoWeekday() == 1) {
                    let text = '';
                    for (let currWeekDay = currDay.clone(); currWeekDay < currDay.clone().endOf('isoWeek'); currWeekDay.add(1, 'day')) {
                        if (currWeekDay.date() == 1) {
                            text = currWeekDay.format('MMM');
                        }
                    }
                    calendarContainer.append($('<div>').addClass("calendar-day-name").text(text));
                }

                let minutes = minutesPerDay.find(x => x.date.isSame(currDay, 'day'))?.duration || 0;

                let heatmapColorIndex = 0;
                if (minutes > 9 * 60) {
                    heatmapColorIndex = 4
                } else if (minutes > 8.5 * 60) {
                    heatmapColorIndex = 3
                // } else if (minutes > 6.5 * 60) {
                //     heatmapColorIndex = 3
                } else if (minutes > 4 * 60) {
                    heatmapColorIndex = 2
                } else if (minutes > 0 * 60) {
                    heatmapColorIndex = 1
                }

                // let heatmapColorIndex = Math.min(Math.ceil(minutes / (3 * 60)), 4);
                // calendarContainer.append($('<div>')
                //     .addClass("calendar-day")
                //     .css("background-color", _this.heatmapColors[heatmapColorIndex])
                //     .attr('title', `${currDay.format('ll')}: ${minutesToString(minutes)}`)
                // );

                let cell = $('<div>')
                    .addClass("calendar-day")
                    .css("background-color", _this.heatmapColors[heatmapColorIndex])
                    .attr('title', `${currDay.format('ll')}: ${minutesToString(minutes)}`);

                if (heatmapColorIndex > 2){
                    cell.addClass('calendar-day-highlight');
                }

                if (heatmapColorIndex == 1){
                    cell.addClass('calendar-day-lowlight');
                }

                calendarContainer.append(cell);

                

            }
            */
            // loader.hide();     
        })      
        
    }

    _this.show2 = function () {
        let today = moment().startOf('day');
        let startOfCalendar = today.clone().startOf('isoWeek').add(-39, 'week');
        let endOfCalendar = today.clone();

        // let loader = $('#calendarChartLoader');
        // loader.show();        

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

            let calendarContainer = $('#calendarChart');
            calendarContainer.empty();


            calendarContainer.append($('<div>'));
            calendarContainer.append($('<div>').addClass("calendar-day-name").text('Mon'));
            calendarContainer.append($('<div>'));
            calendarContainer.append($('<div>').addClass("calendar-day-name").text('Wed'));
            calendarContainer.append($('<div>'));
            calendarContainer.append($('<div>').addClass("calendar-day-name").text('Fri'));
            calendarContainer.append($('<div>'));
            calendarContainer.append($('<div>'));

            for (let currDay = startOfCalendar.clone(); currDay <= endOfCalendar; currDay.add(1, 'day')) {
                if (currDay.isoWeekday() == 1) {
                    let text = '';
                    for (let currWeekDay = currDay.clone(); currWeekDay < currDay.clone().endOf('isoWeek'); currWeekDay.add(1, 'day')) {
                        if (currWeekDay.date() == 1) {
                            text = currWeekDay.format('MMM');
                        }
                    }
                    calendarContainer.append($('<div>').addClass("calendar-day-name").text(text));
                }

                let minutes = minutesPerDay.find(x => x.date.isSame(currDay, 'day'))?.duration || 0;

                let heatmapColorIndex = 0;
                if (minutes > 9 * 60) {
                    heatmapColorIndex = 4
                } else if (minutes > 8.5 * 60) {
                    heatmapColorIndex = 3
                // } else if (minutes > 6.5 * 60) {
                //     heatmapColorIndex = 3
                } else if (minutes > 4 * 60) {
                    heatmapColorIndex = 2
                } else if (minutes > 0 * 60) {
                    heatmapColorIndex = 1
                }

                // let heatmapColorIndex = Math.min(Math.ceil(minutes / (3 * 60)), 4);
                // calendarContainer.append($('<div>')
                //     .addClass("calendar-day")
                //     .css("background-color", _this.heatmapColors[heatmapColorIndex])
                //     .attr('title', `${currDay.format('ll')}: ${minutesToString(minutes)}`)
                // );

                let cell = $('<div>')
                    .addClass("calendar-day")
                    .css("background-color", _this.heatmapColors[heatmapColorIndex])
                    .attr('title', `${currDay.format('ll')}: ${minutesToString(minutes)}`);

                if (heatmapColorIndex > 2){
                    cell.addClass('calendar-day-highlight');
                }

                if (heatmapColorIndex == 1){
                    cell.addClass('calendar-day-lowlight');
                }

                calendarContainer.append(cell);

            }
            // loader.hide();     
        })      
        
    }
}
'use strict'

function DashboardView(options, allHoursApi, viewContainer){
    var _this = this;
    _this.options = options;
    _this.allHoursApi = allHoursApi;
    _this.viewContainer = viewContainer;

    _this.show = function () {
        getDashData();
    }


    function getDashData(){
        $('#travelReimbursementToday').text('');
        $('#travelReimbursementTodaySpinner').hide();

        if (_this.options.travelReimbursement.distance == undefined || _this.options.travelReimbursement.kmCost == undefined) { 
            setTravelReimbursementToday('Not configured'); 
        } else {
            $('#travelReimbursementTodaySpinner').show();
            let currentUserPromise = _this.allHoursApi.getCurrentUserId();
            if (currentUserPromise != undefined) {
                currentUserPromise.then(
                    function (data) {
                        var userId = data;

                        if (data) {
                            var today = moment().startOf('day');

                            _this.allHoursApi.getUserCalculations(data, today, today.clone()).then(
                                function (userCalculations) {
                                    const calculationToday = userCalculations.DailyCalculations[0];
                                    $('#travelReimbursementTodaySpinner').hide();
                                    if (calculationToday.Clockings.some(x => x.ClockingDefinitionId == "834df343-3597-45e8-bbca-60865a85398b")) {
                                        setTravelReimbursementToday(`${(_this.options.travelReimbursement.distance * _this.options.travelReimbursement.kmCost * 2).toFixed(2)} EUR`);
                                    } else {
                                        setTravelReimbursementToday(':P')

                                    }
                                });
                            }
                        }
                    );
            }  
        }      
    }

    function setTravelReimbursementToday(value){
        $('#travelReimbursementToday').text(value);
    }
}



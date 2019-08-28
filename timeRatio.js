function TimeRatio(callback) {
    'use strict';
    var _this = this;
    _this.callback = callback;

    _this.ahAttendance = undefined;
    _this.mhTotalTime = undefined;
    

    _this.setAllHours = function(minutes) {
        _this.ahAttendance = minutes;
        _this.calcRatio();
    },

    _this.setMyHours = function(minutes) {
            _this.mhTotalTime = minutes;
            _this.calcRatio();
          },

    _this.reset = function(){
        _this.ahAttendance = undefined;
        _this.mhTotalTime = undefined;
    },

    _this.calcRatio = function(){
        //console.log("mhTotalTime:" + this.m);
        if (_this.mhTotalTime && _this.ahAttendance){
            var ratio = undefined;
            if (_this.ahAttendance > 0){
                ratio = _this.mhTotalTime/_this.ahAttendance;
            }

            console.log("MH/AH time ratio:" + ratio);
            if (_this.callback){
                _this.callback(ratio);
            }
            
        }
    }
    
}
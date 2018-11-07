var MyHoursRepo = (function () {
    var myHoursRepo;

    function createRepo() {
        var myHoursRepo = new MyHoursApi;
        return myHoursRepo;
    }

    return {
        getInstance: function () {
            if (!myHoursRepo) {
                myHoursRepo = createRepo();
            }
            return myHoursRepo;
        }
    }
}
)();
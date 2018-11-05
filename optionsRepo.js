var OptionsRepo = (function () {
        var optionsRepo;

        function createRepo() {
            var optionsRepo = new Options;
            return optionsRepo;
        }

        return {
            getInstance: function () {
                if (!optionsRepo) {
                    optionsRepo = createRepo();
                }
                return optionsRepo;
            }
        }
    }
)();
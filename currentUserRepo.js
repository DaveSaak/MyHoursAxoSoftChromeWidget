var CurrentUserRepo = (function () {
        var currentUserRepo;

        function createRepo() {
            var currentUserRepo = new CurrentUser;
            return currentUserRepo;
        }

        return {
            getInstance: function () {
                if (!currentUserRepo) {
                    currentUserRepo = createRepo();
                }
                return currentUserRepo;
            }
        }
    }
)();
var AxoSoftRepo = (function () {
    var repo;

    function createRepo() {
        var repo = new AxoSoftApi;
        return repo;
    }

    return {
        getInstance: function () {
            if (!repo) {
                repo = createRepo();
            }
            return repo;
        }
    }
}
)();
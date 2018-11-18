$(function () {
    //init();

    console.info('init options page');
    var _this = this;

    // _this.options = new OptionsRepo.getInstance();
    _this.options = new Options;


    _this.options
        .load()
        .then(function () {
            $('#axoSoftUrl').val(_this.options.axoSoftUrl);
            $('#axoSoftToken').val(_this.options.axoSoftToken);
            $('#axoSoftUserId').val(_this.options.axoSoftUserId);
            $('#axoSoftDefaultWorklogTypeId').val(_this.options.axoSoftDefaultWorklogTypeId);

            _this.axoSoftRepo = new AxoSoftApi(_this.options); //new AxoSoftRepo.getInstance();

            _this.axoSoftRepo.getUsers().then(function (users) {
                    console.log(users);

                    var $select = $("#axoSoftUserId2");
                    
                    console.log(_this.options.axoSoftUserId);

                    $(users).each(function (i, user) {
                        if (user.is_active === true) {
                            $select.append($("<option>", {
                                value: user.id,
                                html: user.full_name + ' -- ' + user.id
                            }));
                        }
                    });

                    $select.val(_this.options.axoSoftUserId);
                }
            )
        });






    $('#saveButton').click(function () {
        //var options = new OptionsRepo.getInstance();

        _this.options.axoSoftUrl = $('#axoSoftUrl').val();
        _this.options.axoSoftToken = $('#axoSoftToken').val();
        _this.options.axoSoftUserId = $('#axoSoftUserId').val();
        _this.options.axoSoftDefaultWorklogTypeId = $('#axoSoftDefaultWorklogTypeId').val();

        _this.options.save().then(function () {
            $('.notification').show();
            setTimeout(function () {
                $('.notification').hide();
            }, 3000)

        });


    })



});
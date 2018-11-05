$(function () {
    //init();

    console.info('init options page');

    var options = new OptionsRepo.getInstance();


    options.load(function () {
        $('#axoSoftUrl').val(options.axoSoftUrl);
        $('#axoSoftToken').val(options.axoSoftToken);
        $('#axoSoftUserId').val(options.axoSoftUserId);

    });


    $('#saveButton').click(function(){
        var options = new OptionsRepo.getInstance();

        options.axoSoftUrl = $('#axoSoftUrl').val();
        options.axoSoftToken = $('#axoSoftToken').val();
        options.axoSoftUserId = $('#axoSoftUserId').val();

        options.save();


    })



});
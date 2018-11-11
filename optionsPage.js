$(function () {
    //init();

    console.info('init options page');

    var options = new OptionsRepo.getInstance();


    options.load().then(function () {
            $('#axoSoftUrl').val(options.axoSoftUrl);
            $('#axoSoftToken').val(options.axoSoftToken);
            $('#axoSoftUserId').val(options.axoSoftUserId);
            $('#axoSoftDefaultWorklogTypeId').val(options.axoSoftDefaultWorklogTypeId);
    });
    


$('#saveButton').click(function () {
    var options = new OptionsRepo.getInstance();

    options.axoSoftUrl = $('#axoSoftUrl').val();
    options.axoSoftToken = $('#axoSoftToken').val();
    options.axoSoftUserId = $('#axoSoftUserId').val();
    options.axoSoftDefaultWorklogTypeId = $('#axoSoftDefaultWorklogTypeId').val();

    options.save().then(function(){
        $('.notification').show();
        setTimeout(function(){
            $('.notification').hide();
        }, 3000)

    });


})



});
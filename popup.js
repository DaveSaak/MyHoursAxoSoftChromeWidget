$(document).ready(function () {
  // we define and invoke a function

  popup();


});


function popup() {
  //init();

  console.info('init');
  var myHoursLogs = undefined;
  var worklogTypes = undefined;
  var myHoursRepo = new MyHoursRepo.getInstance();
  var axoSoftRepo = new AxoSoftRepo.getInstance();
  var options = new OptionsRepo.getInstance();
  options.load();
  var currentUser = new CurrentUserRepo.getInstance();


  //    init = function () {
  $('#loginButton').click(function () {
    var email = $('#email').val();
    var password = $('#password').val();
    login(email, password);
  });

  $('#copyToAxoSoftButton').click(function () {
    copyTimelogs();
  });

  $('#logOutButton').click(function () {
    currentUser.clear();
    showLoginPage();
  });




  
  

  //currentUser.clear(); //test
  currentUser.load(function () {

    console.info(currentUser);

    if (currentUser.accessToken == undefined) {
      if (currentUser.email != undefined) {
        $('#email').val(currentUser.email);
      }
      console.info('access token is undefined');
      showLoginPage();
    } else {
      MyHoursRepo.accessToken = currentUser.accessToken;
      showMainPage();
    }
  })

  function showLoginPage() {
    $('#mainContainer').hide();
    $('#loginContainer').show();

    var currentUser = new CurrentUserRepo.getInstance();
    if (currentUser.email != undefined) {
      $('input#email').val(currentUser.email);
    }

  }

  function showMainPage() {
    $('#mainContainer').show();
    $('#loginContainer').hide();


    var currentUser = new CurrentUserRepo.getInstance();
    $('#usersName').text(currentUser.name);

    getLogs();
  }


  function getLogs() {

    myHoursRepo.getLogs(moment()).then(
      function (data) {
        myHoursLogs = data;

        var logsContainer = $('#logs');
        logsContainer.empty();


        $.each(data, function (index, data) {

          var log = $('<li>').data('logId', data.id);

          var columns = $('<div>').addClass('columns');
          var columnA = $('<div>').addClass('column is-two-thirds');



          if (data.project != null) {
            var projectInfo = $('<span>').text(data.project.name).addClass('tag is-link');
            columnA.append(projectInfo);
          }


          if (data.task != null) {
            var taskInfo = $('<span>').text(data.task.name).addClass('tag is-warning');
            columnA.append(taskInfo);
          }
          columns.append(columnA);


          var columnB = $('<div>').addClass('column is-one-third');
          if (data.duration != null) {
            var duration = moment().startOf('day').add(data.duration, 'seconds');
            var durationInfo = $('<span>').text(duration.format("HH:mm:ss"));
            columnB.append(durationInfo);
          }
          columns.append(columnB);

          log.append(columns);



          logsContainer.append(log);
        });



      },
      function () {
        console.info('failed to get logs');
        showLoginPage();
      }
    )
  }

  function login(email, password) {
    myHoursRepo.getAccessToken(email, password).then(
      function (token) {
        //var currentUser = new CurrentUserRepo.getInstance();
        currentUser.email = email;
        currentUser.setTokenData(token.accessToken, token.refreshToken);
        currentUser.save();

        myHoursRepo.accessToken = token.accessToken;
        myHoursRepo.getUser().then(function (user) {
          currentUser.setUserData(user.id, user.name);
          currentUser.save();
          showMainPage();
        }, function (err) {
          console.info('error while geeting the user data');
          showLoginPage();
        });

      },
      function (error) {
        console.info('error while geeting the access token');
        showLoginPage();
      }
    )
  }

  function getTimeLogDetails(myHoursLog, workLogTypeId) {
    var itemId = (myHoursLog.project.name
        .match(/\d+\.\d+|\d+\b|\d+(?=\w)/g) || [])
      .map(function (v) {
        return +v;
      }).shift();

    if (itemId != undefined) {
      console.info(itemId);


      axoSoftRepo.getFeatureItemType(itemId).then(function (itemType) {
        console.info(itemType);

        var worklog = new Worklog;
        worklog.user.id = options.axoSoftUserId;
        worklog.work_done.duration = myHoursLog.duration / 60 / 60;
        worklog.item.id = itemId;
        worklog.item.item_type = itemType;
        worklog.work_log_type.id = workLogTypeId;
        worklog.description = myHoursLog.note;
        worklog.date_time = myHoursLog.date;

        console.info(worklog);
      })
    }
  }


  function copyTimelogs() {
    console.info(myHoursLogs);
    axoSoftRepo.getWorkLogTypes().then(
      function (data) {
        console.info(data);
        worklogTypes = data;
        $.each(myHoursLogs, function (index, myHoursLog) {
          if (myHoursLog.project != undefined && myHoursLog.project.name != undefined) {

            if (myHoursLog.task != undefined && myHoursLog.task.name != undefined){
              var workLogType = $.grep(worklogTypes, function(obj){return obj.name.toUpperCase() === myHoursLog.task.name.toUpperCase() })[0];
              if (workLogType != undefined){
                var workLogTypeId = workLogType.Id;
              }
            }
            getTimeLogDetails(myHoursLog, workLogTypeId);
          }
        });
      },
      function () {});
  }
};
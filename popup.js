$(document).ready(function () {
  // we define and invoke a function

  popup();


});


function popup() {
  //init();

  console.info('init');

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

  var myHoursLogs = undefined;
  var worklogTypes = undefined;
  var options = new OptionsRepo.getInstance();
  options.load();


  var currentUser = new CurrentUserRepo.getInstance();

  //currentUser.clear(); //test
  currentUser.load(function () {

    console.info(currentUser);

    if (currentUser.accessToken == undefined) {
      if (currentUser.email != undefined) {
        $('#email').val(currentUser.email);
      }
      showLoginPage();
    } else {
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

/*
  var promise = new Promise(function(resolve, reject) {
    // do a thing, possibly async, then…
  
    if (true) {
      resolve("Stuff worked!");
    }
    else {
      reject(Error("It broke"));
    }
  });

*/
  function getLogs() {
    // var currentUser = new CurrentUserRepo.getInstance();
  

    $.ajax({
      url: "https://api.myhours.com/logs",
      headers: {
        "Authorization": "Bearer " + currentUser.accessToken
      },
      type: "GET",
      data: {
        dateFrom: moment().format("YYYY-MM-DD"),
        dateTo: moment().format("YYYY-MM-DD")
      },

      // statusCode: {
      //   401: function (response) {
      //     console.error('unauthorized');
      //     showLoginPage();
      //   },
      //   403: function (response) {
      //     console.error('forbiden');
      //   }
      // },

      success: function (data) {
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
      error: function (data) {

        //use refresh token
        console.error(data);
        showLoginPage();
      }
    });
  }


  function getCurrentUser(resolve, reject) {
    // var currentUser = new CurrentUserRepo.getInstance();

    console.info("api: getting user data");

    $.ajax({
      url: "https://api.myhours.com/users",
      headers: {
        "Authorization": "Bearer " + currentUser.accessToken
      },
      type: "GET",
      success: function (data) {
        currentUser.setUserData(data.id, data.name);
        currentUser.save();
        resolve();
      },
      error: function (data) {
        console.error(data);
        reject(Error());
      }
    });
  }

  function login(email, password) {
    $.ajax({
      url: "https://api.myhours.com/tokens",
      type: "POST",
      data: {
        clientId: "3d6bdd0e-5ee2-4654-ac53-00e440eed057",
        email: email,
        grantType: "password",
        password: password
      },
      success: function (data) {
        var currentUser = new CurrentUserRepo.getInstance();
        currentUser.email = email;
        currentUser.setTokenData(data.accessToken, data.refreshToken);
        currentUser.save();

        var promise = new Promise(getCurrentUser);
        promise.then(function(result) {
          showMainPage();
        }, function(err) {
          showLoginPage();
        });

        
      },
      error: function (data) {
        console.error(data);
      }
    });

  }


  function getTimeLogDetails(myHoursLogProjectName) {
    var itemId = (myHoursLogProjectName
        .match(/\d+\.\d+|\d+\b|\d+(?=\w)/g) || [])
      .map(function (v) {
        return +v;
      }).shift();

    if (itemId != undefined) {
      console.info(itemId);
      var axoItem = getAxoItem(itemId);
    }
  }

  function copyTimeLog(userId, workDoneInHours, itemId, itemType, itemWorklogTypeId, description, datetime) {

    var worklog = new Worklog;
    worklog.user.id = userId;
    worklog.work_done.duration = workDoneInHours;
    worklog.item.id = itemId;
    worklog.item.item_type = itemType;
    worklog.work_log_type.id = itemWorklogTypeId;
    worklog.description = description;
    worklog.date_time = datetime;

    console.info(worklog);
  }

  function getAxoItem(itemId, successCallback) {
    console.info('getting item from axosoft');
    $.ajax({
      url: options.axoSoftUrl + "/v6/features/" + itemId,
      headers: {
        "Authorization": "Bearer " + options.axoSoftToken
      },
      type: "GET",

      success: function (data) {
        console.info(data);

        console.info(data.item_type);

        if (successCallback != undefined) {
          successCallback();
        }
      },
      error: function (data) {
        return null;
      }
    });
  }

  function copyTimelogs() {
    console.info(myHoursLogs);
    $.ajax({
      url: options.axoSoftUrl + "/v6/picklists/work_log_types",
      headers: {
        "Authorization": "Bearer " + options.axoSoftToken,
        "Access-Control-Allow-Origin": "*"
      },
      type: "GET",
      success: function (data) {
        console.info(data);
        worklogTypes = data;
        $.each(myHoursLogs, function (index, myHoursLog) {
          if (myHoursLog.project != undefined && myHoursLog.project.name != undefined) {
            getTimeLogDetails(myHoursLog.project.name);
          }
        });
      },
      error: function (data) {
        console.error();
      }
    });
  }
};
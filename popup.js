$(document).ready(function(){
  // we define and invoke a function

  popup();


});


function popup() {
  //init();

  console.info('init');

  //    init = function () {
  $('#loginButton').click(function () {
    login();
  });

  $('#copyToAxoSoftButton').click(function () {
    copyTimelogs();
  });



  var logs = undefined;
  var worklogTypes = undefined;


  var currentUser = new CurrentUserRepo.getInstance();

  //currentUser.clear(); //test
  currentUser.load(function () {
    if (currentUser.accessToken == undefined) {
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


  function getLogs() {
    var currentUser = new CurrentUserRepo.getInstance();

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
        logs = data;

        var logsContainer = $('#logs');
        logsContainer.empty();


        $.each(data, function (index, data) {

          var log = $('<li>');

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
      }
    });
  }


  function getCurrentUser(successCallback, errorCallback) {
    var currentUser = new CurrentUserRepo.getInstance();

    console.info("api: getting user data");

    $.ajax({
      url: "https://api.myhours.com/users",
      headers: {
        "Authorization": "Bearer " + currentUser.accessToken
      },
      type: "GET",
      //data: {},

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

        currentUser.setUserData(data.id, data.name);
        currentUser.save();

        // window.curentUserData.userName = data.name;
        // window.curentUserData.userId = data.id;



        //saveCurrentUser();

        if (successCallback != undefined) {
          console.info("executing getCurrentUser callback")
          successCallback();
        }

      },
      error: function (data) {
        console.error(data);

        if (errorCallback != undefined) {
          errorCallback();
        }

      }
    });
  }

  function login() {
    var email = $('#email').val();
    $.ajax({
      url: "https://api.myhours.com/tokens",
      type: "POST",
      data: {
        clientId: "3d6bdd0e-5ee2-4654-ac53-00e440eed057",
        email: email,
        grantType: "password",
        password: $('#password').val()
      },
      success: function (data) {
        // window.curentUserData.accessToken = data.accessToken;
        // window.curentUserData.refreshToken = data.refreshToken;

        var currentUser = new CurrentUserRepo.getInstance();
        currentUser.email = email;
        currentUser.setTokenData(data.accessToken, data.reefreshToken);
        currentUser.save();

        getCurrentUser(showMainPage);
      },
      error: function (data) {
        console.error(data);
      }
    });

  }


  function getTimeLogDetails(timeLogProjectName){
    var itemIdMatch = tesst.match(/^[0-9]/);
    console.info(itemIdMatch);

    if (itemIdMatch.length > 0 ){

      var itemId = itemIdMatch[1];
      console.info(itemId);
  
      var axoItem = getAxoItem(itemId);
    }
  }

  function copyTimeLog(userId, workDoneInHours, itemId, itemType, itemWorklogTypeId, description, datetime){

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



  function getAxoItem(itemId, successCallback){

    $.ajax({
      url: options.axoSoftUrl + "/v6/features/" + itemId, 
      headers: {
        "Authorization": "Bearer " + options.axoSoftToken
      },
      type: "GET",

      success: function (data) {
        console.info(data);
        successCallback();        
      },
      error: function (data) {
        return null;
      }
    });
  }


  function copyTimelogs() {

    console.info(logs);

    var options = new OptionsRepo.getInstance();
    options.load(
    
    function () {

      //get worklog types
      //var currentUser = new CurrentUserRepo.getInstance();
      $.ajax({
        url: options.axoSoftUrl + "/v6/picklists/work_log_types", 
        headers: {
          "Authorization": "Bearer " + options.axoSoftToken,
          "Access-Control-Allow-Origin" : "*"
        },
        type: "GET",


        success: function (data) {
          console.info(data);

          worklogTypes = data;

          $.each(logs, function (index, logs) {

            getTimeLogDetails(logs[index].Project.Name);






          });





        },
        error: function (data) {
          console.error();
        }
      });

      
    });
  }
};
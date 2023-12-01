$(function () {
    'use strict';
    console.info('init options page');

    toastr.options = {
        "closeButton": true,
        "timeOut": "4000",
      } 

    var _this = this;
    _this.options = new Options();


    $('#useDevOps').click(_ => {
        toggleAxoSection();
    })

      kofiWidgetOverlay.draw('davidsakelsek', {
        'type': 'floating-chat',
        'floating-chat.donateButton.text': 'Support me',
        'floating-chat.donateButton.background-color': '#3c5081',
        'floating-chat.donateButton.text-color': '#fff'
      });

    _this.options
        .load()
        .then(function () {
            $('#useDevOps').prop( "checked", _this.options.useDevOps);

            $('#axoSoftUrl').val(_this.options.axoSoftUrl);
            $('#axoSoftToken').val(_this.options.axoSoftToken);
            $('#axoSoftUserId').val(_this.options.axoSoftUserId);
            $('#axoSoftDefaultWorklogTypeId').val(_this.options.axoSoftDefaultWorklogTypeId);
            $('#axoSoftRecentItemsBubbleChartHiddenItemsIds').val(_this.options.axoSoftRecentItemsBubbleChartHiddenItemsIds);
            
            $('#contentSwitchProjectId').val(_this.options.contentSwitchProjectId);
            $('#developmentTaskName').val(_this.options.developmentTaskName);
            $('#contentSwitchZoneReEnterTime').val(_this.options.contentSwitchZoneReEnterTime);
            
            $('#ahUrl').val(_this.options.allHoursUrl);
            $('#ahUserName').val(_this.options.allHoursUserName);
            
            $('#isSecret').val(_this.options.isSecret);
            
            $('#devOpsInstanceUrl').val(_this.options.devOpsInstanceUrl);
            $('#devOpsPersonalAccessToken').val(_this.options.devOpsPersonalAccessToken);
            $('#devOpsAuthorName').val(_this.options.devOpsAuthorName);
            $('#devOpsUserId').val(_this.options.devOpsUserId);
            $('#devOpsPullRequestRepos').val(_this.options.devOpsPullRequestRepos);
            $('#devOpsPullRequestMyReviewerGroups').val(_this.options.devOpsPullRequestMyReviewerGroups);
            
            $('#mhCommonDescriptions').val(_this.options.myHoursCommonDescriptions);
            $('#myHoursDistractionComment').val(_this.options.myHoursDistractionComment);
            
            $('#notificationsBadRatio').prop( "checked", _this.options.notificationsBadRatio);
            $('#recentItemsBubbleChartHiddenItemsIds').val(_this.options.recentItemsBubbleChartHiddenItemsIds);

            $('#reloadMyHoursDistractionsTasksButton').click(_ => { populateMyHoursDistractionTasks() });

            $('#extraTravelReimbursementDistance').val(_this.options.extraTravelReimbursementDistance);
            $('#extraTravelReimbursementKmCost').val(_this.options.extraTravelReimbursementKmCost);
            $('#extraShowGaps').prop('checked', _this.options.extraShowGaps);
            $('#extraGapsMinLength').val(_this.options.extraGapsMinLength);



            _this.currentUser = new CurrentUser();
            _this.axoSoftApi = new AxoSoftApi(_this.options);
            _this.allHoursApi = new AllHoursApi(_this.options);
            _this.myHoursApi = new MyHoursApi(_this.currentUser);
            _this.devOpsApi = new DevOpsApi(_this.options);

            _this.devOpsApi.getMyRepositoriesAsync().then(repos => {
                repos.value.forEach(repo => {
                    $('#devops-repos')
                        .append(`<li class='d-flex'>
                            <div for="devops-repo-${repo.id}"> 
                                ${repo.name}
                            </div>
                            <div class='ml-auto'>
                                <small class='text-muted'>
                                    ${repo.id}
                                </small>
                            </div>
                        </li>`);
                })
            });

            _this.axoSoftApi.getUsers().then(function (users) {
                users = _.sortBy(users, function (u) {
                    return u.full_name;
                });
                var $select = $("#axoSoftUserId");
                $(users).each(function (i, user) {
                    if (user.is_active === true) {
                        $select.append($("<option>", {
                            value: user.id,
                            html: user.full_name //+ ' -- ' + user.id
                        }));
                    }
                });
                $select.val(_this.options.axoSoftUserId);
            });

            // AXO
            toggleAxoSection();

            // AXO Worklogs
            _this.axoSoftApi.getWorkLogTypes().then(function (workLogTypes) {
                workLogTypes = _.sortBy(workLogTypes, function (o) {
                    return o.name;
                });
                var $select = $("#axoSoftDefaultWorklogTypeId");
                $(workLogTypes).each(function (i, workLogType) {
                    $select.append($("<option>", {
                        value: workLogType.id,
                        html: workLogType.name
                    }));
                });
                $select.val(_this.options.axoSoftDefaultWorklogTypeId);
            });

            // MH 
            _this.currentUser.load(x => {
                $('#mhUserName').val(_this.currentUser.email);

                _this.myHoursApi.getTags().then(function (tags) {
                    var select = $("#mhDefaultTagId");
                    $(tags).each(function (i, tag) {
                        select.append($("<option>", {
                            value: tag.id,
                            html: tag.name
                        }));
                    });
                    select.val(_this.options.myHoursDefaultTagId);                
                });

                _this.myHoursApi.getProjectsAsync().then(projects => {
                    var select = $("#myHoursCommonProjectId");
                    projects.forEach(project => {
                        select.append($("<option>", {
                            value: project.id,
                            html: project.name
                        }));
                    });
                    select.val(_this.options.myHoursCommonProjectId); 
                    populateMyHoursDistractionTasks();
                });


                

                // if (_this.options.myHoursCommonProjectId) {
                //     _this.myHoursApi.getProjectTaskList(_this.options.myHoursCommonProjectId).then(projectTasks => {
                //         var select = $("#myHoursDistractionTaskId");
                //         projectTasks.forEach(projectTask => {
                //             select.append($("<option>", {
                //                 value: projectTask.taskId,
                //                 html: projectTask.projectName + ' / ' + projectTask.taskName
                //             }));
                //         });
                //         select.val(_this.options.myHoursDistractionTaskId);                     
                //     })
                // }

            });

            console.group('all hours token');
            console.log(_this.options.allHoursAccessTokenValidTill)
            console.groupEnd();


            //check ah token.
            if (_this.options.allHoursAccessTokenValidTill) {
                let allHoursTokenIsExpired = moment().isAfter(moment(_this.options.allHoursAccessTokenValidTill));
                if (allHoursTokenIsExpired) {
                    setAllHoursAccessTokenStyle('alert-danger').text("Sign in. Your access token expired on " + moment(_this.options.allHoursAccessTokenValidTill).format('LLL') + ".");
                }
                else {
                    setAllHoursAccessTokenStyle('alert-primary').text("Your access will expire on " + moment(_this.options.allHoursAccessTokenValidTill).format('LLL'));
                }
            }

        });

    $('input#ahPassword').keyup(function (e) {
        if (e.keyCode == 13) {
            loginToAllHours();
        }
    });

    $('.saveButton').click(function () {
        _this.options.allHoursUrl = $('#ahUrl').val();
        _this.options.allHoursUserName = $('#ahUserName').val();
        _this.options.isSecret = $('#isSecret').val();
        saveOptions().then(
            function(x){
                toastr.success('Settings saved');
            },
            function(err){
                toastr.error('Error saving Settings.');
            }
        );
    });

    $('#saveGeneral').click(function () {
        _this.options.useDevOps = $('#useDevOps').prop('checked');
        _this.options.notificationsBadRatio = $('#notificationsBadRatio').prop( "checked");
        _this.options.recentItemsBubbleChartHiddenItemsIds = $('#recentItemsBubbleChartHiddenItemsIds').val();
        saveOptions().then(
            function(x){
                toastr.success('General settings saved');
            },
            function(err){
                toastr.error('Error saving General settings.');
            }
        );
    });      

    $('#saveAllHoursButton').click(function () {
        _this.options.allHoursUrl = $('#ahUrl').val();
        _this.options.allHoursUserName = $('#ahUserName').val();
        _this.options.isSecret = $('#isSecret').val();
        saveOptions().then(
            function(x){
                toastr.success('All Hours settings saved');
            },
            function(err){
                toastr.error('Error saving All Hours settings.');
            }
        );
    });    

    $('#saveAxoButton').click(function () {
        _this.options.axoSoftUrl = $('#axoSoftUrl').val();
        _this.options.axoSoftToken = $('#axoSoftToken').val();
        _this.options.axoSoftUserId = $('#axoSoftUserId').val();
        _this.options.axoSoftDefaultWorklogTypeId = $('#axoSoftDefaultWorklogTypeId').val();
        _this.options.axoSoftRecentItemsBubbleChartHiddenItemsIds = $('#axoSoftRecentItemsBubbleChartHiddenItemsIds').val();
        saveOptions();
        toastr.success('Axo settings saved');
    });   
    
    $('#saveMhButton').click(function () {
        _this.options.myHoursDefaultTagId = $('#mhDefaultTagId').val();
        _this.options.myHoursCommonProjectId = $('#myHoursCommonProjectId').val();
        _this.options.myHoursCommonDescriptions = $('#mhCommonDescriptions').val();
        _this.options.myHoursDistractionTaskId = $('#myHoursDistractionTaskId').val();
        _this.options.myHoursDistractionComment = $('#myHoursDistractionComment').val();
        saveOptions().then(
            function(x){
                toastr.success('My Hours settings saved');
            },
            function(err){
                toastr.error('Error saving My Hours settings.');
            }
        );
    });     

    $('#saveDevOpsButton').click(function () {
        _this.options.devOpsInstanceUrl = $('#devOpsInstanceUrl').val();
        _this.options.devOpsPersonalAccessToken = $('#devOpsPersonalAccessToken').val();
        _this.options.devOpsAuthorName = $('#devOpsAuthorName').val();
        _this.options.devOpsUserId = $('#devOpsUserId').val();
        _this.options.devOpsPullRequestRepos = $('#devOpsPullRequestRepos').val();
        _this.options.devOpsPullRequestMyReviewerGroups = $('#devOpsPullRequestMyReviewerGroups').val();
        saveOptions().then(
            function(x){
                toastr.success('DevOps settings saved');
            },
            function(err){
                toastr.error('Error saving DevOps settings.');
            }
        );
    });    

    $('#saveExtrasButton').click(function () {
        _this.options.extraTravelReimbursementDistance = $('#extraTravelReimbursementDistance').val();
        _this.options.extraTravelReimbursementKmCost = $('#extraTravelReimbursementKmCost').val();
        _this.options.extraShowGaps = $('#extraShowGaps').prop('checked');
        _this.options.extraGapsMinLength = $('#extraGapsMinLength').val();
        saveOptions().then(
            function(x){
                toastr.success('Extra settings saved');
            },
            function(err){
                toastr.error('Error saving Extra settings.');
            }
        );
        
    });   

    $('#clearUserButton').click(x => {
        let currentUser = new CurrentUser();
        currentUser.clear();
        toastr.success('User data was cleared. You will need to login.');
    });

    $('#loginToAllHours').click(function () {
        loginToAllHours();
    });

    $('#loginToMyHours').click(function () {
        let loginToMyHoursInfo = $('#loginToMyHoursInfo');
        loginToMyHoursInfo.text('logging in...');

        let email = $('#mhUserName').val();
        let password = $('#mhPassword').val();
        _this.myHoursApi.getAccessToken(email, password).then(
            function (token) {
                _this.currentUser.email = email;
                _this.currentUser.setTokenData(token.accessToken, token.refreshToken);
                _this.currentUser.save();

                _this.myHoursApi.getUser().then(function (user) {
                    _this.currentUser.setUserData(user.id, user.name);
                    _this.currentUser.save();
                    toastr.success('You are now logged into your My Hours account.');
                }, function (err) {
                    console.info('error while geeting the user data');
                    toastr.error('Error while getting the user data.');
                });

                loginToMyHoursInfo.text('success');

            },
            function (error) {
                console.info('error while geeting the access token');
                toastr.error('Error logging in.');
                loginToMyHoursInfo.text('fail');
            }
        )
    })

    function populateMyHoursDistractionTasks(){
        const project = $("#myHoursCommonProjectId").val();

        if (project) {
            // if (_this.options.myHoursCommonProjectId) {
                _this.myHoursApi.getProjectTaskList(project).then(projectTasks => {
                    var select = $("#myHoursDistractionTaskId");
                    select.empty();

                    projectTasks[0].incompletedTasks.forEach(projectTask => {
                        select.append($("<option>", {
                            value: projectTask.id,
                            html: projectTask.name
                        }));
                    });
                    select.val(_this.options.myHoursDistractionTaskId);                     
                })
            // }  
        }      
    }


    function loginToAllHours() {
        _this.allHoursApi.getAccessToken(
            $('#ahUserName').val(),
            $('#ahPassword').val()
        ).then(function (data) {
            console.log(data);
            setAllHoursAccessTokenStyle().addClass('alert-success').text("All Good. Token retrieved.");
            _this.options.allHoursAccessToken = data.access_token;
            _this.options.allHoursRefreshToken = data.refresh_token;
            _this.options.allHoursAccessTokenValidTill = moment().add(data.expires_in, 'seconds').toString();

            console.group('all hours token');
            console.log('expires in (seconds): ' + data.expires_in);
            console.log('valid till: ' + _this.options.allHoursAccessTokenValidTill);
            console.groupEnd();

            _this.allHoursApi.setAccessToken(data.access_token);
            _this.allHoursApi.getCurrentUserName().then(
                function (data) {
                    console.log(data);
                    setAllHoursAccessTokenStyle('alert-success').text("Hi " + data + ". Your access token will expire at " + moment(_this.options.allHoursAccessTokenValidTill).format('LLL'));
                    saveOptions();
                },
                function (err) { }
            );
        },
            function (err) {
                setAllHoursAccessTokenStyle('alert-danger').text(err.message);
                console.info('error while geeting token');
                console.error(err);
            }
        );
    }

    // function saveOptions() {
    //     _this.options.save().then(function (x) {
    //         console.log(x);

    //     });
    // }

    function saveOptions() {
        return _this.options.save();
    }

    function setAllHoursAccessTokenStyle(style) {
        return $('#ahAccessToken').removeClass('alert-primary').removeClass('alert-danger').addClass(style);
    }

    function toggleAxoSection(){
        if ($('#useDevOps').prop('checked')) {
            $('#axo-section').hide();
            $('#devops-section').show();
        } else {
            $('#axo-section').show();
            $('#devops-section').hide();
        }
    }
});
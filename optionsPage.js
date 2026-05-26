$(function () {
    'use strict';
    console.info('init options page');

    toastr.options = {
        "closeButton": true,
        "timeOut": "4000",
      } 

    var _this = this;
    _this.options = new Options();


    // $('#useDevOps').click(_ => {
    //     toggleAxoSection();
    // })

      kofiWidgetOverlay.draw('davidsakelsek', {
        'type': 'floating-chat',
        'floating-chat.donateButton.text': 'Support me',
        'floating-chat.donateButton.background-color': '#3c5081',
        'floating-chat.donateButton.text-color': '#fff'
      });

    _this.options
        .load()
        .then(function () {
            // $('#useDevOps').prop( "checked", _this.options.useDevOps);
            
            // $('#contentSwitchProjectId').val(_this.options.contentSwitchProjectId);
            // $('#developmentTaskName').val(_this.options.developmentTaskName);
            // $('#contentSwitchZoneReEnterTime').val(_this.options.contentSwitchZoneReEnterTime);
            
            // $('#ahUrl').val(_this.options.allHoursUrl);
            // $('#ahUserName').val(_this.options.allHoursUserName);
            
            // $('#isSecret').val(_this.options.isSecret);
            
            // $('#devOpsInstanceUrl').val(_this.options.devOpsInstanceUrl);
            // $('#devOpsPersonalAccessToken').val(_this.options.devOpsPersonalAccessToken);
            // $('#devOpsAuthorName').val(_this.options.devOpsAuthorName);
            // $('#devOpsUserId').val(_this.options.devOpsUserId);
            // $('#devOpsPullRequestRepos').val(_this.options.devOpsPullRequestRepos);
            // $('#devOpsPullRequestMyReviewerGroups').val(_this.options.devOpsPullRequestMyReviewerGroups);
            
            // Set active theme tile
            $('.theme-tile').removeClass('active');
            $(`.theme-tile[data-theme="${_this.options.theme}"]`).addClass('active');
            
            $('#mhCommonDescriptions').val(_this.options.myHoursCommonDescriptions);
            $('#myHoursDistractionComment').val(_this.options.myHoursDistractionComment);
            
            $('#notificationsBadRatio').prop( "checked", _this.options.notificationsBadRatio);
            $('#recentItemsBubbleChartHiddenItemsIds').val(_this.options.recentItemsBubbleChartHiddenItemsIds);

            $('#reloadMyHoursDistractionsTasksButton').click(_ => { populateMyHoursDistractionTasks() });


            $('#kaboomDefinitions').val(JSON.stringify(_this.options.kaboomDefinitions, null, 2));


            fetch(chrome.runtime.getURL("settings.json"))
                .then(response => response.json())
                .then(data => {
                    console.log("JSON Data:", data);
                })
                .catch(error => console.error("Error loading JSON:", error));

            



            _this.currentUser = new CurrentUser();
            _this.allHoursApi = new AllHoursApi(_this.options);
            _this.myHoursApi = new MyHoursApi(_this.currentUser, _this.options.platforms.myHours.apiUri, _this.options.platforms.myHours.pat);
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

            // MH 
            _this.currentUser.load(x => {
                $('#mhUserName').val(_this.currentUser.email);
            });

            toggleAxoSection();

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
                    setAllHoursAccessTokenStyle('alert-primary').text("Your AH api access will expire on " + moment(_this.options.allHoursAccessTokenValidTill).format('LLL') + ". It will autorenew in the background thile the refresh token is valid.");
                }
            }

        });

    // Theme tile selection
    $('.theme-tile').click(function () {
        const selectedTheme = $(this).attr('data-theme');
        const selectedThemeName = $(this).find('.theme-tile-label').text().trim() || selectedTheme;

        if (_this.options.theme === selectedTheme) {
            return;
        }

        $('.theme-tile').removeClass('active');
        $(this).addClass('active');

        _this.options.theme = selectedTheme;
        saveOptions().then(
            function () {
                toastr.success(`Theme saved: ${selectedThemeName}`);
            },
            function () {
                toastr.error('Error saving Theme.');
            }
        );
    });

    $('input#ahPassword').keyup(function (e) {
        if (e.keyCode == 13) {
            loginToAllHours($('#ahPassword').val());
        }
    });

    $('.saveButton').click(function () {
        // _this.options.allHoursUrl = $('#ahUrl').val();
        // _this.options.allHoursUserName = $('#ahUserName').val();
        // _this.options.isSecret = $('#isSecret').val();
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
        // _this.options.useDevOps = $('#useDevOps').prop('checked');
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
        // _this.options.allHoursUrl = $('#ahUrl').val();
        // _this.options.allHoursUserName = $('#ahUserName').val();
        // _this.options.isSecret = $('#isSecret').val();
        saveOptions().then(
            function(x){
                toastr.success('All Hours settings saved');
            },
            function(err){
                toastr.error('Error saving All Hours settings.');
            }
        );
    });    
    
    $('#saveMhButton').click(function () {
        // _this.options.myHoursDefaultTagId = $('#mhDefaultTagId').val();
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
        // _this.options.devOpsInstanceUrl = $('#devOpsInstanceUrl').val();
        // _this.options.devOpsPersonalAccessToken = $('#devOpsPersonalAccessToken').val();
        // _this.options.devOpsAuthorName = $('#devOpsAuthorName').val();
        // _this.options.devOpsUserId = $('#devOpsUserId').val();
        // _this.options.devOpsPullRequestRepos = $('#devOpsPullRequestRepos').val();
        // _this.options.devOpsPullRequestMyReviewerGroups = $('#devOpsPullRequestMyReviewerGroups').val();
        saveOptions().then(
            function(x){
                toastr.success('DevOps settings saved');
            },
            function(err){
                toastr.error('Error saving DevOps settings.');
            }
        );
    });    

    $('#saveKaboomButton').click(function () {
        _this.options.kaboomDefinitions = JSON.parse($('#kaboomDefinitions').val());
        saveOptions().then(
            function(x){
                toastr.success('Kaboom settings saved');
            },
            function(err){
                toastr.error('Error saving Kaboom settings.');
            }
        );
    });


    $('#clearUserButton').click(x => {
        let currentUser = new CurrentUser();
        currentUser.clear();
        toastr.success('User data was cleared. You will need to login.');
    });

    $('#authorizeSpica').click(function () {
        loginToAllHours(_this.options.platforms.spica.userName, $('#spicaPassword').val());
    });

    $('#loginToAllHours').click(function () {
        loginToAllHours($('#ahPassword').val());
    });


    function loginToAllHours(username, password) {
        _this.allHoursApi.getAccessToken(
            username,
            password
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
                    toastr.success('You  have obtained All Hours token.');
                    console.log(data);
                    setAllHoursAccessTokenStyle('alert-success').text("Hi " + data + ". Your All Hours access token will expire at " + moment(_this.options.allHoursAccessTokenValidTill).format('LLL'));
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

    function saveOptions() {
        return _this.options.save().then(function (x) {
            console.log(x);
            return x;

        });
    }

    // function saveOptions() {
    //     return _this.options.save();
    // }

    function setAllHoursAccessTokenStyle(style) {
        return $('#ahAccessToken').removeClass('alert-primary').removeClass('alert-danger').addClass(style);
    }


    function toggleAxoSection(){
        if (_this.options?.platforms?.devops?.enabled) {
            // $('#axo-section').hide();
            $('#devops-section').show();
        } else {
            // $('#axo-section').show();
            $('#devops-section').hide();
        }
    }
});
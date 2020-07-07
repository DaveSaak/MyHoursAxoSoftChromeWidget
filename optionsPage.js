$(function () {
    'use strict';
    console.info('init options page');
    var _this = this;
    _this.options = new Options();

    _this.options
        .load()
        .then(function () {
            $('#axoSoftUrl').val(_this.options.axoSoftUrl);
            $('#axoSoftToken').val(_this.options.axoSoftToken);
            $('#axoSoftUserId').val(_this.options.axoSoftUserId);
            $('#axoSoftDefaultWorklogTypeId').val(_this.options.axoSoftDefaultWorklogTypeId);
            $('#contentSwitchProjectId').val(_this.options.contentSwitchProjectId);
            $('#developmentTaskName').val(_this.options.developmentTaskName);
            $('#contentSwitchZoneReEnterTime').val(_this.options.contentSwitchZoneReEnterTime);
            $('#ahUrl').val(_this.options.allHoursUrl);
            $('#ahUserName').val(_this.options.allHoursUserName);

            _this.axoSoftApi = new AxoSoftApi(_this.options);
            _this.allHoursApi = new AllHoursApi(_this.options);

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

            console.group('all hours token');
            console.log(_this.options.allHoursAccessTokenValidTill)
            console.groupEnd();


            //check ah token.
            if (_this.options.allHoursAccessTokenValidTill){
                let allHoursTokenIsExpired = moment().isAfter(moment(_this.options.allHoursAccessTokenValidTill));
                if (allHoursTokenIsExpired){
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
        _this.options.axoSoftUrl = $('#axoSoftUrl').val();
        _this.options.axoSoftToken = $('#axoSoftToken').val();
        _this.options.axoSoftUserId = $('#axoSoftUserId').val();
        _this.options.axoSoftDefaultWorklogTypeId = $('#axoSoftDefaultWorklogTypeId').val();
        _this.options.contentSwitchProjectId = $('#contentSwitchProjectId').val();
        _this.options.developmentTaskName = $('#developmentTaskName').val();
        _this.options.contentSwitchZoneReEnterTime = $('#contentSwitchZoneReEnterTime').val();
        _this.options.allHoursUrl = $('#ahUrl').val();
        _this.options.allHoursUserName = $('#ahUserName').val();
        

        saveOptions();

        // _this.options.save().then(function () {
        //     var notificationOptions = {
        //         type: 'basic',
        //         iconUrl: 'logo.png',
        //         title: 'Options saved',
        //         message: 'Options have been saved.'
        //     };
        //     //chrome.notifications.create('optionsSaved', notificationOptions);
        //     chrome.notifications.create('optionsSaved', notificationOptions, function () { });
        // });
    });

    $('#loginToAllHours').click(function () {
        //loginToAllHours();
        loginToLevelZero();
    });


    function loginToLevelZero(){

        function generateCodeVerifier() {
            return generateRandomString(64)
        }
        function generateRandomString(length) {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
            for (var i = 0; i < length; i++) {
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            return text;
        }
        function generateCodeChallenge(code_verifier) {
            return base64URL(CryptoJS.SHA256(code_verifier))
        }

        function base64URL(string) {
            return string.toString(CryptoJS.enc.Base64).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
        }        

        /*
        //const redirectURL = chrome.identity.getRedirectURL();
        //const redirectURL = chrome.identity.getRedirectURL('oauth2');
        const redirectURL = 'https://allhoursproduction-portal.azurewebsites.net';
        const returnURL = '/callback';
        const clientID = "pkce_client";  
        const scopes = ["openid", "api", "profile", "offline_access"];
        let authURL = "https://login.allhours.com/Account/Login";
        authURL += `?client_id=${clientID}`;
        authURL += `&response_type=code`;
        authURL += `&redirect_uri=${encodeURIComponent(redirectURL)}`;
        authURL += `&scope=${encodeURIComponent(scopes.join(' '))}`;  
        authURL += `&code_challenge=-4_qwlxvSgC5vuEwwi06ec2vCMUc7CY-GFq_xI4FaHI`;
        authURL += `&code_challenge_method=S256`;   
        authURL += `&state=S3Z1N1MyaXNOLmcxa0d3c1Y2Wm1VaWJOTjM3bmh1ZzF3ZC1NZjJvaU8uZDhp`;
        authURL += `&ReturnUrl=${encodeURIComponent(returnURL)}`;
        //authURL += `&returnUrl=${encodeURIComponent(redirectURL)}`;  
        */
       
        //let authURL=`https://login.allhours.com/Account/Login?ReturnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fresponse_type%3Dcode%26client_id%3Dpkce_client%26state%3DR0dRYV9oYUw3ZUljNHVvemJjcnllLXprazNIeHNyQkZZeWxWdUNDdWowZGdE%26redirect_uri%3Dhttps%253A%252F%252Fallhoursproduction-portal.azurewebsites.net%252Fauth-callback%26scope%3Dopenid%2520profile%2520api%2520offline_access%26code_challenge%3DN3XhYBcljXrCHE2xjfkIY1lFYmPytkZ4PjWV-Ng9q40%26code_challenge_method%3DS256`;
        const redirectURL = chrome.identity.getRedirectURL();
        console.log(redirectURL);
        //let authURL=`https://login.allhours.com`;
        //let authURL=`https://spicaidentityserverdevelopment.azurewebsites.net`;
        //authURL +=`/Account/Login?ReturnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fresponse_type%3Dcode%26client_id%3Dpkce_client%26state%3DR0dRYV9oYUw3ZUljNHVvemJjcnllLXprazNIeHNyQkZZeWxWdUNDdWowZGdE%26scope%3Dopenid%2520profile%2520api%2520offline_access%26code_challenge%3DN3XhYBcljXrCHE2xjfkIY1lFYmPytkZ4PjWV-Ng9q40%26code_challenge_method%3DS256`;
        //authURL += `%26redirect_uri%3Dhttps%253A%252F%252Fallhoursproduction-portal.azurewebsites.net%252Fauth-callback`;
        //authURL += `%26redirect_uri%3Dhttps%253A%252F%252Fejfeamnngdpogapmijokhbomdldkebcd.chromiumapp.org%252Fauth-callback`;
        //let authURL=`https://spicaidentityserverdevelopment.azurewebsites.net/Account/Login?ReturnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fresponse_type%3Dcode%26client_id%3Dpkce_client%26state%3DcFYycX4uNW5RRXNvc2VIX0Z-TzJleng5NS5qd1l5WktscHBmaWdNbldGdjJq%26redirect_uri%3Dhttps%253A%252F%252Fahdevelopment-portal.azurewebsites.net%252signin-oidc%26scope%3Dopenid%2520profile%2520api%2520offline_access%26code_challenge%3DtiR-1J1ipd_dJSu5LgMrQFJX4LKolnr6RaZk15HYouI%26code_challenge_method%3DS256`;

        //let authURL=`https://spicaidentityserverdevelopment.azurewebsites.net/Account/Login?ReturnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fresponse_type%3Dcode%26client_id%3Dpkce_client%26state%3Da0ZQR1VYT2FKbmkxQnRZbWkxZDBacVB5dXNfaUdDd0czbV9ZUjFhb0ZxbFBZ%26redirect_uri%3Dhttps%253A%252F%252Fejfeamnngdpogapmijokhbomdldkebcd.chromiumapp.org%26scope%3Dopenid%2520profile%2520api%2520offline_access%26code_challenge%3Dl41OYo2HzHCVMUZ44-2y7KugYUh8uqQ6PFUu2DBtLjU%26code_challenge_method%3DS256`;
        
        
        let codeVerifier = generateCodeVerifier();
        let codeChallenge = generateCodeChallenge(codeVerifier);
        let codeChallengeMethod="S256";
        
        
        // let codeChallenge="l41OYo2HzHCVMUZ44-2y7KugYUh8uqQ6PFUu2DBtLjU";
        
        let authURL=`https://spicaidentityserverdevelopment.azurewebsites.net/Account/Login?ReturnUrl=%2Fconnect%2Fauthorize%2Fcallback%3Fresponse_type%3Dcode%26client_id%3Dpkce_client%26state%3Da0ZQR1VYT2FKbmkxQnRZbWkxZDBacVB5dXNfaUdDd0czbV9ZUjFhb0ZxbFBZ%26redirect_uri%3Dhttps%253A%252F%252Fejfeamnngdpogapmijokhbomdldkebcd.chromiumapp.org%26scope%3Dopenid%2520profile%2520api%2520offline_access`;
        authURL += encodeURIComponent('&code_challenge='+codeChallenge);
        authURL += encodeURIComponent('&code_challenge_method='+codeChallengeMethod);

        console.log(authURL);

        let options = {
            url: authURL,
            interactive: true
        };


        chrome.identity.launchWebAuthFlow(options, function(redirectUri) {

            if (chrome.runtime.lastError) {
                console.log('error');
                console.log(chrome.runtime.lastError.message);
                return;
            }


            console.log('redirect url: ' + redirectUri);
            let params = getParamsFromUrl(redirectUri)
            console.log(params);

            let code = params['code'];
            console.log(code);

            _this.allHoursApi.getAccessTokenUsingCode(code, codeVerifier)
            .then(function (data) {
                console.log(data);
            })
            .catch(error => {
                console.log(error);
            })


        });

    }


    function getParamsFromUrl(url) {
        url = decodeURI(url);
        if (typeof url === 'string') {
            let params = url.split('?');
            let eachParamsArr = params[1].split('&');
            let obj = {};
            if (eachParamsArr && eachParamsArr.length) {
                eachParamsArr.map(param => {
                    let keyValuePair = param.split('=')
                    let key = keyValuePair[0];
                    let value = keyValuePair[1];
                    obj[key] = value;
                })
            }
            return obj;
        }  
    }  

    function loginToAllHours(){
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

    function saveOptions() {
        _this.options.save().then(function () {
            var notificationOptions = {
                type: 'basic',
                iconUrl: 'logo.png',
                title: 'Options saved',
                message: 'Options have been saved.'
            };
            //chrome.notifications.create('optionsSaved', notificationOptions);
            chrome.notifications.create('optionsSaved', notificationOptions, function () { });
        });
    }

    function setAllHoursAccessTokenStyle(style){
        return $('#ahAccessToken').removeClass('alert-primary').removeClass('alert-danger').addClass(style);
    }

});
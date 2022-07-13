'use strict'

function DevOpsApi(options) {
    var _this = this;
    _this.options = options;
    _this.ajaxHeaders = {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(":" + _this.options.devOpsPersonalAccessToken)
    };

/*
    _this.getMyItemsIds = function () {
        return new Promise(function (resolve, reject) {
            console.info('getting my items from devops');

            var queryData =
            {
                query:
                    "Select [System.Id], [System.Title], [System.State], [System.AssignedTo] " +
                    "From WorkItems " +
                    "Where ([System.WorkItemType] = 'Task' OR [System.WorkItemType] = 'Bug')  AND [State] <> 'Closed' AND [State] <> 'Removed' AND [System.AssignedTo] = @Me " +
                    "order by [Microsoft.VSTS.Common.Priority] asc, [System.CreatedDate] desc"
            }

            $.ajax({
                url: _this.options.devOpsInstanceUrl + "/_apis/wit/wiql?api-version=4.1",
                headers: _this.ajaxHeaders,
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(queryData),

                success: function (response) {
                    resolve(response);
                },
                error: function () {
                    reject();
                }
            });
        })
    }
  */  

    _this.getMyItemsIdsAsync = async function () {

        console.info('getting my items from devops');
        const url = _this.options.devOpsInstanceUrl + "/_apis/wit/wiql?api-version=4.1";
        const queryData =
        {
            query:
                "Select [System.Id], [System.Title], [System.State], [System.AssignedTo] " +
                "From WorkItems " +
                "Where ([System.WorkItemType] = 'Task' OR [System.WorkItemType] = 'Bug')  AND [State] <> 'Closed' AND [State] <> 'Removed' AND [System.AssignedTo] = @Me " +
                "order by [Microsoft.VSTS.Common.Priority] asc, [System.CreatedDate] desc"
        };

        const response = await fetch(url, {
            headers: _this.ajaxHeaders,
            method: 'POST',
            body: JSON.stringify(queryData)
        });

        return response.json();     
    }    

    /*
    _this.getItems = function (ids) {
        return new Promise(function (resolve, reject) {
            console.info('getting items from devops');
            $.ajax({
                url: _this.options.devOpsInstanceUrl + "/_apis/wit/workitems?ids=" + ids + "&fields=System.Id,System.Title,System.WorkItemType&api-version=6.0",
                // url: _this.options.devOpsInstanceUrl + "/AgileProject/_apis/wit/workitems?ids=" + ids + "&fields=System.Id,System.Title,System.WorkItemType&api-version=6.0",
                // url: devOpsUri + "/_apis/wit/workitems?ids=" + ids + "&fields=System.Id,System.Title,System.WorkItemType&api-version=6.0",
                headers: {
                    "Authorization": "Basic " + btoa(":" + _this.options.devOpsPersonalAccessToken)
                },
                // headers:  {"Authorization": "Basic " + btoa(":" + pat)},
                type: "GET",

                success: function (response) {
                    resolve(response);
                },
                error: function () {
                    reject();
                }
            });
        })
    }
    */

    _this.getItemsAsync = async function (ids) {
        console.info('getting items from devops');
        const url = _this.options.devOpsInstanceUrl + "/_apis/wit/workitems?ids=" + ids + "&fields=System.Id,System.Title,System.WorkItemType&api-version=6.0";
        const response = await fetch(url, {
            headers: _this.ajaxHeaders
        });
        return response.json();        
    }

    _this.getItemAsync = async function (id) {
        console.info('getting item from devops');
        const url = _this.options.devOpsInstanceUrl + "/_apis/wit/workitems/" + id;
        const response = await fetch(url, {
            headers: _this.ajaxHeaders,
        });
        return response.json();  
    }    

/*
    _this.getItem = function () {
        return new Promise(function (resolve, reject) {
            console.info('getting my items from devops');
            $.ajax({
                url: _this.options.devOpsInstanceUrl + "/AgileProject/_apis/wit/workitems/26?api-version=6.0",
                headers: {
                    "Authorization": "Basic " + btoa(":" + _this.options.devOpsPersonalAccessToken)
                },
                type: "GET",

                success: function (response) {
                    resolve(response);
                },
                error: function () {
                    reject();
                }
            });
        })
    }
    */

    _this.updateItemRemainingAndCompletedWork = function () {
        return new Promise(function (resolve, reject) {
            console.info('getting my items from devops');

            var updateData = [
                {
                    "op": "add",
                    "path": "/fields/Microsoft.VSTS.Scheduling.RemainingWork",
                    "value": "101"
                },
                {
                    "op": "add",
                    "path": "/fields/Microsoft.VSTS.Scheduling.CompletedWork",
                    "value": "17"
                },
            ]


            $.ajax({
                url: _this.options.devOpsInstanceUrl + "/AgileProject/_apis/wit/workitems/26?api-version=6.0",
                headers: {
                    "Authorization": "Basic " + btoa(":" + _this.options.devOpsPersonalAccessToken)
                },
                type: "PATCH",
                contentType: "application/json-patch+json",
                data: JSON.stringify(updateData),

                success: function (response) {
                    console.info(response.data);
                    resolve(response.data);
                },
                error: function () {
                    reject();
                }
            });
        })
    }


    // _this.getMyItemsX = function () {
    //     return new Promise(function (resolve, reject) {
    //         console.info('getting my items from devops');
    //         $.ajax({
    //             url: _this.options.devOpsInstanceUrl + "/_apis/work/accountMyWork?%24queryOption=3",
    //             headers: {
    //                 "Authorization": "Basic " + btoa(":" + _this.options.devOpsPersonalAccessToken)
    //             },
    //             type: "GET",

    //             success: function (response) {
    //                 //console.info(response);
    //                 resolve(response.data);
    //             },
    //             error: function () {
    //                 reject();
    //             }
    //         });
    //     })
    // }


    // _this.getMyCommitsOld = function (from, to) {
    //     return new Promise(function (resolve, reject) {
    //         console.info('getting my commits within time frame from devops');
    //         $.ajax({
    //             url: _this.options.devOpsInstanceUrl +
    //                 `/_apis/git/repositories/414ad502-0e31-4ffa-8fd6-9a0260246b19/commits?api-version=6.0` +
    //                 `&searchCriteria.author=${_this.options.devOpsAuthorName}` +
    //                 `&searchCriteria.fromDate=${from.toISOString()}` +
    //                 `&searchCriteria.toDate=${to.toISOString()}`,
    //             headers: {
    //                 "Authorization": "Basic " + btoa(":" + _this.options.devOpsPersonalAccessToken)
    //             },
    //             type: "GET",

    //             success: function (response) {
    //                 // console.info(response);
    //                 resolve(response);
    //             },
    //             error: function () {
    //                 reject();
    //             }
    //         });
    //     })
    // }

    // _this.getMyCommitsFromRepo = function (from, to, repo) {
    //     return new Promise(function (resolve, reject) {
    //         console.info('getting my commits within time frame from devops');
    //         $.ajax({
    //             url: _this.options.devOpsInstanceUrl +
    //                 `/_apis/git/repositories/${repo}/commits?api-version=6.0` +
    //                 `&searchCriteria.author=${_this.options.devOpsAuthorName}` +
    //                 `&searchCriteria.fromDate=${from.toISOString()}` +
    //                 `&searchCriteria.toDate=${to.toISOString()}`,
    //             headers: {
    //                 "Authorization": "Basic " + btoa(":" + _this.options.devOpsPersonalAccessToken)
    //             },
    //             type: "GET",

    //             success: function (response) {
    //                 // console.info(response);
    //                 resolve(response);
    //             },
    //             error: function () {
    //                 reject();
    //             }
    //         });
    //     })
    // }

    // _this.getMyRepositories = function () {
    //     return new Promise(function (resolve, reject) {
    //         console.info('getting my repositories from devops');
    //         $.ajax({
    //             url: _this.options.devOpsInstanceUrl + `/_apis/git/repositories?api-version=6.0`,
    //             headers: {
    //                 "Authorization": "Basic " + btoa(":" + _this.options.devOpsPersonalAccessToken)
    //             },
    //             type: "GET",

    //             success: function (response) {
    //                 // console.info(response);
    //                 resolve(response);
    //             },
    //             error: function () {
    //                 reject();
    //             }
    //         });
    //     })
    // }

    _this.getMyRepositoriesAsync = async function () {
        console.info('getting my repositories from devops');

        const url = _this.options.devOpsInstanceUrl + `/_apis/git/repositories?api-version=6.0`;
        const response = await fetch(url, {
            headers: _this.ajaxHeaders
            // headers: {
            //     'Content-Type': 'application/json',
            //     "Authorization": "Basic " + btoa(":" + _this.options.devOpsPersonalAccessToken)
            // },
        });
        return response.json();
    }

    _this.getMyCommitsAsync = async function (from, to) {
        let commitPromises = [];
        const repos = await this.getMyRepositoriesAsync();
            repos.value.forEach(repo => {
                const url = _this.options.devOpsInstanceUrl +
                    `/_apis/git/repositories/${repo.id}/commits?api-version=6.0` +
                    `&searchCriteria.author=${_this.options.devOpsAuthorName}` +
                    `&searchCriteria.fromDate=${from.toISOString()}` +
                    `&searchCriteria.toDate=${to.toISOString()}`;

                commitPromises.push(fetch(url, {
                    headers: _this.ajaxHeaders,
                    // headers: {
                    //     'Content-Type': 'application/json',
                    //     "Authorization": "Basic " + btoa(":" + _this.options.devOpsPersonalAccessToken)
                    // },
                }).then(res => res.json()));
        });

        let commits = [];
        const responses = await Promise.all(commitPromises);
        responses.forEach(response => {
            if (response.count > 0) {
                commits.push(...response.value);
            }
        });
        return commits;
    }

}
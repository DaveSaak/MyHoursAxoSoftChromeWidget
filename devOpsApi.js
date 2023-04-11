'use strict'

function DevOpsApi(options) {
    var _this = this;
    _this.options = options;
    _this.ajaxHeaders = {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(":" + _this.options.devOpsPersonalAccessToken)
    };
    _this.ajaxHeadersPatch = {
        'Content-Type': 'application/json-patch+json',
        'Authorization': 'Basic ' + btoa(":" + _this.options.devOpsPersonalAccessToken)
    };

    _this.getPullRequestPortalLink = function (projectName, repositoryName, codeReviewId) {
        return `${_this.options.devOpsInstanceUrl}${encodeURIComponent(projectName)}/_git/${encodeURIComponent(repositoryName)}/pullrequest/${codeReviewId}`;
    }

    _this.getMyItemsIdsAsync = async function () {
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

    _this.getItemsAsync = async function (ids) {
        const url = _this.options.devOpsInstanceUrl + "/_apis/wit/workitems?ids=" + ids + "&fields=System.Id,System.Title,System.WorkItemType,System.State,System.TeamProject,Microsoft.VSTS.Scheduling.CompletedWork,Microsoft.VSTS.Scheduling.OriginalEstimate,Microsoft.VSTS.Scheduling.RemainingWork&api-version=6.0";
        const response = await fetch(url, {
            headers: _this.ajaxHeaders
        });
        return response.json();
    }

    _this.getItemAsync = async function (id) {
        const url = `${_this.options.devOpsInstanceUrl}/_apis/wit/workitems/${id}?$expand=relations`
        const response = await fetch(url, {
            headers: _this.ajaxHeaders,
        });
        return response.json();
    }

    _this.getItemByUrlAsync = async function (url) {
        const response = await fetch(url, {
            headers: _this.ajaxHeaders,
        });
        return response.json();
    }

    _this.getItemUpdatesAsync = async function (id) {
        const url = _this.options.devOpsInstanceUrl + "/_apis/wit/workitems/" + id + "/updates?$top={100}&&api-version=5.1";
        const response = await fetch(url, {
            headers: _this.ajaxHeaders,
        });
        return response.json();
    }    

    // _this.updateRemainingAndCompletedWorkAsync = async function (id, completedWork, remainingWork) {
    //     var updateData = [
    //         {
    //             "op": "add",
    //             "path": "/fields/Microsoft.VSTS.Scheduling.RemainingWork",
    //             "value": remainingWork
    //         },
    //         {
    //             "op": "add",
    //             "path": "/fields/Microsoft.VSTS.Scheduling.CompletedWork",
    //             "value": completedWork
    //         },
    //     ];

    //     const url = _this.options.devOpsInstanceUrl + "/_apis/wit/workitems/" + id + "?api-version=6.0";
    //     const response = await fetch(url, {
    //         headers: _this.ajaxHeadersPatch,
    //         method: 'PATCH',
    //         body: JSON.stringify(updateData)
    //     });

    //     return response.json();
    // };


    _this.updateRemainingAndCompletedWorkAsync = async function (devOpsItem, hoursDone) {

        let completedValue = devOpsItem.fields['Microsoft.VSTS.Scheduling.CompletedWork'];
        let remainingValue = devOpsItem.fields['Microsoft.VSTS.Scheduling.RemainingWork'];
        let estimatedValue = devOpsItem.fields['Microsoft.VSTS.Scheduling.OriginalEstimate'];

        let completed = (completedValue == undefined || Number.isNaN(completedValue)) ? 0 : Number(completedValue);
        let estimated = (estimatedValue == undefined || Number.isNaN(estimatedValue)) ? 0 : Number(estimatedValue);
        let remaining = (remainingValue == undefined || Number.isNaN(remainingValue)) ? estimated : Number(remainingValue);

        let logDurationInHours = hoursDone;

        completed = Math.round((completed + logDurationInHours) * 100) / 100;
        remaining = Math.round(Math.max(remaining - logDurationInHours, 0) * 100) / 100;

        const state = devOpsItem.fields['System.State'];
        var updateData = [
            {
                "op": "add",
                "path": "/fields/Microsoft.VSTS.Scheduling.CompletedWork",
                "value": completed
            },
        ];        
        
        
        if (state != "Closed") {
            updateData.push(
                {
                    "op": "add",
                    "path": "/fields/Microsoft.VSTS.Scheduling.RemainingWork",
                    "value": remaining
                }
            )
        }

        if (state === 'New'){
            updateData.push(
                {
                    "op": "replace",
                    "path": "/fields/System.State",
                    "value": "Active"
                }
            )
        }

        const url = _this.options.devOpsInstanceUrl + "/_apis/wit/workitems/" + devOpsItem.id + "?api-version=6.0";
        const response = await fetch(url, {
            headers: _this.ajaxHeadersPatch,
            method: 'PATCH',
            body: JSON.stringify(updateData)
        });

        return response.json();
    };

    _this.getMyRepositoriesAsync = async function () {
        const url = _this.options.devOpsInstanceUrl + `/_apis/git/repositories?api-version=6.0`;
        const response = await fetch(url, {
            headers: _this.ajaxHeaders
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

    _this.getPullRequestsAsync = async function(){

        let pullRequestPromises = [];
        const repos = await this.getMyRepositoriesAsync();

        const selectedPullRequestRepos = _this.options.devOpsPullRequestRepos?.split(',');
        repos.value.forEach(repo => {
            if (!selectedPullRequestRepos || selectedPullRequestRepos.length === 0 || selectedPullRequestRepos.find(x => x === repo.name)) {
                const url = _this.options.devOpsInstanceUrl +
                    `/_apis/git/repositories/${repo.id}/pullrequests?api-version=7.0` +
                    `&searchCriteria.status=active`;

                pullRequestPromises.push(fetch(url, {
                    headers: _this.ajaxHeaders,
                }).then(
                    res => {
                        console.log(res.headers.get('x-vss-userdata'));
                        return res.json()
                    }
                ));
            }
        });

        let pullRequests = [];
        const responses = await Promise.all(pullRequestPromises);
        responses.forEach(response => {
            if (response.count > 0) {
                pullRequests.push(...response.value);
            }
        });

        return pullRequests;        

        // const url = _this.options.devOpsInstanceUrl + `/_apis/git/repositories/pullrequests?searchCriteria.status=active&api-version=7.0`;
        // const response = await fetch(url, {
        //     headers: _this.ajaxHeaders
        // });
        // return response.json();        

    }
}
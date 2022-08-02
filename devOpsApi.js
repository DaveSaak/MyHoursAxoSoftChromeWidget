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
        const url = _this.options.devOpsInstanceUrl + "/_apis/wit/workitems?ids=" + ids + "&fields=System.Id,System.Title,System.WorkItemType&api-version=6.0";
        const response = await fetch(url, {
            headers: _this.ajaxHeaders
        });
        return response.json();
    }

    _this.getItemAsync = async function (id) {
        const url = _this.options.devOpsInstanceUrl + "/_apis/wit/workitems/" + id;
        const response = await fetch(url, {
            headers: _this.ajaxHeaders,
        });
        return response.json();
    }

    _this.updateRemainingAndCompletedWorkAsync = async function (id, completedWork, remainingWork) {
        var updateData = [
            {
                "op": "add",
                "path": "/fields/Microsoft.VSTS.Scheduling.RemainingWork",
                "value": remainingWork
            },
            {
                "op": "add",
                "path": "/fields/Microsoft.VSTS.Scheduling.CompletedWork",
                "value": completedWork
            },
        ];

        const url = _this.options.devOpsInstanceUrl + "/_apis/wit/workitems/" + id + "?api-version=6.0";
        const response = await fetch(url, {
            headers: _this.ajaxHeadersPatch,
            method: 'PATCH',
            body: JSON.stringify(updateData)
        });

        return response.json();
    };
}


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
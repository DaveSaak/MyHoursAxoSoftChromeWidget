'use strict'

function PullRequestsView(devOpsApi, viewContainer) {
    var _this = this;
    _this.devOpsApi = devOpsApi;
    _this.viewContainer = viewContainer;


    _this.show = function () {

        getPullRequests();


    }


    function getPullRequests() {
        _this.devOpsApi.getPullRequestsAsync().then(pullRequests => {
            console.log(pullRequests);
            pullRequests = pullRequests.filter(x => x.reviewers?.length > 0);

            sortPullRequests(pullRequests);

            const myPullRequestsUi = _this.viewContainer.find('.pull-requests-list .my-pull-requests');
            myPullRequestsUi.empty();

            const otherPullRequestsUi = _this.viewContainer.find('.pull-requests-list .other-pull-requests');
            myPullRequestsUi.empty();

            //split into mine and others

            const partition = (array, callback) => {
                const matches = []
                const nonMatches = []
                array.forEach(element => (callback(element) ? matches : nonMatches).push(element))
                return [matches, nonMatches]
            }

            const [myPullRequests, otherPullRequests] = partition(pullRequests, pullRequest => pullRequest.reviewers?.filter(x => x.id === '05cd4c16-019c-6f13-8c49-c1885ccc78c8').length > 0);


            $('.assigned-to-me-count').text(`(${myPullRequests?.length})`);
            myPullRequests.forEach(pullRequest => {
                const pullRequestUi = getPullRequestUi(pullRequest);
                myPullRequestsUi.append(pullRequestUi);
            });

            $('.assigned-to-my-teams-count').text(`(${otherPullRequests?.length})`);
            otherPullRequests.forEach(pullRequest => {
                const pullRequestUi = getPullRequestUi(pullRequest);
                otherPullRequestsUi.append(pullRequestUi);
            });



        });
    }

    function getPullRequestUi(pullRequest) {
        const pullRequestUi = $('<div>').addClass('d-flex flex-row mb-3 mr-1 align-items-start pull-request');

        const authorAvatarUi = $('<div>');
        const authorAvatarImg = $('<img src="' + pullRequest.createdBy.imageUrl + '" style="border-radius: 100%;width: 30px; height: 32px; padding-bottom: 2px" class="mr-1 mt-2" title="' + pullRequest.createdBy.displayName + '">');
        authorAvatarUi.append(authorAvatarImg);
        pullRequestUi.append(authorAvatarUi);
        

        const pullRequestDetails = $('<div>').addClass('d-flex flex-column ml-2');
        pullRequestUi.append(pullRequestDetails);
        
        const actionsUi = $('<div>').addClass('ml-auto');
        const openDevOpsPullRequestButton = $('<button>')
            .addClass("btn btn-transparent mr-1")
            .attr("title", "Open Pull Request in DevOps portal")
            .append($('<i class="fa-solid fa-arrow-up-right-from-square"></i>'))
            .click(function (event) {
                const pullRequestPortalUrl = _this.devOpsApi.getPullRequestPortalLink(pullRequest.repository.project.name, pullRequest.repository.name, pullRequest.codeReviewId);
                event.preventDefault();
                window.open(pullRequestPortalUrl, '_devops');
            });

        actionsUi.append(openDevOpsPullRequestButton);
        pullRequestUi.append(actionsUi);        

        const repositoryNameUi = $('<div style="font-weight:650; font-size:1rem;">').addClass('').text(`${pullRequest.repository.name}: ${pullRequest.title}`);
        pullRequestDetails.append(repositoryNameUi);
        

        const creationDate = new Date(pullRequest.creationDate);
        const creationDateUi = $('<div>').addClass('').text(`created: ${creationDate.toLocaleDateString('sl-si')}`);
        pullRequestDetails.append(creationDateUi);
       
        
        // pullRequestDetails.append($('<strong>').text(pullRequest.title));

        // const createdByUi = $('<div>')
        //     .append($('<span>').text('Created by: '))
        //     .append($('<span>').text(pullRequest.createdBy.displayName))
        // pullRequestDetails.append(createdByUi);

        const reviewersUi = $('<div>').addClass('d-flex flex-column').append('<span>').text('reviewers: ')
        const reviewersListUi = $('<div>').addClass('d-flex flex-column');
        pullRequest.reviewers.forEach(reviewer => {
            const reviewerUi = $('<div>').addClass('d-flex align-items-center mr-2');//.text(reviewer.displayName);
            const avatarUi = $('<img src="' + reviewer.imageUrl + '" style="border-radius: 100%;width: 13px; height: 15px; padding-bottom: 2px" class="mr-1">');
            reviewerUi.append(avatarUi);
            const reviewerNameUi = $('<span>').text(reviewer.displayName);
            reviewerUi.append(reviewerNameUi);
            reviewersListUi.append(reviewerUi);
        });
        reviewersUi.append(reviewersListUi);
        pullRequestDetails.append(reviewersUi);

        return pullRequestUi;

    }

    function sortPullRequests(items) {

        items.sort((a, b) => {
            const dateCreatedA = Date(a.creationDate);
            const dateCreatedB = Date(b.creationDate);

            const compareResult = Date(dateCreatedA) - Date(dateCreatedB);
            if (compareResult != 0) {
                return compareResult;
            }



            const repoNameA = a.repository.name.toUpperCase(); // ignore upper and lowercase
            const repoNameB = b.repository.name.toUpperCase(); // ignore upper and lowercase

            if (repoNameA < repoNameB) {
                return -1;
            }
            if (repoNameA > repoNameB) {
                return 1;
            }

            // names must be equal
            const titleA = a.title.toUpperCase(); // ignore upper and lowercase
            const titleB = b.title.toUpperCase(); // ignore upper and lowercase

            if (titleA < titleB) {
                return -1;
            }
            if (titleA > titleB) {
                return 1;
            }

            return 0;
        });


    }



}
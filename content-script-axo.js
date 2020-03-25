var copyButtonText = "copy branch name to clipboard";

chrome.runtime.onMessage.addListener(function (request) {
    console.log('content script - got request: ' + request.type);
    console.log(request);

    if (request && request.type === 'axo-item-loaded') {
        console.log('content script - axo-item-loaded');

        let itemHeader = $('.axo-view-item .item-body-header');

        let existingButton = $('#getBranchNameButton');

        if (existingButton.length === 0) {
            let button = $('<button id="getBranchNameButton">')
                .text(copyButtonText)
                .addClass('button--basic button--small')
                .click(getBranchName);

            itemHeader.append(button);
        }
    }
});

function getBranchName() {
    let itemHeader = $('.axo-view-item .item-body-header');
    let itemId = itemHeader.find('.item-field-id').text();
    let itemName = itemHeader.find('.item-field-name').text();

    let branchName = itemName
        .toLowerCase()
        .trim()
        .replace(/[\W_]+/g, " ")  //remove all non alpha chars
        .replace(/\s\s+/g, ' ')  //replace mulitple spaces with single one. 
        .replace(/ /g, "-");     //replace spaces with dashes

    let fullBranchName = itemId + "-" + branchName;
    console.log(fullBranchName);

    chrome.runtime.sendMessage({
        type: 'copy',
        text: fullBranchName
    });

    $(this).text('copied.');
    setTimeout(
        function(copyButton){ 
            $(copyButton).text(copyButtonText); 
        }
        , 2000, this);
}
var copyButtonText = "Copy Git branch name";

// var requestData = {"action": "createContextMenuItemStartLog", "client": "Axo"};
// chrome.extension.sendRequest(requestData);


chrome.runtime.onMessage.addListener(function (request) {
    console.log('content script - got request: ' + request.type);
    console.log(request);

    if (request && request.type === 'axo-item-loaded') {
        console.log('content script - axo-item-loaded');

        //let itemHeader = $('.axo-view-item .item-body-header');
        let itemHeader = $('#gridHeader .axo-view-item-content .axo-menubar-content.axo-menu-content ul');

        let existingButtonWrapper = $('#getBranchNameButtonWrapper');

        if (existingButtonWrapper.length > 0) {
            existingButtonWrapper.remove();
        }
        
        let button = $('<button id="getBranchNameButton">')
            .addClass('button button--basic')
            .click(getBranchName);

        let icon = $('<span>').addClass("fa fa-gitlab");
        button.append(icon);
        let text = $('<span id="getBranchNameButtonText">').text(copyButtonText);
        button.append(text);

        let buttonWrapper = $('<li id="getBranchNameButtonWrapper">');
        buttonWrapper.append(button);

        itemHeader.append(buttonWrapper);
        
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

    $('#getBranchNameButtonText').text('Wohoo. Copied.');
    setTimeout(
        function(copyButton){ 
            $('#getBranchNameButtonText').text(copyButtonText); 
        }
        , 2000, this);
}
var requestData = { "action": "createContextMenuItemStartLog" };
chrome.extension.sendRequest(requestData);

console.log('>> devops content script: hello');
chrome.runtime.onMessage.addListener(function (request) {
    console.log('>> devops content script - got request: ' + request.type);
    console.log(request);
    if (request && request.type === 'devops-item-loaded') {
        setTimeout(() => {
            addGitButton();
        }, 1000);
    }
});


setTimeout(() => {
    addGitButton();
}, 3000);


function addGitButton() {
    const copyToClipboardIcon = $('<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet"><path d="M251.172 116.594L139.4 4.828c-6.433-6.437-16.873-6.437-23.314 0l-23.21 23.21 29.443 29.443c6.842-2.312 14.688-.761 20.142 4.693 5.48 5.489 7.02 13.402 4.652 20.266l28.375 28.376c6.865-2.365 14.786-.835 20.269 4.657 7.663 7.66 7.663 20.075 0 27.74-7.665 7.666-20.08 7.666-27.749 0-5.764-5.77-7.188-14.235-4.27-21.336l-26.462-26.462-.003 69.637a19.82 19.82 0 0 1 5.188 3.71c7.663 7.66 7.663 20.076 0 27.747-7.665 7.662-20.086 7.662-27.74 0-7.663-7.671-7.663-20.086 0-27.746a19.654 19.654 0 0 1 6.421-4.281V94.196a19.378 19.378 0 0 1-6.421-4.281c-5.806-5.798-7.202-14.317-4.227-21.446L81.47 39.442l-76.64 76.635c-6.44 6.443-6.44 16.884 0 23.322l111.774 111.768c6.435 6.438 16.873 6.438 23.316 0l111.251-111.249c6.438-6.44 6.438-16.887 0-23.324" fill="#DE4C36"/></svg>');
    const copySuccessIcon = $('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M443.3 100.7C449.6 106.9 449.6 117.1 443.3 123.3L171.3 395.3C165.1 401.6 154.9 401.6 148.7 395.3L4.686 251.3C-1.562 245.1-1.562 234.9 4.686 228.7C10.93 222.4 21.06 222.4 27.31 228.7L160 361.4L420.7 100.7C426.9 94.44 437.1 94.44 443.3 100.7H443.3z"/></svg>');

    const header = $('.work-item-form-main-header');
    if (!(header?.length > 0)){
        console.log('>> devops content script: header not found');
        return;
    }

    const toolbar = header.find('.work-item-form-toolbar-container');
    if (!(toolbar?.length > 0)){
        console.log('>> devops content script: toolbar not found');
        return;
    }    
    
    const actionsMenuBar = toolbar.find(".menu-bar");
    if (!(actionsMenuBar?.length > 0)){
        console.log('>> devops content script: actions menu bar not found');
        return;
    }     

    const existingGitButton = actionsMenuBar.find('#actionsMenuBar');
    if (existingGitButton.length > 0) {
        console.log('>> devops content script: button exists. quitting');
        return;
    }

    const menuItem = $('<li id="copy-git-branch-name" class="menu-item icon-only" tabindex="-1" role="menuitem" title="" title="Copy GIT branch name to clipboard">');
    menuItemIcon = $('<span class="menu-item-icon bowtie-icon" title="Copy GIT branch name to clipboard">').append(copyToClipboardIcon);
    menuItem.append(menuItemIcon);
    menuItem.append($('<span class="html">'));
    menuItem.click(x => {
        console.log('click');
        const headerContent = header.first('.work-item-form-headerContent');
        const itemId = headerContent.find('[aria-label="ID Field"]').text();
        const itemTitle = headerContent.find('[aria-label="Title Field"]').val();

        console.log(`item: ${itemId}, title: ${itemTitle}`);

        const branchName = itemTitle
            .toLowerCase()
            .trim()
            .replace(/[\W_]+/g, " ")  //remove all non alpha chars
            .replace(/\s\s+/g, ' ')  //replace mulitple spaces with single one. 
            .replace(/ /g, "-");     //replace spaces with dashes

        const fullBranchName = itemId + "-" + branchName;

        chrome.runtime.sendMessage({ type: 'copy', text: fullBranchName });

        menuItemIcon.empty();
        menuItemIcon.append(copySuccessIcon);

        console.log(`>> devops content script: ${fullBranchName}`);

        setTimeout(_ => {
            menuItemIcon.empty();
            menuItemIcon.append(copyToClipboardIcon);
            menuItem.removeClass('hover');
        }, 1000, this);
    })

    actionsMenuBar.prepend(menuItem);
    console.log('>> devops content script: menu item added to actions menu bar');

    menuItem.mouseover(_ => { menuItem.addClass('hover') });
    menuItem.mouseout(_ => { menuItem.removeClass('hover') });
}







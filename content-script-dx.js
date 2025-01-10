// setTimeout((() => {
//     const licensePanel = document.querySelector('body > dx-license');
//     if (!licensePanel.length) {
//         const fakeLicensePanelContainer = document.createElement('div');
//         const fakeLicensePanel = document.createElement('dx-license');
//         fakeLicensePanelContainer.appendChild(fakeLicensePanel);
//         fakeLicensePanelContainer.style.display = 'none';
//         document.body.appendChild(fakeLicensePanelContainer);
//         licensePanel.remove();
//     }
// }), 1000)

const hideLicensePanelIfVisible = () => {
    const intervalId = setInterval(() => {
        const licensePanel = document.querySelector('body > dx-license');

        if (!licensePanel.length) {
            const fakeLicensePanelContainer = document.createElement('div');
            const fakeLicensePanel = document.createElement('dx-license');
            fakeLicensePanelContainer.appendChild(fakeLicensePanel);
            fakeLicensePanelContainer.style.display = 'none';
            document.body.appendChild(fakeLicensePanelContainer);
            licensePanel.remove();

            clearInterval(intervalId);
        }
    }, 50);
};

setTimeout(() => {
    hideLicensePanelIfVisible();
}, 10);
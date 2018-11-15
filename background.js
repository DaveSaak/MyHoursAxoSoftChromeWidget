// // Copyright 2018 The Chromium Authors. All rights reserved.
// // Use of this source code is governed by a BSD-style license that can be
// // found in the LICENSE file.

// 'use strict';

// chrome.runtime.onInstalled.addListener(function () {
//     // var settings = {
//     //     email: 'davidsakelsek@gmail.com',
//     //     accessToken: undefined,
//     //     retryToken: undefined
//     // }

//     // chrome.storage.sync.set(
//     //     settings,
//     //     function () {
//     //         console.log("The email is " + settings.email);
//     //         console.log("The accessToken is " + settings.accessToken);
//     //         console.log("The retryToken is " + settings.retryToken);
//     //     });


//     chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
//         chrome.declarativeContent.onPageChanged.addRules([{
//             conditions: [new chrome.declarativeContent.PageStateMatcher({
//                 pageUrl: {
//                     hostEquals: 'app.myhours.com'
//                 },
//             })],
//             actions: [new chrome.declarativeContent.ShowPageAction()]
//         }]);
//     });

// });
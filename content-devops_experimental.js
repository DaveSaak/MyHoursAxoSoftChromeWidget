// (function () {


    function addPresetComments() {
        console.log("Injecting preset comments...");
        const commentBoxes = document.querySelectorAll(".repos-comment-editor-fit");
        if (!commentBoxes.length) return;

        const commentTypes = [
            ["👏 praise", "Praises highlight something positive. Try to leave at least one of these comments per review (if it exists :^)"],
            ["🤓 nitpick", "Nitpicks are small, trivial, but necessary changes. Distinguishing nitpick comments significantly helps direct the reader's attention to comments requiring more involvement."],
            ["🎯 suggestion", "Suggestions are specific requests to improve the subject under review. It is assumed that we all want to do what's best, so these comments are never dismissed as “mere suggestions”, but are taken seriously."],
            ["🔨 issue", "Issues represent user-facing problems. If possible, it's great to follow this kind of comment with a suggestion."],
            ["❔ question", "Questions are appropriate if you have a potential concern but are not quite sure if it's relevant or not. Asking the author for clarification or investigation can lead to a quick resolution."],
            ["💭 thought", "Thoughts represent an idea that popped up from reviewing. These comments are non-blocking by nature, but they are extremely valuable and can lead to more focused initiatives and mentoring opportunities."],
            ["💣 chore", "Chores are simple tasks that must be done before the subject can be “officially” accepted. Usually, these comments reference some common process. Try to leave a link to the process description so that the reader knows how to resolve the chore."]
        ];

        commentBoxes.forEach((box) => {
            if (!box.dataset.injected) {
                const container = document.createElement("div");
                container.style.marginBottom = "10px";

                commentTypes.forEach(([emoji, description]) => {
                    const button = document.createElement("button");
                    button.innerText = emoji;
                    button.style.marginRight = "5px";
                    button.style.cursor = "pointer";
                    button.style.border = "1px solid #ccc";
                    button.style.padding = "5px";
                    button.style.borderRadius = "4px";
                    button.style.background = "#f3f3f3";
                    
                    button.onclick = () => {
                        const textarea = box.querySelector("textarea");
                        if (textarea) {
                            textarea.value += `\n\n${emoji} ${description}`;
                            textarea.focus();
                        }
                    };

                    container.appendChild(button);
                });

                box.insertBefore(container, box.firstChild);
                box.dataset.injected = "true"; // Avoid duplicate injections
            }
        });
    }

    function handleCommentButtonClick(event) {
        const clickedButton = event.target.closest(".repos-add-comment-button");
        if (!clickedButton) return;

        console.log("Comment button clicked, waiting for comment box...");

        // Wait for the comment box to appear dynamically
        const observer = new MutationObserver((mutations, observer) => {
            const commentBox = document.querySelector(".repos-comment-editor-fit");
            if (commentBox) {
                addPresetCommentsToBox(commentBox);
                observer.disconnect(); // Stop observing once the box is found
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    function listenToCommentButtonClicks() {
        document.body.addEventListener("click", handleCommentButtonClick);
    }


    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "addPresetComments") {
            listenToCommentButtonClicks();
        } 
    });

    chrome.runtime.sendMessage({ action: "wakeUpServiceWorker" }, (response) => {
        console.log(response.status);
    });

    console.log('>> devops content script: hello');

// })();



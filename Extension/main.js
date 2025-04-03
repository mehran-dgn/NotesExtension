var addNoteButton = document.getElementById("addNoteButton");
addNoteButton.addEventListener("click", function () {
    var noteTitle = document.getElementById("noteTitle").value.trim();
    var noteBody =  document.getElementById("noteBody").value.trim();
    var selectedTab = document.getElementById("noteTabsList").value; 

    if ((noteTitle === "" || noteTitle === null) && (noteBody === "" || noteBody === null)) {
        alert("عنوان و متن یاداشت نمیتواند خالی باشد");
    } else if ((noteTitle === "" || noteTitle === null) && (noteBody !== "" || noteBody !== null)) {
        alert("لطفاً عنوان یادداشت را وارد کنید");
    } else if ((noteTitle !== "" || noteTitle !== null) && (noteBody === "" || noteBody === null)) {
        alert("لطفاً متن یادداشت را وارد کنید");
    } else if (!selectedTab || selectedTab === "") {
        alert("لطفاً یک تب معتبر انتخاب کنید!");
    } else {
        chrome.storage.local.get(["notes"], (result) => {
            const notes = result.notes || {}; 
            
            if (!notes[selectedTab]) {
                notes[selectedTab] = {}; 
            }

            if (notes[selectedTab][noteTitle]) {
                alert(`یادداشتی با عنوان "${noteTitle}" قبلاً اضافه شده است. لطفاً عنوان جدیدی وارد کنید!`);
                return; 
            }

            notes[selectedTab][noteTitle] = noteBody; 

            chrome.storage.local.set({ notes: notes }, () => {
                alert(`یادداشت با موفقیت ذخیره شد!`);
                document.getElementById("noteTitle").value = ""
                document.getElementById("noteBody").value = "";
                generateTabsAndContents();
            });
        });
    }
});

function convertLinks(text) {
    const urlRegex = /\b(?:https?:\/\/|www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
    return text.replace(urlRegex, (url) => {
        const href = url.startsWith("http://") || url.startsWith("https://") ? url : `http://${url}`;
        return `<a href="${href}" target="_blank">${url}</a>`;
    });
}


var nodesTabListElem = document.getElementById("noteTabsList");
function populateTabsDropDown(){
    chrome.storage.local.get(["tabs"],(result)=>{
        let tabsList = result.tabs || [];
        nodesTabListElem.innerHTML="";

        tabsList.forEach((tabName,index)=>{
            let option = document.createElement("option");
            option.textContent = tabName;
            option.value = index ;
            nodesTabListElem.appendChild(option);
        });
    });
}
populateTabsDropDown();

function generateTabsAndContents() {
    chrome.storage.local.get(["tabs", "notes"], (result) => {
        const tabsList = result.tabs || [];
        const notes = result.notes || {};

        const tabContainer = document.querySelector(".tab");
        const contentContainer = document.querySelector(".tabcontents");

        tabContainer.innerHTML = "";
        contentContainer.innerHTML = "";

        tabsList.forEach((tabName, index) => {
            const tabButton = document.createElement("button");
            tabButton.classList.add("tablinks");
            tabButton.setAttribute("data-title", tabName);
            tabButton.textContent = tabName;

            tabButton.addEventListener("click", () => {
                const allTabButtons = document.querySelectorAll(".tablinks");
                allTabButtons.forEach((button) => button.classList.remove("active"));
                tabButton.classList.add("active");

                const allPanels = document.querySelectorAll(".tabcontent");
                allPanels.forEach((panel) => (panel.style.display = "none"));

                const activePanel = document.getElementById(`tab-${index}`);
                if (activePanel) activePanel.style.display = "block";
            });

            tabContainer.appendChild(tabButton);

            const tabPanel = document.createElement("div");
            tabPanel.id = `tab-${index}`;
            tabPanel.classList.add("tabcontent");
            tabPanel.style.display = "none";

            const notesForTab = notes[index] || {};
            if (Object.keys(notesForTab).length === 0) {
                const noNotesMessage = document.createElement("p");
                noNotesMessage.textContent = "هیچ یادداشتی در این تب وجود ندارد.";
                tabPanel.appendChild(noNotesMessage);
            } else {
                Object.entries(notesForTab).forEach(([noteTitle, noteBody]) => {
                    const noteItem = document.createElement("div");
                    noteItem.classList.add("note-item");

                    const noteHeading = document.createElement("h4");
                    noteHeading.textContent = `عنوان: ${noteTitle}`;

                    const noteContent = document.createElement("p");
                    noteContent.innerHTML = convertLinks(noteBody);
                    noteItem.appendChild(noteHeading);
                    noteItem.appendChild(noteContent);
                    tabPanel.appendChild(noteItem);

                    const updateButton = document.createElement("button");
                    updateButton.textContent = "ویرایش";
                    updateButton.addEventListener("click", () => {
                        const newTitle = prompt("عنوان جدید:", noteTitle);
                        const newBody = prompt("متن جدید:", noteBody);

                        if (newTitle && newBody) {
                            delete notes[index][noteTitle]; 
                            notes[index][newTitle] = newBody; 

                            chrome.storage.local.set({ notes }, () => {
                                alert("یادداشت با موفقیت ویرایش شد.");
                                generateTabsAndContents(); 
                            });
                        }
                    });

                    const deleteButton = document.createElement("button");
                    deleteButton.textContent = "حذف";
                    deleteButton.addEventListener("click", () => {
                        if (confirm(`آیا می‌خواهید یادداشت "${noteTitle}" را حذف کنید؟`)) {
                            delete notes[index][noteTitle];

                            chrome.storage.local.set({ notes }, () => {
                                alert("یادداشت با موفقیت حذف شد.");
                                generateTabsAndContents(); 
                            });
                        }
                    });

                    noteItem.appendChild(noteHeading);
                    noteItem.appendChild(noteContent);
                    noteItem.appendChild(updateButton);
                    noteItem.appendChild(deleteButton);

                    tabPanel.appendChild(noteItem);
                });
            }

            contentContainer.appendChild(tabPanel);
        });

        if (tabsList.length > 0) {
            const firstTabButton = tabContainer.querySelector(".tablinks");
            const firstTabPanel = contentContainer.querySelector(".tabcontent");
            if (firstTabButton && firstTabPanel) {
                firstTabButton.classList.add("active");
                firstTabPanel.style.display = "block";
            }
        }
    });
}


generateTabsAndContents();

var addNewTab = document.getElementById("addNewTab");
addNewTab.addEventListener("click", function () {
    var newTabNameVal = document.getElementById("tabNameEntry").value.trim();
    if (newTabNameVal === "" || newTabNameVal === null) {
        alert("عنوان تب را وارد کنید!"); 
    } else {
        chrome.storage.local.get(["tabs"], (result) => {
            let tabsList = result.tabs || []; 
            if (tabsList.includes(newTabNameVal)) {
                alert(`نام تب "${newTabNameVal}" قبلاً اضافه شده است. لطفاً نام دیگری انتخاب کنید!`);
                return; 
            }
            tabsList.push(newTabNameVal);

            chrome.storage.local.set({ tabs: tabsList }, () => {
                populateTabsDropDown();
                generateTabsAndContents();
            });
        });
    }
});

var addNoteButton = document.getElementById("addNoteButton");
addNoteButton.addEventListener("click", function () {
    var noteTitle = document.getElementById("noteTitle").value.trim();
    var noteBody = document.getElementById("noteBody").value.trim();
    var selectedTab = document.getElementById("noteTabsList").value;

    if (!noteTitle || !noteBody || !selectedTab) {
        alert("لطفاً عنوان و متن یاداشت را وارد کنید و یک تب انتخاب کنید!");
        return;
    }

    chrome.storage.local.get(["notes"], (result) => {
        const notes = result.notes || {};

        if (!notes[selectedTab]) {
            notes[selectedTab] = [];
        }
        const existingNote = notes[selectedTab].find(note => note.title === noteTitle);
        if (existingNote) {
            alert(`یادداشتی با عنوان "${noteTitle}" قبلاً اضافه شده است. لطفاً عنوان جدیدی وارد کنید!`);
            return;
        }

        notes[selectedTab].push({ title: noteTitle, body: noteBody, timestamp: Date.now() });

        chrome.storage.local.set({ notes: notes }, () => {
            alert(`یادداشت با موفقیت ذخیره شد!`);
            document.getElementById("noteTitle").value = "";
            document.getElementById("noteBody").value = "";
            generateTabsAndContents();
        });
    });
});


var removeTabButton = document.getElementById("removeTab");
removeTabButton.addEventListener("click", function() {
    var selectedTabIndex = document.getElementById("modifyTabsList").value;
    var selectedTabName = document.getElementById("modifyTabsList").options[selectedTabIndex].text;
    
    if (selectedTabIndex === "" || selectedTabIndex === null) {
        alert("لطفاً یک تب برای حذف انتخاب کنید!");
        return;
    }
    
    if (confirm(`آیا مطمئن هستید که می‌خواهید تب "${selectedTabName}" و تمام یادداشت‌های آن را حذف کنید؟`)) {
        chrome.storage.local.get(["tabs", "notes"], (result) => {
            let tabsList = result.tabs || [];
            let notes = result.notes || {};
        
            tabsList.splice(selectedTabIndex, 1);
            
            delete notes[selectedTabIndex];
        
            let newNotes = {};
            Object.keys(notes).forEach(tabIndex => {
                if (parseInt(tabIndex) > parseInt(selectedTabIndex)) {
                    newNotes[tabIndex - 1] = notes[tabIndex];
                } else if (parseInt(tabIndex) < parseInt(selectedTabIndex)) {
                    newNotes[tabIndex] = notes[tabIndex];
                }
            });
            
            chrome.storage.local.set({ 
                tabs: tabsList,
                notes: newNotes 
            }, () => {
                alert(`تب "${selectedTabName}" و یادداشت‌های آن با موفقیت حذف شدند.`);
                populateTabsDropDown();
                generateTabsAndContents();
            });
        });
    }
});


function convertLinks(text) {
    const urlRegex = /(\b(?:https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    return text.replace(urlRegex, (url) => {
        if (url.includes('@')) {
            return `<a href="mailto:${url}">${url}</a>`;
        } else {
            const href = url.startsWith("http://") || url.startsWith("https://") ? url : `http://${url}`;
            return `<a href="${href}" target="_blank">${url}</a>`;
        }
    });
}



var nodesTabListElem = document.getElementById("noteTabsList");
var tabsListForModify = document.getElementById("modifyTabsList");
function populateTabsDropDown(){
    chrome.storage.local.get(["tabs"],(result)=>{
        let tabsList = result.tabs || [];
        nodesTabListElem.innerHTML="";
        tabsListForModify.innerHTML="";
        
        tabsList.forEach((tabName,index)=>{
            let option = document.createElement("option");
            option.textContent = tabName;
            option.value = index ;
            nodesTabListElem.appendChild(option);
        });

        tabsList.forEach((tabName,index)=>{
            let option = document.createElement("option");
            option.textContent = tabName;
            option.value = index ;
            tabsListForModify.appendChild(option);
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

            const notesForTab = notes[index] || []; 
            const sortedNotes = notesForTab.sort((a, b) => b.timestamp - a.timestamp); 

            if (sortedNotes.length === 0) {
                const noNotesMessage = document.createElement("p");
                noNotesMessage.textContent = "هیچ یادداشتی در این تب وجود ندارد.";
                tabPanel.appendChild(noNotesMessage);
            } else {
                sortedNotes.forEach(({ title, body }) => {
                    const noteItem = document.createElement("div");
                    noteItem.classList.add("note-item");

                    const noteHeading = document.createElement("h4");
                    noteHeading.textContent = `عنوان: ${title}`;

                    const noteContent = document.createElement("p");
                    noteContent.innerHTML = convertLinks(body);
                    noteItem.appendChild(noteHeading);
                    noteItem.appendChild(noteContent);
                    tabPanel.appendChild(noteItem);

                    const updateButton = document.createElement("button");
                    updateButton.textContent = "ویرایش";
                    updateButton.classList.add("updateNoteBtn");
                    updateButton.addEventListener("click", () => {
                        const newTitle = prompt("عنوان جدید:", title);
                        const newBody = prompt("متن جدید:", body);
            
                        if (newTitle && newBody) {
                            const noteIndex = notesForTab.findIndex(note => note.title === title);
                            if (noteIndex !== -1) {
                                notes[index][noteIndex] = { title: newTitle, body: newBody, timestamp: Date.now() }; 
                                chrome.storage.local.set({ notes }, () => {
                                    alert("یادداشت با موفقیت ویرایش شد.");
                                    generateTabsAndContents();
                                });
                            }
                        }
                    });
            
                    const deleteButton = document.createElement("button");
                    deleteButton.textContent = "حذف";
                    deleteButton.classList.add("deleteNoteBtn");
                    deleteButton.addEventListener("click", () => {
                        if (confirm(`آیا می‌خواهید یادداشت "${title}" را حذف کنید؟`)) {
                            const noteIndex = notesForTab.findIndex(note => note.title === title);
                            if (noteIndex !== -1) {
                                notes[index].splice(noteIndex, 1);
                                chrome.storage.local.set({ notes }, () => {
                                    alert("یادداشت با موفقیت حذف شد.");
                                    generateTabsAndContents();
                                });
                            }
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

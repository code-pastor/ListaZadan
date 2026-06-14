const calendar =
document.getElementById("calendar");

const monthTitle =
document.getElementById("monthTitle");

const modal =
document.getElementById("modal");

let currentDate = new Date();

let selectedDate = null;
let selectedIndex = null;

let events =
JSON.parse(
localStorage.getItem("calendarEvents")
) || {};

let notifiedEvents = {};

const months = [
"Styczeń","Luty","Marzec","Kwiecień",
"Maj","Czerwiec","Lipiec","Sierpień",
"Wrzesień","Październik","Listopad","Grudzień"
];

async function requestNotifications(){

    if(!("Notification" in window))
        return;

    if(Notification.permission === "default"){
        await Notification.requestPermission();
    }
}

requestNotifications();

function saveStorage(){

    localStorage.setItem(
        "calendarEvents",
        JSON.stringify(events)
    );
}

function formatDate(y,m,d){

    return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

function renderCalendar(){

    calendar.innerHTML="";

    const year =
    currentDate.getFullYear();

    const month =
    currentDate.getMonth();

    monthTitle.textContent =
    `${months[month]} ${year}`;

    const first =
    new Date(year,month,1);

    const last =
    new Date(year,month+1,0);

    let start =
    first.getDay();

    start =
    start===0 ? 6 : start-1;

    for(let i=0;i<start;i++){

        calendar.appendChild(
            document.createElement("div")
        );
    }

    for(let day=1;day<=last.getDate();day++){

        const key =
        formatDate(year,month,day);

        const cell =
        document.createElement("div");

        cell.className="day";

        cell.innerHTML=`
            <div class="day-header">
                <strong>${day}</strong>
                <button
                class="add-btn"
                data-date="${key}">
                +
                </button>
            </div>
        `;

        const dayEvents =
        events[key] || [];

        dayEvents
        .sort((a,b)=>
            a.time.localeCompare(b.time))
        .forEach((event,index)=>{

            const div =
            document.createElement("div");

            div.className="event";

            div.innerHTML=`
                <div class="event-time">
                    ${event.time}
                </div>
                <div>
                    ${event.title}
                </div>
            `;

            div.addEventListener(
                "click",
                ()=>openEdit(key,index)
            );

            cell.appendChild(div);
        });

        calendar.appendChild(cell);
    }

    document
    .querySelectorAll(".add-btn")
    .forEach(btn=>{

        btn.onclick=()=>{

            openNew(
                btn.dataset.date
            );

        };

    });
}

function openNew(date){

    selectedDate=date;
    selectedIndex=null;

    eventTime.value="";
    eventTitle.value="";
    eventDescription.value="";

    modal.style.display="flex";
}

function openEdit(date,index){

    selectedDate=date;
    selectedIndex=index;

    const event =
    events[date][index];

    eventTime.value =
    event.time;

    eventTitle.value =
    event.title;

    eventDescription.value =
    event.description;

    modal.style.display="flex";
}

function closeModal(){

    modal.style.display="none";
}

saveBtn.onclick=()=>{

    const newEvent={

        time:eventTime.value,

        title:eventTitle.value.trim(),

        description:eventDescription.value.trim()
    };

    if(!newEvent.title){
        return;
    }

    if(!events[selectedDate]){
        events[selectedDate]=[];
    }

    if(selectedIndex===null){

        events[selectedDate]
        .push(newEvent);

    }else{

        events[selectedDate]
        [selectedIndex]=newEvent;
    }

    saveStorage();

    renderCalendar();

    closeModal();
};

deleteBtn.onclick=()=>{

    if(selectedIndex===null)
        return;

    events[selectedDate]
    .splice(selectedIndex,1);

    if(
        events[selectedDate]
        .length===0
    ){
        delete events[selectedDate];
    }

    saveStorage();

    renderCalendar();

    closeModal();
};

closeBtn.onclick=closeModal;

prevMonth.onclick=()=>{

    currentDate.setMonth(
        currentDate.getMonth()-1
    );

    renderCalendar();
};

nextMonth.onclick=()=>{

    currentDate.setMonth(
        currentDate.getMonth()+1
    );

    renderCalendar();
};

function notify(title,body){

    if(
        Notification.permission
        !== "granted"
    ){
        return;
    }

    new Notification(title,{
        body
    });
}

function checkEvents(){

    const now = new Date();

    const today =
    formatDate(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );

    const currentMinutes =
        now.getHours()*60 +
        now.getMinutes();

    const todayEvents =
    events[today] || [];

    todayEvents.forEach(event=>{

        const [h,m] =
        event.time.split(":");

        const eventMinutes =
        Number(h)*60 +
        Number(m);

        const diff =
        eventMinutes -
        currentMinutes;

        const key1 =
        `${today}_${event.time}_${event.title}`;

        const key2 =
        `${key1}_15`;

        if(
            diff===15 &&
            !notifiedEvents[key2]
        ){

            notify(
                `Za 15 minut: ${event.title}`,
                event.description
            );

            notifiedEvents[key2]=true;
        }

        if(
            diff===0 &&
            !notifiedEvents[key1]
        ){

            notify(
                event.title,
                event.description
            );

            notifiedEvents[key1]=true;
        }

    });
}

setInterval(
    checkEvents,
    60000
);

checkEvents();

renderCalendar();
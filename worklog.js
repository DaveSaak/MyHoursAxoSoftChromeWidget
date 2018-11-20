function Worklog(){

    this.user = new User;

    this.work_done = new WorkDone;

    this.item = new Item;

    this.work_log_type = new WorkLogType;

    this.description = "description";
    this.date_time = "2018-10-30T14:38:00Z"

}


function User(){
    this.id = 2;
}

function WorkDone(){
    this.duration = 0;
    this.time_unit = new TimeUnit;    
}

function TimeUnit(){
    this.id = 1; //minutes
}

function Item(){
    this.id = 3911;
    this.item_type = "features";
}

function WorkLogType(){
    this.id = 3;  //3=internal work
}
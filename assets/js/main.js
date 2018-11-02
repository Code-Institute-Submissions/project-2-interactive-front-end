function getDataFromApi(type, arg, cb) {
//*****************************************************************************************************************************************************************//
//                      function to connect to the API of World of tanks, extended with the search type and parameter                                              //
//                      option 1: search player name to Get Account ID                                                                                             //
//                      option 2: search account_id to get player statistics                                                                                       //
//                      option 3: search account_id to get player vs vehicle stats                                                                                 //
//                      option 4: search for all tanks to get the tank name, level, nation                                                                         //
//                      Option 5: search for specific tank stats                                                                                                   //
//*****************************************************************************************************************************************************************//    
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            cb(JSON.parse(this.responseText));
        }
    };

    if (type == 'nickname') {
        xhr.open("GET", "https://api.worldoftanks.eu/wot/account/list/?application_id=5d6d1657c5bc736658f1e6aa3dcb5f6e&search=" + arg);
    }
    else if (type == 'account_id') {
        xhr.open("GET", "https://api.worldoftanks.eu/wot/account/info/?application_id=5d6d1657c5bc736658f1e6aa3dcb5f6e&account_id=" +  arg + "&fields=statistics%2C+global_rating%2C+last_battle_time");
    }
    else if (type == 'Player-vehicle') {
        xhr.open("GET", "https://api.worldoftanks.eu/wot/account/tanks/?application_id=5d6d1657c5bc736658f1e6aa3dcb5f6e&account_id=" + arg);
    }
    else if (type == 'vehicle') {
        xhr.open("GET", "https://api.worldoftanks.eu/wot/encyclopedia/tanks/?application_id=5d6d1657c5bc736658f1e6aa3dcb5f6e&fields=level%2C+nation%2C+tank_id%2C+type%2C+name");
    }
    else if (type == 'vehicle-stats') {
        xhr.open("GET", "https://api.worldoftanks.eu/wot/tanks/stats/?application_id=5d6d1657c5bc736658f1e6aa3dcb5f6e&account_id="+ arg + "&fields=all%2C+tank_id");
    }
    else {
        //not a valid search
    }
    xhr.send();
}

function getPlayerInfo() {
//*********************************************************************************************************************//
//          This function will call the API to get the Account ID back based on the requested Nickname search         //
//********************************************************************************************************************//
    var type = "nickname"
    var Accountid = "" ;
    
    // get the account_id from the player that from the input field//
    var arg = document.getElementById("inputNickname").value;
    getDataFromApi(type, arg,  function(data) {

        var respLen = data.meta.count;
        data = data.data["0"];
        
            if (respLen == 0) {
                alert('Invalid Name, please try again');
            }
            else {
                Accountid = data['account_id']
                document.getElementById("NickName").innerHTML = "Overall player statistics for: " + data['nickname'] ;
                
                //After waiting for the Request to be finished, The Account ID can be used to for the next API call to get the account statistics
                getGenericAccountStats(Accountid);
            }
    return false;
    });
}


function getGenericAccountStats(acc_id) {
//*********************************************************************************************************************//
//          This function will call the API to get the General Account Statistics back based on the found Accound ID   //
//********************************************************************************************************************//
    var type = "account_id"
    var arg = acc_id.toString();
    getDataFromApi(type, arg, function(data) {
        var account = acc_id;
        
        var GlobalRating = data.data[account].global_rating;
        var LastBattle = data.data[account].last_battle_time;
        let timeValue = new Date(LastBattle);
        
        timeValue = timeValue * 1000;
        var d = new Date(timeValue);
        document.getElementById("Global_Rating").innerHTML = "Global Rating: " + GlobalRating ;
        document.getElementById("Last_Battle").innerHTML = "Last Battle played at: " + d.toLocaleDateString() ;
        
        // ------------------------------------------------------------Get now the data of the player on his specific tanks
        getAccountTankData(account)
        
    return false;
    });
}

function getAccountTankData(acc_id) {
//*************************************************************************************************************************//
//          This function will call the API to get the Tanks and Their Battle results back based on the found Accound ID   //
//*************************************************************************************************************************//
    var type = "Player-vehicle"
    var arg = acc_id.toString();
    getDataFromApi(type, arg, function(data) {

        var account = acc_id;
        var myTankArray = [];
        
        data = data.data[account];
        
        data.forEach(function(item) {
            var MoM = item.mark_of_mastery;
            var tankid = item.tank_id;
            var battles = item.statistics.battles;
            var wins = item.statistics.wins;
            myTankArray.push({
            "Name": tankid,
            "WinAmount":  wins,
            "BattleAmount":battles,
            "Mastery": MoM
            });
            
        });
       
        getAccountTankStats(myTankArray);
        
    return false;
    });
}

function getAccountTankStats(myTankArray) {
//*************************************************************************************************************************//
//          This function will call the API to get the all available Tanks in game                                         //
//          This information is needed to enrich the data from the previous API with tank type, name, Nation and level     //
//          End result is a list that will be passed to a function to combine both                                         //
//*************************************************************************************************************************//
    var type = "vehicle"
    var arg = ""; //no need for an accountid
    getDataFromApi(type, arg, function(data) {
        data = data.data;
        var TankArray = [];
            Object.keys(data).forEach(function(key) {
                var Name = data[key].name;
                var Nation = data[key].nation;
                var Type = data[key].type;
                var Level = data[key].level;
                var Tank_id = data[key].tank_id; 
                TankArray.push({
                "Name": Name,
                "Nation":Nation,
                "Type":Type,
                "Level": Level,
                "Tank_Id": Tank_id
                });
            });
        
        return false;
        });
}



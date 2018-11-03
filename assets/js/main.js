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
    else  {
       
    }
    xhr.send();
}

function loadJSON(file, callback) {   

    var xobj = new XMLHttpRequest();
    // xobj.overrideMimeType("application/json");
    xobj.open('GET', file, true); 
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            callback(xobj.responseText);
          }
    };
    xobj.send(null);  
 }
 

function getJSONFile() {
    var Wn8Array = [];
    loadJSON("./assets/data/WN8.json", function(callback) {
        var actual_JSON = JSON.parse(callback);
        actual_JSON.forEach(function(item) {
            Wn8Array.push({
            "IDNum" : item.IDNum,
            "expfrag" : item.expFrag,
            "expDmg" : item.expDamage,
            "expSpot" : item.expSpot,
            "expDef" : item.expDef,
            "expWin" : item.expWinRate,
            });
        });
    });
    console.log(Wn8Array);
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
            myTankArray.push({
            "Name": item.tank_id,
            "WinAmount":  item.statistics.wins,
            "BattleAmount":item.statistics.battles,
            "Mastery": item.mark_of_mastery
            });
            
        });
       
        getTankStats(myTankArray);
        
    return false;
    });
}

function getTankStats(myTankArray) {
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
                TankArray.push({
                    "Name": data[key].name,
                    "Nation":data[key].nation,
                    "Type":data[key].type,
                    "Level": data[key].level,
                    "Tank_Id": data[key].tank_id
                });
            });
        //combine the to datasets (player-vehicle with vehicle stats)
        CombineArray(TankArray, myTankArray);
        return false;
        });
}

function CombineArray(TankArray, myTankArray) {
//*****************************************************************************************************************************//
//          This function will combine the player tankss list with the tank list to get battle results per nation, level, type //
//          Also comverting the tank type to a short name which is mostly used and know by the players                         //
//          Also calculating the winrate per tank based on the wins and battles fought                                         //
//*****************************************************************************************************************************//    
    var TankStats = [];
    Object.keys(myTankArray).forEach(function(key1){
        Object.keys(TankArray).forEach(function(key2){
            var Type = TankArray[key2].Type;
            if (myTankArray[key1].Name == TankArray[key2].Tank_Id) {
                if (Type == "heavyTank") {
                    Type = "HT";
                } else if (Type == "AT-SPG") {
                    Type = "TD";
                } else if (Type == "mediumTank") {
                    Type = "MT";
                } else if (Type == "lightTank") {
                    Type = "LT";
                } 
                
                TankStats.push({
                    "TankID": TankArray[key2].Tank_Id,
                    "Name": getSecondPartOfSecondPart(getSecondPart(TankArray[key2].Name)),
                    "Nation":TankArray[key2].Nation,
                    "Type":Type,
                    "Level": TankArray[key2].Level,
                    "Wins": myTankArray[key1].WinAmount,
                    "Battles": myTankArray[key1].BattleAmount,
                    "Mark": myTankArray[key1].Mastery,
                    "Winrate": ((myTankArray[key1].WinAmount / myTankArray[key1].BattleAmount) * 100).toFixed(2),
                }); 
            }
        });
        
    });
    console.log(TankStats)
    return false;
}

function getSecondPart(str) {
    return str.split(':')[1];
}
function getSecondPartOfSecondPart(str) {
    return str.split(/_(.+)/)[1];
}



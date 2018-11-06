
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
        xhr.open("GET", "https://api.worldoftanks.eu/wot/tanks/stats/?application_id=5d6d1657c5bc736658f1e6aa3dcb5f6e&account_id="+ arg + "&fields=all%2C+tank_id")
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
 

function getJSONFile(TankStats) {
//*********************************************************************************************************************//
//          This function will import a JSON FILE which contains expected tank values in order to calculate WN8 scores.//
//          http://wiki.wnefficiency.net/pages/WN8                                                                     //
//          http://www.wnefficiency.net/wnexpected/                                                                   //
//********************************************************************************************************************//
    var Wn8Array = [];
    var b = 0;
    var wn = 0;
    var avgWn = 0;
    
    loadJSON("./assets/data/WN8.json", function(callback) {
        var actual_JSON = JSON.parse(callback);
        actual_JSON.forEach(function(item) {
            Wn8Array.push({
            "IDNum" : item.IDNum,
            "expFrag" : item.expFrag,
            "expDmg" : item.expDamage,
            "expSpot" : item.expSpot,
            "expDef" : item.expDef,
            "expWin" : item.expWinRate,
            });
        });
        calculateWn8(TankStats, Wn8Array)
    });
} 
   
function calculateWn8(TankStats, Wn8Array){
//*********************************************************************************************************************//
//          This function will combine the object created from JSON import with the Tanks Stats and will calculate    //
//          the WN8 score per tank, and stores that in a new Object which contains now all Tank data + WN8 score      //
//********************************************************************************************************************//    
var found = ""
var TankWn8 = [];
    Object.keys(TankStats).forEach(function(key1){
        Object.keys(Wn8Array).forEach(function(key2){
            if (TankStats[key1].TankID == Wn8Array[key2].IDNum) {
                
                var rDAMAGE = (TankStats[key1].avg_dmg / Wn8Array[key2].expDmg);
                var rSPOT = (TankStats[key1].avg_spot / Wn8Array[key2].expSpot);
                var rFRAG = (TankStats[key1].avg_frags / Wn8Array[key2].expFrag);
                var rDEF = (TankStats[key1].avg_dcp / Wn8Array[key2].expDef);
                var rWIN = (TankStats[key1].avg_wins / Wn8Array[key2].expWin);
            
                var rWINc = Math.max(0,(rWIN - 0.71) / (1 - 0.71));
                var rDAMAGEc = Math.max(0,(rDAMAGE - 0.22) / (1 - 0.22));
                var rFRAGc = Math.max(0, Math.min(rDAMAGEc + 0.2, (rFRAG - 0.12) / (1 - 0.12)));
                var rSPOTc = Math.max(0, Math.min(rDAMAGEc + 0.1, (rSPOT - 0.38) / (1 - 0.38)));
                var rDEFc = Math.max(0, Math.min(rDAMAGEc + 0.1, (rDEF - 0.10) / (1 - 0.10)));
                
                var WN8 = (980*rDAMAGEc + 210*rDAMAGEc*rFRAGc + 155*rFRAGc*rSPOTc + 75*rDEFc*rFRAGc + 145*Math.min(1.8,rWINc)).toFixed(2);
                
                TankWn8.push({
                    "Tank_id": TankStats[key1].TankID,
                    "TankName" : TankStats[key1].Name,
                    "Level":  TankStats[key1].Level,
                    "Type":  TankStats[key1].Type,
                    "Nation":  TankStats[key1].Nation,
                    "Wins": TankStats[key1].wins,
                    "Battles": TankStats[key1].battles,
                    "Avg_wins":TankStats[key1].avg_wins,
                    "WN8" : WN8,
                    "All" : "All"
                });
                console.log(TankStats[key1].TankID, found)
                found = false;
                return;
            }
            
        });
        
    });
    console.log(TankWn8)
    makeGraphs(TankWn8)
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
                $('#Comments').addClass("hidden");
                $('#stats-section').removeClass("hidden");
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
        getAccountTankStats(account)
        
    return false;
    });
}

function getAccountTankStats(acc_id){
//****************************************************************************************************************************//
//          This function will call the API to get the Extended Tanks statistics results back based on the found Accound ID   //
//          This information is needed to compare with the expected Tank stats in order to calculate the WN8 per Tannk vehicle//
//****************************************************************************************************************************//   
    var type = "vehicle-stats";
    var arg = acc_id.toString();
    var Battles = 0;
    getDataFromApi(type, arg, function(data) {

        var account = acc_id;
        var myTankStatsArray = [];
        data = data.data[account];
        // console.log(data);
        Object.keys(data).forEach(function(key) {
                Battles = parseInt(data[key].all.battles);
                if (Battles > 0) {
                    myTankStatsArray.push({
                        "battles": data[key].all.battles,
                        "capture_points":data[key].all.capture_points,
                        "avg_cp":(data[key].all.capture_points / data[key].all.battles).toFixed(3),
                        "damage_dealt":data[key].all.damage_dealt,
                        "avg_dmg": (data[key].all.damage_dealt / data[key].all.battles).toFixed(3),
                        "spotted": data[key].all.spotted,
                        "avg_spot": (data[key].all.spotted / data[key].all.battles).toFixed(3),
                        "frags": data[key].all.frags,
                        "avg_frags": (data[key].all.frags / data[key].all.battles).toFixed(3),
                        "dropped_capture_points": data[key].all.dropped_capture_points,
                        "avg_dcp":(data[key].all.dropped_capture_points / data[key].all.battles).toFixed(3),
                        "wins": data[key].all.wins,
                        "avg_wins":(data[key].all.wins / data[key].all.battles*100).toFixed(3),
                        "tank_id": data[key].tank_id
                    });
                }
            });
    getTankData(myTankStatsArray);
    return false;
    });
}


function getTankData(myTankStatsArray) {
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
        CombineArray(TankArray, myTankStatsArray);
        return false;
        });
}

function CombineArray(TankArray, myTankStatsArray) {
//*****************************************************************************************************************************//
//          This function will combine the player tankss list with the tank list to get battle results per nation, level, type //
//          Also comverting the tank type to a short name which is mostly used and know by the players                         //
//          Also calculating the winrate per tank based on the wins and battles fought                                         //
//*****************************************************************************************************************************//    
    var TankStats = [];
    
    Object.keys(myTankStatsArray).forEach(function(key1){
        Object.keys(TankArray).forEach(function(key2){
            var Type = TankArray[key2].Type;
            if (myTankStatsArray[key1].tank_id == TankArray[key2].Tank_Id) {
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
                    "battles": myTankStatsArray[key1].battles,
                    "capture_points":myTankStatsArray[key1].capture_points,
                    "avg_cp":myTankStatsArray[key1].avg_cp,
                    "damage_dealt":myTankStatsArray[key1].damage_dealt,
                    "avg_dmg": myTankStatsArray[key1].avg_dmg,
                    "spotted": myTankStatsArray[key1].spotted,
                    "avg_spot": myTankStatsArray[key1].avg_spot,
                    "frags": myTankStatsArray[key1].frags,
                    "avg_frags": myTankStatsArray[key1].avg_frags,
                    "dropped_capture_points": myTankStatsArray[key1].dropped_capture_points,
                    "avg_dcp":myTankStatsArray[key1].avg_dcp,
                    "wins": myTankStatsArray[key1].wins,
                    "avg_wins":myTankStatsArray[key1].avg_wins
                });
            }
        });
        
    });
    getJSONFile(TankStats);
    
    return false;
}

function getSecondPart(str) {
    return str.split(':')[1];
}
function getSecondPartOfSecondPart(str) {
    return str.split(/_(.+)/)[1];
}
// ******************************************************************************************************************//
//                                          Making the GRAPH Section                                                 //
// ******************************************************************************************************************//
function makeGraphs(transactionsData) {
    var List = [];
    console.log(transactionsData)
    
    transactionsData.forEach(function(d){
        d.Avg_wins = parseInt(d.Avg_wins);
        d.Wins = parseInt(d.Wins);
        d.Battles = parseInt(d.Battles);
        d.Level = parseInt(d.Level);
        d.WN8 = parseInt(d.WN8);
        
    });
    
    var ndx = crossfilter(transactionsData);
    
    show_selectors(ndx);
    makeGraphsWinRate(ndx);
    makeGraphsWN8(ndx);
    MakePieChart(ndx);
    MakePieChartLevel(ndx);
    MakePieChartNation(ndx);
    makeWN8(ndx);
    MakeDataTable(ndx)
    MakeDataTableSmall(ndx)
        
    dc.renderAll();
}

function show_selectors(ndx) {
    var disciplineDimLevel = ndx.dimension(dc.pluck("Level"));
    var disciplineSelectLevel = disciplineDimLevel.group();
    
    var disciplineDimType = ndx.dimension(dc.pluck("Type"));
    var disciplineSelectType = disciplineDimType.group();
    
    var disciplineDimType = ndx.dimension(dc.pluck("Nation"));
    var disciplineSelectNation = disciplineDimType.group();
    
    dc.selectMenu("#Level_selector")
        .dimension(disciplineDimLevel)
        .group(disciplineSelectLevel)

    dc.selectMenu("#Level_selector2")
        .dimension(disciplineDimLevel)
        .group(disciplineSelectLevel)    
    
    dc.selectMenu("#Type_selector")
        .dimension(disciplineDimType)
        .group(disciplineSelectType);    
    
        dc.selectMenu("#Type_selector2")
        .dimension(disciplineDimType)
        .group(disciplineSelectType);
        
    dc.selectMenu("#Nation_selector")
        .dimension(disciplineDimType)
        .group(disciplineSelectNation);  
}

function makeGraphsWinRate(ndx) {
var dim = ndx.dimension(dc.pluck('Level'));
        var group = dim.group().reduce(
            function (p, v) {
                p.Count++;
                p.Wins += v.Wins;
                p.Battles += v.Battles;
                p.Average = p.Wins / p.Battles;
                return p;
            },
            function (p, v) {
                p.Count--;
                if (p.Count == 0) {
                    p.Wins = 0;
                    p.Battles = 0;
                    p.Average = 0;
                } else {
                    p.Wins -= v.Wins;
                    p.Battles -= v.Battles;
                    p.Average = p.Wins / p.Battles;
                }
                return p;
            },
            function () {
                return {Wins: 0, Count: 0, Average: 0, Battles: 0};
            }
        );
     
    var chart = dc.barChart("#bar-chart-winrate");
    chart
        .width(400)
        .height(300)
        .margins({ top: 10, right: 150, bottom: 50, left: 50 })
        .dimension(dim)
        .group(group)
        .renderHorizontalGridLines(true)
        .valueAccessor(function (p) {
            return p.value.Average.toFixed(4);
        })
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .elasticY(true)
        .colorAccessor(function (d) {
            return d.key;
        })
        .xAxisLabel("Level")
        .yAxis().ticks(9);

}

function makeGraphsWN8(ndx) {
var dim = ndx.dimension(dc.pluck('Type'));
        var group = dim.group().reduce(
            function (p, v) {
                p.Count++;
                p.Battles += v.Battles;
                p.WN8 += parseInt((v.WN8 * v.Battles).toFixed(2));
                p.Average = parseInt((p.WN8 / p.Battles).toFixed(2)); 
                return p;
            },
            function (p, v) {
                p.Count--;
                if (p.Count == 0) {
                    p.WN8 = 0;
                    p.Battles = 0;
                    p.Average = 0;
                } else {
                    
                    p.Battles -= v.Battles;
                    p.WN8 -= parseInt((v.WN8 * v.Battles).toFixed(2));
                    p.Average = parseInt((p.WN8) / p.Battles).toFixed(2);
                }
                return p;
            },
            function () {
                return {WN8: 0, Count: 0, Average: 0, Battles: 0};
            }
                
        );
    

    var chart = dc.barChart("#bar-chart-wn8");
    chart
        .width(400)
        .height(300)
        .margins({ top: 10, right: 150, bottom: 50, left: 50 })
        .dimension(dim)
        .group(group)
        .renderHorizontalGridLines(true)
        .valueAccessor(function (p) {
            return p.value.Average;
        })
        .x(d3.scale.ordinal())
        .y(d3.scale.linear())
        .xUnits(dc.units.ordinal)
        // .yUnits(dc.units.linear)
        .elasticY(true)
        .colorAccessor(function (d) {
            return d.key;
        })
        .xAxisLabel("Level")
        .yAxis().ticks();

}

function makeWN8(ndx) {
var dim = ndx.dimension(dc.pluck('All'));
        var group = dim.group().reduce(
            function (p, v) {
                p.Count++;
                p.Battles += v.Battles;
                p.WN8 += parseInt((v.WN8 * v.Battles).toFixed(2));
                p.Average = parseInt((p.WN8 / p.Battles).toFixed(2)); 
                return p;
            },
            function (p, v) {
                p.Count--;
                if (p.Count == 0) {
                    p.WN8 = 0;
                    p.Battles = 0;
                    p.Average = 0;
                } else {
                    
                    p.Battles -= v.Battles;
                    p.WN8 -= parseInt((v.WN8 * v.Battles).toFixed(2));
                    p.Average = parseInt((p.WN8) / p.Battles).toFixed(2);
                }
                return p;
            },
            function () {
                return {WN8: 0, Count: 0, Average: 0, Battles: 0};
            }
                
        );
    

    var chart = dc.barChart("#bar-wn8");
    chart
        .width(400)
        .height(300)
        .margins({ top: 10, right: 150, bottom: 50, left: 50 })
        .dimension(dim)
        .group(group)
        .renderHorizontalGridLines(true)
        .valueAccessor(function (p) {
            return p.value.Average;
        })
        .x(d3.scale.ordinal())
        .y(d3.scale.linear())
        .xUnits(dc.units.ordinal)
        // .yUnits(dc.units.linear)
        .elasticY(true)
        .colorAccessor(function (d) {
            return d.key;
        })
        // .xAxisLabel("Level")
        .yAxis().ticks();

}

function MakePieChart(ndx){
    
    var name_dim = ndx.dimension(dc.pluck('Type'));
    var total_battles = name_dim.group().reduceSum(dc.pluck('Battles'));
    
    dc.pieChart('#Type-chart')
        .height(300)
        .width(380)
        .radius(90)
        .transitionDuration(1500)
        .dimension(name_dim)
        .group(total_battles)
        .legend(dc.legend().x(15).y(25).itemHeight(10).gap(5));

    
}

function MakePieChartLevel(ndx){
    
    var name_dim = ndx.dimension(dc.pluck('Level'));
    var total_battles = name_dim.group().reduceSum(dc.pluck('Battles'));
    
    dc.pieChart('#Level-chart')
        .height(300)
        .width(380)
        .radius(90)
        .transitionDuration(1500)
        .dimension(name_dim)
        .group(total_battles)
        .ordering(function(d) { return d.key })
        .legend(dc.legend().x(15).y(25).itemHeight(10).gap(5));

    
}

function MakePieChartNation(ndx){
    
    var name_dim = ndx.dimension(dc.pluck('Nation'));
    var total_battles = name_dim.group().reduceSum(dc.pluck('Battles'));
    
    dc.pieChart('#Nation-chart')
        .height(300)
        .width(380)
        .radius(90)
        .transitionDuration(1500)
        .dimension(name_dim)
        .group(total_battles)
        .ordering(function(d) { return d.key })
        .legend(dc.legend().x(15).y(25).itemHeight(10).gap(5));

    
}

function MakeDataTable(ndx){

    var Dim = ndx.dimension(function (d) {return d.TankName;})
    dc.dataTable("#Table")
      .width(250).height(800)
      .dimension(Dim)
      .group(function(d) {return ' '})
      .size(205)             // number of rows to return
      .columns([
      function(d) { return d.TankName;},
      function(d) { return d.Nation;},
      function(d) { return d.Type;},
      function(d) { return d.Level;},
      function(d) { return d.Battles;},
      function(d) { return d.Avg_wins;},
      function(d) { return d.WN8;},
    ])
      .sortBy(function(d){ return d.Winrate;})
      .order(d3.descending);

dc.renderAll();
    
}

function MakeDataTableSmall(ndx){

    var Dim = ndx.dimension(function (d) {return d.TankName;})
    dc.dataTable("#TableSmall")
      .width(250).height(800)
      .dimension(Dim)
      .group(function(d) {return ' '})
      .size(205)             // number of rows to return
      .columns([
      function(d) { return d.TankName;},
      function(d) { return d.Avg_wins;},
      function(d) { return d.WN8;},
    ])
      .sortBy(function(d){ return d.Avg_wins;})
      .order(d3.descending);

dc.renderAll();
    
}
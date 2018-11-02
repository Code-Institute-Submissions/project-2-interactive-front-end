function getDataFromApi(type, arg, cb) {
//function to connect to the API of World of tanks, extended with the search type and parameter//
//option 1: search player name to Get Account ID//
//option 2: search account_id to get player statistics//
//option 3: search account_id to get player vs vehicle stats
//option 4: search for all tanks to get the tank name, level, nation//
//Option 5: search for specific tank stats
    
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
    
    //first type is always nickname
    var type = "nickname"
    var arg = document.getElementById("inputNickname").value;
    //var type = "search=" + document.getElementById("uname").value;
    var Accountid = "" ;
    // get the account_id from the player that is filled in the input field//
    getDataFromApi(type, arg,  function(data) {
        var respLen = data.meta.count;
        data = data.data["0"];
        
            if (respLen == 0) {
                alert('Invalid Name, please try again');
            }
            else {
                Accountid = data['account_id']
                document.getElementById("NickName").innerHTML = "Overall player statistics for: " + data['nickname'] ;
            }
    return false;
    });
}
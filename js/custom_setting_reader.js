(function(e) {
    'use strict';
    document.querySelector("button").onclick = function() {
        var botCounts = Number(document.querySelector("form > p:nth-child(1) > label:nth-child(1) > input[type=number]").value);
        var sortType = document.querySelector("#chkbx_s").checked ? "random" : (function() {
            return document.querySelector("#shuffleCustom > label:nth-child(2) > input[type=radio]").checked ? "middle" : (function() {
                return document.querySelector("#shuffleCustom > label:nth-child(1) > input[type=radio]").checked ? "first" : "last";
            })();
        })();
        var timeLimits = Number(document.querySelector("form > p:nth-child(1) > label:nth-child(4) > input[type=number]").value);
        var difficulty = document.querySelector('input[type="radio"][name="difficulty"][value="Normal"]').checked ? "Normal" : (function() {
            return document.querySelector('input[type="radio"][name="difficulty"][value="Easy"]').checked ? "Easy" : (function() {
                return document.querySelector('input[type="radio"][name="difficulty"][value="Hard"]').checked ? "Hard" : "Insane";
            })();
        })();


        e.user_settings = ({
            "bots": botCounts,
            "difficulty": difficulty,
            "nickname": document.querySelector("#playground > main > div > div > div:nth-child(3) > input[type=text]").value,
            "sortType": sortType,
            "timeLimits": timeLimits
        });
    }
})(this)
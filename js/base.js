(function($, _) {
    function Playground(Config) {
        /**
         * 1. 게임 시작 =>
         * 2. 사운드 재생
         * 3. 사운드 끝나고 첫번째 턴에 대상자에게 몇 마리인지 받기
         * 4. 다음턴으로 넘기기
         * 5. 잡았다, 놓쳤다, 도망갔다 중 뭘 선택했는지 입력받기
         * 6. 다 잡았는지 체크
         * 7. 다 잡았다면 만세타임~
         * 8. 1.5초후 플레이어가 만세했는지 체크
         * 9. 나머지 봇들 만세 랜더링
         * 
         */
        gameLoop();
        console.log("gameloop")


        function gameLoop() {
            var player = Config.players[Config.turn];

            if (Config.mice == undefined) {
                if (player.type == "Player") {
                    var dclr = window.prompt("몇 마리?");

                    player.playerNode.declare(dclr);
                } else {
                    var Min = 2,
                        Max = Config.players.length + 1,
                        Offset = {
                            "Easy": 1,
                            "Normal": 2,
                            "Hard": 4,
                            "Insane": 6
                        };
                    
                    player.playerNode.declare(Math.floor(
                        Math.random() * ((Max - Min) * Offset[Config.difficulty]) + Min * Offset[Config.difficulty]
                    ));
                }
            } else {
                console.log("loop")
                if (player.type == "Bot") {
                    Config.timer = setTimeout(function() {
                        console.log(false)
                        // 봇일때 시간 안에 해야할것
                        switch(Math.floor(Math.random() * 3)) {
                            case 0:
                                player.playerNode.caught();
                                break;
                            case 1:
                                player.playerNode.missed();
                                break;
                            case 2:
                                player.playerNode.fled();
                                break;
                        }

                    }, Math.random() * Config.timeLimits * 1000);
                } else {
                    Config.timer = setTimeout(function() {
                        
                    }, Config.timeLimits * 1000);
                }
            }
        }
    }

    

    


    $.play = function(){Playground($.Config)};
    $.Initalize = function(config) {
        var settings = {
            "players": [],
            "turn": 0,
            "counts": 0,
            "mice": undefined,
            "difficulty": config.difficulty,
            "timeLimits": config.timeLimits,
            "timer": null,
            "needToHurray": false
        }

        var template = document.querySelector("template");

        function createPlayerNode(isBot, nickname) {
            return {
                "nickname": (isBot ? "봇:" : "나:")+(nickname ? nickname : "Unnamed"),
                "type": isBot ? "Bot" : "Player",
                "playerNode": (function(inner) {
                    var inner = inner.cloneNode(true);
                    inner.querySelectorAll("p")[1].innerText = (isBot ? "봇:" : "나:")+(nickname ? nickname : "Unnamed");

                    var r = inner.querySelector("div");

                    r.declare = function(t) {
                        var game = window.Config;

                        game.mice = Number(t);
                        document.querySelector("[data-scope='RoomTitle'] span").innerText = game.mice;
                        nextSeq();
                        window.play();
                    }

                    r.caught = function() {
                        var game = window.Config;
                        clearTimeout(game.timer);

                        if (!game.needToHurray) {
                            game.counts++;
                            r.querySelector("p").innerText = "잡았다! 💥";
                            setTimeout(function() {
                                r.querySelector("p").innerText = "♩ ♪ ♫ ♬";
                            } ,1000);

                            new Audio("./sounds/caught.m4a").play();
                            setTimeout(function() {
                                new Audio("./sounds/caught_effect.m4a").play();
                            }, 200);
                            

                            if (game.counts >= game.mice) {
                                game.needToHurray = true;
                                game.timer = setTimeout(function() {
                                    game.players.filter(function(e) {
                                        return e.type == "Bot";
                                    }).forEach(function(e) {
                                        e.playerNode.querySelector("p").innerText = "만세! 🙌";
                                    });

                                    window.alert("이런~! 만세를 외쳐야해요!\n아쉽지만, 탈락입니다!");
                                    location.reload();
                                } , 750);
                            } else if (isBot) { // 봇의 의도적인 실수;
                                var base = Math.random();
                                var Offset = { 
                                    "Easy": .8,
                                    "Normal": .6,
                                    "Hard": .4,
                                    "Insane": .2
                                };

                                var correction = 1;

                                var v1 = game.players.length/8; // 사람이 적을 수록 실수할 확률이 낮게
                                var v2 = Offset[game.difficulty]; // 난이도를 높게 설정할 수록 실수할 확률이 낮게
                                var v3 = (game.mice - game.counts) * 2; // 목표 숫자에 근접할 수록 실수할 확률이 높게

                                var posiblility = function() {
                                    return (v1 * v2 / v3) * correction
                                }

                                if (base < posiblility()) {
                                    setTimeout(function() {
                                        r.querySelector("p").innerText = "만세! 🙄";
                                        setTimeout(function() {
                                            clear(game.turn);
                                        }, 500);
                                    } , 450);
                                } else {
                                    nextSeq();
                                    window.play();
                                }
                            } else {
                                nextSeq();
                                window.play();
                            }
                        } else {
                            new Audio("./sounds/caught.m4a").play();
                            r.querySelector("p").innerText = "잡았다! 💥";

                            if (!isBot) {
                                setTimeout(function() {
                                    alert("이런~! 만세를 외쳐야해요!\n아쉽지만, 탈락입니다!");
                                    location.reload();
                                }, 500);
                            } else {
                                clearTimeout(game.timer);
                                setTimeout(function() {
                                    clear(game.turn);
                                }, 2000);
                            }
                        }
                    }

                    r.missed = function() {
                        var game = window.Config;
                        clearTimeout(game.timer);

                        if (game.needToHurray) {
                            setTimeout(function() {
                                alert("이런~! 만세를 외쳐야해요!\n아쉽지만, 탈락입니다!");
                                location.reload();
                            }, 500);
                        } else {
                            r.querySelector("p").innerText = "놓쳤다! 💢";
                            setTimeout(function() {
                                r.querySelector("p").innerText = "♩ ♪ ♫ ♬";
                            } ,1000);

                            nextSeq();
                            window.play();
                        }
                    }

                    r.fled = function() {
                        var game = window.Config;
                        clearTimeout(game.timer);

                        if (game.needToHurray) {
                            setTimeout(function() {
                                alert("이런~! 만세를 외쳐야해요!\n아쉽지만, 탈락입니다!");
                                location.reload();
                            }, 500);
                        } else {
                            if (isBot && game.counts < 1) {
                                r.querySelector("p").innerText = "놓쳤다! 💢";
                                setTimeout(function() {
                                    r.querySelector("p").innerText = "♩ ♪ ♫ ♬";
                                } ,1000);
                            } else {
                                if (game.counts < 1) {
                                    setTimeout(function() {
                                        alert("이런~! 도망갈 쥐가 없었어요~ \n 아쉽지만, 탈락입니다!");
                                        location.reload();
                                    }, 500);
                                }
                                game.counts--;
                                r.querySelector("p").innerText = "도망갔다! 💨";
                                setTimeout(function() {
                                    r.querySelector("p").innerText = "♩ ♪ ♫ ♬";
                                } ,1000);
                            }

                            nextSeq();
                            window.play();
                        }
                    }

                    r.hurray = function() {
                        var game = window.Config;
                        var o = false;

                        if (game.needToHurray) {
                            clearInterval(game.timer);
                            game.needToHurray = false;
                            r.querySelector("p").innerText = "만세! 🙌";
                            game.players.filter(function(e) {
                                return e.type == "Bot";
                            }).forEach(function(e) {
                                if (!o && Math.random() < .6) {
                                    o = true;
                                    e.playerNode.querySelector("p").innerText = "(멀뚱?) 🥱";

                                    setTimeout(function() {
                                       clear(game.players.findIndex(function(t){
                                           return t.nickname == e.nickname;
                                       })); 
                                    }, 500);
                                } else {
                                    e.playerNode.querySelector("p").innerText = "만세! 🙌";
                                }
                            });
                            game.counts = 0;
                            game.mice = undefined;

                            nextSeq();
                            if (!o) {
                                window.play();
                            }
                        } else {
                            setTimeout(function() {
                                alert("이런~! 아직 만세를 하면 안돼요!\n아쉽지만 탈락입니다.");
                                location.reload();
                            }, 500);
                        }
                    }

                    if (!isBot) {
                        document.querySelector("[data-scope='Catch']").onclick = r.caught;
                        document.querySelector("[data-scope='Miss']").onclick = r.missed;
                        document.querySelector("[data-scope='Flee']").onclick = r.fled;
                        document.querySelector("[data-scope='Hurray']").onclick = r.hurray;
                    }

                    return r;
                })(template.content)
            }
        }

        function nextSeq() {
            var game = window.Config;
            game.turn = game.players.length == ++game.turn ? 0 : game.turn;
        }

        function clear(idx) {
            window.alert(window.Config.players[idx].nickname +"님의 실수!");
            window.Config.players[idx].playerNode.style.display = "none";
            window.Config.players.splice(idx, 1);

            if (window.Config.players.length == 1) {
                window.alert("대단하시군요! 당신이 승리하였습니다.");
                location.reload();
            } else {
                window.alert("게임을 이어서 시작합니다.");
                window.Config.mice = undefined;
                window.Config.counts = 0;
                window.Config.needToHurray = false;

                window.play();
            }

        }

        function GetFunnyBotName(bot_count) {
            // https://m.blog.naver.com/modelo17/221234730193
            var name_set = [
                "아프리카청춘이다",
                "벼랑위의당뇨",
                "니이모를찾아서",
                "거져줄게잘사가",
                "넌내게목욕값을줬어",
                "돈들어손내놔",
                "닮은살걀",
                "아무리생강캐도난마늘",
                "어머니는짜장면에밥까지드셨어",
                "헬리콥터와마법사의똥",
                "신밧드의보험",
                "오즈의맙소사",
                "짱구는목말러",
                "달려야하니",
                "빨간망든차차",
                "메뚜기3분요리",
                "티끌모아파산",
                "여자라서햄볶아요",
                "톱과젤리",
                "흔들린우동",
                "난앓아요",
                "천국의계란",
                "백마타고온환자",
                "세일러묵",
                "이쑤신장군",
                "곰탕재료푸우",
                "순대렐라",
                "반만고양이",
                "미션임파선염",
                "추적60인분",
                "오드리될뻔",
                "올리비아핫바",
                "친정간금자씨",
                "옥수수콧수염차",
                "대추나무사람걸렸네",
                "은하철도구부려",
                "명란젓코난",
                "축구싶냐농구있네",
                "기회를위기로", // haha
            ];
    
            var result = [];
            var _e = (name_set.length - bot_count);
    
            while (name_set.length > _e) {
                result.push(name_set.splice(Math.floor(Math.random() * name_set.length), 1)[0]);
            }
    
            return result;
        }

        (function MainActivity($, _) {

            var botsnicks = GetFunnyBotName($.bots);

            botsnicks.forEach(function(name) {
                _.players.push(createPlayerNode(true, name));
            });

            if ($.sortType == "first") {
                _.players.unshift(createPlayerNode(false, $.nickname));
            } else if ($.sortType == "last") {
                _.players.push(createPlayerNode(false, $.nickname));
            } else if($.sortType == "middle") {
                _.players.splice(Math.floor(_.players.length/2), 0, createPlayerNode(false, $.nickname))
            } else {
                _.players.push(createPlayerNode(false, $.nickname));
                _.players.sort(function() {
                    return Math.random() - 0.5;
                });
            }

            _.difficulty = $.difficulty;
            _.timeLimits = $.timeLimits;

            _.players.forEach(function(e) {
                document.querySelector('[data-scope="PlayerBox"]').appendChild(e.playerNode);
            })
            
            document.querySelector('[data-label="WaitingRoom"]').hidden = true;
            document.querySelector('[data-label="GameCanvasRenderer"]').hidden = false;
            
        })(config, settings);

        $.Config = settings;
        $.play();
    }
    _($);
})(this, function(__Document) {
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


        console.log({
            "bots": botCounts,
            "difficulty": difficulty,
            "nickname": document.querySelector("#playground > main > div > div > div:nth-child(3) > input[type=text]").value,
            "sortType": sortType,
            "timeLimits": timeLimits
        });

        __Document.Initalize({
            "bots": botCounts,
            "difficulty": difficulty,
            "nickname": document.querySelector("#playground > main > div > div > div:nth-child(3) > input[type=text]").value ? document.querySelector("#playground > main > div > div > div:nth-child(3) > input[type=text]").value : "Unnamed",
            "sortType": sortType,
            "timeLimits": timeLimits
        })
    }
})
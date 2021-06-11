from browser import document, html, timer, window, alert, bind
from browser.widgets.dialog import EntryDialog, InfoDialog
from browser.local_storage import storage
from random import random, shuffle
from math import floor

settings = None

game_session = None

sounds_ = html.AUDIO(src="./sounds/sound_effects.mp3")

# main_song = html.AUDIO(src="./sounds/main_song.m4a")
# catch_sound = html.AUDIO(src="./sounds/caught.m4a")
# catch_sound_s = html.AUDIO(src="./sounds/caught_effect.m4a")
# missed_sound = html.AUDIO(src="./sounds/missed.m4a")
# fled_sound = html.AUDIO(src="./sounds/fled.m4a")

""" @brython(preload) """
# document <= main_song
# document <= catch_sound
# document <= catch_sound_s
# document <= missed_sound
# document <= fled_sound




def toggle_shuffle_chkbox(event):
    if document["chkbx_s"].checked:
        document["shuffleCustom"].style.display = "none"
    else:
        document["shuffleCustom"].style.display = "inline"

document["shuffleChkbx"].bind("click", toggle_shuffle_chkbox)

def you_lose(text):
    alert("{0}\n아쉽지만, 탈락입니다!".format(text))

def get_bot_nicks(c):
    name_set = [
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
        "기회를위기로",
    ]

    result = []

    _e = len(name_set) - c

    while len(name_set) > _e:
        idx = floor(random() * len(name_set))
        result.append(name_set[idx])

        del name_set[idx]
    return result

def game_start(evt):
    global game_session

    settings = window.user_settings

    if settings['nickname'] == "":
        settings['nickname'] = "Unnamed"

    storage["nick"] = settings['nickname']

    players = []
    botnicks = get_bot_nicks(settings["bots"])
    print(botnicks)

    for nick in botnicks:
        players.append(Player(True, nick))

    if settings["sortType"] == "first":
        players.insert(0, Player(False, settings["nickname"]))
    elif settings["sortType"] == "last":
        players.append(Player(False, settings["nickname"]))
    elif settings["sortType"] == "middle":
        players.insert(floor(len(players)/2), Player(False, settings["nickname"]))
    else:
        players.append(Player(False, settings["nickname"]))
        shuffle(players)

    for player in players:
        document.select('[data-scope="PlayerBox"]')[0] <= player.view_dom
    
    document.select('[data-label="WaitingRoom"]')[0].hidden = True
    document.select('[data-label="GameCanvasRenderer"]')[0].hidden = False

    game_session = Game(players, settings['difficulty'], settings['timeLimits'])


    
    


class Player:
    def __init__(self, is_bot, nickname) -> None:

        PlayerView = document.select("template")[0].content.cloneNode(True)

        self.bot = is_bot
        
        if is_bot:
            self.nickname = "봇:"
        else:
            self.nickname = "(나) "
        self.nickname += nickname

        PlayerView.select("p")[1].text = self.nickname
        self.view_dom = PlayerView.select("div")[0]

        if not is_bot:
            document.select("[data-scope='Catch']")[0].bind("click", self.mouse_caught)
            document.select("[data-scope='Miss']")[0].bind("click", self.mouse_missed)
            document.select("[data-scope='Flee']")[0].bind("click", self.mouse_fled)
            document.select("[data-scope='Hurray']")[0].bind("click", self.mouse_hurray)

    def my_turn(self):
        return game_session.players[game_session.turn] == self

    def view_state(self, text, img="player_cat.PNG"):
        self.view_dom.select("p")[0].text = text
        self.view_dom.select("img")[0].src = "./img/{0}".format(img)

    def mouse_caught(self, event):
        if self.my_turn():
            self.responded()
            sounds_.currentTime = 25
            timer.set_timeout(lambda: sounds_.pause() ,430)
            sounds_.play()
            self.view_state("잡았다! 💥", "player_caught.jpeg")
            if not game_session.hurray_time:
                game_session.counts += 1
                timer.set_timeout(lambda: self.view_state("♩ ♪ ♫ ♬"), 900)
                game_session.next_seq()

                if game_session.counts >= game_session.mice:
                    def timeout():
                        bots = filter(lambda x: x.bot, game_session.players)

                        for bot in bots:
                            bot.view_dom.select("p")[0].text = "만세! 🙌"
                        
                        timer.set_timeout(lambda: you_lose("이런~! 만세를 외쳐야해요!"), 10)
                        timer.set_timeout(lambda: window.location.reload(), 10)

                    game_session.hurray_time = True
                    game_session.timer = timer.set_timeout(timeout, 750)

                elif self.bot:
                    base = random()
                    offset = {
                        "Easy": .8,
                        "Normal": .6,
                        "Hard": .4,
                        "Insane": .2
                    }
                    correction_value = 1

                    v1 = len(game_session.players)/8
                    v2 = offset[game_session.difficulty]
                    v3 = (game_session.mice - game_session.counts) * 2

                    def posibility():
                        return (v1 * v2 / v3) * correction_value
                    
                    if base < posibility():
                        timer.set_timeout(lambda: self.view_state("만세? 🙄"), 450)
                        timer.set_timeout(self.clear, 550)
                    else:
                        game_session.turn_begin()
                else:
                    game_session.turn_begin()

            else:
                if self.bot:
                    pass
                else:
                    you_lose("이런~! 만세를 외쳐야해요!")
                    window.location.reload()

        else:
            print("아직 당신의 차례가 아닙니다.")

    def mouse_missed(self, event):
        if self.my_turn():
            self.responded()
            sounds_.currentTime = 25.4
            timer.set_timeout(lambda: sounds_.pause() ,420)
            sounds_.play()
            self.view_state("놓쳤다! 💢", "player_missed.PNG")
            if game_session.hurray_time:
                if self.bot:
                    pass
                else:
                    you_lose("이런~! 만세를 외쳐야해요!")
                    window.location.reload()
            else:
                timer.set_timeout(lambda: self.view_state("♩ ♪ ♫ ♬"), 900)
                game_session.next_seq()
                game_session.turn_begin()
        else:
            print("아직 당신의 차례가 아닙니다.")

    def mouse_fled(self, event):
        if self.my_turn():
            self.responded()
            if game_session.hurray_time:
                if self.bot:
                    pass
                else:
                    sounds_.currentTime = 25.8
                    timer.set_timeout(lambda: sounds_.pause() ,420)
                    sounds_.play()
                    you_lose("이런~! 만세를 외쳐야해요!")
                    window.location.reload()
            else:
                if self.bot and game_session.counts < 1:
                    sounds_.currentTime = 25.4
                    timer.set_timeout(lambda: sounds_.pause() ,420)
                    sounds_.play()
                    self.view_state("놓쳤다! 💢", "player_missed.PNG")
                else:
                    sounds_.currentTime = 25.8
                    timer.set_timeout(lambda: sounds_.pause() ,420)
                    sounds_.play()
                    self.view_state("도망갔다! 💨", "player_fled.PNG")
                    if game_session.counts < 1:
                        you_lose("이런~ 도망갈 쥐가 없어요~")
                        window.location.reload()
                    else:
                        game_session.counts -= 1
                
                timer.set_timeout(lambda: self.view_state("♩ ♪ ♫ ♬"), 900)
                
                game_session.next_seq()
                game_session.turn_begin()

                    
        else:
            print("아직 당신의 차례가 아닙니다.")

    def mouse_hurray(self, event):
        self.view_state("만세! 🙌", "player_hurrayed.PNG")
        timer.set_timeout(lambda: self.view_state("♩ ♪ ♫ ♬"), 400)
        self.responded()
        if game_session.hurray_time:
            game_session.hurray_time = False

            bots = filter(lambda x: x.bot, game_session.players)
            bot_mistaked = False

            for bot in bots:
                if (not bot_mistaked) and (random() < .25):
                    bot_mistaked = True
                    bot.view_state("(멀뚱?) 🥱")
                    timer.set_timeout(bot.clear, 500)
                else:
                    bot.view_state("만세! 🙌", "player_hurrayed.PNG")
                    timer.set_timeout(lambda: bot.view_state("♩ ♪ ♫ ♬"), 400)
            
            game_session.counts = 0
            game_session.mice = None
            
            def Init():
                for element in document.select(".Player__action"):
                    element.text = "♩ ♪ ♫ ♬"

            timer.set_timeout(Init, 400)
            

            if not bot_mistaked:
                game_session.next_seq()
                document.select("[data-scope='RoomTitle'] span")[0].text = "몇"

                sounds_.currentTime = 13.5
                sounds_.play()
                timer.set_timeout(lambda: sounds_.pause(), 1500)
                timer.set_timeout(lambda: game_session.turn_begin(), 1600)
                

        else:
            you_lose("이런~! 아직 만세를 하면 안돼요!")
            window.location.reload()

    def responded(self):
        global game_session

        try:
            timer.clear_timeout(game_session.timer)
        finally:
            game_session.timer = None
        

    def clear(self):
        alert("{nickname}이 실수를 했네요!\n그 봇은 탈락했어요.".format(nickname=self.nickname))
        self.view_dom.style.display = "none"
        game_session.players.remove(self)

        if len(game_session.players) == 1:
            alert("대단하시군요~! 당신이 승리하였습니다!\n축하해요~!")
            window.location.reload()
        else:
            alert("게임은 이어서 시작됩니다!")
            
            game_session.mice = None
            game_session.counts = 0
            game_session.hurray_time = False

            document.select("[data-scope='RoomTitle'] span")[0].text = "몇"

            if len(game_session.players) <= game_session.turn:
                game_session.next_seq()

            sounds_.currentTime = 15.7
            sounds_.play()
            
            timer.set_timeout(lambda: sounds_.pause(), 9300)
            timer.set_timeout(lambda: game_session.turn_begin(), 9400)
            

class Game:
    def __init__(self, players, difficulty, time_limits) -> None:
        self.players = players
        self.turn = 0
        self.counts = 0
        self.mice = None
        self.difficulty = difficulty
        self.time_limits = time_limits
        self.timer = None
        self.hurray_time = False

        sounds_.play()
        timer.set_timeout(lambda: sounds_.pause(), 15750)
        
        timer.set_timeout(lambda: self.turn_begin(), 15800)
        

    def next_seq(self):
        for player in self.players:
            player.view_dom.select("div")[0].style.border = "none"
        self.turn += 1

        print("current counts: %d" % self.counts)
        
        if self.turn >= len(self.players):
            self.turn = 0
        
        self.players[self.turn].view_dom.select("div")[0].style.border = "2px dotted red"

        if not self.players[self.turn].bot:
            document.select("[data-scope='Catch']")[0].disabled = False
            document.select("[data-scope='Miss']")[0].disabled = False
            document.select("[data-scope='Flee']")[0].disabled = False
        else:
            document.select("[data-scope='Catch']")[0].disabled = True
            document.select("[data-scope='Miss']")[0].disabled = True
            document.select("[data-scope='Flee']")[0].disabled = True
    def turn_begin(self):
        
        if self.mice == None:
            if not self.players[self.turn].bot:
                u_input = EntryDialog("몇 마리?", "쥐돌이는 몇 마리?")

                @bind(u_input, "entry")
                def entry(event):
                    u_input.close()
                    try:
                        mice = int(u_input.value)

                        if 1 < mice and mice < 25:
                            self.mice = mice
                            document.select("[data-scope='RoomTitle'] span")[0].text = mice

                            self.next_seq()
                            self.turn_begin()
                        else:
                            confirmo = InfoDialog("발칙한 쥐돌이", "2마리 이상 25마리 미만이어야 해요!", ok="확인했습니다.")
                            @bind(confirmo.ok_button, "click")
                            def __begin(evt):
                                self.turn_begin()
                    except ValueError:
                        confirmo = InfoDialog("발칙한 쥐돌이", "발칙한 쥐돌이의 마릿수를 숫자로 입력해주세요!", ok="확인")
                        @bind(confirmo.ok_button, "click")
                        def __begin(evt):
                            self.turn_begin()
            else:
                Min = 2
                Max = len(self.players)+1
                Offset = {
                    "Easy": 1,
                    "Normal": 2,
                    "Hard": 4,
                    "Insane": 6
                }

                mice = floor(random() * ((Max - Min) * Offset[self.difficulty]) + (Min * Offset[self.difficulty]))

                self.mice = mice
                document.select("[data-scope='RoomTitle'] span")[0].text = mice
                self.next_seq()
                self.turn_begin()
        else:
            if self.players[self.turn].bot:
                def decide_to():
                    print("Executed Bot's Action")
                    do = ["mouse_caught", "mouse_missed", "mouse_fled"]
                    getattr(self.players[self.turn], do[floor(random() * 3)])("")
                
                response_sec = (.4 + random() * (self.time_limits - .4))

                print("bot will give its response to the game:", response_sec)
                    
                self.timer = timer.set_timeout(decide_to, response_sec * 1000)
            else:
                def timeout():
                    you_lose("이런~ 시간을 초과하셨어요!")
                    window.location.reload()
                
                self.timer = timer.set_timeout(timeout, self.time_limits * 1000)




    


if __name__ == "__main__":
    document.select("[data-scope=\"StartSinglePlay\"]")[0].bind("click", game_start)

    if storage.get("nick") == None:
        pass
    else:
        document.select("[data-scope=\"Nickname\"] input")[0].value = storage.get("nick")
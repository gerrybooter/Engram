"""
意图识别闯关 —— Engram 玩具版

玩法：只改下面 my_recognize() 里的规则，然后运行
    python playground/intent_game.py
它会自动判分。目标：从 3/12 打到 9/12 以上。

不需要 Docker，不需要联网，不需要 pip install。
"""

# ── 一共 5 种意图 ────────────────────────────────────────────────────────────
GENERAL   = "general"     # 打招呼、闲聊、笼统的问题
TECHNICAL = "technical"   # 用不了、报错、登录不上、卡住
BILLING   = "billing"     # 钱相关：退款、发票、扣费、套餐
COMPLAINT = "complaint"   # 骂人、投诉、情绪不满
OTHER     = "other"       # 实在判不出来时的兜底


# ══════════════════════════════════════════════════════════════════════════
#  你的赛场：只改这个函数
# ══════════════════════════════════════════════════════════════════════════
def my_recognize(message: str) -> str:
    """输入一句用户的话，返回上面 5 个常量之一。"""

    # 起手先送你两条规则，照着往下加就行
    if "退款" in message:
        return BILLING

    if "登录" in message:
        return TECHNICAL

    # TODO: 在这里加你的规则。想到什么加什么，丑没关系。
    #   提示：还可以用 any(k in message for k in ["发票", "扣费"]) 这种写法

    return OTHER


# ══════════════════════════════════════════════════════════════════════════
#  下面是判卷机，先别看（看了也没关系，但先玩几轮更爽）
# ══════════════════════════════════════════════════════════════════════════
CASES = [
    # (用户说的话, 标准答案, 这题在考你什么)
    ("你好",                          GENERAL,   "最简单的招呼"),
    ("我要退款",                      BILLING,   "送分题"),
    ("登录不上去",                    TECHNICAL, "送分题"),
    ("怎么开发票",                    BILLING,   "钱的另一种说法"),
    ("APP 一直闪退",                  TECHNICAL, "故障的另一种说法"),
    ("你们这什么破系统",              COMPLAINT, "有情绪但没具体业务"),
    ("我要投诉你们的客服态度",        COMPLAINT, "明确投诉"),
    ("你们都有些什么服务呀",          GENERAL,   "笼统询问"),
    ("我付款成功了但是登录不上去",    TECHNICAL, "钱和故障打架，真正的诉求是故障"),
    ("为什么给我多扣了一笔钱",        BILLING,   "扣费，但没出现'退款'二字"),
    ("上次那个问题还是没解决",        OTHER,     "全靠上下文，单句判不出，该认怂"),
    ("退款申请交了三天了没人理我",    COMPLAINT, "有'退款'但重点是不满，最难的一题"),
]


def run() -> None:
    passed = 0
    print("=" * 62)
    for msg, expect, note in CASES:
        got = my_recognize(msg)
        ok = got == expect
        passed += ok
        mark = "[ OK ]" if ok else "[ X  ]"
        print(f"{mark} {msg}")
        if not ok:
            print(f"        你判: {got:<10} 答案: {expect:<10} <- {note}")
    print("=" * 62)
    print(f"得分: {passed}/{len(CASES)}")

    if passed <= 3:
        print("起步分。挑一条错的，加一条规则，再跑一次。")
    elif passed < 9:
        print("在爬了。注意：规则的先后顺序会打架，谁在前面谁说了算。")
    elif passed < len(CASES):
        print("很强了。剩下的几题靠关键词大概率打不赢 —— 这正是真项目要上 LLM 的原因。")
    else:
        print("满分。现在去看 core/intent_recognizer.py，看它多做了什么。")


if __name__ == "__main__":
    run()

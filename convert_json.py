import json
import sys

# Mapping between ponyhead set names and database set names
expansions = {
  "pr": "PR"
, "cn": "CN"
, "cg": "CG"
, "ad": "AD"
, "eo": "EO"
, "hm": "HM"
, "mt": "MT"
, "rr": "RR"
, "cs": "CS"
, "st": "ST"
, "gf": "GF"
, "de": "DE"
}

mappings = json.loads(open(sys.argv[1]).read())
db = json.loads(open("data/db.json").read())["data"]

# Url Ids
urls = {}
output = {}
output["cards"] = {}
output["urls"] = {}

def search_db(cardset, num, db):
    for card in db:
        if card["set"] == cardset and card["number"] == num:
            return card
        elif (num.lower() + cardset.upper()) in card["allids"]:
            return card
    return None

for pid,cardmap in enumerate(mappings):
    pid = str(pid+1)
    urls[pid] = cardmap["urls"]
    for (ix, card) in enumerate(cardmap["cards"]):
        expansion = None
        card_num = None
        for exp in expansions:
            if card.startswith(exp):
                expansion = exp
                card_num = card.split(exp)[1]
                break
        if expansion is None:
            print("Unknown expansion for " + card + ". Skipping.", file=sys.stderr)
            continue
        card_num = card_num.replace('n', '-')
        db_card = search_db(expansions[expansion], card_num, db)
        if db_card is None:
            print("Card " + card + " was not found in the database. Skipping.", file=sys.stderr)
            continue
        cardobj = {}
        cardobj["name"] = db_card["fullname"]
        cardobj["index"] = ix
        cardobj["pic_id"] = pid
        cardobj["type"] = db_card["type"]
        output["cards"][card] = cardobj
output["urls"] = urls
print(json.dumps(output))

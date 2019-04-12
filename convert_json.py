import json
import sys
import hashlib

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
, "sb": "SB"
, "ff": "FF"
}

mappings = json.loads(open(sys.argv[1]).read())
db = json.loads(open("data/db.json").read())["data"]
for card in db:
  if "id" not in card:
    card["id"] = card["set"] + card["number"]
xmldb = {}

def guidify(db_card):
  if "octgn_guid" in db_card:
    return db_card["octgn_guid"]
  else:
    h = hashlib.sha256((db_card["title"] + db_card["subtitle"]).encode('utf-8')).hexdigest()
    return h[0:8] + '-' + h[8:12] + '-' + h[12:16] + '-' + h[16:20] + '-' + h[20:32]

# Url Ids
urls = {}
output = {}
output["cards"] = {}
output["urls"] = {}

def search_db(cardset, num, db):
    for card in db:
        if card["id"] == cardset + num:
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
            print("Card " + card + " was not found in the database. Skipping", file=sys.stderr)
        cardobj = {}
        cardobj["name"] = db_card["fullname"]
        cardobj["uuid"] = guidify(db_card)
        cardobj["index"] = ix
        cardobj["pic_id"] = pid
        cardobj["type"] = db_card["type"]
        output["cards"][card] = cardobj
output["urls"] = urls
print("db = " + json.dumps(output) + ";")

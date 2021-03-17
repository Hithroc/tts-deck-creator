import json
import sys
import argparse

def search_mapping(i):
    for pid,mapping in enumerate(mappings):
        pid = pid+1
        if i in mapping["cards"]:
            return (pid, mapping["cards"].index(i))
    print(f"Warning: no mapping found for {i}", file=sys.stderr)
    return (0, 0)

def compress_data(data):
    cards = {}
    for k,v in data["cards"].items():
        card_type = v["type"][0]
        card_index = v["index"]
        card_pic_id = v["pic_id"]
        card_name = v["name"]
        #card_data = cardType << 16 + cardIndex << 8 + cardPicId
        cards[k] = f"{card_type}|{card_index}|{card_pic_id}|{card_name}"
    return { "cards": cards, "urls": data["urls"] }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert card database into a format accepted by JavaScript deck creator")
    parser.add_argument("--mappings", help="TTS URL mappings")
    parser.add_argument("--output", "-o", help="output file")
    parser.add_argument("--output-compressed", help="compressed output file")
    parser.add_argument("databases", metavar="DB_PATH", nargs="+", help="paths to card JSON databases")
    args = parser.parse_args()
    fs = args.databases
    mappings = []
    if args.mappings is not None:
        mappings = json.load(open(args.mappings))

    db = []
    for f in fs:
        cards = json.load(open(f))["data"]
        db += cards

    output = { "cards" : {}, "urls" : {}}
    for card in db:
        cardobj = {}
        pid, ix = search_mapping(card["ponyhead_id"])
        cardobj["name"] = card["fullname"]
        cardobj["uuid"] = card["octgn_guid"]
        cardobj["index"] = ix
        cardobj["pic_id"] = pid
        cardobj["type"] = card["type"]
        output["cards"][card["ponyhead_id"]] = cardobj

    for pid, mapping in enumerate(mappings):
        output["urls"][pid+1] = mapping["urls"]

    out = sys.stdout
    if args.output is not None:
        out = args.output
    print("db = " + json.dumps(output) + ";", file=open(out, 'w'))
    if args.output_compressed is not None:
      json.dump(compress_data(output), open(args.output_compressed, 'w'))

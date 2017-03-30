
function idToDeckObj(pic_id, cardback)
{
  back = cardback;
  unique = false;
  if(db["urls"][pic_id].hasOwnProperty('back'))
  {
    back = db["urls"][pic_id]["back"];
    unique = true;
  }
  return { "FaceURL": db["urls"][pic_id]["front"], "BackURL": back, "BackIsHidden": true, "UniqueBack": unique, "NumWidth": 10, "NumHeight": 7 }
}

function generateStates(cards, cardback, predicate, sideways, transform)
{
  var obj_state = 
  { "ColorDiffuse": {"r": 0.713235259,"g": 0.713235259, "b": 0.713235259}
  , "ContainedObjects": []
  , "Grid": true
  , "Nickname": ""
  , "Name": "DeckCustom"
  , "GUID": "-1"
  , "Locked": false
  , "Description": ""
  , "Transform": transform
  , "SidewaysCard": sideways
  , "CustomDeck": {}
  , "DeckIDs": []
  };

  var current_id = 100;
  console.log("hello");
  for(cardix in cards)
  {
    card = cards[cardix];
    for(var i = 0; i < card["amount"]; i++)
    {
      card_info = db["cards"][card["id"]];
      if(!predicate(card_info))
        continue;
      if(obj_state["CustomDeck"].hasOwnProperty(card_info["pic_id"]))
        var deck_obj = obj_state["CustomDeck"][card_info["pic_id"]]
      else
      {
        var deck_obj = idToDeckObj(card_info["pic_id"], cardback);
        obj_state["CustomDeck"][card_info["pic_id"]] = deck_obj;
      }
      card_id = parseInt(card_info["pic_id"] + ("0" + card_info["index"].toString()).slice(-2));
      obj_state["DeckIDs"].push(card_id);
      deck_obj_ = {}
      deck_obj_[card_info["pic_id"]] = deck_obj
      var card_obj =
      { "CardID": card_id
      , "Name": "Card"
      , "Nickname": card_info["name"]
      , "Transform": transform
      , "CustomDeck": deck_obj_
      , "SidewaysCard": card_info["type"] === "Problem"
      };
      obj_state["ContainedObjects"].push(card_obj);
    }
    current_id++;
  }
  if(obj_state["ContainedObjects"].length == 1)
    return obj_state["ContainedObjects"][0];
  return obj_state;
}

function generateTTS(cards, cardback)
{
  // I know that it's not very effective to pass the decklist 3 times for
  // 3 decks. I will rewrite it someday. 
  var transform_all  = {"rotX": 0, "posY": 1.0, "scaleY": 1.0, "posZ": 3.5, "scaleZ": 1.0, "posX": 2.5, "rotY": 180, "rotZ": 180, "scaleX": 1.0};
  var transform_prob = {"rotX": 0, "posY": 1.0, "scaleY": 1.0, "posZ": 0.0, "scaleZ": 1.0, "posX": 2.5, "rotY": 180, "rotZ": 180, "scaleX": 1.0};
  var transform_mane = {"rotX": 0, "posY": 1.0, "scaleY": 1.0, "posZ": 0.0, "scaleZ": 1.0, "posX": 0.0, "rotY": 180, "rotZ": 180, "scaleX": 1.0};
  var isMane = function(c) { return c["type"] == "Mane"; };
  var isProblem = function(c) { return c["type"] == "Problem"; };
  var otherwise = function(c) { return !(isMane(c) || isProblem(c)); };
  var manes = generateStates(cards, cardback, isMane, false, transform_mane);
  var problems = generateStates(cards, cardback, isProblem, true, transform_prob);
  var states = generateStates(cards, cardback, otherwise, false, transform_all);
  var tts =
  { "Date": ""
  , "GameMode": ""
  , "Note": ""
  , "ObjectStates": [manes, states, problems]
  , "PlayerTurn": ""
  , "Rules": ""
  , "SaveName": ""
  , "Sky": ""
  , "Table": ""
  };
  return tts;
}

function ponyHeadToCards(ponyhead_url)
{
  var urlre = /[-|=]([a-z][a-z])(\w+)x(\d+)/g;
  var m;
  var cards = [];
  do
  {
    m = urlre.exec(ponyhead_url);
    if(m)
    {
      cid = m[1] + m[2];
      cards.push({"id":cid, "amount": m[3]});
    }
  } while(m);
  return cards;
}

function submit()
{
  var deck_name    = document.getElementById("deck_name").value;
  var cardback_url = document.getElementById("cardback_url").value;
  var ponyhead_url = document.getElementById("ponyhead_url").value;
  if(cardback_url === "")
    cardback_url = "http://i.imgur.com/pAxOuds.jpg";
  var cards = ponyHeadToCards(ponyhead_url);
  var tts = generateTTS(cards, cardback_url);
  var blob = new Blob([JSON.stringify(tts, null, 2)], {type: "text/plain;charset=utf-8"});
  saveAs(blob, deck_name + ".json");
}

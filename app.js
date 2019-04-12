function idToDeckObj(pic_id, cardback)
{
  var back = cardback;
  var unique = false;
  if(db["urls"][pic_id].hasOwnProperty('back'))
  {
    back = db["urls"][pic_id]["back"];
    unique = true;
  }
  return { "FaceURL": db["urls"][pic_id]["front"], "BackURL": back, "BackIsHidden": true, "UniqueBack": unique, "NumWidth": 10, "NumHeight": 7 };
}

function generateStates(cards, cardback, sideways, transform)
{
  var obj_state =
  { "ColorDiffuse": {"r": 0.713235259, "g": 0.713235259, "b": 0.713235259}
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

  cards.forEach(function (card) {
    var card_info = card["data"];
    for(var i = 0; i < card["amount"]; i++)
    {
      if(obj_state["CustomDeck"].hasOwnProperty(card_info["pic_id"]))
        var deck_obj = obj_state["CustomDeck"][card_info["pic_id"]];
      else
      {
        var deck_obj = idToDeckObj(card_info["pic_id"], cardback);
        obj_state["CustomDeck"][card_info["pic_id"]] = deck_obj;
      }
      var card_id = parseInt(card_info["pic_id"] + ("0" + card_info["index"].toString()).slice(-2));
      obj_state["DeckIDs"].push(card_id);
      var deck_obj_ = {};
      deck_obj_[card_info["pic_id"]] = deck_obj;
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
  });
  if(obj_state["ContainedObjects"].length == 1)
    return obj_state["ContainedObjects"][0];
  return obj_state;
}

function generateTTS(cards, cardback, probback)
{
  var transform_draw = {"posX": 3.0, "posY": 1.0, "posZ": 0.0, "rotX": 0, "rotY": 180, "rotZ": 180, "scaleX": 1.3, "scaleY": 1.0, "scaleZ": 1.3};
  var transform_prob = {"posX": 1.5, "posY": 1.0, "posZ": 4.0, "rotX": 0, "rotY": 90, "rotZ": 180, "scaleX": 1.3, "scaleY": 1.0, "scaleZ": 1.3};
  var transform_mane = {"posX": 0.0, "posY": 1.0, "posZ": 0.0, "rotX": 0, "rotY": 180, "rotZ": 0, "scaleX": 1.3, "scaleY": 1.0, "scaleZ": 1.3};
  function isMane(c) { return c["data"]["type"] == "Mane"; };
  function isProblem(c) { return c["data"]["type"] == "Problem"; };
  function otherwise(c) { return !(isMane(c) || isProblem(c)); };
  var manes = generateStates(cards.filter(isMane), cardback, false, transform_mane);
  var problems = generateStates(cards.filter(isProblem), probback, true, transform_prob);
  var drawdeck = generateStates(cards.filter(otherwise), cardback, false, transform_draw);
  var tts =
  { "Date": ""
  , "GameMode": ""
  , "Note": ""
  , "ObjectStates": [manes, drawdeck, problems]
  , "PlayerTurn": ""
  , "Rules": ""
  , "SaveName": ""
  , "Sky": ""
  , "Table": ""
  };
  return tts;
}

function generateOCTGN(cards)
{
  var str = "<?xml version=\"1.0\" encoding=\"utf-8\" standalone=\"yes\"?>\n";
  str += "<deck game=\"65656467-b709-43b2-a5c6-80c2f216adf9\">\n";
  var sections = { "Mane": "", "Friend": "", "Resource": "", "Event": "", "Troublemaker": "", "Problem": ""};
  var encodeXML = function(str)
  {
    return str.split("&").join("&amp;")
         .split("<").join("&lt;")
         .split(">").join("&gt;")
         .split("'").join("&apos;")
         .split("\"").join("&quot;");
  };
  cards.forEach(function (card) {
    var card_info = card["data"];
    var ct = card_info["type"];
    sections[ct] += "  <card qty=\"" + card["amount"] + "\" id=\"" + card_info["uuid"] + "\">" + encodeXML(card_info["name"]) + "</card>\n";
  })
  var printSection = function(name, content)
  {
    var sec = ""
    sec += "<section name=\"" + name + "\" shared=\"False\">\n";
    sec += content;
    sec += "</section>\n";
    return sec;
  };
  str += printSection("Mane Character", sections["Mane"]);
  str += printSection("Friends", sections["Friend"]);
  str += printSection("Resources", sections["Resource"]);
  str += printSection("Events", sections["Event"]);
  str += printSection("Troublemakers", sections["Troublemaker"]);
  str += printSection("Problems", sections["Problem"]);
  str += "</deck>\n";
  console.log(str);
  return str;
}

function ponyHeadToCards(ponyhead_url)
{
  var urlre = /[-=]([a-z][a-z])(\w+)x(\d+)/g;
  var cards = [];
  do
  {
    var m = urlre.exec(ponyhead_url);
    if(m)
    {
      var cid = m[1] + m[2];
      cards.push({"data": db["cards"][cid], "amount": m[3]});
    }
  } while(m);
  if(cards.length === 0)
    throw "Wrong PonyHead URL!";
  return cards;
}

function submit(tts)
{
  try
  {
    var deck_name = document.getElementById("deck_name").value;
    var cardback_url = document.getElementById("cardback_url").value;
    var probback_url = document.getElementById("probback_url").value;
    var ponyhead_url = document.getElementById("ponyhead_url").value;

    var date = new Date();
    var time = date.getTime();
    time += 365 * 24 * 60 * 60 * 1000;
    date.setTime(time)
    document.cookie = "cardback_url=" + btoa(cardback_url) + "; expires=" + date.toUTCString() + "; path=/;";
    document.cookie = "probback_url=" + btoa(probback_url) + "; expires=" + date.toUTCString() + "; path=/;";

    if(cardback_url === "")
      cardback_url = "http://cloud-3.steamusercontent.com/ugc/252591719340213373/873428FF40D27FA11227445CC59BF39144E391FA/";
    if(probback_url === "")
      probback_url = cardback_url;
    var cards = ponyHeadToCards(ponyhead_url);
    var res;
    var blob;
    var ext = "";
    if(tts)
    {
      res = generateTTS(cards, cardback_url, probback_url);
      blob = new Blob([JSON.stringify(res, null, 2)], {type: "text/plain;charset=utf-8"});
      ext = "json";
    }
    else
    {
      res = generateOCTGN(cards)
      blob = new Blob([res], {type: "text/plain;charset=utf-8"});
      ext = "o8d"
    }
    if(deck_name === "")
      deck_name = "New Deck"
    saveAs(blob, deck_name + "." + ext);
  }
  catch(e)
  {
    alert(e);
  }
}

function init()
{
  document.getElementById("cardback_url").value = atob(document.cookie.replace(/(?:(?:^|.*;\s*)cardback_url\s*\=\s*([^;]*).*$)|^.*$/, "$1"));
  document.getElementById("probback_url").value = atob(document.cookie.replace(/(?:(?:^|.*;\s*)probback_url\s*\=\s*([^;]*).*$)|^.*$/, "$1"));
}
document.addEventListener("DOMContentLoaded", init, false);

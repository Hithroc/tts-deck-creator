{ inputDbs ? [ ./db.json ], mappings ? ./stmap.json, pkgs }:
with pkgs;
stdenv.mkDerivation {
  name = "deck-converter";
  src = ./convert_json.py;
  mappingsArg = if mappings == null then "" else "--mappings ${mappings}";

  buildInputs = [python3];

  dbs = inputDbs;
  static = ./static;

  unpackPhase = ''
    cp $src ./convert_json.py
  '';
  buildPhase = ''
    python convert_json.py $dbs -o data.js --output-compressed datatts.json $mappingsArg
    '';
  installPhase = ''
    mkdir $out
    cp $static/* $out/
    cp data.js $out/
    cp datatts.json $out/
    '';
}

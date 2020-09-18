{ inputDbs ? [ ./db.json ], mappings ? null }:
let
  pkgs = import <nixpkgs> {};
in with pkgs;
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
    python convert_json.py $dbs -o data.js $mappingsArg
    '';
  installPhase = ''
    mkdir $out
    cp $static/* $out/
    cp data.js $out/
    '';
}

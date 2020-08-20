{ inputDbs ? [ ./db.json ] }:
let
  pkgs = import <nixpkgs> {};
in with pkgs;
stdenv.mkDerivation {
  name = "deck-converter";
  src = ./convert_json.py;

  buildInputs = [python3];

  dbs = inputDbs;
  static = ./static;

  unpackPhase = ''
    cp $src ./convert_json.py
  '';
  buildPhase = ''
    python convert_json.py $dbs -o data.js
    '';
  installPhase = ''
    mkdir $out
    cp $static/* $out/
    cp data.js $out/
    '';
}

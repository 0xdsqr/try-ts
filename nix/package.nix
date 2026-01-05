{
  pkgs,
  version ? "0.0.0",
}:
let
  src = pkgs.lib.cleanSource ../.;
  node_modules = import ./deps.nix { inherit pkgs; };
in
pkgs.stdenv.mkDerivation {
  pname = "try-ts";
  inherit version src;

  nativeBuildInputs = [ pkgs.bun ];

  configurePhase = ''
    runHook preConfigure
    export HOME=$(mktemp -d)
    cp -r ${node_modules} node_modules
    chmod -R u+w node_modules
    runHook postConfigure
  '';

  buildPhase = ''
    runHook preBuild
    bun run build
    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall
    mkdir -p $out
    cp -r dist/* $out/
    runHook postInstall
  '';
}

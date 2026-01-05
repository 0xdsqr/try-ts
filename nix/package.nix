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
    # Copy node_modules (dereference symlinks from store)
    cp -rL ${node_modules} node_modules
    chmod -R u+w node_modules
    # Recreate .bin symlinks pointing to the copied files
    rm -rf node_modules/.bin
    mkdir -p node_modules/.bin
    ln -sf ../typescript/bin/tsc node_modules/.bin/tsc
    ln -sf ../typescript/bin/tsserver node_modules/.bin/tsserver
    chmod +x node_modules/typescript/bin/tsc node_modules/typescript/bin/tsserver
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

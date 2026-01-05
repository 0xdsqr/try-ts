{
  pkgs,
  version ? "0.0.0",
}:
pkgs.stdenv.mkDerivation {
  pname = "try-ts";
  inherit version;

  src = ../.;

  nativeBuildInputs = [ pkgs.bun ];

  buildPhase = ''
    runHook preBuild
    export HOME=$(mktemp -d)
    bun install --frozen-lockfile
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

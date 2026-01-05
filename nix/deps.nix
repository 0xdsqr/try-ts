# Manual bun2nix-style deps
# Each package is fetched as a separate derivation with its integrity hash from bun.lock
#
# To update: parse new hashes from bun.lock (they're base64 sha512)
#
{ pkgs }:
let
  # Helper to fetch npm tarballs
  fetchNpmTarball =
    {
      name,
      version,
      hash,
    }:
    pkgs.fetchurl {
      url = "https://registry.npmjs.org/${name}/-/${baseNameOf name}-${version}.tgz";
      inherit hash;
    };

  # Packages from bun.lock (sha512 integrity hashes converted to SRI format)
  packages = {
    "@types/bun" = fetchNpmTarball {
      name = "@types/bun";
      version = "1.3.5";
      hash = "sha512-RnygCqNrd3srIPEWBd5LFeUYG7plCoH2Yw9WaZGyNmdTEei+gWaHqydbaIRkIkcbXwhBT94q78QljxN0Sk838w==";
    };
    "@types/node" = fetchNpmTarball {
      name = "@types/node";
      version = "25.0.3";
      hash = "sha512-W609buLVRVmeW693xKfzHeIV6nJGGz98uCPfeXI1ELMLXVeKYZ9m15fAMSaUPBHYLGFsVRcMmSCksQOrZV9BYA==";
    };
    "bun-types" = fetchNpmTarball {
      name = "bun-types";
      version = "1.3.5";
      hash = "sha512-inmAYe2PFLs0SUbFOWSVD24sg1jFlMPxOjOSSCYqUgn4Hsc3rDc7dFvfVYjFPNHtov6kgUeulV4SxbuIV/stPw==";
    };
    "typescript" = fetchNpmTarball {
      name = "typescript";
      version = "5.9.3";
      hash = "sha512-jl1vZzPDinLr9eUt3J/t7V6FgNEw9QjvBPdysz9KfQDD41fQrC2Y4vKQdiaUpFT4bXlb1RHhLpp8wtm6M5TgSw==";
    };
    "undici-types" = fetchNpmTarball {
      name = "undici-types";
      version = "7.16.0";
      hash = "sha512-Zz+aZWSj8LE6zoxD+xrjh4VfkIG8Ya6LvYkZqtUQGJPZjYl53ypCaUwWqo7eI0x66KBGeRo+mlBEkMSeSZ38Nw==";
    };
  };
in
# Build node_modules directory from tarballs
pkgs.stdenv.mkDerivation {
  name = "try-ts-node-modules";

  # No src needed - we're just assembling tarballs
  dontUnpack = true;

  buildInputs = [
    pkgs.gnutar
    pkgs.gzip
  ];

  buildPhase = ''
    mkdir -p node_modules/@types
    mkdir -p node_modules/.bin

    # @types/bun
    mkdir -p node_modules/@types/bun
    tar -xzf ${packages."@types/bun"} -C node_modules/@types/bun --strip-components=1

    # @types/node
    mkdir -p node_modules/@types/node
    tar -xzf ${packages."@types/node"} -C node_modules/@types/node --strip-components=1

    # bun-types
    mkdir -p node_modules/bun-types
    tar -xzf ${packages."bun-types"} -C node_modules/bun-types --strip-components=1

    # typescript
    mkdir -p node_modules/typescript
    tar -xzf ${packages."typescript"} -C node_modules/typescript --strip-components=1

    # undici-types
    mkdir -p node_modules/undici-types
    tar -xzf ${packages."undici-types"} -C node_modules/undici-types --strip-components=1

    # Create .bin links
    ln -s ../typescript/bin/tsc node_modules/.bin/tsc
    ln -s ../typescript/bin/tsserver node_modules/.bin/tsserver
  '';

  installPhase = ''
    mkdir -p $out
    cp -r node_modules/. $out/
  '';
}

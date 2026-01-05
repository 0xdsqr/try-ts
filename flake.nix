{
  description = "try-ts - Rust-style error handling for TypeScript";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-compat.url = "github:edolstra/flake-compat";
    flake-compat.flake = false;
    treefmt-nix.url = "github:numtide/treefmt-nix";
    treefmt-nix.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs =
    {
      self,
      nixpkgs,
      treefmt-nix,
      ...
    }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forEachSystem = nixpkgs.lib.genAttrs systems;
    in
    {
      # ------------------------------------------------------------
      # Packages (nix build)
      # ------------------------------------------------------------
      packages = forEachSystem (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = import ./nix/package.nix { inherit pkgs; };
          node_modules = import ./nix/deps.nix { inherit pkgs; };
        }
      );

      # ------------------------------------------------------------
      # Development shell (nix develop)
      # ------------------------------------------------------------
      devShells = forEachSystem (
        system:
        let
          devConfig = import ./nix/devshell.nix { inherit nixpkgs system; };
        in
        devConfig.devShells.${system}
      );

      # ------------------------------------------------------------
      # Formatter (nix fmt)
      # ------------------------------------------------------------
      formatter = forEachSystem (
        system:
        (treefmt-nix.lib.evalModule nixpkgs.legacyPackages.${system} ./nix/treefmt.nix).config.build.wrapper
      );

      # ------------------------------------------------------------
      # Checks (nix flake check)
      # ------------------------------------------------------------
      checks = forEachSystem (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          src = pkgs.lib.cleanSource self;
          node_modules = import ./nix/deps.nix { inherit pkgs; };
        in
        {
          formatting = (treefmt-nix.lib.evalModule pkgs ./nix/treefmt.nix).config.build.check self;

          tests = pkgs.stdenv.mkDerivation {
            name = "try-ts-tests";
            inherit src;
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
              bun test --coverage --coverage-reporter=lcov --coverage-dir=coverage
              runHook postBuild
            '';

            installPhase = ''
              runHook preInstall
              mkdir -p $out/coverage
              cp -r coverage/* $out/coverage/ || true
              echo "Tests passed" > $out/result
              runHook postInstall
            '';
          };

          build = self.packages.${system}.default;
        }
      );
    };
}

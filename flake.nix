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
        in
        {
          formatting = (treefmt-nix.lib.evalModule pkgs ./nix/treefmt.nix).config.build.check self;

          tests = pkgs.stdenv.mkDerivation {
            name = "try-ts-tests";
            src = self;
            nativeBuildInputs = [ pkgs.bun ];
            buildPhase = ''
              export HOME=$(mktemp -d)
              bun install --frozen-lockfile
              bun test --coverage --coverage-reporter=lcov --coverage-dir=coverage
            '';
            installPhase = ''
              mkdir -p $out
              cp -r coverage $out/
              echo "Tests passed" > $out/result
            '';
          };

          build = self.packages.${system}.default;
        }
      );
    };
}

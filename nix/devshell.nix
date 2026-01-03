{ nixpkgs, system }:
let
  pkgs = import nixpkgs { inherit system; };
in
{
  # import the dev pkgs from compilation
  packages.${system}.default = [
    pkgs.bun
  ];

  # Create a development shell
  devShells.${system}.default = pkgs.mkShell {
    buildInputs = with pkgs; [
      nixfmt-rfc-style
      nixfmt-tree
      statix
      deadnix
      nil
      bun
    ];

    shellHook = ''
      echo "Bun version: $(bun --version)"
    '';
  };
}

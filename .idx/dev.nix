
# To learn more about how to use Nix to configure your environment
# see: https://firebase.google.com/docs/studio/customize-workspace
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.mongodb-tools
    # pkgs.go
    # pkgs.python311
    # pkgs.python311Packages.pip
    pkgs.nodejs_20 # Assuming you want nodejs_20 as commented out before
    pkgs.nodePackages.nodemon # Assuming you want nodemon as commented out before
  ];

  # Define a development shell with necessary tools
  # devShell = pkgs.mkShell {
  #   buildInputs = [
  #     pkgs.nodejs # Include nodejs here as well for the shell
  #     pkgs.yarn # Or pkgs.npm, include your preferred package manager
  #     pkgs.jdk # Include jdk for Android development
  #     pkgs.watchman # Include watchman for better performance

  #     # Android SDK with required packages
  #     (pkgs.androidsdk.withPackages (p: [
  #       "platform-tools"
  #       "platforms;android-31" # Replace with your target Android version
  #       "build-tools;31.0.0"  # Replace with your build tools version
  #     ]))
  #   ];

  #   shellHook = ''
  #     export ANDROID_SDK_ROOT=${(pkgs.androidsdk.withPackages (p: ["platform-tools"]))}/libexec/android-sdk
  #   '';
  # };

  # Sets environment variables in the workspace
  env = {};
  services.docker.enable = true ;
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      # "vscodevim.vim"
    ];

    # Enable previews
    previews = {
      enable = true;
      previews = {
        # web = {
        #   # Example: run "npm run dev" with PORT set to IDX's defined port for previews,
        #   # and show it in IDX's web preview panel
        #   command = ["npm" "run" "dev"];
        #   manager = "web";
        #   env = {
        #     # Environment variables to set for your server
        #     PORT = "$PORT";
        #   };
        # };
      };
    };

    # Workspace lifecycle hooks
    workspace = {
      # Runs when a workspace is first created
      onCreate = {
        # Example: install JS dependencies from NPM
        # npm-install = "npm install";
      };
      # Runs when the workspace is (re)started
      onStart = {
        # Example: start a background task to watch and re-build backend code
        # watch-backend = "npm run watch-backend";
      };
    };
  };
}

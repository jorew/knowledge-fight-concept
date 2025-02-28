{pkgs}: {
  channel = "stable-23.05"; # "stable-23.05" or "unstable"
  packages = [
    pkgs.nodejs
    pkgs.bun
  ];
  idx.extensions = [
    "svelte.svelte-vscode"
    "heybourn.headwind"
    "bradlc.vscode-tailwindcss"
    "esbenp.prettier-vscode"
    "antfu.iconify"
  ];
  # runs when a workspace is first created with this `dev.nix` file
  # to run something each time the environment is rebuilt, use the `onStart` hook
  idx.workspace.onCreate = {
    bun-install = "bun install";
  };
  idx.previews = {
    enable = true;
    previews = [
      {
        command = ["bun" "run" "dev" "--" "--port" "$PORT" "--host" "0.0.0.0"];
        manager = "web";
        id = "web";
      }
    ];
  };
}
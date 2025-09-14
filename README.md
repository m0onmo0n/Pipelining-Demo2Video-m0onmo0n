# CS Demo Processor (Pipelined Edition) (m0on mo0n edition)

This program automates the process of downloading a Counter-Strike 2 demo, analyzing it, recording highlights of a specified player, and uploading the resulting video to YouTube. It runs as a continuous service with a web interface for queuing jobs, making it a complete, hands-free pipeline.

This version uses a multi-stage, parallel processing pipeline to maximize efficiency, allowing it to download the next demo while recording the current one.

---

## ⚠️ System Requirements

**IMPORTANT:** This application is extremely resource-intensive due to its parallel processing design. It runs multiple demanding tasks simultaneously (downloading, demo analysis, launching a modern video game, and screen recording). Running this on anything other than a high-end PC will likely result in poor performance, stuttering in the final video, and application instability.

**Recommended High-End Specifications:**

* **CPU**: A high-performance 6-core CPU or better (e.g., Intel Core i7/i9, AMD Ryzen 7/9 from a recent generation).
* **RAM**: 32 GB is strongly recommended to handle the concurrent tasks smoothly.
* **Storage**: A fast NVMe SSD is essential. The application performs heavy, simultaneous read/write operations that will be bottlenecked by a traditional HDD or SATA SSD.
* **GPU**: A powerful, modern graphics card (e.g., NVIDIA GeForce RTX 3060 / AMD Radeon RX 6700 XT or newer) is required to run CS2 and OBS recording without performance degradation.

---

## Installation Guide

This guide is designed to be as user-friendly as possible.

### Step 1: Install Required Software

Before you begin, you must manually install the following programs:

1. **cs2** duuh
2. ***MAKE SURE that you have a valid winget installation as this modded version utilizes winget to install all the required software**
    if you'd rather install the software manually, here's a list of the software it will install:
        * vss tools with c++ tools and win10 sdk
        * python 3.13 (and python launcher for backup)
        * nvm for windows (and if it can't install nvm, and node is missing from the system it'll install node LTS as a backup plan)
        * obs studio (websocket plugin is no longer needed)
        * postgresql 17 (this project uses a public csdm database hosted by xify, password can be found in the right channel on discord)
*(optional but recommended) 3. Git - used to interface with git commands in powershell*
*(optional but recommended) 4. Terminal - open source terminal app for windows that holds all your terminal needs, it's already pre-installed on w11. setting it as the default terminal application and the default profile to be powershell is ***highly*** advised*

### Step 2: Download and Install This Project

1.  **clone the project!** I would **highly** suggest you clone the project, via git in powershell by doing `git clone https://github.com/m0onmo0n/Pipelining-Demo2Video-m0onmo0n`
2.  **Run the Installer**: From the main project folder, double-click the `install.bat` file or invoke it through the terminal .\install.bat. This will automatically:
    * Check for Python, Node.js, vss tool package, obs studio and postgresql 17 (and install via winget if any of them are missing). ⚠️NOTE: Visual studio code 2022 ***WILL*** take some time to install, 10-20 minutes ***are to be expected***
    * Install all necessary dependencies(python & node) for this project.
    * Launch an interactive setup guide to help you create your `config.ini` file.

### Step 3: Authorize YouTube

After the installer finishes, you need to authorize the application with Google.

1.  Open a terminal in the **`cs-demo-processor`** subfolder.
2.  Run the command: `python setup_youtube_auth.py`
3.  Follow the browser prompts to log in and grant permission.

---

## How to Run the Application

1.  **Run the Launcher**: From the main project folder, double-click the `run.bat` file.
        This will automatically start the necessary background processes and open the web interface in your default browser at `http://localhost:5001`.

    ⚠️if any of the processes fail to start by using the run.bat file, you can start the processes manually. it is also *highly advised* to start obs manually once before using the run.bat file so you can set it up with where it's saving the videos etc⚠️
        **csdm fork** to start the csdm fork you navigate into the csdm-fork directory within the cs demo processor folder, open in a terminal and run `node scripts/develop-cli.mjs` **this terminal window should stay open**
        **cs demo processor** to start the cs demo processor you navigate into the cs-demo-processor folder, open in a terminal and run `python main.py` **this terminal window should stay open**

    ---

## Project layout

```
Pipelining-Demo2Video-m0onmo0n-/
├─ install.bat            # installs deps, runs setup
├─ run.bat                # resolves Node/Python and launches everything
└─ cs-demo-processor/
   ├─ main.py             # processor + web server
   ├─ setup.py            # interactive config
   ├─ setup_youtube_auth.py # Sets up youtube authorization for automatic youtube upload
   └─ csdm-fork/          # forked CSDM CLI + dev server
      └─ scripts/develop-cli.mjs
```


---

## Project layout
since this is a highly modified version of the pipelined repo made by norton, I have a special folder structure like shown below. some of the paths are "hardcoded" and are expected in different places, *if you don't change those parameters the project will fail to start*
```

cswatch_auto/
├─ obs           # obs portable installation
├─ obs_videos             # this is where obs saves videos 
└─Pipelining-Demo2Video-m0onmo0n/ # root folder of the project
    ├─ install.bat            # installs deps, runs setup
    ├─ run.bat                # resolves Node/Python and launches everything
    └─ cs-demo-processor/
        ├─ main.py             # processor + web server
        ├─ setup.py            # interactive config
        ├─ setup_youtube_auth.py
        └─ csdm-fork/          # forked CSDM CLI + dev server
            ├─ scripts/develop-cli.mjs

```


## What has changed from the original?
I've added timestamps, a copy yt link button, made the UI wider and changed the upload logic(title, description). OBS saves the file in a certain format, with timestamps and the script is expecting a certain type of naming scheme, which it then renames the same as the youtube title, and then uploads it to youtube.
I've also added a retry button if the upload never started(sometimes obs takes forever to save to the file, in which case it can't upload, clicking the retry button will attempt to add the file to the upload que again, *if* the video file got renamed)

## Settings

### OBS
For the csdm dev server it creates a hidden .csdm_dev directory in $USER(your username) and within said directory you'll find a settings.json file after the first time you run it.
this is where you can set how cs is ran and other parameters. I've included my own settings.json with this project(settings.json.example) also shown below

```
{
  "schemaVersion": 8,
  "autoDownloadUpdates": true,
  "database": {
    "hostname": "csdm.xify.pro",
    "port": 8432,
    "username": "csdm",
    "password": "join discord for password",
    "database": "csdm"
  },
  "playback": {
    "width": 1280,
    "height": 720,
    "closeGameAfterHighlights": true,
    "fullscreen": false,
    "useCustomHighlights": true,
    "useCustomLowlights": true,
    "highlights": {
      "beforeKillDelayInSeconds": 3,
      "afterKillDelayInSeconds": 3,
      "includeDamages": true
    },
    "lowlights": {
      "beforeKillDelayInSeconds": 3,
      "afterKillDelayInSeconds": 2,
      "includeDamages": false
    },
    "round": {
      "beforeRoundDelayInSeconds": 0,
      "afterRoundDelayInSeconds": 2
    },
    "launchParameters": "-insecure +novid engine_no_focus_sleep 0 -allow-third-party-software +cl_crosshair_recoil 1 +volume 0.1",
    "useHlae": false,
    "playerVoicesEnabled": true,
    "cs2": {
      "executablePath": "drive\\path_to_steam\\steam\\steamapps\\common\\Counter-Strike Global Offensive\\game\\bin\\win64\\cs2.exe"
    }
  }
}
```

### python scripts hardcoded paths
For the hardcoded paths in the python scripts, i've added a settings.txt file in the `cs-demo-processor` directory; open it and set the paths you want to use
contents of settings.txt shown below:
```
# settings file

# Path where recorded videos are stored before upload. should match the video path in config.ini [Paths]->output_folder.
# e.g E:\cswatch_auto\obs_videos
UPLOAD_DIR=

# Logging directory. Leave blank to use "logs" in the project folder.
LOG_DIR=

# Path to your csdm-fork directory.
# Leave blank to use the one bundled with the project.
CSDM_PROJECT_PATH=

# Path where demo files will be downloaded.
# Example: E:\cswatch_auto\demo files
# Leave blank to default inside the csdm-fork/demos folder.
DEMOS_FOLDER=
```

### OBS
In my obs i use this fileformatting scheme `%DD-%MM_%hh-%mm`, which you can set within settings of OBS.


readme or any other files are prone to be changed.
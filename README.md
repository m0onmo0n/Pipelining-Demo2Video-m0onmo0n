# CS Demo Processor (Pipelined Edition)

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

1.  **CS Demo Manager**: Download and install the latest release from the [official CSDM GitHub page](https://github.com/akiver/cs-demo-manager/releases).
    * **IMPORTANT**: After installing, run CS Demo Manager at least once. It will guide you through setting up its required PostgreSQL database. This step must be completed before you proceed.
2.  **OBS Studio**: Install from [obsproject.com](https://obsproject.com/).

### Step 2: Download and Install This Project

1.  **Download**: Download this project as a ZIP file and extract it to a permanent location on your computer (e.g., `C:\CS-Demo-Processor`).
2.  **Run the Installer**: From the main project folder, double-click the `install.bat` file. This will automatically:
    * Check for Python and Node.js (and provide download links if they are missing).
    * Install all necessary dependencies for this project.
    * Launch an interactive setup guide to help you create your `config.ini` file.

### Step 3: Authorize YouTube

After the installer finishes, you need to authorize the application with Google.

1.  Open a terminal in the **`cs-demo-processor`** subfolder.
2.  Run the command: `python setup_youtube_auth.py`
3.  Follow the browser prompts to log in and grant permission.

---

## How to Run the Application

1.  **Start OBS Studio**: Open OBS and leave it running in the background. Make sure it's configured according to the setup guide (Game Capture source, correct output folder, etc.).
2.  **Run the Launcher**: From the main project folder, double-click the `run.bat` file.

This will automatically start the necessary background processes and open the web interface in your default browser at `http://localhost:5001`.
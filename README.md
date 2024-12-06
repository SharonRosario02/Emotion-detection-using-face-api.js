# Project README

## Overview
This document provides essential information on how to set up and run the face detection project using face-api.js. Please follow the steps below to ensure successful installation and troubleshooting.

## Prerequisites
- Node.js installed on your machine.
- Basic familiarity with Node.js and PowerShell.

## Bug Fixes

### Deprecated `navigator.getUserMedia`
The method `navigator.getUserMedia` is now deprecated and has been replaced by `navigator.mediaDevices.getUserMedia` for enhanced security and performance. Update your code by replacing all instances of `navigator.getUserMedia` with `navigator.mediaDevices.getUserMedia`.

### Low-end Devices Bug
On low-end devices, the `play` event listener may trigger too soon, causing issues with the Face API due to incomplete video loading. To fix this:
- Use the `playing` event instead of `play` in your event listeners.
- The `playing` event ensures that media playback can start and continue without buffering interruptions, which is critical for smooth functionality across various devices and browsers.

## Installation Instructions

### Step 1: Install http-server
1. Open your terminal or command prompt.
2. Execute the following command to install `http-server` globally:
    ```bash
    npm install -g http-server
    ```

### Step 2: Set Execution Policy for PowerShell
If you are using Windows and need to run scripts through PowerShell, follow these steps to adjust the script execution policy:
1. Run PowerShell as Administrator.
2. Set the execution policy to bypass for the current session by executing:
    ```powershell
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
    ```

### Step 3: Start the Server
1. Navigate to the directory containing your project files.
2. Launch the server using the following command:
    ```bash
    http-server
    ```

## Running the Project
After setting up the server, use a web browser to navigate to `http://localhost:8080`. Ensure your webcam is enabled and configured to permit web access, which is necessary for the face detection to function.

## Additional Notes
Follow the above steps carefully to avoid common issues and ensure a successful project setup. For further assistance, refer to the documentation or seek help from community forums.

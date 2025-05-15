# Project Setup and Run Instructions

This project includes platform-specific scripts to automate the project setup. Please follow the appropriate instructions for your operating system.

## Prerequisites

Before running the project, make sure the following are installed on your system:

- [Node.js (LTS version)](https://nodejs.org/)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

---

## Running on macOS or Linux

Use the provided `run.sh` Bash script:

### Steps

1. Open your **Terminal**.
2. Navigate to the project directory where `run.sh` is located.
3. Run the script:
    ```bash
    bash ./run.sh
    ```

## Running on Windows

Use the provided PowerShell script: `run.ps1`.

### Steps

1. Open **PowerShell** (preferably as Administrator).
2. Navigate to the project directory where `run.ps1` is located:
3. Run this command first to make sure script execution is allowed:
    ```powershell
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
    ```
4. Lastly, run this PowerShell script.
    ```powershell
    .\run.ps1
    ```

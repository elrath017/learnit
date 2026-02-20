# Udemy-like Course Viewer

A local React application to browse and watch video courses organized in nested folders, mimicking the Udemy UI and continuous playback experience. 

## Features

- **Nested Folder Structure:** Browse your courses efficiently. Organizes parent folders as courses and sub-folders as modules/chapters.
- **Auto-Play & Next Lecture:** Videos automatically play, and an overlay for the "Next Lecture" appears beautifully integrated even in Fullscreen mode.
- **Configurable Paths:** Manage your video course path directly from the UI toolbar. Set `E:\Rahul\Courses` (or any other folder) and easily switch between recent paths.
- **Playback Memory:** Remembers exactly what course and what video you watched last, auto-launching back into it on load! 
- **Video Duration Scanning:** Displays the lengths of each video lesson, parsing duration dynamically using `ffprobe`.
- **Advanced Features:** Variable playback speed, detailed volume slider control, percentage tooltips, and watched video checkmarks stored persistently in the browser. 
- **Desktop Shortcut Support:** Boot exactly like a desktop app directly from your homescreen via pre-configured batch scripts.

## Setup Instructions

1.  **Install dependencies**:
    This uses `Node.js` (`>=18.x`).
    ```bash
    npm install
    cd server && npm install
    cd ../client && npm install
    cd ..
    ```

2.  **Add your courses**:
    -   You can place your courses securely anywhere on your machine (e.g. `E:\Courses`).
    -   Inside your root courses directory, create folders for each *Course* name.
    -   Inside *Course* folders, organize subfolders for *Chapters*.
    -   Add your video files (`.mp4`, `.webm`, `.mkv`) inside the chapter folders.

    **Example Structure:**
    ```
    My Courses/
    ├── React Course/
    │   ├── Chapter 1/
    │   │   ├── lecture1.mp4
    │   │   └── lecture2.mp4
    │   └── Chapter 2/
    │       └── lecture3.mp4
    └── Node.js Course/
        └── ...
    ```

3.  **Run the application**:
    Run the command below in the project root to securely launch both the backend (Port `3001`) and frontend (Port `5173`):
    ```bash
    npm start
    ```

4.  **Open in Browser**:
    Go to [http://localhost:5173](http://localhost:5173). 
    Click the "Settings" Gear icon in the top right, copy and paste your absolute path (e.g., `E:\My Courses`), and hit "Save & Scan". 

## Tech Stack
-   **Frontend:** Vite, React, `lucide-react`
-   **Backend:** Express (Node), REST API, `fluent-ffmpeg`, `ffprobe-static`

# Udemy-like Course Viewer

A local React application to browse and watch video courses organized in folders.

## Setup

1.  **Install dependencies**:
    ```bash
    npm install
    cd server && npm install
    cd ../client && npm install
    cd ..
    ```

2.  **Add your courses**:
    -   Create a folder named `courses` in the root directory (already created).
    -   Inside `courses`, create subfolders for each course (e.g., "React Mastery").
    -   Inside each course folder, create subfolders for chapters (e.g., "01 - Introduction").
    -   Add your video files (`.mp4`, `.webm`, `.mkv`) inside the chapter folders.

    **Example Structure:**
    ```
    courses/
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
    ```bash
    npm start
    ```
    This will start both the backend server (port 3001) and the frontend client (port 5173).

4.  **Open in Browser**:
    Go to [http://localhost:5173](http://localhost:5173) to view your courses.

## Troubleshooting

-   If videos don't play, ensure the file format is supported by your browser (MP4 is recommended).
-   If the course list is empty, refresh the page after adding files.

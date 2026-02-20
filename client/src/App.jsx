import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  ChevronRight,
  ChevronLeft,
  Search,
  Menu,
  X,
  Star,
  Settings,
  FolderOpen,
  Share2,
  MoreVertical,
  Trophy,
  TvMinimalPlay,
  Check,
  Square,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  FileText,
  Minimize2,
  Maximize2,
  CheckSquare,
  ArrowRight,
  File,
  Link,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Pause,
  Clock
} from 'lucide-react';
import './App.css';

// --- Mock Data Utilities (to supplement missing backend data) ---

// Deterministic random generator for consistent UI between renders
const seededRandom = (seed) => {
  let value = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
};

const getCourseMetadata = (courseName) => {
  const random = seededRandom(courseName);
  const rating = (4.0 + random() * 1.0).toFixed(1);
  const reviewCount = Math.floor(random() * 50000);
  const price = Math.floor(random() * 500) + 300;
  const isBestseller = random() > 0.7;
  const isPremium = random() > 0.4;

  // Choose a color theme
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple
    'linear-gradient(to top, #30cfd0 0%, #330867 100%)', // Teal/Purple
    'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)', // Blue
    'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)', // Green
    'linear-gradient(to right, #fa709a 0%, #fee140 100%)', // Pink/Orange
  ];
  const color = colors[Math.floor(random() * colors.length)];

  return {
    rating,
    reviewCount: reviewCount.toLocaleString(),
    currentPrice: `₹${price}`,
    originalPrice: `₹${price * 4}`, // Udemy usually has huge "original" prices
    instructor: "Dr. Angela Yu, Developer and Lead Instructor", // Mocked common instructor
    details: "Become a Full-Stack Web Developer with just one course. HTML, CSS, Javascript, Node, React, MongoDB, Web3 and DApps", // Mock description
    isBestseller,
    isPremium,
    color
  };
};

const API_URL = 'http://localhost:3001/api';

function App() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lastWatched, setLastWatched] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lastWatched') || 'null');
    } catch {
      return null;
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [rootDir, setRootDir] = useState(() => localStorage.getItem('udemy_clone_root_path') || 'E:\\Rahul\\Courses');
  const [pathHistory, setPathHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('udemy_clone_path_history') || '[]');
    } catch {
      return [];
    }
  });

  // Fetch courses helper
  const fetchCourses = () => {
    return fetch(`${API_URL}/courses`)
      .then(res => res.json())
      .then(data => {
        // Hydrate data with mock metadata
        const enriched = data.map(c => ({
          ...c,
          ...getCourseMetadata(c.name)
        }));
        setCourses(enriched);
        return enriched;
      })
      .catch(err => console.error('Error fetching courses:', err));
  };

  // Initial load
  useEffect(() => {
    fetch(`${API_URL}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: rootDir })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchCourses().then((enriched) => {
            if (enriched && lastWatched) {
              const course = enriched.find(c => c.name === lastWatched.courseName);
              if (course) {
                setSelectedCourse(course);
                setCurrentVideo({
                  name: lastWatched.videoName,
                  path: lastWatched.videoPath
                });
              }
            }
          });
        } else {
          console.error("Default path invalid or not found:", data.error);
        }
      })
      .catch(err => console.error("Failed to set initial config", err));
  }, []);

  const handleBrowse = () => {
    fetch(`${API_URL}/browse`)
      .then(res => res.json())
      .then(data => {
        if (data.path) {
          setRootDir(data.path);
        }
      })
      .catch(err => console.error("Error opening browser:", err));
  };

  const handleUpdateFolder = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: rootDir })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem('udemy_clone_root_path', rootDir);
          setPathHistory(prev => {
            const newHistory = [rootDir, ...prev.filter(p => p !== rootDir)].slice(0, 5);
            localStorage.setItem('udemy_clone_path_history', JSON.stringify(newHistory));
            return newHistory;
          });
          setShowSettings(false);
          fetchCourses(); // Reload courses from new folder
          alert('Course folder updated successfully!');
        } else {
          alert('Error: ' + data.error);
        }
      })
      .catch(err => alert('Failed to update folder'));
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
  };

  const handleVideoSelect = (video, course) => {
    setCurrentVideo(video);
    // Save last watched
    const record = {
      courseName: course.name,
      videoName: video.name,
      videoPath: video.path,
      timestamp: Date.now()
    };
    setLastWatched(record);
    localStorage.setItem('lastWatched', JSON.stringify(record));
  };


  // View: Video Player
  if (selectedCourse) {
    return (
      <VideoPlayerLayout
        course={selectedCourse}
        currentVideo={currentVideo}
        setCurrentVideo={(v) => handleVideoSelect(v, selectedCourse)}
        onBack={() => { setSelectedCourse(null); setCurrentVideo(null); }}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
    );
  }

  // View: Home / Dashboard
  return (
    <div className="app-container">
      <nav className="navbar">
        {/* Reuse previous logic or simplify for "Udemy" look */}
        <div style={{ display: 'flex', alignItems: 'center', height: '7.2rem', gap: '2rem' }}>
          <img src="https://www.udemy.com/staticx/udemy/images/v7/logo-udemy.svg" alt="Udemy" style={{ height: '3.2rem' }} />
          <div className="search-bar" style={{ flex: 1, maxWidth: '60rem', border: '1px solid #1c1d1f', borderRadius: '4rem', height: '4.8rem', display: 'flex', alignItems: 'center', padding: '0 1.6rem', gap: '1rem', background: '#f7f9fa' }}>
            <Search size={20} color="#6a6f73" />
            <input placeholder="Search for anything" style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '1.4rem', outline: 'none' }} />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '1.6rem', alignItems: 'center' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 500 }}>Categories</span>
            <button
              onClick={() => setShowSettings(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#2d2f31' }}
              title="Change Content Folder"
            >
              <Settings size={24} />
              <span style={{ fontSize: '1rem', marginTop: '0.4rem' }}>Settings</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Settings</h2>
              <button onClick={() => setShowSettings(false)} className="close-btn"><X size={24} /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdateFolder}>
                <label style={{ display: 'block', marginBottom: '0.8rem', fontWeight: 700 }}>Course Directory Path</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input
                    type="text"
                    value={rootDir}
                    onChange={(e) => setRootDir(e.target.value)}
                    placeholder="E.g. D:/My Courses"
                    style={{ flex: 1, padding: '1rem', border: '1px solid #1c1d1f', borderRadius: '4px' }}
                  />
                  <button
                    type="button"
                    onClick={handleBrowse}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #1c1d1f', borderRadius: '4px' }}
                  >
                    <FolderOpen size={16} /> Browse
                  </button>
                </div>

                {pathHistory.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.4rem', color: '#2d2f31' }}>Recent Paths:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                      {pathHistory.map((path, idx) => (
                        <div
                          key={idx}
                          onClick={() => setRootDir(path)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            background: '#f7f9fa',
                            border: '1px solid #d1d7dc',
                            borderRadius: '4px',
                            fontSize: '1.2rem',
                            cursor: 'pointer'
                          }}
                        >
                          {path}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p style={{ fontSize: '1.2rem', color: '#6a6f73', marginTop: '0.8rem' }}>
                  Paste the absolute path to your courses folder.
                  The folder should contain subfolders for each course.
                </p>
                <div style={{ marginTop: '2.4rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" onClick={() => setShowSettings(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Save & Scan</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <main className="main-container">
        {lastWatched && (
          <div className="section-header-group">
            <h2>What to learn next</h2>
            <div className="continue-learning-card" onClick={() => {
              const course = courses.find(c => c.name === lastWatched.courseName);
              if (course) {
                setSelectedCourse(course);
                setCurrentVideo({
                  name: lastWatched.videoName,
                  path: lastWatched.videoPath
                });
              }
            }}>
              <div className="cl-thumbnail" style={{ background: '#2d2f31' }}>
                {/* Placeholder for video thumbnail, usually last frame */}
                <div style={{ color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Play fill="white" size={48} />
                </div>
              </div>
              <div className="cl-info">
                <span className="cl-meta" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem', color: '#6a6f73' }}>
                  Date {new Date(lastWatched.timestamp).toLocaleDateString()}
                </span>
                <span className="cl-course-title">{lastWatched.courseName}</span>
                <span className="cl-lecture-title">{lastWatched.videoName.replace(/\.[^/.]+$/, "")}</span>
                <span className="cl-meta">Lecture • 17m left</span>
              </div>
            </div>
          </div>
        )}

        <div className="section-header-group">
          {(lastWatched == null) && <h2>What to learn next</h2>}
          <h3>Recommended for you</h3>
          <div className="carousel-wrapper">
            <div className="course-carousel">
              {courses.map(course => (
                <div key={course.name} className="course-card-new" onClick={() => handleCourseSelect(course)}>
                  <div className="cc-thumbnail">
                    <div className="cc-placeholder" style={{ background: course.color }}>
                      {/* Mock Course Image Gradient */}
                      <span style={{ fontWeight: 700, fontSize: '2rem', padding: '1rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                        {course.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="cc-details">
                    <h3 className="cc-title">{course.name}</h3>
                    <span className="cc-instructor">{course.instructor}</span>
                    <div className="cc-rating-row">
                      <span className="rating-number">{course.rating}</span>
                      <div className="rating-stars">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} fill={i < Math.floor(course.rating) ? "#e59819" : "#e59819"} color="#e59819" />
                        ))}
                      </div>
                      <span className="rating-count">({course.reviewCount})</span>
                    </div>
                    <div className="cc-badges">
                      {course.isBestseller && <span className="badge badge-bestseller">Bestseller</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {courses.length > 4 && (
              <button className="carousel-nav-btn">
                <ChevronRight size={24} />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Custom Video Player Component ---
const CustomVideoPlayer = ({ src, onTimeUpdate, onEnded, autoPlay, children }) => {
  const videoRef = React.useRef(null);
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [speed, setSpeed] = React.useState(1);
  const [volume, setVolume] = React.useState(1);
  const [isMuted, setIsMuted] = React.useState(false);
  const [showControls, setShowControls] = React.useState(false);
  const [speedMenuOpen, setSpeedMenuOpen] = React.useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = React.useState(true);

  React.useEffect(() => {
    if (videoRef.current) {
      if (autoPlay) {
        videoRef.current.play().catch(() => { });
        setPlaying(true);
      }
      videoRef.current.playbackRate = speed;
    }
  }, [src, autoPlay]);

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const handleTimeUpdateInternal = (e) => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setProgress((current / dur) * 100);
      setDuration(dur);
      if (onTimeUpdate) onTimeUpdate(e);
    }
  };

  const handleSeek = (e) => {
    if (videoRef.current) {
      const newTime = (e.target.value / 100) * videoRef.current.duration;
      videoRef.current.currentTime = newTime;
      setProgress(e.target.value);
    }
  };

  const skip = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const formatTime = (time) => {
    if (!time) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (newVol > 0 && isMuted) setIsMuted(false);
    if (newVol === 0) setIsMuted(true);
  };

  return (
    <div
      className="custom-video-wrapper"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      <video
        ref={videoRef}
        src={src}
        className="custom-video-element"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdateInternal}
        onEnded={() => {
          setPlaying(false);
          if (autoplayEnabled && onEnded) onEnded();
        }}
      />

      {children}

      {/* Controls Overlay */}
      <div className={`custom-controls ${showControls || !playing ? 'visible' : ''}`}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
          padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem',
          opacity: showControls || !playing ? 1 : 0, transition: 'opacity 0.3s'
        }}
      >
        {/* Progress Bar */}
        <input
          type="range"
          min="0" max="100"
          value={progress}
          onChange={handleSeek}
          style={{ width: '100%', cursor: 'pointer', accentColor: '#a435f0' }}
        />

        <div className="controls-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem' }}>
            <button onClick={togglePlay} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              {playing ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
            </button>

            <button onClick={() => skip(-10)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <RotateCcw size={20} />
            </button>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
                style={{ background: '#fff', color: '#000', border: 'none', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700, fontSize: '1.2rem', cursor: 'pointer' }}
              >
                {speed}x
              </button>
              {speedMenuOpen && (
                <div style={{ position: 'absolute', bottom: '100%', left: '0', background: '#2d2f31', borderRadius: '4px', padding: '0.4rem', marginBottom: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(s => (
                    <div
                      key={s}
                      onClick={() => { setSpeed(s); setSpeedMenuOpen(false); }}
                      style={{ color: '#fff', padding: '0.4rem 0.8rem', cursor: 'pointer', background: speed === s ? '#a435f0' : 'transparent', fontSize: '1.2rem' }}
                    >
                      {s}x
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => skip(10)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <RotateCw size={20} />
            </button>

            <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem' }}>
            <div
              onClick={() => setAutoplayEnabled(!autoplayEnabled)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', opacity: 0.9 }}
            >
              <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>Autoplay</span>
              <div style={{
                width: '32px', height: '18px', background: autoplayEnabled ? '#a435f0' : '#6a6f73',
                borderRadius: '99px', position: 'relative', transition: 'background 0.2s'
              }}>
                <div style={{
                  width: '14px', height: '14px', background: 'white', borderRadius: '50%',
                  position: 'absolute', top: '2px', left: autoplayEnabled ? '16px' : '2px', transition: 'left 0.2s'
                }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div onClick={() => setIsMuted(!isMuted)} style={{ cursor: 'pointer' }}>
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </div>
              <input
                type="range"
                min="0" max="1" step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                style={{ width: '60px', accentColor: '#a435f0', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '1.2rem', fontWeight: 700, minWidth: '3.5rem', textAlign: 'left' }}>
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>
            <Maximize2 size={20} style={{ cursor: 'pointer' }} onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen();
              else videoRef.current?.parentElement?.requestFullscreen();
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sorting Helpers (extracted for reuse) ---
const getTypePriority = (name) => {
  if (name.match(/\.(mp4|mkv|webm|ogg|mov|avi)$/i)) return 0; // Top priority: Videos
  if (name.match(/\.(pdf|zip|rar|7z|txt|md|html|htm|url|docx|doc|ppt|pptx)$/i)) return 1; // Secondary: Resources
  return 2; // Others
};

const getNumberPrefix = (name) => {
  const match = name.match(/^(\d+(?:[.-]\d+)*)/);
  return match ? match[0] : null;
};

const advancedSort = (a, b) => {
  const aNum = getNumberPrefix(a.name);
  const bNum = getNumberPrefix(b.name);

  if (aNum && bNum) {
    const numCmp = aNum.localeCompare(bNum, undefined, { numeric: true, sensitivity: 'base' });
    if (numCmp !== 0) return numCmp;
    const typeCmp = getTypePriority(a.name) - getTypePriority(b.name);
    if (typeCmp !== 0) return typeCmp;
  } else if (aNum && !bNum) {
    return -1;
  } else if (!aNum && bNum) {
    return 1;
  } else {
    const typeCmp = getTypePriority(a.name) - getTypePriority(b.name);
    if (typeCmp !== 0) return typeCmp;
  }
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
};

// --- Player Component (Refactored for Udemy-like Layout) ---
const VideoPlayerLayout = ({ course, currentVideo, setCurrentVideo, onBack, sidebarOpen, setSidebarOpen }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedFolders, setExpandedFolders] = useState({});
  const [completedVideos, setCompletedVideos] = useState(() => {
    try {
      const stored = localStorage.getItem('udemy_clone_completed_videos');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem('udemy_clone_completed_videos', JSON.stringify([...completedVideos]));
  }, [completedVideos]);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [flatPlaylist, setFlatPlaylist] = useState([]);

  // Generate flat playlist based on sorted structure
  useEffect(() => {
    const playlist = [];
    const traverse = (items) => {
      const sorted = [...items].sort(advancedSort);
      sorted.forEach(item => {
        if (item.type === 'directory') {
          if (item.children) traverse(item.children);
        } else if (item.name.match(/\.(mp4|mkv|webm|ogg|mov|avi)$/i)) {
          playlist.push(item);
        }
      });
    };
    if (course.children) {
      traverse(course.children);
    }
    setFlatPlaylist(playlist);
  }, [course]);

  // Auto-expand/collapse active active folder
  useEffect(() => {
    if (!currentVideo || !course.children) return;

    const newExpanded = {};
    const findAndMarkPath = (items) => {
      for (const item of items) {
        if (item.path === currentVideo.path) return true;
        if (item.type === 'directory' && item.children) {
          if (findAndMarkPath(item.children)) {
            newExpanded[item.path] = true;
            return true;
          }
        }
      }
      return false;
    };

    findAndMarkPath(course.children);

    if (Object.keys(newExpanded).length > 0) {
      setExpandedFolders(newExpanded);
    }

    setShowNextOverlay(false);
  }, [currentVideo, course]);

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const playNextVideo = () => {
    if (!currentVideo || flatPlaylist.length === 0) return;
    const currentIndex = flatPlaylist.findIndex(v => v.path === currentVideo.path);
    if (currentIndex !== -1 && currentIndex < flatPlaylist.length - 1) {
      setCurrentVideo(flatPlaylist[currentIndex + 1]);
    }
  };

  const handleTimeUpdate = (e) => {
    const { currentTime, duration } = e.target;
    if (!duration || !currentVideo) return;
    const remaining = duration - currentTime;

    // Tick checkbox in last 5 seconds
    if (remaining <= 5 && !completedVideos.has(currentVideo.path)) {
      setCompletedVideos(prev => new Set(prev).add(currentVideo.path));
    }

    // Show next overlay in last 3 seconds
    if (remaining <= 3 && !showNextOverlay) {
      // Only show if there is a next video
      const currentIndex = flatPlaylist.findIndex(v => v.path === currentVideo.path);
      if (currentIndex !== -1 && currentIndex < flatPlaylist.length - 1) {
        setShowNextOverlay(true);
      }
    }
  };

  return (
    <div className="player-page">
      {/* Dark Header */}
      <header className="player-header">
        <div className="player-header-left">
          <img src="https://www.udemy.com/staticx/udemy/images/v7/logo-udemy-inverted.svg" alt="Udemy" style={{ height: '3.2rem', cursor: 'pointer' }} onClick={onBack} />
          <div className="player-header-title">
            {course.name}
          </div>
        </div>
        <div className="player-header-right">
          <div className="rating-pill" style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', marginRight: '1.6rem' }}>
            <Star size={16} fill="#fff" /> Leave a rating
          </div>

          <div className="header-btn-dark">
            <Trophy size={16} /> Your progress
          </div>

          <button className="header-btn-dark">
            Share <Share2 size={16} />
          </button>

          <button className="header-icon-btn">
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="player-body">
        {/* Left: Video & Info */}
        <div className="video-container-left">
          <div className="video-frame">
            {currentVideo ? (
              <CustomVideoPlayer
                src={`${API_URL}/video?path=${encodeURIComponent(currentVideo.path)}`}
                onTimeUpdate={handleTimeUpdate}
                onEnded={playNextVideo}
                autoPlay={true}
              >
                {showNextOverlay && (
                  <div style={{
                    position: 'absolute', bottom: '80px', right: '20px',
                    padding: '1rem 2rem', background: '#2d2f31', color: 'white',
                    borderRadius: '4px', cursor: 'pointer', zIndex: 30,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    animation: 'fadeIn 0.5s'
                  }} onClick={playNextVideo}>
                    <span style={{ fontWeight: 700 }}>Next Lecture</span>
                    <ArrowRight size={20} color="#a435f0" />
                  </div>
                )}
              </CustomVideoPlayer>
            ) : (
              <div style={{ color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <TvMinimalPlay size={64} />
                <p style={{ fontSize: '1.6rem', fontWeight: 700 }}>Select a lecture to start watching</p>
              </div>
            )}
          </div>

          {/* Info Tabs */}
          <div className="info-tabs-container">
            <div className="info-tabs">
              <div className={`info-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</div>
              <div className={`info-tab ${activeTab === 'qa' ? 'active' : ''}`} onClick={() => setActiveTab('qa')}>Q&A</div>
              <div className={`info-tab ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>Notes</div>
              <div className={`info-tab ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveTab('announcements')}>Announcements</div>
              <div className={`info-tab ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>Reviews</div>
              <div className={`info-tab ${activeTab === 'tools' ? 'active' : ''}`} onClick={() => setActiveTab('tools')}>Learning tools</div>
            </div>
          </div>

          {/* Content Below Tabs */}
          <div className="course-info-content">
            <h1 className="course-big-title">{currentVideo ? currentVideo.name.replace(/\.[^/.]+$/, "") : course.name}</h1>

            <div className="course-stats-row">
              <div className="rating-pill">
                <span style={{ fontSize: '1.4rem', color: '#b4690e', fontWeight: 700 }}>4.6</span>
                <Star size={14} fill="#b4690e" stroke="#b4690e" />
              </div>
              <span style={{ color: '#2d2f31' }}>34,134 students</span>
              <span style={{ color: '#2d2f31' }}>51 hours total</span>
            </div>

            <div style={{ borderTop: '1px solid #d1d7dc', paddingTop: '1.6rem', marginTop: '1.6rem' }}>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.8rem', color: '#2d2f31' }}>Description</h3>
              <p style={{ fontSize: '1.4rem', lineHeight: '1.6', color: '#2d2f31' }}>
                {course.details || "A comprehensive course to master the subject matter. Dive deep into concepts with practical examples and hands-on projects."}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Sidebar Content */}
        {sidebarOpen && (
          <div className="course-sidebar-right">
            <div className="sidebar-tabs">
              <div className="sidebar-tab active">Course content</div>
              <div className="sidebar-tab" style={{ color: '#5624d0' }}>✨ AI Assistant</div>
              <div className="sidebar-header-icons" style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', paddingRight: '1rem' }}>
                <div style={{ padding: '0.8rem', cursor: 'pointer' }} onClick={() => setSidebarOpen(false)}><X size={20} color="#2d2f31" /></div>
              </div>
            </div>

            <div className="sidebar-content">
              {course.children && <SimpleFileTree items={course.children} expanded={expandedFolders} toggle={toggleFolder} onPlay={setCurrentVideo} current={currentVideo} completed={completedVideos} flatPlaylist={flatPlaylist} />}
            </div>
          </div>
        )}
        {!sidebarOpen && (
          <div style={{ position: 'absolute', right: 0, top: '6rem', background: '#2d2f31', padding: '1rem', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px', cursor: 'pointer', zIndex: 99 }} onClick={() => setSidebarOpen(true)}>
            <ChevronLeft size={24} color="white" />
          </div>
        )}
      </div>
    </div>
  );
};

const LessonItem = ({ item, current, onPlay, completed, level, flatPlaylist }) => {
  const [durationLabel, setDurationLabel] = useState("");
  const isVideo = item.name.match(/\.(mp4|mkv|webm|ogg|mov|avi)$/i);
  const isPDF = item.name.match(/\.(pdf)$/i);
  const isLink = item.name.match(/\.(html|htm|url)$/i);

  useEffect(() => {
    let active = true;
    if (isVideo) {
      let shouldLoad = false;
      if (flatPlaylist && flatPlaylist.length > 0) {
        const myIndex = flatPlaylist.findIndex(v => v.path === item.path);
        if (myIndex !== -1) {
          const currentIndex = current ? flatPlaylist.findIndex(v => v.path === current.path) : -1;
          // Load if it's one of the first 5, OR within 3 videos of current (before or after)
          if (myIndex < 5 || (currentIndex !== -1 && Math.abs(myIndex - currentIndex) <= 3)) {
            shouldLoad = true;
          }
        }
      } else {
        shouldLoad = true;
      }

      if (shouldLoad && !durationLabel) {
        fetch(`${API_URL}/duration?path=${encodeURIComponent(item.path)}`)
          .then(res => res.json())
          .then(data => {
            if (active) {
              const seconds = data.duration;
              if (seconds !== undefined && seconds !== 0) {
                const minutes = Math.round(seconds / 60);
                setDurationLabel(`${minutes}min`);
              }
            }
          })
          .catch(() => { });
      }
    } else {
      setDurationLabel(isPDF ? "PDF" : (isLink ? "Link" : "Resource"));
    }
    return () => { active = false; };
  }, [item, isVideo, isPDF, isLink, flatPlaylist, current, durationLabel]);

  const handleItemClick = () => {
    if (isVideo) {
      onPlay(item);
    } else {
      window.open(`${API_URL}/video?path=${encodeURIComponent(item.path)}`, '_blank');
    }
  };

  return (
    <div
      className={`lesson-item ${current?.path === item.path ? 'active' : ''}`}
      onClick={handleItemClick}
      style={{ paddingLeft: level > 0 ? '1.6rem' : '1.6rem' }}
    >
      <div className="lesson-checkbox">
        {isVideo && (completed.has(item.path) ? <CheckSquare size={16} color="#a435f0" fill="#a435f0" stroke="white" /> : <Square size={16} strokeWidth={1} />)}
        {!isVideo && <div style={{ width: 16 }}></div>}
      </div>
      <div className="lesson-info">
        <div className="lesson-title">{item.name.replace(/\.[^/.]+$/, "")}</div>
        <div className="lesson-meta">
          <div className="video-icon-small">
            {isVideo && <PlayCircle size={14} />}
            {isPDF && <File size={14} />}
            {isLink && <Link size={14} />}
            {!isVideo && !isPDF && !isLink && <FileText size={14} />}

            <span style={{ marginLeft: '0.4rem', fontSize: '1.2rem' }}>
              {durationLabel || (isVideo ? "" : "Resource")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SimpleFileTree = ({ items, expanded, toggle, onPlay, current, completed = new Set(), level = 0, flatPlaylist }) => {
  const sortedItems = [...items].sort(advancedSort);

  return sortedItems.map(item => (
    <div key={item.path}>
      {item.type === 'directory' ? (
        <div className="section-container" style={{ marginLeft: level > 0 ? '1.6rem' : 0 }}>
          <div className="section-header" onClick={() => toggle(item.path)} style={{ paddingLeft: level > 0 ? '0' : '1.6rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span className="section-title-text" style={{ fontWeight: 700, lineHeight: 1.2 }}>{item.name}</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 400, color: '#6a6f73' }}>
                {expanded[item.path] ? 'Hide' : 'Show'} Content
              </span>
            </div>
            {expanded[item.path] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>

          {expanded[item.path] && (
            <div className="section-items">
              <SimpleFileTree items={item.children} expanded={expanded} toggle={toggle} onPlay={onPlay} current={current} completed={completed} level={level + 1} flatPlaylist={flatPlaylist} />
            </div>
          )}
        </div>
      ) : (
        <LessonItem key={item.path} item={item} current={current} onPlay={onPlay} completed={completed} level={level} flatPlaylist={flatPlaylist} />
      )}
    </div>
  ));
};

export default App;

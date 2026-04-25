import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Moon, Utensils, Heart, Activity, AlertCircle, Save, Shirt, Coins, Volume2, VolumeX, Camera } from 'lucide-react';

// Sound effects using Web Audio API
const createSound = (frequency, duration, type = 'sine') => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

const playSound = (soundName) => {
  const sounds = {
    bark: () => { createSound(400, 0.3, 'sawtooth'); setTimeout(() => createSound(350, 0.2, 'sawtooth'), 100); },
    crunch: () => { createSound(800, 0.1, 'square'); setTimeout(() => createSound(600, 0.1, 'square'), 50); },
    snore: () => createSound(100, 0.5, 'sine'),
    tada: () => { createSound(523, 0.1); setTimeout(() => createSound(659, 0.1), 100); setTimeout(() => createSound(784, 0.3), 200); },
    pet: () => createSound(800, 0.15, 'sine'),
    coin: () => { createSound(1200, 0.1, 'sine'); setTimeout(() => createSound(1800, 0.15), 50); },
    click: () => createSound(600, 0.05, 'square'),
  };
  sounds[soundName]?.();
};

export default function App() {
  // Load saved data from localStorage
  const loadSavedData = () => {
    const saved = localStorage.getItem('lalaGameData');
    if (saved) {
      const data = JSON.parse(saved);
      const lastSaved = data.lastSaved ? new Date(data.lastSaved) : new Date();
      const now = new Date();
      const hoursOffline = (now - lastSaved) / (1000 * 60 * 60);
      
      // Calculate offline progress
      const offlineHunger = Math.max(0, (data.hunger || 80) - hoursOffline * 5);
      const offlineEnergy = Math.min(100, (data.energy || 100) + (data.isSleeping ? hoursOffline * 10 : 0));
      const offlineHappiness = Math.max(0, (data.happiness || 80) - hoursOffline * 2);
      
      return {
        hunger: offlineHunger,
        happiness: offlineHappiness,
        energy: offlineEnergy,
        poopCount: data.poopCount || 0,
        coins: data.coins || 0,
        unlockedFoods: data.unlockedFoods || ['Royal Canin'],
        wardrobe: data.wardrobe || { sweater: false, cap: false },
        isSoundEnabled: data.isSoundEnabled !== false,
      };
    }
    return null;
  };

  const savedData = loadSavedData();
  
  const [hunger, setHunger] = useState(savedData?.hunger ?? 80);
  const [happiness, setHappiness] = useState(savedData?.happiness ?? 80);
  const [energy, setEnergy] = useState(savedData?.energy ?? 100);
  const [isSleeping, setIsSleeping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [message, setMessage] = useState('');
  const [speechText, setSpeechText] = useState('');
  const [poopCount, setPoopCount] = useState(savedData?.poopCount ?? 0);
  
  const [isARSupported, setIsARSupported] = useState(false);
  const [isARMode, setIsARMode] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [particles, setParticles] = useState([]);
  
  const [playMode, setPlayMode] = useState('none'); 
  const [showPlayMenu, setShowPlayMenu] = useState(false);
  const [showFeedMenu, setShowFeedMenu] = useState(false);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [isEating, setIsEating] = useState(false);
  const [activeBowl, setActiveBowl] = useState(null);
  const [ballX, setBallX] = useState(50);
  const [hidingSpot, setHidingSpot] = useState(1);
  const [revealedSpot, setRevealedSpot] = useState(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [activeTrick, setActiveTrick] = useState(null);
  const [trickStartTime, setTrickStartTime] = useState(0);
  
  // New features state
  const [coins, setCoins] = useState(savedData?.coins ?? 0);
  const [unlockedFoods, setUnlockedFoods] = useState(savedData?.unlockedFoods ?? ['Royal Canin']);
  const [wardrobe, setWardrobe] = useState(savedData?.wardrobe ?? { sweater: false, cap: false });
  const [isSoundEnabled, setIsSoundEnabled] = useState(savedData?.isSoundEnabled ?? true);
  const [cameraZoom, setCameraZoom] = useState(14);
  const [isPetting, setIsPetting] = useState(false);
  const [petCount, setPetCount] = useState(0);
  
  // Day/Night cycle
  const [isDaytime, setIsDaytime] = useState(true);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  
  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setCurrentHour(hour);
      setIsDaytime(hour >= 6 && hour < 18); // Day: 6am - 6pm
    };
    checkTime();
    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);
  
  // PWA Install Prompt
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  
  useEffect(() => {
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    
    // Check if already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.navigator.standalone === true) {
        setIsInstalled(true);
      }
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      console.log('[PWA] App installed successfully!');
    });
    
    checkInstalled();
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install');
      setShowInstallBanner(false);
    } else {
      console.log('[PWA] User dismissed install');
    }
    
    setInstallPrompt(null);
  };
  
  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    // Save dismissal to localStorage so it doesn't show again for 7 days
    localStorage.setItem('pwaInstallDismissed', Date.now().toString());
  };
  
  const gameAreaRef = useRef(null);
  const canvasMountRef = useRef(null);
  const rendererRef = useRef(null);
  const [threeReady, setThreeReady] = useState(false);
  const targetCameraPos = useRef({ x: 0, y: 3, z: 14 });

  const stateRef = useRef({ isSleeping, isSpeaking, isListening, playMode, isBlinking, isEating, isARMode, activeTrick, trickStartTime });
  useEffect(() => {
    stateRef.current = { isSleeping, isSpeaking, isListening, playMode, isBlinking, isEating, isARMode, activeTrick, trickStartTime };
  }, [isSleeping, isSpeaking, isListening, playMode, isBlinking, isEating, isARMode, activeTrick, trickStartTime]);

  // Save game state to localStorage
  useEffect(() => {
    const saveData = {
      hunger,
      happiness,
      energy,
      poopCount,
      coins,
      unlockedFoods,
      wardrobe,
      isSoundEnabled,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem('lalaGameData', JSON.stringify(saveData));
  }, [hunger, happiness, energy, poopCount, coins, unlockedFoods, wardrobe, isSoundEnabled]);

  // Sound effect helper
  const playGameSound = useCallback((soundName) => {
    if (isSoundEnabled) playSound(soundName);
  }, [isSoundEnabled]);

  useEffect(() => {
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        setIsARSupported(supported);
      });
    }
  }, []);

  useEffect(() => {
    if (!window.THREE) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.async = true;
      script.onload = () => setThreeReady(true);
      document.body.appendChild(script);
    } else {
      setThreeReady(true);
    }
  }, []);

  useEffect(() => {
    if (!threeReady || !canvasMountRef.current) return;
    const THREE = window.THREE;
    const width = canvasMountRef.current.clientWidth;
    const height = canvasMountRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 3, 14);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.xr.enabled = true; 
    rendererRef.current = renderer;
    canvasMountRef.current.innerHTML = '';
    canvasMountRef.current.appendChild(renderer.domElement);

    const handleResize = () => {
      if (!canvasMountRef.current) return;
      const newWidth = canvasMountRef.current.clientWidth;
      const newHeight = canvasMountRef.current.clientHeight;
      renderer.setSize(newWidth, newHeight);
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    const envGroup = new THREE.Group();
    scene.add(envGroup);

    // Walls
    const roomGeometry = new THREE.BoxGeometry(40, 30, 40);
    const roomMaterial = new THREE.MeshStandardMaterial({ color: 0xf7f3e8, side: THREE.BackSide, roughness: 1 }); 
    const roomMesh = new THREE.Mesh(roomGeometry, roomMaterial);
    roomMesh.position.y = 11.5; 
    envGroup.add(roomMesh);

    // Floor
    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.8 }); 
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -3.4; 
    envGroup.add(floorMesh);

    // Rug
    const rugGeo = new THREE.PlaneGeometry(24, 16);
    const rugMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 1 }); 
    const rugMesh = new THREE.Mesh(rugGeo, rugMat);
    rugMesh.rotation.x = -Math.PI / 2;
    rugMesh.position.y = -3.35; 
    envGroup.add(rugMesh);

    // Baseboards
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const bbBack = new THREE.Mesh(new THREE.BoxGeometry(40, 0.8, 0.4), baseboardMat);
    bbBack.position.set(0, -3.0, -19.8);
    const bbLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 40), baseboardMat);
    bbLeft.position.set(-19.8, -3.0, 0);
    const bbRight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 40), baseboardMat);
    bbRight.position.set(19.8, -3.0, 0);
    envGroup.add(bbBack, bbLeft, bbRight);

    // Picture Frames
    const loadTextureRobust = (url, onSuccess) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace || THREE.LinearEncoding;
        tex.needsUpdate = true;
        onSuccess(tex);
      };
      img.onerror = () => {
        const imgFallback = new window.Image();
        imgFallback.onload = () => {
          const tex = new THREE.Texture(imgFallback);
          tex.colorSpace = THREE.SRGBColorSpace || THREE.LinearEncoding;
          tex.needsUpdate = true;
          onSuccess(tex);
        };
        imgFallback.src = url.startsWith('./') ? url : `./${url}`;
      };
      img.src = url;
    };

    const createPictureFrame = (imageUrl, x, y, z, rotY, w, h) => {
      const frameGroup = new THREE.Group();
      frameGroup.position.set(x, y, z);
      frameGroup.rotation.y = rotY;

      const frameGeo = new THREE.BoxGeometry(w + 0.6, h + 0.6, 0.2);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameGroup.add(frameMesh);

      const mattingGeo = new THREE.PlaneGeometry(w + 0.2, h + 0.2);
      const mattingMat = new THREE.MeshStandardMaterial({ color: 0xfffdf7, roughness: 1 });
      const mattingMesh = new THREE.Mesh(mattingGeo, mattingMat);
      mattingMesh.position.z = 0.11;
      frameGroup.add(mattingMesh);

      const photoGeo = new THREE.PlaneGeometry(w, h);
      const photoMat = new THREE.MeshBasicMaterial({ color: 0xe0e0e0 }); 
      const photoMesh = new THREE.Mesh(photoGeo, photoMat);
      photoMesh.position.z = 0.12;
      frameGroup.add(photoMesh);

      loadTextureRobust(imageUrl, (tex) => {
        photoMat.map = tex;
        photoMat.color.setHex(0xffffff); 
        photoMat.needsUpdate = true;
      });

      return frameGroup;
    };

    // Back Wall
    envGroup.add(createPictureFrame("/11bef94c-d02c-4a46-825e-3c237f1b34de.jpg", 8, 6, -19.5, 0, 5, 7)); 
    envGroup.add(createPictureFrame("/7041577e-b6c3-46e8-9e24-ba104c283f06.jpg", -8, 6, -19.5, 0, 5, 7)); 

    // Left Wall
    envGroup.add(createPictureFrame("/8e2349ec-5605-4680-84df-b9d796e98664.jpg", -19.5, 6, -8, Math.PI / 2, 6, 8)); 
    envGroup.add(createPictureFrame("/97058043-34f4-4183-a223-7ca09099de26.jpg", -19.5, 6, 2, Math.PI / 2, 6, 8)); 
    envGroup.add(createPictureFrame("/c60d0bde-a31b-4afb-b18f-f3bdccd9c4cc.jpg", -19.5, 6, 12, Math.PI / 2, 6, 8)); 

    // Right Wall
    envGroup.add(createPictureFrame("/c6a730dc-c4b6-42d1-8035-ea014827ae93.jpg", 19.5, 6, -8, -Math.PI / 2, 6, 8)); 
    envGroup.add(createPictureFrame("/df638660-426f-464f-94e2-606cc6c61ed1.jpg", 19.5, 6, 2, -Math.PI / 2, 6, 8)); 
    envGroup.add(createPictureFrame("/fdfc5997-f59d-4426-9c98-a06946b8315c.jpg", 19.5, 6, 12, -Math.PI / 2, 6, 8)); 

    // Sofa
    const couchMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.8 });
    const couch = new THREE.Group();
    couch.position.set(6, -3, -8); 
    const seat = new THREE.Mesh(new THREE.BoxGeometry(6, 0.8, 3), couchMat);
    seat.position.set(0, 0.4, 0);
    const back = new THREE.Mesh(new THREE.BoxGeometry(6, 2.5, 0.6), couchMat);
    back.position.set(0, 1.65, -1.2);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 3), couchMat);
    armL.position.set(-2.6, 0.7, 0);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 3), couchMat);
    armR.position.set(2.6, 0.7, 0);
    couch.add(seat, back, armL, armR);
    envGroup.add(couch);

    // Window with Day/Night cycle
    const winGroup = new THREE.Group();
    winGroup.position.set(0, 2.5, -19.6); 
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    
    // Day glass (blue sky)
    const dayGlassMat = new THREE.MeshStandardMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.3, emissive: 0x335577, emissiveIntensity: 0.2 });
    // Night glass (dark with stars)
    const nightGlassMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, transparent: true, opacity: 0.9, emissive: 0x0f0f23, emissiveIntensity: 0.5 });
    
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(6, 8), dayGlassMat);
    const frameT = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.3, 0.3), frameMat); frameT.position.y = 4;
    const frameB = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.3, 0.3), frameMat); frameB.position.y = -4;
    const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 8.4, 0.3), frameMat); frameL.position.x = -3;
    const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 8.4, 0.3), frameMat); frameR.position.x = 3;
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(6, 0.15, 0.15), frameMat);
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.15, 8, 0.15), frameMat);
    winGroup.add(glass, frameT, frameB, frameL, frameR, crossH, crossV);
    envGroup.add(winGroup);
    
    // Stars for night time (outside window)
    const starsGroup = new THREE.Group();
    starsGroup.position.set(0, 2.5, -20);
    const starGeo = new THREE.SphereGeometry(0.05, 4, 4);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 50; i++) {
      const star = new THREE.Mesh(starGeo, starMat);
      star.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        0
      );
      starsGroup.add(star);
    }
    starsGroup.visible = !isDaytime;
    envGroup.add(starsGroup);
    
    // Moon for night time
    const moonGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xffffdd, emissive: 0xffffdd, emissiveIntensity: 0.5 });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(2, 4, -19.5);
    moon.visible = !isDaytime;
    envGroup.add(moon);
    
    // Sun for day time
    const sunGeo = new THREE.SphereGeometry(1, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffdd44, emissive: 0xffaa00, emissiveIntensity: 0.8 });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(-2, 5, -19);
    sun.visible = isDaytime;
    envGroup.add(sun);

    // Armchair
    const chairMat = new THREE.MeshStandardMaterial({ color: 0xf39c12, roughness: 0.7 });
    const chair = new THREE.Group();
    chair.position.set(-8, -3, -6);
    chair.rotation.y = Math.PI / 4; 
    const cSeat = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 3), chairMat); cSeat.position.y = 0.4;
    const cBack = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 0.6), chairMat); cBack.position.set(0, 1.65, -1.2);
    const cArmL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 3), chairMat); cArmL.position.set(-1.2, 0.7, 0);
    const cArmR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 3), chairMat); cArmR.position.set(1.2, 0.7, 0);
    chair.add(cSeat, cBack, cArmL, cArmR);
    envGroup.add(chair);

    // Toys
    const toyBall = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.3 }));
    toyBall.position.set(-4, -3, 3);
    envGroup.add(toyBall);

    const toyBone = new THREE.Group();
    toyBone.position.set(5, -3.2, 4);
    toyBone.rotation.y = Math.PI / 3;
    const boneColor = new THREE.MeshStandardMaterial({ color: 0xecf0f1 });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8), boneColor); shaft.rotation.z = Math.PI / 2;
    const n1 = new THREE.Mesh(new THREE.SphereGeometry(0.15), boneColor); n1.position.set(0.4, 0, 0.1);
    const n2 = new THREE.Mesh(new THREE.SphereGeometry(0.15), boneColor); n2.position.set(0.4, 0, -0.1);
    const n3 = new THREE.Mesh(new THREE.SphereGeometry(0.15), boneColor); n3.position.set(-0.4, 0, 0.1);
    const n4 = new THREE.Mesh(new THREE.SphereGeometry(0.15), boneColor); n4.position.set(-0.4, 0, -0.1);
    toyBone.add(shaft, n1, n2, n3, n4);
    envGroup.add(toyBone);

    // Dynamic Lighting with Day/Night cycle
    const dayAmbientLight = new THREE.AmbientLight(0xffeedd, 0.75);
    const nightAmbientLight = new THREE.AmbientLight(0x2d3561, 0.3);
    nightAmbientLight.visible = !isDaytime;
    scene.add(dayAmbientLight, nightAmbientLight);
    
    const dirLight = new THREE.DirectionalLight(0xfff5e6, isDaytime ? 0.8 : 0.2);
    dirLight.position.set(5, 12, 8);
    scene.add(dirLight);
    
    // Cozy lamp for night time (near couch)
    const lampGroup = new THREE.Group();
    lampGroup.position.set(4, -3, -6);
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.5), new THREE.MeshStandardMaterial({ color: 0x8b4513 }));
    const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4), new THREE.MeshStandardMaterial({ color: 0x8b4513 }));
    lampPole.position.y = 2;
    const lampShade = new THREE.Mesh(new THREE.ConeGeometry(1, 1.5, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xffd700, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }));
    lampShade.position.y = 4;
    lampGroup.add(lampBase, lampPole, lampShade);
    
    // Warm lamp light (only at night)
    const lampLight = new THREE.PointLight(0xffaa44, 0, 15);
    lampLight.position.set(4, 4, -6);
    lampLight.visible = !isDaytime;
    scene.add(lampLight, lampGroup);

    // Lala Setup
    const lalaWorld = new THREE.Group();
    scene.add(lalaWorld);
    const lala = new THREE.Group();
    lalaWorld.add(lala);
    
    const fluffMat = new THREE.MeshStandardMaterial({ color: 0xfffaec, roughness: 0.9, flatShading: true }); 
    const peachMat = new THREE.MeshStandardMaterial({ color: 0xffd1b3, roughness: 0.9, flatShading: true }); 
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, flatShading: true });
    const pinkMat = new THREE.MeshStandardMaterial({ color: 0xffaacc, roughness: 0.8, flatShading: true });
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 });

    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 1.5), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.05;
    lala.add(shadow);

    const chestLala = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 1), fluffMat);
    chestLala.position.set(0, 1.6, 0.4);
    lala.add(chestLala);

    const backBodyLala = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 1), peachMat);
    backBodyLala.position.set(0, 1.4, -0.5);
    lala.add(backBodyLala);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.7, 1.0);
    lala.add(headGroup);

    const headLala = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 1), fluffMat);
    headGroup.add(headLala);

    const snoutLala = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 0), fluffMat);
    snoutLala.scale.set(1, 0.8, 1.2);
    snoutLala.position.set(0, -0.1, 0.8);
    headGroup.add(snoutLala);

    const noseLala = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), darkMat);
    noseLala.position.set(0, 0.05, 0.35);
    snoutLala.add(noseLala);

    const eyeGeo = new THREE.IcosahedronGeometry(0.1, 0);
    const eyeR = new THREE.Mesh(eyeGeo, darkMat); eyeR.position.set(0.35, 0.25, 0.85);
    const eyeL = new THREE.Mesh(eyeGeo, darkMat); eyeL.position.set(-0.35, 0.25, 0.85);
    headGroup.add(eyeR, eyeL);

    const earGeo = new THREE.ConeGeometry(0.3, 0.7, 4);
    const earR = new THREE.Mesh(earGeo, peachMat); earR.position.set(0.45, 0.8, 0); earR.rotation.set(-0.1, 0.2, -0.2);
    const earL = new THREE.Mesh(earGeo, peachMat); earL.position.set(-0.45, 0.8, 0); earL.rotation.set(-0.1, -0.2, 0.2);
    headGroup.add(earR, earL);

    const tongue = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 0), pinkMat);
    tongue.position.set(0, -0.25, 1.05);
    headGroup.add(tongue);

    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 1.8, -1.4);
    lala.add(tailGroup);
    const tailMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 1), peachMat);
    tailMesh.position.set(0, 0.4, -0.2);
    tailGroup.add(tailMesh);

    const pawGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.8, 5);
    const pawFL = new THREE.Mesh(pawGeo, fluffMat); pawFL.position.set(-0.4, 0.4, 0.9);
    const pawFR = new THREE.Mesh(pawGeo, fluffMat); pawFR.position.set(0.4, 0.4, 0.9);
    const pawBL = new THREE.Mesh(pawGeo, peachMat); pawBL.position.set(-0.5, 0.4, -0.8);
    const pawBR = new THREE.Mesh(pawGeo, peachMat); pawBR.position.set(0.5, 0.4, -0.8);
    lala.add(pawFL, pawFR, pawBL, pawBR);

    // Wardrobe - Yellow Sweater
    const sweaterMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.7, flatShading: true });
    const sweater = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.5, 1.2, 8), sweaterMat);
    sweater.position.set(0, 1.6, 0.4);
    sweater.visible = false;
    lala.add(sweater);

    // Wardrobe - Purple Cap
    const capMat = new THREE.MeshStandardMaterial({ color: 0x9b59b6, roughness: 0.7, flatShading: true });
    const capGroup = new THREE.Group();
    capGroup.position.set(0, 3.2, 1.0);
    const capDome = new THREE.Mesh(new THREE.SphereGeometry(1.05, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
    const capBrim = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.1, 8), capMat);
    capBrim.position.set(0, -0.1, 0.3);
    capBrim.rotation.x = 0.3;
    capBrim.scale.set(1, 0.5, 1.5);
    capGroup.add(capDome, capBrim);
    capGroup.visible = false;
    lala.add(capGroup);
    
    const FLOOR_Y = -3.4; 
    const COUCH_POS = { x: 6, y: -2.2, z: -8 }; 
    let targetLalaPos = new THREE.Vector3(0, FLOOR_Y, 0);

    let roamTime = 0;
    let lastARMode = false;

    const animate = () => {
      const time = Date.now();
      const st = stateRef.current;
      
      if (st.isARMode !== lastARMode) {
        lastARMode = st.isARMode;
        if (st.isARMode) {
          envGroup.visible = false;
          lalaWorld.scale.set(0.15, 0.15, 0.15); 
          lalaWorld.position.set(0, 3 * 0.15, -1); 
        } else {
          envGroup.visible = true;
          lalaWorld.scale.set(1, 1, 1);
          lalaWorld.position.set(0, 0, 0);
        }
      }

      let targetHeadRotX = 0;
      let targetHeadRotZ = 0;
      let targetEyeScaleY = 1;
      let targetTongueScale = 0.01; 
      let targetLalaRotZ = 0;
      let isMoving = false;
      let isWalking = false;

      let nextTargetPos = targetLalaPos.clone();

      if (st.isSleeping) {
        nextTargetPos.set(COUCH_POS.x, COUCH_POS.y, COUCH_POS.z);
        if (st.isARMode) nextTargetPos.set(0, FLOOR_Y, 0); 
        
        targetHeadRotX = -0.4;
        targetEyeScaleY = 0.1;
        targetLalaRotZ = 1.2; 
        shadow.visible = false; 
      } else {
        shadow.visible = true;
        nextTargetPos.y = FLOOR_Y + Math.abs(Math.sin(time * 0.003)) * 0.05;

        if (st.isEating) {
          nextTargetPos.set(0, FLOOR_Y, 1); 
          targetHeadRotX = -0.7; 
          targetTongueScale = 0.8 + Math.sin(time * 0.04) * 0.3; 
          nextTargetPos.y += Math.abs(Math.sin(time * 0.01)) * 0.1; 
        } else if (st.isListening) {
           targetHeadRotZ = 0.2; 
        }

        if (st.isSpeaking) {
          targetTongueScale = 1.0 + Math.sin(time * 0.02) * 0.3; 
          targetHeadRotX = Math.sin(time * 0.01) * 0.1; 
        }

        if (st.playMode === 'none' && !st.isSpeaking && !st.isListening && !st.isEating) {
          roamTime += 0.002;
          nextTargetPos.x = Math.sin(roamTime) * 5;
          nextTargetPos.z = Math.cos(roamTime * 0.7) * 3 - 1;
          isMoving = true;
          isWalking = true;
        } else if (st.playMode === 'fetch') {
          nextTargetPos.x = (ballX - 50) * 0.15;
          nextTargetPos.z = 2; 
          isMoving = true;
          isWalking = true;
        } else if (st.playMode === 'find' && isRevealing) {
          nextTargetPos.x = (revealedSpot - 1) * 4; 
          nextTargetPos.z = 2;
          isMoving = true;
          isWalking = true;
        }

        if (st.playMode === 'fetch' && lala.position.distanceTo(nextTargetPos) < 1.5) {
           nextTargetPos.y += Math.abs(Math.sin(time * 0.015)) * 0.4;
           targetHeadRotX = 0.2;
           isWalking = false;
        }

        if (st.activeTrick) {
          isMoving = false;
          isWalking = false;
          const elapsed = time - st.trickStartTime;
          const progress = Math.min(elapsed / 2000, 1);

          if (st.activeTrick === 'jump') {
            nextTargetPos.y += Math.sin(progress * Math.PI) * 4; 
            targetHeadRotX = -0.3; 
            pawFL.position.z = 1.2; pawFR.position.z = 1.2; 
          } else if (st.activeTrick === 'roll') {
            nextTargetPos.y += Math.sin(progress * Math.PI) * 1.5; 
          }
        }
      }

      lala.position.lerp(nextTargetPos, 0.05);

      let targetRotY = lala.rotation.y;
      if (isMoving && !st.isSleeping) {
        const direction = nextTargetPos.clone().sub(lala.position).normalize();
        if (lala.position.distanceTo(nextTargetPos) > 0.5) {
          targetRotY = Math.atan2(direction.x, direction.z);
        }
      }
      
      if (st.activeTrick === 'spin') {
        lala.rotation.y -= 0.25; 
      } else {
        let deltaRotY = targetRotY - lala.rotation.y;
        if (deltaRotY > Math.PI) deltaRotY -= Math.PI * 2;
        if (deltaRotY < -Math.PI) deltaRotY += Math.PI * 2;
        lala.rotation.y += deltaRotY * 0.08;
      }

      if (st.activeTrick === 'roll') {
        const elapsed = time - st.trickStartTime;
        const progress = Math.min(elapsed / 2000, 1);
        lala.rotation.z = progress * Math.PI * 2;
      } else {
        lala.rotation.z += (targetLalaRotZ - lala.rotation.z) * 0.1;
      }

      if (isWalking && !st.isSleeping) {
        pawFL.position.z = 0.9 + Math.sin(time * 0.01) * 0.3;
        pawFR.position.z = 0.9 + Math.sin(time * 0.01 + Math.PI) * 0.3;
        pawBL.position.z = -0.8 + Math.sin(time * 0.01 + Math.PI) * 0.3;
        pawBR.position.z = -0.8 + Math.sin(time * 0.01) * 0.3;
      } else {
        pawFL.position.z += (0.9 - pawFL.position.z) * 0.1;
        pawFR.position.z += (0.9 - pawFR.position.z) * 0.1;
        pawBL.position.z += (-0.8 - pawBL.position.z) * 0.1;
        pawBR.position.z += (-0.8 - pawBR.position.z) * 0.1;
      }

      if (!st.isSleeping) {
        tailGroup.rotation.z = Math.sin(time * 0.015) * 0.3; 
        tailGroup.rotation.x = Math.sin(time * 0.005) * 0.1;
      } else {
        tailGroup.rotation.z = 0;
        tailGroup.rotation.x = -0.5; 
      }

      headGroup.rotation.x += (targetHeadRotX - headGroup.rotation.x) * 0.1;
      headGroup.rotation.z += (targetHeadRotZ - headGroup.rotation.z) * 0.1;

      targetEyeScaleY = st.isBlinking ? 0.1 : targetEyeScaleY;
      eyeR.scale.y += (targetEyeScaleY - eyeR.scale.y) * 0.3;
      eyeL.scale.y = eyeR.scale.y;

      tongue.scale.z += (targetTongueScale - tongue.scale.z) * 0.3;
      tongue.scale.x = tongue.scale.z;
      tongue.scale.y = tongue.scale.z * 0.5;
      tongue.visible = tongue.scale.z > 0.1;

      // Petting wiggle effect
      if (isPetting) {
        lala.rotation.z = Math.sin(time * 0.02) * 0.1;
        tailGroup.rotation.z = Math.sin(time * 0.03) * 0.8;
      }

      // Update wardrobe visibility
      sweater.visible = wardrobe.sweater;
      capGroup.visible = wardrobe.cap;

      // Day/Night cycle updates
      const isDay = isDaytime;
      dayAmbientLight.visible = isDay;
      nightAmbientLight.visible = !isDay;
      dirLight.intensity = isDay ? 0.8 : 0.2;
      lampLight.visible = !isDay;
      lampLight.intensity = !isDay ? 1 : 0;
      starsGroup.visible = !isDay;
      moon.visible = !isDay;
      sun.visible = isDay;
      glass.material = isDay ? dayGlassMat : nightGlassMat;
      
      // Update room color based on time
      roomMesh.material.color.setHex(isDay ? 0xf7f3e8 : 0x2d2d3a);
      floorMat.color.setHex(isDay ? 0x8d6e63 : 0x3d3d4a);

      // Camera with dynamic zoom
      if (!st.isARMode) {
        camera.position.x += (targetCameraPos.current.x - camera.position.x) * 0.05;
        camera.position.y += (targetCameraPos.current.y - camera.position.y) * 0.05;
        camera.position.z += (cameraZoom - camera.position.z) * 0.03;
        camera.lookAt(lala.position.x, lala.position.y + 2, lala.position.z); 
      }

      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.setAnimationLoop(null);
      renderer.dispose();
      if (canvasMountRef.current) canvasMountRef.current.innerHTML = '';
    };
  }, [threeReady]);

  const startAR = async () => {
    if (!rendererRef.current || !navigator.xr) return;
    try {
      const sessionInit = {
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.body }
      };
      const session = await navigator.xr.requestSession('immersive-ar', sessionInit);
      rendererRef.current.xr.setSession(session);
      setIsARMode(true);
      
      session.addEventListener('end', () => {
        setIsARMode(false);
      });
    } catch (e) {
      showMessage("Could not start AR. Ensure you are on a compatible mobile device.");
    }
  };

  useEffect(() => {
    const blinkTimer = setInterval(() => {
      if (!isSleeping) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 200);
      }
    }, Math.random() * 4000 + 2000); 
    return () => clearInterval(blinkTimer);
  }, [isSleeping]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isSleeping) {
        setHunger((prev) => Math.max(0, prev - 2));
        setHappiness((prev) => Math.max(0, prev - 1));
        setEnergy((prev) => Math.max(0, prev - 1));
      } else {
        setEnergy((prev) => Math.min(100, prev + 5));
        setHunger((prev) => Math.max(0, prev - 1));
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [isSleeping]);

  useEffect(() => {
    const poopTimer = setInterval(() => {
      setPoopCount((prev) => {
        if (prev < 5 && playMode === 'none') {
          showMessage("Oh no, Lala made a mess! 💩");
          return prev + 1;
        }
        return prev;
      });
    }, 35000);
    return () => clearInterval(poopTimer);
  }, [playMode]);

  useEffect(() => {
    if (playMode !== 'none' && (energy < 15 || hunger < 15)) {
      setPlayMode('none');
      showMessage("Lala is too tired/hungry to keep playing right now!");
    }
  }, [energy, hunger, playMode]);

  const spawnParticles = (type) => {
    const count = type === 'coin' ? 5 : 3;
    const newParticles = Array.from({ length: count }).map(() => ({
      id: Math.random(),
      type,
      x: Math.random() * 100 - 50, 
    }));
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter(p => !newParticles.includes(p)));
    }, 1000);
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const openFeedMenu = () => {
    playGameSound('click');
    if (isSleeping) return showMessage("Lala is sleeping! Wake her up first.");
    setShowPlayMenu(false);
    setShowWardrobe(false);
    setShowFeedMenu(true);
  };

  const feedLala = (brand, emoji) => {
    playGameSound('click');
    setShowFeedMenu(false);
    setIsEating(true);
    setActiveBowl(emoji);
    showMessage(`Lala is eating ${brand}!`);

    // Play crunching sounds while eating
    const crunchInterval = setInterval(() => playGameSound('crunch'), 800);

    setTimeout(() => {
      clearInterval(crunchInterval);
      setIsEating(false);
      setActiveBowl(null);
      setHunger(prev => Math.min(100, prev + 30));
      setEnergy(prev => Math.max(0, prev - 5));
      setHappiness(prev => Math.min(100, prev + 10));
      spawnParticles('heart');
      showMessage(`Yum! ${brand} was delicious!`);
    }, 3500);
  };

  const openPlayMenu = () => {
    playGameSound('click');
    if (isSleeping) return showMessage("Lala is resting right now.");
    if (energy < 20) return showMessage("Lala is too tired to play.");
    if (hunger < 20) return showMessage("Lala is too hungry to play.");
    setShowFeedMenu(false);
    setShowWardrobe(false);
    setShowPlayMenu(true);
  };

  const toggleSleep = () => {
    playGameSound('click');
    const newSleepState = !isSleeping;
    setIsSleeping(newSleepState);
    if (newSleepState) {
      showMessage("Shhh... Lala is going to sleep. 🌙");
      // Play snoring sound periodically
      const snoreInterval = setInterval(() => {
        if (stateRef.current.isSleeping) {
          playGameSound('snore');
        } else {
          clearInterval(snoreInterval);
        }
      }, 4000);
    } else {
      showMessage("Good morning, Lala! ☀️");
    }
  };

  const cleanPoop = (e) => {
    e.stopPropagation();
    playGameSound('click');
    if (poopCount > 0) {
      setPoopCount(prev => prev - 1);
      showMessage("Sparkling clean! ✨");
      setHappiness(prev => Math.min(100, prev + 5));
    }
  };

  const startFetch = () => {
    playGameSound('click');
    setPlayMode('fetch');
    setShowPlayMenu(false);
    setBallX(50);
    showMessage("Click anywhere on the floor to throw the ball! 🎾");
  };

  const startFind = () => {
    playGameSound('click');
    setPlayMode('find');
    setShowPlayMenu(false);
    setHidingSpot(Math.floor(Math.random() * 3));
    showMessage("Click a bush to help Lala find her stick! 🪵");
  };

  const doTrick = () => {
    playGameSound('click');
    if (energy < 15) return showMessage("Lala is too tired for tricks.");
    setShowPlayMenu(false);
    
    const tricks = ['spin', 'jump', 'roll'];
    const randomTrick = tricks[Math.floor(Math.random() * tricks.length)];
    
    setActiveTrick(randomTrick);
    setTrickStartTime(Date.now());
    setEnergy(prev => Math.max(0, prev - 5));
    setHappiness(prev => Math.min(100, prev + 10));
    showMessage(`Lala is doing a ${randomTrick}! ✨`);
    
    // Camera zoom in for trick
    setCameraZoom(8);

    setTimeout(() => {
      setActiveTrick(null);
      spawnParticles('heart');
      playGameSound('tada');
      earnCoins(20);
      showMessage("Good girl, Lala! 💖");
      setCameraZoom(14);
    }, 2000);
  };

  const stopPlaying = () => {
    playGameSound('click');
    setPlayMode('none');
    setShowWardrobe(false);
    showMessage("All done playing for now!");
  };

  const handlePointerMove = (e) => {
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    if (clientX !== undefined && clientY !== undefined) {
      const nx = (clientX / window.innerWidth) * 2 - 1;
      const ny = -(clientY / window.innerHeight) * 2 + 1;
      targetCameraPos.current = {
        x: nx * 12, 
        y: 3 + ny * 6, 
        z: 14
      };
    }
  };

  const handleGameAreaClick = (e) => {
    if (playMode === 'fetch' && gameAreaRef.current) {
      playGameSound('click');
      const rect = gameAreaRef.current.getBoundingClientRect();
      let clickX = ((e.clientX - rect.left) / rect.width) * 100;
      clickX = Math.max(10, Math.min(90, clickX)); 
      setBallX(clickX);
      setTimeout(() => {
        setTimeout(() => {
          handleFetchSuccess();
        }, 1000); 
      }, 300); 
    }
  };

  const handleBushClick = (index, e) => {
    e.stopPropagation();
    playGameSound('click');
    if (playMode !== 'find' || isRevealing) return;
    setIsRevealing(true);
    
    setTimeout(() => {
      setRevealedSpot(index);
      if (index === hidingSpot) {
        handleFindSuccess();
        showMessage("Yay! Lala found the stick! 🪵");
      } else {
        showMessage("Not here! Try another one.");
      }
      setTimeout(() => {
        setRevealedSpot(null);
        setIsRevealing(false);
        if (index === hidingSpot) {
          setHidingSpot(Math.floor(Math.random() * 3));
        }
      }, 2500);
    }, 1000); 
  };

  const startListening = () => {
    if (isSleeping) return showMessage("Lala can't hear you while sleeping!");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return showMessage("Sorry, your browser doesn't support the microphone feature.");
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => { setIsListening(true); setSpeechText("Listening..."); };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSpeechText(`You said: "${transcript}"`);
      speakLikeLala(transcript);
    };
    recognition.onerror = () => {
      setIsListening(false); setSpeechText(""); showMessage("Couldn't hear you clearly. Try again!");
    };
    recognition.onend = () => {
      setIsListening(false); setTimeout(() => setSpeechText(""), 4000);
    };
    recognition.start();
  };

  const speakLikeLala = (text) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 2.0; 
    utterance.rate = 1.3;  
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const getStatusMessage = () => {
    if (activeTrick) return `Doing a ${activeTrick}! ✨`;
    if (isSleeping) return "Zzz...";
    if (isSpeaking) return "Woof! (Talking)";
    if (isListening) return "Lala is listening...";
    if (playMode === 'fetch') return "Playing Fetch!";
    if (playMode === 'find') return "Where is the stick?";
    if (poopCount > 0) return "Lala made a mess! Clean it!";
    if (hunger < 30) return "Lala is hungry!";
    if (energy < 30) return "Lala is tired.";
    if (happiness < 30) return "Lala is sad, play with her!";
    return "Lala is happy!";
  };

  // Petting interaction
  const handlePetLala = (e) => {
    e.stopPropagation();
    if (isSleeping) return;
    
    setIsPetting(true);
    setPetCount(prev => prev + 1);
    setHappiness(prev => Math.min(100, prev + 5));
    spawnParticles('heart');
    playGameSound('pet');
    showMessage("Lala loves pets! 💕");
    
    setTimeout(() => setIsPetting(false), 500);
    
    // Camera zoom in on pet
    setCameraZoom(8);
    setTimeout(() => setCameraZoom(14), 1500);
  };

  // Wardrobe functions
  const toggleWardrobeItem = (item) => {
    playGameSound('click');
    setWardrobe(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const openWardrobe = () => {
    playGameSound('click');
    setShowWardrobe(true);
    setShowFeedMenu(false);
    setShowPlayMenu(false);
  };

  // Camera zoom function
  const handleCameraZoom = () => {
    playGameSound('click');
    setCameraZoom(prev => prev === 14 ? 8 : 14);
  };

  // Coin and unlock system
  const earnCoins = (amount) => {
    setCoins(prev => prev + amount);
    playGameSound('coin');
    spawnParticles('coin');
  };

  const buyFood = (foodName, cost) => {
    if (coins >= cost) {
      setCoins(prev => prev - cost);
      setUnlockedFoods(prev => [...prev, foodName]);
      playGameSound('tada');
      showMessage(`Unlocked ${foodName}! 🎉`);
    } else {
      showMessage(`Need ${cost - coins} more coins! 💰`);
    }
  };

  // Sound toggle
  const toggleSound = () => {
    setIsSoundEnabled(prev => !prev);
    showMessage(isSoundEnabled ? "Sound OFF 🔇" : "Sound ON 🔊");
  };

  // Updated game functions with coins and sounds
  const handleFetchSuccess = () => {
    playGameSound('bark');
    earnCoins(10);
    setHappiness(prev => Math.min(100, prev + 10));
    setEnergy(prev => Math.max(0, prev - 4));
    setHunger(prev => Math.max(0, prev - 2));
  };

  const handleFindSuccess = () => {
    playGameSound('tada');
    earnCoins(15);
    setHappiness(prev => Math.min(100, prev + 25));
    setEnergy(prev => Math.max(0, prev - 10));
    setHunger(prev => Math.max(0, prev - 5));
  };

  const StatBar = ({ icon: Icon, value, color, bgColor, barColor }) => (
    <div className="flex items-center gap-3 bg-white/70 backdrop-blur-md px-3 py-2 rounded-2xl shadow-sm border border-white/50 flex-1 min-w-[120px] max-w-[200px]">
      <div className={`p-1.5 rounded-xl ${bgColor} ${color} shadow-sm`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 bg-black/10 rounded-full h-3 overflow-hidden shadow-inner relative">
        <div 
          className="h-full transition-all duration-700 ease-out absolute left-0 top-0 bottom-0"
          style={{ width: `${value}%`, background: value < 30 ? 'linear-gradient(90deg, #ef4444, #fca5a5)' : barColor }}
        />
        <div className="absolute top-0 left-0 w-full h-1/2 bg-white/30" />
      </div>
    </div>
  );

  return (
    <div className={`fixed inset-0 w-full h-full font-sans select-none transition-colors duration-500 overflow-hidden ${isARMode ? 'bg-transparent' : 'bg-slate-50'}`}>
      
      <div className={`absolute top-0 left-0 w-full p-4 md:p-6 z-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pointer-events-none transition-all ${isARMode ? 'opacity-80' : ''}`}>
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
              <span className="bg-white/80 px-4 py-1.5 rounded-2xl shadow-sm border border-white/50 text-slate-800 inline-block">My Talking Lala 3D</span>
            </h1>
            {/* Coin Counter */}
            <div className="bg-yellow-100 border border-yellow-300 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm">
              <Coins className="w-5 h-5 text-yellow-600" />
              <span className="font-bold text-yellow-700">{coins}</span>
            </div>
            {/* Day/Night Indicator */}
            <div className={`${isDaytime ? 'bg-sky-100 border-sky-300 text-sky-700' : 'bg-indigo-100 border-indigo-300 text-indigo-700'} border px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm`}>
              <span className="text-lg">{isDaytime ? '☀️' : '🌙'}</span>
              <span className="font-bold text-sm">{currentHour}:00</span>
            </div>
          </div>
          {isARSupported && !isARMode && (
            <button onClick={startAR} className="mt-2 py-2 px-4 w-max bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-bold rounded-xl shadow-[0_4px_15px_rgba(99,102,241,0.4)] hover:scale-[1.05] active:scale-95 transition-transform flex justify-center items-center gap-2">
              ✨ Enter AR Mode
            </button>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Control buttons */}
          <div className="flex gap-2">
            <button onClick={toggleSound} className="p-2 bg-white/80 rounded-xl shadow-sm border border-white/50 hover:bg-white transition-colors">
              {isSoundEnabled ? <Volume2 className="w-5 h-5 text-slate-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
            </button>
            <button onClick={handleCameraZoom} className="p-2 bg-white/80 rounded-xl shadow-sm border border-white/50 hover:bg-white transition-colors">
              <Camera className="w-5 h-5 text-slate-600" />
            </button>
            <button onClick={openWardrobe} className="p-2 bg-white/80 rounded-xl shadow-sm border border-white/50 hover:bg-white transition-colors">
              <Shirt className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          
          {/* Stats */}
          <div className="flex gap-2">
            <StatBar icon={Utensils} value={hunger} color="text-orange-600" bgColor="bg-orange-100" barColor="linear-gradient(90deg, #f97316, #fdba74)" />
            <StatBar icon={Heart} value={happiness} color="text-pink-600" bgColor="bg-pink-100" barColor="linear-gradient(90deg, #ec4899, #f9a8d4)" />
            <StatBar icon={Activity} value={energy} color="text-indigo-600" bgColor="bg-indigo-100" barColor="linear-gradient(90deg, #6366f1, #a5b4fc)" />
          </div>
        </div>
      </div>

      {message && (
        <div className="absolute top-[120px] md:top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-xl flex items-center gap-2 animate-bounce whitespace-nowrap">
          <AlertCircle className="w-4 h-4" />
          {message}
        </div>
      )}

      {/* PWA Install Banner */}
      {showInstallBanner && !isInstalled && (
        <div className="absolute top-[100px] md:top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 animate-[slideIn_0.3s_ease-out]">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <span className="text-2xl">🐕</span>
              </div>
              <div>
                <p className="font-bold text-sm">Install Lala Game</p>
                <p className="text-xs text-white/80">Add to home screen for quick access!</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleInstallClick}
                className="bg-white text-pink-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-pink-50 active:scale-95 transition-all shadow-lg"
              >
                Install
              </button>
              <button 
                onClick={dismissInstallBanner}
                className="text-white/60 hover:text-white p-1 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <div 
        ref={gameAreaRef}
        onClick={handleGameAreaClick}
        onMouseMove={handlePointerMove}
        onTouchMove={handlePointerMove}
        className={`absolute inset-0 transition-colors duration-1000 cursor-crosshair overflow-hidden ${isARMode ? 'bg-transparent' : (isSleeping ? 'bg-slate-900' : 'bg-sky-100')}`}
      >
        {(speechText || getStatusMessage() !== "Lala is happy!") && (
          <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur px-6 py-4 rounded-3xl shadow-2xl text-lg font-bold text-slate-700 max-w-md text-center transform transition-all z-20 ${isSleeping ? 'opacity-40' : 'opacity-100'}`}>
            {speechText || getStatusMessage()}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white/95 rotate-45" />
          </div>
        )}

        {particles.map(p => (
          <div key={p.id} className="absolute z-40 text-4xl animate-[ping_1s_ease-out_forwards]" style={{ left: `calc(50% + ${p.x * 2}px)`, bottom: '30%' }}>
            {p.type === 'bone' ? '🦴' : p.type === 'coin' ? '🪙' : '💖'}
          </div>
        ))}

        {playMode === 'find' && (
          <div className="absolute bottom-[20%] w-full flex justify-center gap-12 md:gap-32 px-10 z-20 pointer-events-none">
            {[0, 1, 2].map(index => (
              <div key={index} onClick={(e) => handleBushClick(index, e)} className={`relative cursor-pointer transition-transform pointer-events-auto ${isRevealing ? '' : 'hover:scale-110 active:scale-95'}`}>
                <div className="text-7xl md:text-8xl drop-shadow-2xl">🌳</div>
                {revealedSpot === index && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-6xl animate-[bounce_0.5s_ease-out]">
                    {hidingSpot === index ? '🪵' : '❌'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {playMode === 'fetch' && (
          <div className="absolute bottom-[15%] text-6xl z-20 transition-all duration-[800ms] ease-out animate-[bounce_1s_infinite] drop-shadow-xl" style={{ left: `calc(${ballX}% - 30px)` }}>
            🎾
          </div>
        )}

        {isEating && (
          <div className="absolute bottom-[15%] text-7xl z-20 transition-all drop-shadow-2xl left-1/2 -translate-x-1/2 animate-[bounce_0.5s_ease-out]">
            {activeBowl}
          </div>
        )}

        <div ref={canvasMountRef} className="absolute inset-0 w-full h-full z-10" onClick={handlePetLala} />

        {/* Petting instruction */}
        {!isSleeping && !isARMode && (
          <div className="absolute top-[60%] left-1/2 -translate-x-1/2 text-slate-600 text-sm font-medium bg-white/70 px-4 py-2 rounded-full z-30 animate-pulse">
            👆 Click Lala to pet her!
          </div>
        )}

        {isSleeping && !isARMode && (
          <div className="absolute top-1/3 right-1/4 text-sky-200 font-bold text-4xl animate-pulse z-50 drop-shadow-lg">
            Z<span className="text-3xl">z</span><span className="text-2xl">z</span>
          </div>
        )}

        {Array.from({ length: poopCount }).map((_, i) => (
          <div key={i} onClick={cleanPoop} className="absolute text-6xl cursor-pointer hover:scale-125 transition-transform z-30 animate-[bounce_2s_infinite] drop-shadow-xl" style={{ bottom: '15%', left: `${20 + (i * 15)}%` }}>
            💩
          </div>
        ))}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl z-20">
        <div className={`p-4 md:p-6 rounded-[2rem] transition-all shadow-2xl border ${isARMode ? 'bg-white/70 backdrop-blur-lg border-white/50' : 'bg-white/90 backdrop-blur-md border-slate-200'}`}>
          {playMode !== 'none' ? (
            <button onClick={stopPlaying} className={`w-full py-4 text-lg font-bold rounded-2xl active:scale-95 transition-all shadow-md ${isARMode ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'}`}>
              🛑 Stop Playing
            </button>
          ) : showWardrobe ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={() => toggleWardrobeItem('sweater')} className={`py-4 font-bold rounded-2xl active:scale-95 transition-all shadow-md flex items-center justify-center gap-3 text-lg ${wardrobe.sweater ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400' : isARMode ? 'bg-white/80 hover:bg-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                <span className="text-3xl">🧥</span> Yellow Sweater {wardrobe.sweater ? '✓' : ''}
              </button>
              <button onClick={() => toggleWardrobeItem('cap')} className={`py-4 font-bold rounded-2xl active:scale-95 transition-all shadow-md flex items-center justify-center gap-3 text-lg ${wardrobe.cap ? 'bg-purple-100 text-purple-700 border-2 border-purple-400' : isARMode ? 'bg-white/80 hover:bg-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                <span className="text-3xl">🧢</span> Purple Cap {wardrobe.cap ? '✓' : ''}
              </button>
              <button onClick={() => setShowWardrobe(false)} className={`sm:col-span-2 py-3 font-bold rounded-2xl active:scale-95 transition-all text-sm ${isARMode ? 'bg-black/10 text-slate-800 hover:bg-black/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                Done
              </button>
            </div>
          ) : showFeedMenu ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={() => feedLala("Royal Canin", "🥣")} className={`py-3 font-bold rounded-2xl active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 ${isARMode ? 'bg-white/80 hover:bg-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'}`}>
                <span className="text-2xl">🥣</span> Royal Canin
              </button>
              {unlockedFoods.includes('Pedigree') ? (
                <button onClick={() => feedLala("Pedigree", "🥩")} className={`py-3 font-bold rounded-2xl active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 ${isARMode ? 'bg-white/80 hover:bg-white' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'}`}>
                  <span className="text-2xl">🥩</span> Pedigree
                </button>
              ) : (
                <button onClick={() => buyFood('Pedigree', 50)} className="py-3 font-bold rounded-2xl active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 bg-slate-100 text-slate-400 border border-slate-200 border-dashed">
                  <span className="text-2xl">🔒</span> Unlock 50🪙
                </button>
              )}
              {unlockedFoods.includes('Beefy Treats') ? (
                <button onClick={() => feedLala("Beefy Treats", "🍖")} className={`py-3 font-bold rounded-2xl active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 ${isARMode ? 'bg-white/80 hover:bg-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'}`}>
                  <span className="text-2xl">🍖</span> Beefy Treats
                </button>
              ) : (
                <button onClick={() => buyFood('Beefy Treats', 100)} className="py-3 font-bold rounded-2xl active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 bg-slate-100 text-slate-400 border border-slate-200 border-dashed">
                  <span className="text-2xl">🔒</span> Unlock 100🪙
                </button>
              )}
              <button onClick={() => setShowFeedMenu(false)} className={`sm:col-span-3 py-3 font-bold rounded-2xl active:scale-95 transition-all text-sm ${isARMode ? 'bg-black/10 text-slate-800 hover:bg-black/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                Cancel
              </button>
            </div>
          ) : showPlayMenu ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={startFetch} className={`py-4 font-bold rounded-2xl active:scale-95 transition-all shadow-md flex items-center justify-center gap-3 text-lg ${isARMode ? 'bg-white/80 hover:bg-white' : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'}`}>
                <span className="text-3xl">🎾</span> Fetch
              </button>
              <button onClick={startFind} className={`py-4 font-bold rounded-2xl active:scale-95 transition-all shadow-md flex items-center justify-center gap-3 text-lg ${isARMode ? 'bg-white/80 hover:bg-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'}`}>
                <span className="text-3xl">🪵</span> Find Stick
              </button>
              <button onClick={doTrick} className={`py-4 font-bold rounded-2xl active:scale-95 transition-all shadow-md flex items-center justify-center gap-3 text-lg ${isARMode ? 'bg-white/80 hover:bg-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'}`}>
                <span className="text-3xl">🪄</span> Tricks
              </button>
              <button onClick={() => setShowPlayMenu(false)} className={`sm:col-span-3 py-3 font-bold rounded-2xl active:scale-95 transition-all text-sm ${isARMode ? 'bg-black/10 text-slate-800 hover:bg-black/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 md:gap-4">
              <button onClick={openFeedMenu} className={`flex flex-col items-center justify-center p-3 md:p-4 text-orange-500 rounded-2xl active:scale-95 transition-all group ${isARMode ? 'bg-white/80 shadow-md hover:bg-white' : 'bg-white shadow-sm border border-slate-100 hover:-translate-y-1 hover:shadow-md hover:bg-orange-50'}`}>
                <Utensils className="w-8 h-8 md:w-10 md:h-10 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-sm font-bold text-slate-600">Feed</span>
              </button>

              <button onClick={openPlayMenu} className={`flex flex-col items-center justify-center p-3 md:p-4 text-pink-500 rounded-2xl active:scale-95 transition-all group ${isARMode ? 'bg-white/80 shadow-md hover:bg-white' : 'bg-white shadow-sm border border-slate-100 hover:-translate-y-1 hover:shadow-md hover:bg-pink-50'}`}>
                <Heart className="w-8 h-8 md:w-10 md:h-10 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs md:text-sm font-bold text-slate-600">Play</span>
              </button>

              <button onClick={toggleSleep} className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl transition-all group ${isSleeping ? 'bg-indigo-600 text-white shadow-inner scale-95' : isARMode ? 'bg-white/80 text-indigo-500 shadow-md hover:bg-white active:scale-95' : 'bg-white text-indigo-500 shadow-sm border border-slate-100 hover:-translate-y-1 hover:shadow-md hover:bg-indigo-50 active:scale-95'}`}>
                <Moon className="w-8 h-8 md:w-10 md:h-10 mb-2 group-hover:scale-110 transition-transform" />
                <span className={`text-xs md:text-sm font-bold ${isSleeping ? 'text-white' : 'text-slate-600'}`}>{isSleeping ? 'Wake' : 'Sleep'}</span>
              </button>

              <button onClick={startListening} disabled={isSleeping || isListening} className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl transition-all group ${isListening ? 'bg-green-500 text-white animate-pulse shadow-inner' : isARMode ? 'bg-white/80 text-green-500 shadow-md hover:bg-white active:scale-95' : 'bg-white text-green-500 shadow-sm border border-slate-100 hover:-translate-y-1 hover:shadow-md hover:bg-green-50 active:scale-95'} ${isSleeping ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}>
                <Mic className="w-8 h-8 md:w-10 md:h-10 mb-2 group-hover:scale-110 transition-transform" />
                <span className={`text-xs md:text-sm font-bold ${isListening ? 'text-white' : 'text-slate-600'}`}>Talk</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

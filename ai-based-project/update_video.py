import re

with open("src/Pages/VideoInterview.jsx", "r") as f:
    content = f.read()

# Chunk 1: State
state_addition = """  const [feedback, setFeedback] = useState("");

  // --- Green Room State ---
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micLevel, setMicLevel] = useState(0);
  const [connection, setConnection] = useState("Checking");
  const [lighting, setLighting] = useState("Checking");
  const [persona, setPersona] = useState("friendly");
  const [countdown, setCountdown] = useState(null);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micAnimFrameRef = useRef(null);
  const lightingTimerRef = useRef(null);
  const canvasRef = useRef(null);

  const KNOWN_COMPANIES = [
    { name: "Google", emoji: "🔵", color: "#4285F4" },
    { name: "Amazon", emoji: "🟠", color: "#FF9900" },
    { name: "Microsoft", emoji: "🟦", color: "#00A4EF" },
    { name: "Meta", emoji: "🔷", color: "#1877F2" },
    { name: "Apple", emoji: "⚫", color: "#555555" },
    { name: "Netflix", emoji: "🔴", color: "#E50914" },
  ];
"""
content = content.replace('  const [feedback, setFeedback] = useState("");', state_addition)

# Chunk 2: persistPerQuestionHistory
content = content.replace(
    'mbaSpecialization: interviewDetails.mbaSpecialization,',
    'mbaSpecialization: interviewDetails.mbaSpecialization,\n      persona,'
)

# Chunk 3: generateQuestions body
content = content.replace(
    'mbaSpecialization: interviewDetails.mbaSpecialization,\n          ...(useBank ? {} : { count: 5 }),',
    'mbaSpecialization: interviewDetails.mbaSpecialization,\n          persona,\n          ...(useBank ? {} : { count: 5 }),'
)

# Chunk 4: replace useEffect and stopStream
health_check_code = """
  const toggleCamera = async () => {
    if (cameraEnabled) {
      stopStream();
      setCameraEnabled(false);
    } else {
      setCameraEnabled(true);
      await startPreview();
    }
  };

  useEffect(() => {
    // Auto start on mount
    if (interviewStage === "setup" && cameraEnabled && !isPreviewOn) {
      startPreview().catch(() => {});
    }
  }, [interviewStage, cameraEnabled, isPreviewOn]);

  useEffect(() => {
    // Connection check
    if (navigator.connection) {
      const type = navigator.connection.effectiveType;
      if (type === "4g") setConnection("Excellent");
      else if (type === "3g") setConnection("Good");
      else setConnection("Fair");
    } else {
      setConnection("Good");
    }

    if (!streamRef.current || !isPreviewOn) return;

    // Mic Check
    try {
      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
        source.connect(analyserRef.current);
      }

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkMic = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const bars = Math.min(5, Math.ceil(average / 10));
        setMicLevel(bars);
        micAnimFrameRef.current = requestAnimationFrame(checkMic);
      };
      checkMic();
    } catch (e) {
      console.warn("Mic check failed", e);
    }

    // Lighting check
    lightingTimerRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let colorSum = 0;
        // Sample every 4th pixel to save CPU
        for (let x = 0, len = data.length; x < len; x += 16) {
          colorSum += (data[x] + data[x + 1] + data[x + 2]) / 3;
        }
        const brightness = Math.floor(colorSum / (canvas.width * canvas.height / 4));
        if (brightness < 40) setLighting("Too Dark ⚠");
        else if (brightness > 200) setLighting("Too Bright ⚠");
        else setLighting("Looks Good ✓");
      } catch(e) {}
    }, 2000);

    return () => {
      if (micAnimFrameRef.current) cancelAnimationFrame(micAnimFrameRef.current);
      if (lightingTimerRef.current) clearInterval(lightingTimerRef.current);
    };
  }, [isPreviewOn]);

  useEffect(() => {
    // Clean up when leaving page completely
    return () => {
      stopStream();
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(()=>{});
      }
    };
  }, []);

  const startInterviewCountdown = () => {
    if (!interviewDetails.jobRole.trim()) {
      alert("Please enter a Job Role.");
      return;
    }
    let n = 3;
    setCountdown(n);
    const id = setInterval(() => {
      n--;
      if (n === 0) {
        setCountdown("GO");
      } else if (n < 0) {
        clearInterval(id);
        setCountdown(null);
        void generateQuestions();
      } else {
        setCountdown(n);
      }
    }, 1000);
  };
"""

content = content.replace("""  useEffect(() => {
    // Clean up when leaving page
    return () => stopStream();
  }, []);""", health_check_code)


with open("src/Pages/VideoInterview.jsx", "w") as f:
    f.write(content)

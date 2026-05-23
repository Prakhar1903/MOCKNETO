import re

with open("src/Pages/VideoInterview.jsx", "r") as f:
    content = f.read()

# The logic block to insert
logic_block = """
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

  const handleCompanyChange = (e) => {
"""

# We need to find `const handleCompanyChange = (e) => {` and insert our block right before it.
idx = content.find("  const handleCompanyChange = (e) => {")
if idx != -1:
    content = content[:idx] + logic_block + content[idx + len("  const handleCompanyChange = (e) => {\n"):]
    
    # We must also remove the old `useEffect(() => { stopStream(); }, []);` from around line 228
    old_cleanup = """  useEffect(() => {
    // Clean up when leaving page
    return () => stopStream();
  }, []);"""
    content = content.replace(old_cleanup, "")

    with open("src/Pages/VideoInterview.jsx", "w") as f:
        f.write(content)
    print("Functions added.")
else:
    print("Could not find insertion point.")

with open("src/Pages/VideoInterview.jsx", "r") as f:
    content = f.read()

# 1. Imports
imports_replacement = """import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaPipeAnalysis } from "../hooks/useMediaPipeAnalysis";
import { useSpeechPacing } from "../hooks/useSpeechPacing";
import { AnalysisOverlay } from "../components/AnalysisOverlay";
import { SentimentRibbon } from "../components/SentimentRibbon";
"""
content = content.replace(
    'import React, { useCallback, useEffect, useRef, useState } from "react";\nimport { motion, AnimatePresence } from "framer-motion";\n',
    imports_replacement
)

# 2. Hook Initialization
hooks_replacement = """  const [feedback, setFeedback] = useState("");

  const {
    isReady: isAiReady,
    confidenceScore,
    gazeZone,
    isSlouching,
    isFidgeting,
    sessionLog,
    startAnalysis,
    stopAnalysis
  } = useMediaPipeAnalysis(videoRef);

  const {
    wpm,
    wpmStatus,
    fillerCount,
    startListening,
    stopListening
  } = useSpeechPacing();
"""
content = content.replace('  const [feedback, setFeedback] = useState("");\n', hooks_replacement)

# 3. Start Analysis
content = content.replace(
    '      setInterviewStage("interview");',
    '      setInterviewStage("interview");\n      startAnalysis();\n      startListening();'
)

# 4. Stop Analysis
content = content.replace(
    '      setInterviewStage("feedback");',
    '      setInterviewStage("feedback");\n      stopAnalysis();\n      stopListening();'
)

# 5. Render AnalysisOverlay
overlay_str = """                <div className="text-gray-300 text-sm mb-2">Live Video</div>
                <div className="relative w-full rounded bg-black aspect-video overflow-hidden border border-gray-600">
                  <video
                    ref={setVideoElementRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {isAiReady && (
                    <AnalysisOverlay
                      confidenceScore={confidenceScore}
                      gazeZone={gazeZone}
                      wpm={wpm}
                      wpmStatus={wpmStatus}
                      isSlouching={isSlouching}
                      isFidgeting={isFidgeting}
                      fillerCount={fillerCount}
                    />
                  )}
                </div>"""

old_video_element = """                <div className="text-gray-300 text-sm mb-2">Live Video</div>
                <video
                  ref={setVideoElementRef}
                  playsInline
                  muted
                  className="w-full rounded bg-black aspect-video"
                />"""

content = content.replace(old_video_element, overlay_str)

# 6. Render SentimentRibbon
old_feedback_ui = """            <div className="bg-gray-700 p-4 rounded mb-6 border border-gray-600">
              <pre className="whitespace-pre-wrap font-sans">{feedback}</pre>
            </div>"""
new_feedback_ui = old_feedback_ui + "\n            <SentimentRibbon sessionLog={sessionLog} />\n"
content = content.replace(old_feedback_ui, new_feedback_ui)

with open("src/Pages/VideoInterview.jsx", "w") as f:
    f.write(content)

